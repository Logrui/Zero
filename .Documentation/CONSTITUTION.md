
Zero OS is a fork of https://github.com/Mail-0/Zero that is focused on implementing advanced features for Zero focused around additional pages and more complex feature such as AI Workflows, advanced feature for AI chat, conversion of the ai agent into a full suite productivity "IDE like" productivity system with context aware Zero Agent system across most pages

Core Planned Features:
-/calendar page w/ integration with the existing AI copilot
-Calendar with have bidirectional sync with google calendar
-Enable easy planning and scheduling with events
-Notifications management system with support for internal Zero system notifications and support external HTTP notifications such as workflows from n8n
-Events tracking workflows for /events page
-Google Drive and Google Calendar integration
-Chat integrations and context awareness with current user files and commands such as /workflows /calendar for activating various predefined workflows for zero. Utilization of @ for specifying specific email threads
-A RAG system for identify and finding specific emails and/or calendar events "I remember meeting with an investor that was
-CRM integration with a self hosted twenty crm instance for
-People page with an automated generated list of People tracking from incoming and outgoing emails
-Companies page with an automated generated list of Company tracking from incoming and outgoing emails
-Workspaces page (TBD feature for task management)
-Agents page for user defined custom agent workflows
-

Design and Theme:
-Zero OS will follow the existing styling of the zero mail app with the integration of new features


Constaints:
-Minimize editing of core files originally sourced from upstream dev
-For development purposes maintain edits to remove autumn and any other billing related edits

Development Environment:
-git will maintain connection to two separate repos:
-origin (/Logrui/Zero.git) branched Zero OS home repo
-upstream (/Mail-0/Zero.git) original app
-

