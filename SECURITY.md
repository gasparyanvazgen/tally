# Security Policy

## Reporting a Vulnerability

Do not disclose security vulnerabilities in public GitHub Issues. Contact the project maintainer privately with a description, affected area, reproduction details when safe, impact, and suggested mitigation. Never include passwords, tokens, private keys, or other secrets.

## Security Principles

- User-owned data must be protected by Supabase Row Level Security.
- Client-side checks are not the security boundary.
- Never expose Supabase service-role or other server-only secrets to browser code.
- Validate important inputs.
- Use database constraints and transactions for critical business rules.
- Treat invoice and billed-time-entry operations as security-sensitive.

See [DATABASE](docs/DATABASE) and [ARCHITECTURE](docs/ARCHITECTURE).
