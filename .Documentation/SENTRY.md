# Sentry Documentation for Zero OS

## What is Sentry?

**Sentry** is a comprehensive application monitoring and error tracking platform that helps developers identify, debug, and resolve issues in their applications in real-time. It provides crash reporting, performance monitoring, and error tracking capabilities across multiple programming languages and frameworks.

## Core Features

### 🐛 **Error Tracking & Crash Reporting**
- **Real-time error alerts** with detailed stack traces
- **Automatic error grouping** to reduce noise and identify patterns
- **Context capture** including user information, request details, and custom data
- **Release tracking** to see which deployments introduce new errors

### 📊 **Performance Monitoring**
- **Application Performance Monitoring (APM)** for slow transactions
- **Real User Monitoring (RUM)** for frontend performance metrics
- **Database query performance** tracking and optimization insights
- **Custom performance metrics** and distributed tracing

### 🔍 **Issue Management**
- **Issue assignment** and workflow integration
- **Comment system** for team collaboration on bugs
- **Integration with issue trackers** (GitHub, Jira, Linear, etc.)
- **Custom alert rules** and notification settings

### 📈 **Analytics & Insights**
- **Release health** metrics and adoption tracking
- **User impact analysis** - see how many users are affected by errors
- **Performance trends** over time
- **Custom dashboards** for team-specific metrics

## How Sentry Works

### 1. **SDK Integration**
Sentry provides SDKs for various platforms that you integrate into your application code:

```javascript
// Frontend (React/JavaScript)
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_DSN_HERE",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### 2. **Error Capture**
When errors occur, the SDK automatically captures and sends them to Sentry with context:

```javascript
// Automatic error capture
throw new Error("Something went wrong!");

// Manual error reporting
Sentry.captureException(new Error("Custom error"));

// Add context
Sentry.setUser({ id: "123", email: "user@example.com" });
Sentry.setTag("feature", "email-sync");
```

### 3. **Performance Tracking**
Monitor performance metrics and slow operations:

```javascript
// Start a transaction
const transaction = Sentry.startTransaction({
  name: "Email Sync",
  op: "task"
});

// Track database queries, API calls, etc.
const span = transaction.startChild({
  op: "db.query",
  description: "SELECT * FROM emails"
});

span.finish();
transaction.finish();
```

### 4. **Release Management**
Track which code changes introduce issues:

```bash
# Create a new release
sentry-cli releases new 1.2.3

# Associate commits with the release
sentry-cli releases set-commits 1.2.3 --auto

# Upload source maps for better error tracking
sentry-cli sourcemaps upload --release 1.2.3 ./build
```

## Sentry in Zero OS

### Current Configuration

Zero OS uses Sentry for both **frontend** and **backend** monitoring with the following setup:

#### **Frontend (React Router App)**
```typescript
// apps/mail/app/root.tsx
import * as Sentry from '@sentry/react';

// Error boundary integration
export function ErrorBoundary() {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <App />
    </Sentry.ErrorBoundary>
  );
}
```

#### **Backend (Cloudflare Workers)**
```typescript
// apps/server/src/index.ts
import * as Sentry from '@sentry/cloudflare-workers';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return Sentry.withSentry(env, ctx, async () => {
      // Your application logic
    });
  }
};
```

### Organization Structure

**Current Sentry Organization**: `zero-7y`
- **Frontend Project**: `nextjs` (legacy name, actually React Router)
- **Backend Project**: `cloudflare-workers`

### Source Maps Configuration

Source maps help Sentry provide readable stack traces in production:

```bash
# Current configuration (package.json)
"sentry:sourcemaps": "sentry-cli sourcemaps inject --org zero-7y --project nextjs ./apps/mail/.next && sentry-cli sourcemaps upload --org zero-7y --project nextjs ./apps/mail/.next"
```

⚠️ **Configuration Issue**: The current source maps configuration references:
- Project name `nextjs` (should be updated to reflect React Router)
- Directory `./apps/mail/.next` (doesn't exist, should be `./apps/mail/build`)

### Environment Variables

Sentry requires these environment variables:

```bash
# Required for Sentry CLI operations
SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=zero-7y
SENTRY_PROJECT=nextjs  # Frontend project
SENTRY_PROJECT_BACKEND=cloudflare-workers  # Backend project

# DSN for error reporting (runtime)
SENTRY_DSN=https://...@sentry.io/...
```

## Benefits for Zero OS

### 🎯 **Email Application Specific Benefits**

1. **Email Sync Monitoring**
   - Track email sync failures and performance
   - Monitor API rate limits from email providers
   - Alert on authentication issues with email services

2. **AI Feature Monitoring**
   - Track AI model API failures (Google Generative AI, Perplexity)
   - Monitor AI response times and token usage
   - Alert on AI service quota exhaustion

3. **Cloudflare Workers Monitoring**
   - Track serverless function cold starts
   - Monitor Cloudflare service integration issues
   - Track background job failures (queues, workflows)

4. **User Experience Monitoring**
   - Frontend performance for email loading
   - Real user monitoring for email search
   - Track user actions and conversion funnels

### 📊 **Development Workflow Integration**

1. **Release Tracking**
   - Correlate new bugs with specific deployments
   - Track feature adoption and health
   - Monitor regression introduction

2. **Team Collaboration**
   - Assign bugs to specific developers
   - Track fix progress and resolution time
   - Integration with GitHub for automatic issue creation

3. **Performance Optimization**
   - Identify slow email queries and operations
   - Track memory usage and resource consumption
   - Monitor third-party service dependencies

## Best Practices for Zero OS

### 🔧 **Configuration Recommendations**

1. **Update Project Configuration**
   ```bash
   # Fix source maps for React Router build
   sentry:sourcemaps: sentry-cli sourcemaps inject --org zero-7y --project react-router-app ./apps/mail/build
   ```

2. **Environment-Specific Configuration**
   ```typescript
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
     beforeSend(event) {
       // Filter out development noise
       if (event.environment === 'development') return null;
       return event;
     }
   });
   ```

3. **Custom Context for Email App**
   ```typescript
   // Add email-specific context
   Sentry.setContext("email_sync", {
     provider: "gmail",
     last_sync: lastSyncTime,
     email_count: emailCount
   });
   
   Sentry.setTag("feature", "email_processing");
   Sentry.setUser({
     id: user.id,
     email: user.email,
     subscription: user.plan
   });
   ```

### 🚨 **Error Handling Strategies**

1. **Email Service Errors**
   ```typescript
   try {
     await syncEmails();
   } catch (error) {
     Sentry.captureException(error, {
       tags: {
         service: 'gmail',
         operation: 'sync'
       },
       extra: {
         userId: user.id,
         lastSyncTime: user.lastSync
       }
     });
   }
   ```

2. **AI Service Monitoring**
   ```typescript
   const transaction = Sentry.startTransaction({
     name: "AI Email Processing",
     op: "ai.process"
   });
   
   try {
     const response = await geminiAPI.generateResponse(prompt);
     transaction.setTag("ai_provider", "gemini");
     transaction.setData("tokens_used", response.tokensUsed);
   } catch (error) {
     transaction.setStatus("internal_error");
     Sentry.captureException(error);
   } finally {
     transaction.finish();
   }
   ```

3. **Performance Monitoring**
   ```typescript
   // Monitor email loading performance
   const span = Sentry.startSpan({ op: "email.load", name: "Load Inbox" });
   const emails = await loadInboxEmails(userId);
   span.finish();
   
   // Track user interactions
   Sentry.addBreadcrumb({
     message: "User opened email",
     category: "user_action",
     data: { emailId: email.id }
   });
   ```

## Integration with Development Workflow

### 🔄 **CI/CD Integration**

1. **Automatic Release Creation**
   ```yaml
   # GitHub Actions
   - name: Create Sentry Release
     run: |
       sentry-cli releases new $GITHUB_SHA
       sentry-cli releases set-commits $GITHUB_SHA --auto
       sentry-cli sourcemaps upload --release $GITHUB_SHA ./apps/mail/build
   ```

2. **Deploy Notifications**
   ```bash
   # Notify Sentry of deployment
   sentry-cli releases deploys $VERSION new -e production
   ```

### 📊 **Monitoring Dashboards**

Create custom dashboards for:
- **Email sync success rates** by provider
- **AI processing performance** and error rates  
- **User engagement metrics** and feature adoption
- **Infrastructure health** (Cloudflare Workers performance)

### 🔔 **Alert Configuration**

Set up alerts for:
- **High error rates** (>1% of requests)
- **Performance degradation** (>2s response time)
- **AI service failures** (OpenAI/Gemini API issues)
- **Email sync failures** (authentication or quota issues)

## Cost Considerations

### 💰 **Sentry Pricing Tiers**

1. **Developer Plan** (Free)
   - 5,000 errors/month
   - 10,000 performance units/month
   - Basic features

2. **Team Plan** ($26/month)
   - 50,000 errors/month
   - 100,000 performance units/month
   - Advanced features

3. **Organization Plan** ($80/month)
   - 200,000 errors/month
   - 500,000 performance units/month
   - Enterprise features

### 📈 **Usage Optimization**

1. **Sample Rate Configuration**
   ```typescript
   Sentry.init({
     tracesSampleRate: 0.1, // Only track 10% of transactions
     profilesSampleRate: 0.1, // Only profile 10% of transactions
   });
   ```

2. **Error Filtering**
   ```typescript
   beforeSend(event) {
     // Filter out known issues or development errors
     if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
       return null; // Don't send to Sentry
     }
     return event;
   }
   ```

## Security Considerations

### 🔒 **Data Privacy**

1. **PII Scrubbing**
   ```typescript
   Sentry.init({
     beforeSend(event) {
       // Scrub sensitive email content
       if (event.extra?.emailContent) {
         delete event.extra.emailContent;
       }
       return event;
     }
   });
   ```

2. **User Data Protection**
   - Never log email content or passwords
   - Sanitize user data in error reports
   - Configure data retention policies

### 🛡️ **Access Control**

1. **Team Permissions**
   - Limit access to production error data
   - Use role-based access control
   - Regular audit of team members

2. **API Key Security**
   - Store Sentry tokens securely
   - Rotate authentication tokens regularly
   - Use environment-specific configurations

## Troubleshooting Common Issues

### 🐛 **Common Problems**

1. **Missing Source Maps**
   - **Problem**: Minified code in error stack traces
   - **Solution**: Ensure source maps are uploaded after build

2. **High Error Volume**
   - **Problem**: Sentry quota exhausted quickly
   - **Solution**: Implement error filtering and sampling

3. **Duplicate Errors**
   - **Problem**: Same error reported multiple times
   - **Solution**: Configure proper error grouping rules

4. **Performance Impact**
   - **Problem**: Sentry SDK affecting app performance
   - **Solution**: Reduce sampling rate and optimize configuration

### 🔧 **Configuration Issues in Zero OS**

1. **Incorrect Build Directory**
   - Current: `./apps/mail/.next`
   - Correct: `./apps/mail/build`

2. **Wrong Project Name**
   - Current: `nextjs`
   - Better: `zero-mail-app` or `react-router-app`

3. **Missing Environment Variables**
   - Ensure `SENTRY_DSN` is set in production
   - Configure `SENTRY_AUTH_TOKEN` for CI/CD

## Recommended Actions for Zero OS

### 🎯 **Immediate Fixes Needed**

1. **Update Source Maps Configuration**
   ```bash
   # Fix the sourcemaps script in package.json
   "sentry:sourcemaps": "sentry-cli sourcemaps inject --org zero-7y --project zero-mail-app ./apps/mail/build && sentry-cli sourcemaps upload --org zero-7y --project zero-mail-app ./apps/mail/build"
   ```

2. **Create Proper Sentry Project**
   - Rename or create new project reflecting React Router architecture
   - Update all references from `nextjs` to the new project name

3. **Add Missing Environment Variables**
   ```bash
   # Add to .env.prod
   SENTRY_DSN=https://your-dsn@sentry.io/project-id
   SENTRY_AUTH_TOKEN=your-auth-token
   SENTRY_ORG=zero-7y
   SENTRY_PROJECT=zero-mail-app
   ```

4. **Configure Release Management**
   - Set up automatic release creation in CI/CD
   - Link releases to GitHub commits
   - Track deployment success/failure

### 🔮 **Future Enhancements**

1. **Custom Dashboards**
   - Email sync success rates by provider
   - AI processing performance metrics
   - User engagement and feature adoption

2. **Advanced Monitoring**
   - Set up custom performance metrics
   - Implement distributed tracing for complex workflows
   - Add business logic monitoring (email processing pipelines)

3. **Team Integration**
   - Connect to GitHub for automatic issue creation
   - Set up Slack/Discord notifications for critical errors
   - Create on-call rotation and escalation policies

## Conclusion

Sentry provides powerful monitoring and debugging capabilities that can significantly improve Zero OS's reliability and development workflow. The current setup needs some configuration updates to properly work with the React Router architecture, but once fixed, it will provide valuable insights into application performance and user experience.

Key benefits for Zero OS:
- **Real-time error tracking** for email sync and AI processing
- **Performance monitoring** for user experience optimization  
- **Release management** for safer deployments
- **Team collaboration** for faster issue resolution

The investment in proper Sentry configuration will pay dividends in reduced debugging time, improved user experience, and more reliable email service delivery.