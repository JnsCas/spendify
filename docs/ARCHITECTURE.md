# Spendify Architecture

## Overview

Spendify is a web application that parses credit card statement PDFs and extracts expense data using Anthropic's Claude API.

## System Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  Anthropic  │
│  (Next.js)  │     │  (NestJS)   │     │  Claude API │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌─────────┐ ┌─────────┐
        │ Postgres │ │  Redis  │ │ Uploads │
        │    DB    │ │ (Queue) │ │  (Disk) │
        └──────────┘ └─────────┘ └─────────┘
```

## Components

### Frontend (Next.js 14)
- **Port:** 3000
- **Responsibilities:**
  - User authentication UI
  - PDF upload interface
  - Expense table display and editing
  - CSV export

### Backend (NestJS)
- **Port:** 3001
- **Modules:**
  - `auth` - JWT-based authentication
  - `users` - User management
  - `statements` - PDF upload and status tracking
  - `parser` - PDF text extraction and AI parsing
  - `expenses` - Expense CRUD operations
  - `cards` - Credit card management
  - `export` - CSV export functionality

### Database (PostgreSQL)
- **Port:** 5432
- **Entities:**
  - `User` - User accounts
  - `Statement` - Uploaded PDF statements
  - `Expense` - Extracted expense records
  - `Card` - Credit card identifiers

### Queue (Redis + BullMQ)
- **Port:** 6379
- **Queue:** `statement-processing`
- Handles async PDF processing jobs

### AI Service (Anthropic Claude API)
- **Model:** claude-3-haiku (fast and cost-effective)
- Cloud-based, no local resources required
- Parses extracted PDF text into structured expense data

## Data Flow

### PDF Processing Pipeline

1. **Upload:** User uploads PDF via frontend
2. **Store:** Backend saves PDF to disk, creates Statement record
3. **Queue:** Job added to `statement-processing` queue
4. **Extract:** `PdfService` extracts text from PDF using `pdf-parse`
5. **Parse:** `AnthropicService` sends text to Claude API
6. **Store:** Parsed expenses saved to database
7. **Notify:** Statement status updated to `completed`

### Request Flow

```
POST /statements/upload
       │
       ▼
┌─────────────────────┐
│ StatementsController │
└──────────┬──────────┘
           │ save file, create record
           ▼
┌─────────────────────┐
│  StatementsService   │
└──────────┬──────────┘
           │ add job to queue
           ▼
┌─────────────────────┐
│ StatementProcessor   │ (async)
└──────────┬──────────┘
           │
      ┌────┴────┐
      ▼         ▼
┌──────────┐ ┌─────────────────┐
│PdfService│ │ AnthropicService │
│  (text)  │ │  (Claude API)    │
└──────────┘ └─────────────────┘
      │              │
      │ extract text │ parse with AI
      └──────┬───────┘
             ▼
┌─────────────────────┐
│   ExpensesService    │
└──────────┬──────────┘
           │ save expenses
           ▼
        Database
```

## File Structure

```
spendify/
├── frontend/                 # Next.js application
│   └── src/
│       ├── app/             # App Router pages
│       └── components/      # React components
├── backend/                  # NestJS application
│   └── src/
│       ├── auth/            # Authentication module
│       ├── users/           # Users module
│       ├── statements/      # Statements module
│       ├── parser/          # PDF parsing module
│       │   ├── pdf.service.ts       # Text extraction
│       │   ├── anthropic.service.ts # Claude API integration
│       │   ├── parser.service.ts    # Orchestration
│       │   └── statement.processor.ts  # Queue processor
│       ├── expenses/        # Expenses module
│       ├── cards/           # Cards module
│       └── export/          # Export module
├── docker-compose.yml       # Service orchestration
├── start.sh                 # Start script
└── stop.sh                  # Stop script
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_HOST` | postgres | PostgreSQL host |
| `DATABASE_PORT` | 5432 | PostgreSQL port |
| `REDIS_HOST` | redis | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `ANTHROPIC_API_KEY` | - | Anthropic API key (required) |
| `ANTHROPIC_MODEL` | claude-3-haiku-20240307 | Claude model to use |
| `JWT_SECRET` | - | JWT signing secret |

## Running Locally

```bash
# Set your Anthropic API key in .env
echo "ANTHROPIC_API_KEY=your-key-here" >> .env

# Start all services
npm start

# Stop all services
npm run stop
```
