# Spendify

A web application for parsing credit card statement PDFs using AI and exporting expenses to interactive tables.

## Tech Stack

- **Frontend:** Next.js 14 with TypeScript
- **Backend:** NestJS with TypeScript
- **Database:** PostgreSQL with TypeORM
- **AI:** Anthropic Claude API
- **Queue:** Redis with BullMQ
- **Containerization:** Docker Compose

## Quick Start

```bash
# 1. Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Add your Anthropic API key to backend/.env
# ANTHROPIC_API_KEY=your-key-here

# 3. Start all services
npm start
```

## Services

| Service    | URL                     |
|------------|-------------------------|
| Frontend   | http://localhost:3000   |
| Backend    | http://localhost:3001   |
| PostgreSQL | localhost:5432          |
| Redis      | localhost:6379          |

## Development

```bash
# Run backend in dev mode
cd backend && npm run start:dev

# Run frontend in dev mode
cd frontend && npm run dev
```

## Stop Services

```bash
npm run stop
```

---

See `docs/ARCHITECTURE.md` for detailed system design.

