import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// CORS Configuration
app.use(cors({
  origin: ['https://profound-souffle-5f77b3.netlify.app', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://cryptoforextraining_db_user:Xf2bHJmn3Jt2lFtu@cluster0.oev392y.mongodb.net/?appName=Cluster0';
const AUTH_SECRET = process.env.AUTH_SECRET || 'af9k3jd82mqp0sl7xz9qm2vbN4';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const PORT = process.env.PORT || 5000;

let db;

async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI, {
      serverApi: { version: '1', strict: true, deprecationErrors: true }
    });
    await client.connect();
    db = client.db('automated_financial');
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
}

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, AUTH_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const users = db.collection('users');
    const existing = await users.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email exists' });

    await users.insertOne({
      name,
      email,
      password,
      balance: 5000,
      portfolio: [],
      createdAt: new Date()
    });

    const token = jwt.sign({ email }, AUTH_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { name, email, balance: 5000, portfolio: [] } });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const user = await db.collection('users').findOne({ email, password });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ email }, AUTH_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { name: user.name, email: user.email, balance: user.balance, portfolio: user.portfolio || [] } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});app.get('/api/me', authenticate, async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { name: user.name, email: user.email, balance: user.balance, portfolio: user.portfolio || [] } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/trade', authenticate, async (req, res) => {
  const { side, coinId, quantity, price } = req.body;
  if (!side || !coinId || !quantity || !price) return res.status(400).json({ error: 'Missing fields' });

  try {
    const users = db.collection('users');
    const user = await users.findOne({ email: req.user.email });
    const cost = quantity * price;

    if (side === 'buy' && user.balance < cost) return res.status(400).json({ error: 'Insufficient balance' });

    const portfolio = user.portfolio || [];
    const idx = portfolio.findIndex(p => p.id === coinId);

    if (side === 'buy') {
      if (idx >= 0) {
        portfolio[idx].qty += quantity;
      } else {
        portfolio.push({ id: coinId, qty: quantity, avgPrice: price });
      }
      await users.updateOne({ email: req.user.email }, { $set: { balance: user.balance - cost, portfolio } });
    } else {
      if (idx < 0 || portfolio[idx].qty < quantity) return res.status(400).json({ error: 'Insufficient holdings' });
      portfolio[idx].qty -= quantity;
      if (portfolio[idx].qty <= 0) portfolio.splice(idx, 1);
      await users.updateOne({ email: req.user.email }, { $set: { balance: user.balance + cost, portfolio } });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Trade failed' });
  }
});

app.post('/api/admin-login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Wrong password' });
  const token = jwt.sign({ admin: true }, AUTH_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.get('/api/admin-users', authenticate, async (req, res) => {
  try {
    const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Automated Financial Backend Running' });
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
