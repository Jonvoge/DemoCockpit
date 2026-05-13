# Demo Launchpad — Design Spec

**Date:** 2026-05-13  
**Status:** Approved for implementation  
**Author:** Jon Vöge  

---

## Overview

Demo Launchpad is a web application that acts as a personal and team-wide launchpad for navigating to live demos. Consultants at Inspari maintain a portfolio of demos hosted across Microsoft Fabric, Power BI, and standalone websites. The app provides a single, organized view of all demos with one-click access, search and filtering, and per-user personalization.

The app is designed to be opened during presentations and kept running as a persistent launchpad — all demo links open in a new tab.

---

## Goals

- Fast access to any demo from one place
- Shared by Inspari colleagues, each able to add their own demos
- Personalization per user (pins, sort preference)
- Low maintenance — no servers to manage, no recurring cost

---

## Non-Goals

- Dark mode
- Demo health monitoring / uptime checks
- Ratings, comments, or social features
- Server-side rendering

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    User (Browser)                     │
│              React SPA (Vite + TypeScript)            │
└──────────────┬──────────────────┬────────────────────┘
               │                  │
         /.auth/login/aad    /api/*
               │                  │
┌──────────────┴──────────────────┴────────────────────┐
│           Azure Static Web Apps (Free tier)           │
│  ┌─────────────────┐   ┌──────────────────────────┐  │
│  │  Static hosting  │   │  Managed Azure Functions  │  │
│  │  (CDN-backed)    │   │  (TypeScript)             │  │
│  └─────────────────┘   └────────────┬─────────────┘  │
│  ┌─────────────────┐                │                 │
│  │  Built-in Entra  │                │                 │
│  │  Auth (config)   │                │                 │
│  └─────────────────┘                │                 │
└─────────────────────────────────────┼────────────────┘
                                      │
                          ┌───────────┴───────────┐
                          │  Azure Blob Storage    │
                          │                        │
                          │  demos/demos.json      │
                          │  prefs/{userId}.json   │
                          └────────────────────────┘
```

### Key Decisions

- **Azure Static Web Apps (Free tier)** — CDN-backed static hosting with built-in Entra authentication and managed Azure Functions. No servers to manage.
- **Target URL:** `democockpit.azurestaticapps.net` (name chosen at resource creation)
- **Custom domain:** Out of scope for v1. Can be added later at no cost.
- **Entra auth:** Restricted to Inspari tenant via `staticwebapp.config.json`. All `/api/*` routes require login — enforced at the SWA layer, not in function code.
- **Azure Functions in TypeScript** — same language as the frontend, single language across the stack.
- **Blob Storage** — data lives in two JSON files. Concurrency handled via ETags (`If-Match` on writes). Suitable for this scale (<100 demos, <50 users).
- **Managed identity** — Functions connect to Blob Storage via managed identity. No connection strings in code or config.

---

## Data Model

### Demo

```typescript
interface Demo {
  id: string;              // UUID, auto-generated on creation
  title: string;
  description: string;     // Short, shown on card (1-2 sentences)
  url: string;             // Link to the demo
  category: string;        // Free-text (e.g. "Fabric", "Power BI", "Website")
  icon: string;            // Lucide icon name (e.g. "zap", "bar-chart-2")
  visibility: "public" | "private";
  owner: {
    id: string;            // Entra object ID
    name: string;          // Display name from auth token
    email: string;         // UPN — used for Teams deep link
  };
  clickCount: number;      // Global, incremented server-side on each open
  notes: string;           // Markdown — shown in detail drawer
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

**Storage:** Single file at `demos/demos.json` — a JSON array of Demo objects.

**Concurrency:** Each read returns an ETag. Each write sends `If-Match: <etag>`. If a concurrent write has occurred, the write fails with 412 and the function retries with fresh data.

### UserPreferences

```typescript
interface UserPreferences {
  userId: string;                            // Entra object ID
  pinnedDemoIds: string[];                   // Ordered list of pinned demo IDs
  sortField: "alphabetical" | "clickCount" | "lastUsed";
  sortDirection: "asc" | "desc";
  lastClicked: Record<string, string>;       // demoId → ISO 8601 timestamp
}
```

**Storage:** Per-user file at `prefs/{userId}.json`. Users only read/write their own file — no concurrency risk.

---

## API Routes

All routes require authentication. Identity is read from the `x-ms-client-principal` header injected by SWA.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/demos` | Any user | Returns all public demos + caller's private demos |
| `POST` | `/api/demos` | Any user | Creates a demo. Owner set from auth context. |
| `PUT` | `/api/demos/{id}` | Owner or admin | Updates a demo |
| `DELETE` | `/api/demos/{id}` | Owner or admin | Deletes a demo |
| `POST` | `/api/demos/{id}/click` | Any user | Increments `clickCount`; records `lastClicked` in caller's prefs |
| `GET` | `/api/preferences` | Any user | Returns caller's preferences (creates defaults if none exist) |
| `PUT` | `/api/preferences` | Any user | Updates caller's preferences |

### Authorization Rules

- **Create:** Any authenticated user
- **Edit/Delete:** `currentUser.id === demo.owner.id` OR user has the `admin` SWA role
- **Admin role:** Assigned via Azure Portal → Static Web Apps → Role Management

### Private Demo Filtering

`GET /api/demos` applies server-side filtering before returning:
```
return demos where demo.visibility === "public"
              OR demo.owner.id === currentUser.id
```

Private demos from other users are never included in the response.

---

## Frontend — Component Structure

```
App
├── AuthGuard          — Redirects to /.auth/login/aad if not authenticated
├── TopBar             — Brand name, search input, user avatar/menu
├── FilterBar          — Category pills + "Private" pill + sort dropdown + direction toggle
├── DemoGrid
│   ├── DemoSection    — "Pinned" section (teal left-border accent)
│   └── DemoSection    — "All demos" section
│       └── DemoCard   — Icon, title, description, tag, owner; hover actions
├── DetailDrawer       — Slide-in panel (right), triggered by ⓘ on card
├── AddDemoModal       — Form for creating a new demo
├── EditDemoModal      — Pre-filled form for editing (owner/admin only)
└── FAB                — Floating "+" button to open AddDemoModal
```

### DemoCard

Each card displays:
- **Icon** — Lucide icon in a colored rounded square
- **Title** — with inline "New" badge (demos created in last 7 days) and/or "🔒 Private" badge
- **Description** — short text
- **Footer:** Category tag · Owner name · (hover) action buttons

**Hover actions (appear on hover, bottom-right of card):**
- 📌 Pin / Unpin
- 📋 Copy URL to clipboard
- 💬 Chat with {owner name} — Teams deep link: `https://teams.microsoft.com/l/chat/0/0?users={owner.email}`
- ⓘ Open detail drawer

**Card click:** Opens the demo URL in a new tab. Also fires `POST /api/demos/{id}/click`.

### FilterBar

- Category pills built dynamically from distinct `category` values across all loaded demos
- "Private" pill filters to `demo.owner.id === currentUser.id`
- Sort options: A → Z, Most clicked, Last used
- Sort direction toggle (↑ / ↓)
- Sort preference and direction persisted to `UserPreferences` on change

### DemoGrid Sections

- **Pinned** — demos whose IDs appear in `userPreferences.pinnedDemoIds`, in pin order
- **All demos** — remaining demos in current sort order
- If no pinned demos, the Pinned section is hidden

### DetailDrawer

Slide-in panel from the right (~420px wide). Contains:
1. **Header** — icon, title, category tag, close button
2. **Description** — full description text
3. **Notes & Instructions** — markdown rendered (using a lightweight renderer, e.g. `marked`)
4. **Owner** — avatar, display name, "💬 Chat in Teams" button
5. **Footer** — "↗ Open Demo" (primary CTA, opens in new tab) + "📋 Copy URL" (secondary)

### AddDemoModal / EditDemoModal

Fields:
- Title (text, required)
- Description (textarea, required, short)
- URL (text, required, validated as URL)
- Category (combobox — type new or select existing)
- Icon (picker grid with two tabs: "General" Lucide icons and "Brands" — see Icon Strategy)
- Visibility toggle: "Everyone" / "Only me"
- Notes & Instructions (textarea, markdown, optional)

Owner is set automatically from auth context on create — pulled from the decoded `x-ms-client-principal` header: `id` (object ID), `name` (display name), `email` (UPN). Only owner or admin sees the edit/delete options.

---

## Icon Strategy

### General Icons (Lucide, MIT license)

~40 curated icons in 6 categories:

| Category | Icons |
|----------|-------|
| Data & Analytics | BarChart2, PieChart, TrendingUp, Database, Table, LineChart, Activity |
| AI & Intelligence | Brain, Bot, Sparkles, MessageSquare, Lightbulb |
| Cloud & Infrastructure | Cloud, Server, Globe, Network, Layers, Blocks |
| Apps & Web | Monitor, Smartphone, Layout, AppWindow, ExternalLink |
| Business | Users, Building, Briefcase, Target, Rocket |
| General | Zap, Shield, Code, Settings, Wrench, Search, Star, Tag, Link, FileText, Play, Map, Compass, Clock, Eye, Package, Presentation |

### Brand Icons (Simple Icons, CC0 license)

Shown in a "Brands" tab of the icon picker. Intended for demos clearly tied to a specific platform.

Planned set: Microsoft Fabric, Power BI, Snowflake, Databricks, Azure, AWS, Google Cloud, dbt, OpenAI, Anthropic, Tableau, Looker, Hugging Face, GitHub, Terraform.

> **Note:** Simple Icons CDN slug names must be verified during implementation. Some guessed slugs failed during brainstorming. Verify against [simpleicons.org](https://simpleicons.org) before shipping.

Brand icons are rendered as `<img>` tags from the Simple Icons CDN (or bundled locally). Each is displayed with a matching tinted background color from the brand's palette.

---

## Personalization

All personalization is per-user and stored in `prefs/{userId}.json`:

| Feature | Storage |
|---------|---------|
| Pinned demos | `pinnedDemoIds[]` — ordered array, pin order = display order |
| Sort field | `sortField` |
| Sort direction | `sortDirection` |
| Last used (for sort) | `lastClicked` map — updated on each `POST /api/demos/{id}/click` |

Preferences are loaded on app init and cached in React state. Written back to the API on change (debounced for sort changes).

---

## Inspari Branding

Uses Inspari brand colors. Full palette in `C:\repos\secondbrain\learnings\inspari-brand-colors.md`.

Key tokens used in the app:

```css
--inspari-teal: #00A4BD;   /* Primary CTA, active filters, pinned accent */
--dark-navy: #003C43;       /* Top bar background */
--bg: #f5f5f3;              /* Page background */
--surface: #fafaf8;         /* Card background */
--border-soft: #e0e0db;     /* Card borders */
--muted-text: #a0a09a;      /* Secondary text, section labels */
```

---

## Infrastructure

### Azure Resources Required

| Resource | SKU | Cost |
|----------|-----|------|
| Azure Static Web Apps | Free | $0 |
| Azure Storage Account | LRS, Hot | ~$0 at this scale |

### Deployment

- GitHub repository for the project
- SWA GitHub Actions workflow (auto-generated by Azure on resource creation)
- Push to `main` → auto-deploy

### Entra Configuration

- SWA authentication provider: Azure Active Directory
- Tenant: `a7ed0222-1883-488c-8bbb-6ee4f043da6d`
- Restrict access to Inspari tenant in `staticwebapp.config.json`
- Admin role: assigned manually via Azure Portal → SWA → Role Management

---

## Open Questions / Future Work

- **Brand icons:** Verify Simple Icons slugs before implementing the Brands tab in the icon picker
- **Custom domain:** `demos.inspari.dk` or similar — add later via CNAME + SWA custom domain config
- **Multiple owners:** Deliberately deferred. Single owner for v1.
- **Admin UI for role management:** Admins currently assigned in Azure Portal. Could be surfaced in-app later.
