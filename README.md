# InvoiceAI

AI-powered invoicing and proposals for freelancers.

InvoiceAI helps you:
- manage clients
- generate line items and proposal sections with AI
- create professional PDF invoices and proposals
- email documents to clients
- share secure public links for client view/accept/reject/pay
- track lifecycle status (draft, sent, viewed, paid, overdue, expired)

## Tech Stack

- Next.js 14 (App Router)
- TypeScript + Tailwind CSS
- Prisma ORM (SQLite in development)
- NextAuth (Credentials)
- TanStack Query + React Hook Form + Zod
- Puppeteer / Chromium for PDF generation
- Anthropic SDK for AI generation
- Resend for email delivery
- Cloudinary for file uploads

## Prerequisites

- Node.js 18+
- npm 9+

## Environment Setup

1. Create a local env file:

```bash
cp .env.example .env
```

2. Fill all required variables in .env.

Minimum local setup:
- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL

For full functionality also set:
- ANTHROPIC_API_KEY
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

## Install and Run

```bash
npm install
npm run prisma:push
npm run prisma:generate
npm run dev
```

App URL:

http://localhost:3000

## Available Scripts

- npm run dev
- npm run build
- npm run start
- npm run lint
- npm run typecheck
- npm run prisma:push
- npm run prisma:generate

## Health Check

Operational health endpoint:

- GET /api/health

Example:

```bash
curl http://localhost:3000/api/health
```

Possible responses:
- 200 with status ok (API + DB available)
- 503 with status degraded (API up, DB unavailable)

## Core Functional Areas

### Authentication
- Register and login with credentials
- Session-based protected dashboard routes

### Clients
- Create, update, soft-delete
- Search and detail view

### Invoices
- Create/edit/list/detail
- Dynamic line items + totals
- PDF generation
- Email send with PDF and public view link
- Public client page for view and payment confirmation

### Proposals
- Create/edit/list/detail
- Section builder
- PDF generation
- Email send with PDF and public view link
- Public client page for accept/reject actions

### AI Assist
- AI invoice line item generation
- AI proposal section generation

### Settings
- Profile + business identity
- Default tax/payment terms/due-days
- Password change
- Business logo upload

## Lifecycle Automation

System automatically transitions statuses:
- Invoice SENT/VIEWED to OVERDUE when due date passes
- Proposal SENT/VIEWED to EXPIRED when valid-until passes

## Security and Hardening

- Protected API routes via NextAuth middleware
- Public tokenized routes for client actions
- Rate limiting on high-risk endpoints:
	- AI generation
	- registration
	- send endpoints
	- public respond/pay endpoints
- Unique per-user constraints for invoice/proposal numbering

## Deployment Notes

### Vercel

This project includes function duration settings in vercel.json for PDF endpoints.

Recommended production checklist:

1. Set production environment variables
2. Ensure Cloudinary and Resend are configured
3. Ensure database URL points to production DB
4. Run Prisma schema sync before rollout
5. Verify /api/health after deploy

### Database Migration Strategy

For SQLite local development:

```bash
npm run prisma:push
```

For production workflows, use your preferred Prisma migration strategy and CI controls.

## Troubleshooting

### PDF generation fails
- Verify Puppeteer/Chromium dependencies in environment
- Confirm API route timeouts are sufficient

### Emails not sending
- Verify RESEND_API_KEY and RESEND_FROM_EMAIL
- Verify sender domain in Resend dashboard

### Uploads fail
- Verify Cloudinary keys
- Ensure upload file type and size are valid

### Auth session issues
- Verify NEXTAUTH_SECRET and NEXTAUTH_URL
- Clear browser cookies after env changes

## Development Quality Gate

Before opening a PR or deployment:

```bash
npm run lint
npm run typecheck
```

## License

Private project.
