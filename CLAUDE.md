# Spendify - Development Guidelines

## Project Overview
A web application for parsing credit card statement PDFs using Anthropic Claude API and exporting expenses to interactive CSV tables.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **AI**: Anthropic Claude API (claude-3-haiku)
- **Cache/Queue**: Redis with BullMQ
- **Containerization**: Docker Compose

## Project Structure
```
spendify/
├── frontend/          # Next.js application
│   └── .env           # Frontend environment variables
├── backend/           # NestJS application
│   └── .env           # Backend environment variables
├── docs/              # Architecture documentation
├── docker-compose.yml # All services orchestration
├── start.sh           # Start Docker containers
└── stop.sh            # Stop all services
```

## Development Commands

### Start all services
```bash
npm start
```

### Stop all services
```bash
npm run stop
```

### Docker only
```bash
docker-compose up -d
```

### Backend only (development)
```bash
cd backend && npm run start:dev
```

### Frontend only (development)
```bash
cd frontend && npm run dev
```

### Run migrations
```bash
cd backend && npm run migration:run
```

### Generate migration
```bash
cd backend && npm run migration:generate -- src/migrations/MigrationName
```

## Port Assignments
| Service    | Port  |
|------------|-------|
| Frontend   | 3000  |
| Backend    | 3001  |
| PostgreSQL | 5432  |
| Redis      | 6379  |

## Environment Variables
Each project has its own `.env.example` file. Copy to `.env` in each directory:

**Backend** (`backend/.env`):
- `ANTHROPIC_API_KEY` - Required for PDF parsing
- `JWT_SECRET` - Secret for JWT token signing
- Database and Redis connection settings

**Frontend** (`frontend/.env`):
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Code Conventions

### Backend (NestJS)
- Use TypeORM entities for database models
- Follow NestJS module structure (module, controller, service, entity)
- Use class-validator for DTO validation
- Use Passport.js with JWT strategy for authentication
- Use BullMQ for background job processing

### Frontend (Next.js)
- Use App Router with server components where possible
- Use client components only when interactivity is needed
- Use Tailwind CSS for styling
- Store auth tokens in httpOnly cookies (handled by backend)

### API Design
- RESTful endpoints
- All responses use consistent format: `{ data, error, message }`
- Use proper HTTP status codes
- Validate all inputs with class-validator DTOs

## Database Conventions
- Use UUID for primary keys
- Use snake_case for column names
- Include `created_at` and `updated_at` timestamps
- Use DECIMAL(12,2) for monetary values

## PDF Processing
- PDFs are parsed using text extraction (pdf-parse library)
- Extracted text is sent to Claude API for structured data extraction
- Store original PDFs in `uploads/{user_id}/{statement_id}/`

## Security Considerations
- Never log sensitive data (passwords, tokens, API keys)
- Use bcrypt for password hashing
- Validate file uploads (PDF only, size limits)
- Sanitize AI-generated content before database insertion
