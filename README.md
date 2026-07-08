# IBN SINA E-Commerce Monorepo

## Architecture Overview

### Backend (Node.js + Express + PostgreSQL)
- **Framework**: Express.js with modular route structure
- **Database**: PostgreSQL (Supabase) with repository pattern for data access
- **Authentication**: JWT-based auth with refresh tokens, bcrypt password hashing
- **Security**: Helmet, CORS, rate limiting, CSRF protection, input sanitization, account lockout
- **Features**:
  - Repository pattern for data layer (admin, cart, orders, products, users, deals)
  - Middleware stack (auth, rate limiter, security logger, input sanitizer, error handler)
  - Modular routes organized by feature (auth, admin, products, orders, cart, wishlist, promos, deals, banners, brands, categories, newsletter, homepage)
  - In-memory data fallback for offline capability
  - Database setup and maintenance scripts

### Frontend (React 19 + Vite + TypeScript)
- **Framework**: React 19 with Vite build tool
- **Styling**: Tailwind CSS v4 with Radix UI components (shadcn/ui)
- **State Management**: TanStack Query for server state, React Hook Form + Zod for forms
- **Routing**: React Router DOM v7
- **Features**:
  - Component library with 46+ reusable UI components
  - Custom hooks (mobile detection, debounce, localStorage, offline DB)
  - API layer with offline support and fallback
  - Multi-language support (French, Arabic, English)
  - Pages: Home, Catalog, Product Detail, Cart, Checkout, Login, Register, Profile, Order History, Admin Dashboard
  - Security features (input sanitization, XSS protection)


## Folder Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # Database and JWT configuration
│   │   ├── data/            # In-memory store data (fallback)
│   │   ├── lib/             # Utility functions (mappers, order status, output encoder)
│   │   ├── middleware/      # Express middleware (auth, security, rate limiting, etc.)
│   │   ├── repositories/    # Data access layer (repository pattern)
│   │   ├── routes/          # API routes organized by feature
│   │   └── app.js           # Express app configuration
│   ├── scripts/             # Database setup and maintenance scripts
│   └── server.js            # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (layout, UI, feature components)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # API layer, utilities, services
│   │   ├── pages/           # Page components (including admin dashboard)
│   │   ├── App.jsx          # Root component
│   │   └── main.jsx         # Entry point
│   └── public/              # Static assets
```

## Getting Started

### 1. Backend
```bash
cd backend
npm install
npm run dev
```
Runs on **http://localhost:5000** (set `PORT` in `backend/.env` if needed).

If port 5000 is busy:
```powershell
netstat -ano | findstr :5000
taskkill /PID 12345 /F
```
Replace `12345` with the number in the **last column** of the `LISTENING` line (not the word `pid`).

**Database Setup** (requires `DATABASE_URL` in `backend/.env`):
```bash
npm run db:setup
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on **http://localhost:5173** and proxies `/api` to the backend.

## Demo accounts

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Staff (dashboard) | `adelmoula9hwa1234@gmail.com` | `M14WpSo3XvDiAKXd1ecvgnP3UdOKVjRGpq` | Works with API + local fallback |

## Order workflow
Orders start as **Need approval (call)**. Staff update status in **Dashboard → Orders**.


gitignore 
node_modules/
.env
.env.local
.env.production
.env.development
dist/
build/
.DS_Store
*.log


cloudflare config :
> cloudflared tunnel --url http://localhost:5173