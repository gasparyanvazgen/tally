# Contributing to Tally

Thank you for contributing to Tally.

## Before You Start

Read [README](README), [SECURITY](SECURITY.md), [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md), [Architecture](docs/ARCHITECTURE.md), [Database](docs/DATABASE.md), and [Development Guide](docs/DEVELOPMENT.md).

## Setup

```bash
npm install
npm run dev
```

Configure the required Supabase environment variables in `.env.local`. Never commit secrets.

## Branches

Use focused branches such as `feature/...`, `fix/...`, `refactor/...`, `security/...`, `docs/...`, `test/...`, and `chore/...`.

### Example

Create a branch for a new feature:

```bash
git switch -c feature/supabase-time-entries
```

## Database

Database changes must use Supabase migrations. Review RLS whenever user-owned data or access rules change. Authorization must be enforced by the database, not only React.

## No localStorage for Business Data

Do not introduce new browser-only persistence for clients, projects, time entries, invoices, invoice numbers, or other persistent business records. Supabase/PostgreSQL should be the source of truth.

## Invoice Changes

Keep invoice numbering database-controlled, protect billed time entries, preserve historical line-item data, use transactional generation, and test concurrency and rollback behavior.

## Testing

Before opening a PR:

```bash
npm run lint
npm run build
```

Run relevant automated and manual tests.

## Commit Messages

Use concise conventional-style messages, for example:

```text
feat: add client search
fix: prevent duplicate time entries
refactor: extract invoice queries
security: tighten invoice RLS
test: add invoice generation tests
docs: update database guide
```

## Pull Requests

Explain what changed, why, how it was tested, and whether database/RLS changes were made. Keep PRs focused and update documentation when necessary.

## Checklist

- [ ] Related issue identified.
- [ ] No secrets committed.
- [ ] Database changes use migrations.
- [ ] RLS reviewed when applicable.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Relevant tests/manual testing completed.
- [ ] Documentation updated where necessary.
