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
- **Framework**: Next.js (App Router)
- **Key Technologies**:
  - TypeScript
  - React 18+
  - Tailwind CSS
  - tRPC for type-safe API calls
  - React Query for data fetching
  - Internationalization (i18n)
  - React Router

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
│   │   ├── app/       # Next.js app directory
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
5. Access the application at `http://localhost:3000`

## Contributing
1. Create a new branch for your feature
2. Follow the code style guidelines
3. Write tests for new features
4. Submit a pull request

## License
[Specify License]
