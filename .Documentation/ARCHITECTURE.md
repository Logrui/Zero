# Zero Application Architecture

## Project Overview
Zero is a modern full-stack application built with a monorepo architecture using pnpm workspaces. The project follows modern web development best practices with a clear separation between frontend and backend components.

## Core Architecture

### 1. Monorepo Structure
- **Package Manager**: pnpm workspaces
- **Build System**: Turborepo for task orchestration
- **Key Configuration Files**:
  - `turbo.json` - Task running and caching
  - `pnpm-workspace.yaml` - Workspace configuration
  - `docker-compose.*.yaml` - Container orchestration
  - `.github/` - CI/CD workflows

### 2. Main Applications

#### A. Mail App (Frontend)
- **Location**: `/apps/mail`
- **Framework**: React Router v7 + Vite
- **Key Technologies**:
  - TypeScript
  - React 18+
  - Tailwind CSS
  - tRPC for type-safe API calls
  - React Query for data fetching
  - Internationalization (i18n)
  - React Router v7

#### B. Server (Backend)
- **Location**: `/apps/server`
- **Runtime**: Node.js with TypeScript
- **Key Features**:
  - Drizzle ORM for database
  - tRPC for type-safe API
  - Authentication system
  - Environment-based configuration
  - Worker configuration (Cloudflare Workers)

### 3. Development Tooling
- **Package Management**: pnpm
- **Type Checking**: TypeScript
- **Linting/Formatting**:
  - ESLint
  - Prettier
  - Oxlint
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Testing**: Jest (indicated by test scripts)

### 4. Directory Structure
```
.
├── apps/
│   ├── mail/          # Frontend application
│   │   ├── app/       # React Router app directory
│   │   ├── components/# React components
│   │   ├── lib/       # Shared utilities
│   │   └── public/    # Static assets
│   │
│   └── server/        # Backend server
│       ├── src/       # Source code
│       └── drizzle/   # Database migrations
│
├── packages/          # Shared packages
│   ├── ui/           # Shared UI components
│   ├── config/       # Shared configurations
│   └── types/        # Shared TypeScript types
│
├── docker/           # Docker configurations
├── scripts/          # Utility scripts
└── public/           # Global static assets
```

### 5. Development Workflow

#### Local Development
```bash
# Start development servers
pnpm dev

# Start database container
pnpm docker:db:up

# Run database migrations
pnpm db:migrate
```

#### Common Commands
```bash
# Install dependencies
pnpm install

# Run linter
pnpm lint

# Format code
pnpm format

# Build for production
pnpm build

# Run tests
pnpm test
```

### 6. Key Dependencies

#### Frontend
- React 18+
- Next.js 14+
- Tailwind CSS
- tRPC
- React Query
- React Hook Form
- Various UI component libraries

#### Backend
- Node.js
- Drizzle ORM
- tRPC
- Authentication libraries
- Database drivers
- Server utilities

### 7. Deployment
- Frontend can be deployed to Vercel/Netlify
- Backend supports serverless deployment (Cloudflare Workers)
- Docker-based deployment available
- Environment-based configuration

### 8. Development Best Practices
- TypeScript for type safety
- Component-based architecture
- Atomic design principles for components
- Environment variables for configuration
- Git hooks for code quality
- Conventional commits

### 9. Testing Strategy
- Unit tests for utilities and components
- Integration tests for API routes
- End-to-end tests for critical user flows
- Test coverage reporting

### 10. Documentation
- Inline code documentation
- Component documentation
- API documentation
- Development guides

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables (copy `.env.example` to `.env`)
4. Start the development environment: `pnpm dev`
5. Access the application at `http://localhost:3500`

## Contributing
1. Create a new branch for your feature
2. Follow the code style guidelines
3. Write tests for new features
4. Submit a pull request

## Tech Stack

### Frontend
- **React Router v7** - React-based web framework for the email client
- **Vite** - Fast build tool and development server
- **React 19** - UI library for building user interfaces
- **TypeScript** - Type-safe JavaScript for better development experience
- **TailwindCSS** - Utility-first CSS framework for styling
- **Shadcn UI** - Modern component library built on top of Radix UI

### Backend
- **Node.js** - JavaScript runtime for server-side development
- **tRPC** - End-to-end typesafe APIs
- **Drizzle ORM** - Type-safe SQL ORM for database operations
- **Hono** - Fast web framework for Cloudflare Workers

### Database
- **PostgreSQL** - Relational database for data storage
- **Hyperdrive** - Cloudflare's database connection pooling service

### Authentication & Security
- **Better Auth** - Modern authentication library
- **Google OAuth** - For Gmail integration and user authentication
- **Autumn** - Encryption service for secure data handling

### Infrastructure & Deployment
- **Cloudflare Workers** - Serverless platform for backend deployment
- **Durable Objects** - Cloudflare's stateful serverless compute
- **R2 Bucket** - Object storage for email data
- **Docker** - Containerization for development and deployment
- **Vercel** - Frontend hosting and deployment

### Development Tools
- **pnpm (v10+)** - Fast, disk space efficient package manager
- **Turbo** - High-performance build system for monorepos
- **ESLint & Oxlint** - Code linting and quality checks
- **Prettier** - Code formatting
- **Husky** - Git hooks for code quality

### Additional Services
- **Twilio** - SMS integration for notifications
- **Resend** - Email sending service
- **Redis** - Caching and session storage
- **Sentry** - Error tracking and monitoring
- **Dub Analytics** - Analytics tracking

## Detailed Project Architecture

Zero is structured as a pnpm workspace monorepo with the following key applications:

- **`apps/mail/`** - React Router v7 frontend email client
- **`apps/server/`** - Backend server (Cloudflare Workers)
- **`packages/cli/`** - CLI tools (nizzy command)
- **`packages/db/`** - Database schemas and utilities
- Various shared configuration packages
