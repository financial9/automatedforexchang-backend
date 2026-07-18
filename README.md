# Automated Financial Backend

Express.js + MongoDB backend for the crypto trading platform.

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Create `.env` file** (copy from `.env.example`):
```bash
cp .env.example .env
```

3. **Update `.env` with your values:**
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `AUTH_SECRET` - JWT secret key
- `ADMIN_PASSWORD` - Admin panel password
- `PORT` - Server port (default 5000)

4. **Run locally:**
```bash
npm run dev
```

Server runs on http://localhost:5000

## API Endpoints

### Auth
- `POST /api/signup` - Create account
- `POST /api/login` - Login
- `GET /api/me` - Get user (requires Bearer token)

### Trading
- `POST /api/trade` - Buy/Sell crypto (requires Bearer token)

### Admin
- `POST /api/admin-login` - Admin login
- `GET /api/admin-users` - List all users (requires Bearer token)

## Deploy to Railway

1. Go to https://railway.app
2. New Project → GitHub
3. Connect your repo
4. Add variables from `.env.example`
5. Deploy!

Your backend URL will be: `https://your-project.railway.app`
