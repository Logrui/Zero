<p align="center">
  <picture>
    <source srcset="apps/mail/public/white-icon.svg" media="(prefers-color-scheme: dark)">
    <img src="apps/mail/public/black-icon.svg" alt="Zero Logo" width="64" style="background-color: #000; padding: 10px;"/>
  </picture>
</p>

# Zero OS

Dissapointed by Superhuman claiming to be a true "AI Inbox"?

Welcome to Zero OS - An Open-Source Full Stack Productivity Suite for the Future of Productivity

Treat your inboxes as the ultimate data source for your upstream workflows syncing files, people, calendar

## What is Zero OS?

Zero OS is a poweruser fork of the open-source AI email solution, Zero Mail. Zero OS enables users the power to **self-host** their own full stack productivity platform while also integrating external services like Gmail and other email providers. 

This fork is focused on implementing advanced features for Zero, such as AI Workflows, advanced AI chat, and a context-aware Zero Agent system across most new features:

## Zero OS Core and Planned Features:
- 🦾 **MAX Mode** - Power users can enable MAX mode for frontier level AI integrations w/ People, Organizations, embeddings and tracking for Notes, People, and memories
- 📬 **Inbox as a Data Source** – Treat multiple email accounts as the penultimate data source for tracking your work life and personal life
- 💻 **Agentic IDE-like Experience** – Add context easily to Zero OS queries by @tagging Specific Emails, People, Organizations, Tasks,
- 🚀 **Max Context Agents w/ MCP Tools** – Long term persistent memory, meetings, documents
- ⚡**MAX Modules** - Enhance not only emails with Agents workflows & LLMs but enable Calendar, People, Organization, Task, News, and more w/ a bundled Twenty CRM, Qdrant for Vector Embeddings, and N8N for workflows (w/ custom ZeroOS Custom Nodes for Twenty and Zero)
- 📁 **Automatic Docs/Attachments Management** – Automatic file management for your email attachments with w/ Google Drive and OneDrive. Never lose an email attachment again
- 🪄 **Full Agentic RAG Context for Agents** - Enable MAX mode for full RAG context w/ memory management for @People @Documents, @Organizations, Google Keep/Obsidian Notes, and 
- ⚙️ **Self-Hosting Freedom** – Run your own mini CRM, AI system, email app with ease.
- 🎨 **Customizable UI & Features** – Tailor your email experience the way you want it.
- ✅ **Open-Source Integrations w/ Local LLMs and Local Databases** – No hidden agendas, fully transparent.

## Tech Stack

Zero OS is built on top of the existing Zero tech stack with a few extra modern and reliable technologies focused on self hosting a powerful:
- **Fast and Light Desktop Frontend**: Next.js, React Router, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Node.js, Drizzle ORM, Twenty CRM, or your own separate Locally running Infrastructure
- **AI Backend**: Cloudflare Workers for embeddings and access to large LLM providers
- **Database**: PostgreSQL, Qdrant, Redis, and Twenty CRM
- **Authentication**: Better Auth, Google OAuth
- **Mobile Experience** - Zero OS is built on Next.js w/ a focus on a separate mobile app experience

**Option 1: Recommended Tech Stack - Hybrid:**
-Enable Cloudflare Workers to enable speed for AI and 24/7 uptime for automations/notifications/
-Utilize a Cloudflare Tunnel Published Application Tunnel (requires Domain) for remote access 24/7
-Keep your private data local

**Option 2: Fully Local Tech Stack:**
-Only utilize Gmail as input and Microsoft OneDrive
-Utilize local LLMs for all your embedding and processing needs
-Keep all your files and data hosted privately on your own PC or private Server

**Option 3: Fully Deployed Online Microsaas:**
-Complex to set up - set up instructions (WIP)

## Getting Started (NEEDS UPDATE)

### Video Tutorial

Watch this helpful video tutorial on how to set up Zero locally:

<p align="center">
  <a href="https://www.youtube.com/watch?v=yIXLQcjbeEM">
    <img src="https://img.youtube.com/vi/yIXLQcjbeEM/0.jpg" alt="Zero Setup Tutorial" />
  </a>
</p>

### Prerequisites (NEEDS UPDATE)

**Required Versions:**

- [Node.js](https://nodejs.org/en/download) (v18 or higher)
- [pnpm](https://pnpm.io) (v10 or higher)
- [Docker](https://docs.docker.com/engine/install/) (v20 or higher)

Before running the application, you'll need to set up services and configure environment variables. For more details on environment variables, see the [Environment Variables](#environment-variables) section.

### Setup Options (NEEDS UPDATE)

You can set up Zero in two ways:

<details open>
<summary><b>Standard Setup (Recommended)</b></summary> (NEEDS UPDATE)

#### Quick Start Guide

1. **Clone and Install**

   ```bash
   # Clone the repository
   git clone https://github.com/Logrui/Zero.git
   cd Zero

   # Install dependencies
   pnpm install

   # Start database locally
   pnpm docker:db:up
   ```

2. **Set Up Environment**

   - Run `pnpm nizzy env` to setup your environment variables
   - Run `pnpm nizzy sync` to sync your environment variables and types
   - Start the database with the provided docker compose setup: `pnpm docker:db:up`
   - Initialize the database: `pnpm db:push`

3. **Start the App**

   ```bash
   pnpm dev
   ```

4. **Open in Browser**

   Visit [http://localhost:3000](http://localhost:3000)
   </details>

<details open>
<summary><b>Devcontainer Setup</b></summary>

#### Quick Start guide (NEEDS UPDATE)

1. **Clone and Install**

   ```bash
   # Clone the repository
   git clone https://github.com/Logrui/Zero.git
   cd Zero
   ```

   Then open the code in devcontainer and install the dependencies:

   ```
   pnpm install

   # Start the database locally
   pnpm docker:db:up
   ```

2. **Set Up Environment**

   - Run `pnpm nizzy env` to setup your environment variables
   - Run `pnpm nizzy sync` to sync your environment variables and types
   - Start the database with the provided docker compose setup: `pnpm docker:db:up`
   - Initialize the database: `pnpm db:push`

3. **Start The App**
   ```bash
   pnpm dev
   ```
   Visit [http://localhost:3000](http://localhost:3000)
     </details>

### Environment Setup (NEEDS UPDATE)

1. **Better Auth Setup**

   - Open the `.env` file and change the BETTER_AUTH_SECRET to a random string. (Use `openssl rand -hex 32` to generate a 32 character string)

     ```env
     BETTER_AUTH_SECRET=your_secret_key
     ```

2. **Google OAuth Setup** (Required for Gmail integration) 

   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Add the following APIs in your Google Cloud Project: [People API](https://console.cloud.google.com/apis/library/people.googleapis.com), [Gmail API](https://console.cloud.google.com/apis/library/gmail.googleapis.com)
     - Use the links above and click 'Enable' or
     - Go to 'APIs and Services' > 'Enable APIs and Services' > Search for 'Google People API' and click 'Enable'
     - Go to 'APIs and Services' > 'Enable APIs and Services' > Search for 'Gmail API' and click 'Enable'
   - Enable the Google OAuth2 API
   - Create OAuth 2.0 credentials (Web application type)
   - Add authorized redirect URIs:
     - Development:
       - `http://localhost:8787/api/auth/callback/google`
     - Production:
       - `https://your-production-url/api/auth/callback/google`
   - Add to `.env`:

     ```env
     GOOGLE_CLIENT_ID=your_client_id
     GOOGLE_CLIENT_SECRET=your_client_secret
     ```

   - Add yourself as a test user:

     - Go to [`Audience`](https://console.cloud.google.com/auth/audience)
     - Under 'Test users' click 'Add Users'
     - Add your email and click 'Save'

> [!WARNING]
> The authorized redirect URIs in Google Cloud Console must match **exactly** what you configure in the `.env`, including the protocol (http/https), domain, and path - these are provided above.

4. **Twilio Setup** (Optional, currently disabled for SMS Integration)

   - Go to the [Twilio](https://www.twilio.com/)
   - Create a Twilio account if you don’t already have one
   - From the dashboard, locate your:

     - Account SID
     - Auth Token
     - Phone Number

   - Add to your `.env` file:

   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ```

### Environment Variables

Run `pnpm nizzy env` to setup your environment variables. It will copy the `.env.example` file to `.env` and fill in the variables for you.
For local development a connection string example is provided in the `.env.example` file located in the same folder as the database.

#### Gemini Model & API Migration

We migrated Gemini integration to be fully environment-driven. See the detailed guide: [GEMINI_GenerativeAI_Migration.md](.Documentation/GEMINI_GenerativeAI_Migration.md).

- __GOOGLE_GENERATIVE_AI_API_KEY__: Your Google Generative AI API key (replaces `GEMINI_API_KEY`).
- __GEMINI_FLASH_MODEL__: Gemini model identifier to use. Defaults to `gemini-2.0-flash` when unset.

### Database Setup

Zero uses PostgreSQL for storing data. Here's how to set it up:

1. **Start the Database**

   Run this command to start a local PostgreSQL instance:

   ```bash
   pnpm docker:db:up
   ```

   This creates a database with:

   - Name: `zerodotemail`
   - Username: `postgres`
   - Password: `postgres`
   - Port: `5432`

2. **Set Up Database Connection**

   Make sure your database connection string is in `.env` file. And you have ran `pnpm nizzy sync` to sync the latest env.

   For local development use:

   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zerodotemail"
   ```

3. **Database Commands**

   - **Set up database tables**:

     ```bash
     pnpm db:push
     ```

   - **Create migration files** (after schema changes):

     ```bash
     pnpm db:generate
     ```

   - **Apply migrations**:

     ```bash
     pnpm db:migrate
     ```

   - **View database content**:
     ```bash
     pnpm db:studio
     ```
     > If you run `pnpm dev` in your terminal, the studio command should be automatically running with the app.

### Sync

Background: https://x.com/cmdhaus/status/1940886269950902362
We're now storing the user's emails in their Durable Object & an R2 bucket. This allow us to speed things up, a lot.
This also introduces 3 environment variables, `DROP_AGENT_TABLES`,`THREAD_SYNC_MAX_COUNT`, `THREAD_SYNC_LOOP`.
`DROP_AGENT_TABLES`: should the durable object drop the threads table before starting a sync
`THREAD_SYNC_MAX_COUNT`: how many threads should we sync? max `500` because it's using the same number for the maxResults number from the driver. i.e 500 results per page.
`THREAD_SYNC_LOOP`: should make sure to sync all of the items inside a folder? i.e if THREAD_SYNC_MAX_COUNT=500 it will sync 500 threads per request until the folder is fully synced. (should be true in production)

## Contribute

Please refer to the [contributing guide](.github/CONTRIBUTING.md).

If you'd like to help with translating Zero to other languages, check out our [translation guide](.github/TRANSLATION.md).
