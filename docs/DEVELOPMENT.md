# Development Guide

## Requirements

- Node.js
- npm
- Supabase project
- Git

## Installation

```bash
npm install
```

Configure the required Supabase environment variables in `.env.local`. Never commit `.env.local` or secrets.

## Local Development

```bash
npm run dev
```

The development server normally runs at `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run build
```

Run relevant tests when available.

## Workflow

```text
GitHub Issue
    ↓
Feature/fix branch
    ↓
Implementation
    ↓
Database migration if needed
    ↓
Testing
    ↓
Pull Request
    ↓
Review
    ↓
Merge
```

## Database Workflow

Create a migration, update affected RLS policies, update application types/data access, test authorization, and update database documentation when behavior changes.

## Real Application Rule

Do not use browser `localStorage` as the source of truth for persistent business data. Business data should survive refresh, logout/login, another browser, and another device by using Supabase/PostgreSQL.

## Debugging

Check authentication/session, Supabase request, RLS, foreign keys/constraints, database functions/transactions, and UI error handling. Do not fix authorization problems only in React.

## Production Readiness

Verify persistence, authorization, validation, error handling, tests, responsive UI, accessibility, documentation, and CI/build status.
