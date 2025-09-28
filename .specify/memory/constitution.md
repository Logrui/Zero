<!--
SYNC IMPACT REPORT

- Version change: 1.0.0 -> 1.1.0
- List of modified principles:
  - Added: Fork Stewardship
- Added sections:
  - Fork Stewardship principle
- Removed sections:
  - None
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (reviewed — no mandatory changes)
  - ✅ .specify/templates/spec-template.md (reviewed — no mandatory changes)
  - ✅ .specify/templates/tasks-template.md (reviewed — no mandatory changes)
  - ✅ .specify/templates/commands/*.md (reviewed — no mandatory changes)
  - ⚠ .Documentation/CONSTITUTION.md (sync review recommended)
- Follow-up TODOs:
  - TODO(RATIFICATION_DATE): Determine the original adoption date of the upstream constitution.
  - TODO(SYNC_MANUAL_REVIEW): Review `apps/` modules for any policy references that assume upstream-only behavior.
-->

# Constitution of Zero OS

## Preamble

This document defines the core principles and governance model for Zero OS — a maintained fork of the
original Zero mail application focused on expanding the platform into an integrated, AI-first productivity
environment. It is the project's source of truth for architecture, design, and contributor expectations. All
contributors, CI agents, and automated systems MUST follow this constitution.

## Governance

- **Constitution Version:** 1.1.0
- **Ratification Date:** TODO(RATIFICATION_DATE): Determine the original adoption date of this constitution.
- **Last Amended Date:** 2025-09-26

### Amendment Process

1.  **Proposal:** Any contributor may propose an amendment by creating a pull request that modifies this document.
2.  **Review:** The proposal MUST be reviewed by at least two other contributors, one of whom is a project
    owner or maintainer with write access.
3.  **Ratification:** The amendment is ratified when the pull request is merged into the `main` (or configured)
    branch.

### Versioning

This constitution follows semantic versioning for governance changes:
- **MAJOR:** Backward-incompatible changes (removal or fundamental redefinition of a principle).
- **MINOR:** Addition of a new principle or material expansion of guidance (this update: 1.0.0 -> 1.1.0).
- **PATCH:** Clarifications, wording changes, or typo fixes.

---

## Principles

### Principle 1: AI-First Development

- **Name:** AI-First Development
- **Description:** The system's core logic, features, and user experiences are designed with AI capabilities at the
  forefront. AI features MUST be considered during design, and the platform MUST provide clear extension points
  for AI integrations (agents, embeddings, RAG, model adapters).
- **Rationale:** AI capabilities enable automation and context-aware experiences that increase user
  productivity. Prioritizing AI allows developers to deliver high-value features and faster iteration cycles.

### Principle 2: Radical Modularity

- **Name:** Radical Modularity
- **Description:** The system is composed of independent, loosely coupled, and highly cohesive modules. Each
  module encapsulates a specific capability and SHOULD be testable, deployable, and replaceable independently.
- **Rationale:** Modularity reduces coupling, improves maintainability, and enables parallel development across
  teams and CI pipelines. It also simplifies incremental upgrades and experimentation in a forked project.

### Principle 3: Convention over Configuration

- **Name:** Convention over Configuration
- **Description:** Provide sensible defaults and established patterns for code layout, APIs, and deployments.
  Customization is allowed but SHOULD be minimized for common tasks to reduce cognitive load and onboarding time.
- **Rationale:** Sensible defaults speed development and ensure consistency across the repository and forks.

### Principle 4: User-Centric Design

- **Name:** User-Centric Design
- **Description:** The end-user experience MUST drive design and development decisions. Features MUST be
  intuitive, accessible, and deliver measurable user value.
- **Rationale:** Prioritizing users increases adoption and ensures engineering effort focuses on real problems.

### Principle 5: Security First

- **Name:** Security First
- **Description:** Security is non-negotiable and MUST be integrated into the entire development lifecycle. Default
  configurations SHOULD follow least-privilege principles and avoid shipping secrets or billing dependencies
  in development branches.
- **Rationale:** Embedding security reduces risk, protects user data, and preserves project integrity — especially
  important in forks and when adding integrations (Google, Gemini, Drive, calendars).

### Principle 6: Fork Stewardship

- **Name:** Fork Stewardship
- **Description:** As a maintained fork, Zero OS MUST minimize drift from upstream where practical, clearly
  document fork-specific changes, and preserve compatibility with upstream fixes when reasonable. Changes that
  facilitate the fork's goals (AI Workflows, calendar integrations, agents) MUST be documented and gated with
  tests and migration notes.
- **Rationale:** Responsible stewardship ensures the fork benefits from upstream improvements while enabling
  divergent innovation. This reduces long-term maintenance burden and eases contributions between repositories.


### Principle 7: Local Hosting Focus and Prioritization

- **Name:** Local Hosting Focus and Prioritization
- **Description:** Zero OS is intended to be a self hosted application utilizing docker containers
- **Rationale:** Ensure that development is focused on Zero OS in self hosted application context and refrain from 
building for the original application and its server based infr