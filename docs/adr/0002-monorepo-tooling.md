# ADR-0002: Monorepo Tooling — Nx

**Date**: 2026-07-12  
**Status**: Accepted  
**Deciders**: Platform architecture team  

---

## Context

The Laundry Management Platform has multiple deployable Node.js applications sharing significant code:
- `api` — Main REST API (NestJS)
- `worker` — Background job processor (NestJS, separate deployable)
- Potential future: `admin-bff` — Admin backend-for-frontend

We needed to decide between:
1. **Native NestJS workspaces** (monorepo via npm/pnpm workspaces)
2. **Nx** (full monorepo orchestration tool)
3. **Turborepo** (lightweight task runner)

---

## Decision

We will use **Nx** as the monorepo tooling.

---

## Rationale

### Why Nx

| Factor | Nx | Native Workspaces | Turborepo |
|--------|----|--------------------|-----------|
| **Task orchestration** | Full graph-based, parallel execution | Manual scripts | Pipeline-based |
| **Computation caching** | Local + remote cache (Nx Cloud) | None | Local + remote |
| **Code generators** | Rich generator ecosystem (`@nx/nest`, `@nx/js`) | None | None |
| **Affected detection** | `nx affected` — only build/test what changed | Manual | Limited |
| **NestJS integration** | First-class `@nx/nest` plugin | Works but no DX | Works but no DX |
| **Project graph** | Visual dependency graph | None | None |
| **Incremental adoption** | Can migrate incrementally | — | — |

### Key Benefits for This Project

1. **Multiple deployable apps**: `apps/api` and `apps/worker` can each be built and deployed independently via `nx build api` / `nx build worker`
2. **Affected builds in CI**: Only rebuild what changed on a PR — critical for a 12-phase, long-lived project
3. **Generators**: `nx generate @nx/nest:app`, `nx generate @nx/nest:library` — saves boilerplate in every phase
4. **Shared libraries**: Can extract `libs/shared` in later phases for DTOs, events, and domain types shared across apps

### Why NOT Native Workspaces

- No built-in task caching
- No `affected` detection
- No code generators
- CI becomes slow as codebase grows

### Why NOT Turborepo

- No NestJS generators
- Less mature than Nx for TypeScript-heavy monorepos
- No visual project graph

---

## Consequences

### Positive
- Fast CI via Nx's computation cache and affected detection
- Consistent code generation across all 12 phases
- Clean separation of `apps/` and `libs/` as the project grows

### Negative / Trade-offs
- Slightly heavier tooling — Nx daemon runs in the background
- Team must learn Nx conventions (`project.json`, `nx.json` config)
- `nx.json` and `project.json` files add configuration overhead
