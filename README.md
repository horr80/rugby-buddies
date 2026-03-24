# Rugby Buddies

Kids rugby training booking and management platform. Built with Next.js 14, PostgreSQL, Prisma, and NextAuth.

**Live site:** [www.rugbybuddies.co.uk](https://www.rugbybuddies.co.uk)

## Features

- **User Registration** — Parents register with their child's details, manage multiple children
- **Booking System** — Browse training blocks by age group and term, check availability, book and pay
- **Admin Panel** — Full management dashboard for blocks, sessions, bookings, users, and content
- **Age Groups** — Configurable age categories (Under 12 through Under 15)
- **Term-Based Scheduling** — Sessions organised around UK school terms (Autumn, Winter, Summer)
- **Payment Links** — Configurable PayPal/Stripe payment links per block
- **Announcements** — News and updates displayed on the homepage
- **Media Gallery** — YouTube-style video and photo gallery with thumbnails
- **Messaging** — In-app messages from admin to users with read/unread tracking
- **Email Blasts** — Send emails to all users or filtered by age group / session
- **Digital Postcards** — Branded rugby-themed email postcards
- **Reminders** — Automated session reminders configurable per block
- **Coach Profile** — Dedicated profile page (pre-loaded with Charlie Hodgson)
- **Contact Page** — Configurable contact form and details

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** NextAuth.js (credentials)
- **Styling:** Tailwind CSS + Radix UI
- **Email:** Nodemailer (configurable SMTP)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/rugby-buddies.git
cd rugby-buddies

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and other settings
```

### Environment Variables

Create a `.env` file with:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/rugbybuddies?schema=public"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Email (optional - for sending emails)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-password"
SMTP_FROM="noreply@rugbybuddies.co.uk"

# Cron secret (for reminder cron job)
CRON_SECRET="your-cron-secret"
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database with sample data
npx prisma db seed
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Default Admin Login

After seeding:
- **Email:** admin@rugbybuddies.co.uk
- **Password:** RugbyAdmin2026!

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, register pages
│   ├── admin/            # Admin panel (16 management pages)
│   ├── api/              # API routes (26 endpoints)
│   ├── dashboard/        # User dashboard, bookings, messages
│   ├── media/            # Media gallery
│   ├── contact/          # Contact page
│   ├── profile/coach/    # Coach profile
│   └── announcements/    # Announcements archive
├── components/
│   ├── ui/               # Reusable UI components
│   ├── navbar.tsx        # Main navigation
│   ├── footer.tsx        # Site footer
│   └── providers.tsx     # Session provider
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client
│   ├── email.ts          # Email templates and sending
│   └── utils.ts          # Utility functions
└── types/
    └── next-auth.d.ts    # Type augmentations
```

## Admin Panel

Access at `/admin` (requires admin role). Manage:

- Age Groups, Terms, Blocks & Sessions
- Bookings (filter, update status)
- Users (search, filter by age group)
- Announcements, Messages, Media
- Email Blasts & Digital Postcards
- Reminders, Contact Config
- Coach Profile, Site Settings

## Deployment

The app is Vercel-ready:

```bash
npm run build
npm start
```

Set environment variables in your hosting dashboard. For automated reminders, set up a cron job to call:

```
GET /api/cron/reminders?key=YOUR_CRON_SECRET
```

## Licence

Private project. All rights reserved.
