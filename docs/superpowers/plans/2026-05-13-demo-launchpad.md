# Demo Launchpad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React + TypeScript SPA hosted on Azure Static Web Apps that lets Inspari consultants browse, pin, and launch demos, backed by Azure Functions + Blob Storage with Entra authentication.

**Architecture:** React SPA (Vite) deployed to Azure Static Web Apps Free tier. Managed Azure Functions (TypeScript, Node 20) handle CRUD for demos and user preferences stored as JSON in Azure Blob Storage. Built-in SWA auth with a custom Entra ID provider restricts access to the Inspari tenant.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, `marked` (markdown rendering), Azure Static Web Apps, Azure Functions v4 (Node 20), `@azure/storage-blob`, `@azure/identity`

---

## File Structure

```
democockpit/
├── staticwebapp.config.json          # SWA routing, auth, security headers, fallback
├── package.json                      # Frontend dependencies
├── vite.config.ts                    # Vite config
├── tsconfig.json
├── index.html
│
├── src/
│   ├── main.tsx                      # React entry point
│   ├── App.tsx                       # Root component, auth guard, data fetching
│   ├── types.ts                      # Demo, UserPreferences interfaces
│   ├── api.ts                        # Typed fetch wrappers for all /api/* routes
│   │
│   ├── components/
│   │   ├── TopBar.tsx                # Brand, search input, user avatar/menu
│   │   ├── FilterBar.tsx             # Category pills, Private pill, sort controls
│   │   ├── DemoGrid.tsx              # Pinned + All sections
│   │   ├── DemoCard.tsx              # Single card with hover actions
│   │   ├── DetailDrawer.tsx          # Slide-in panel with full demo info
│   │   ├── AddDemoModal.tsx          # Create demo form
│   │   ├── EditDemoModal.tsx         # Edit demo form (owner/admin only)
│   │   └── IconPicker.tsx            # Lucide icon grid (General + Brands tabs)
│   │
│   └── hooks/
│       ├── useAuth.ts                # Read x-ms-client-principal from /.auth/me
│       └── usePreferences.ts        # Load/save UserPreferences, local state sync
│
├── api/                              # Azure Functions
│   ├── package.json
│   ├── tsconfig.json
│   ├── host.json
│   ├── local.settings.json           # Local dev only, gitignored
│   │
│   ├── src/
│   │   ├── blobClient.ts             # Blob Storage singleton + ETag helpers
│   │   ├── auth.ts                   # Decode x-ms-client-principal, getUser()
│   │   ├── demos/
│   │   │   ├── getDemos.ts           # GET /api/demos
│   │   │   ├── createDemo.ts         # POST /api/demos
│   │   │   ├── updateDemo.ts         # PUT /api/demos/{id}
│   │   │   ├── deleteDemo.ts         # DELETE /api/demos/{id}
│   │   │   └── clickDemo.ts          # POST /api/demos/{id}/click
│   │   └── preferences/
│   │       ├── getPreferences.ts     # GET /api/preferences
│   │       └── updatePreferences.ts  # PUT /api/preferences
│   │
│   └── tests/
│       ├── auth.test.ts
│       ├── blobClient.test.ts
│       ├── getDemos.test.ts
│       ├── createDemo.test.ts
│       ├── updateDemo.test.ts
│       ├── deleteDemo.test.ts
│       ├── clickDemo.test.ts
│       ├── getPreferences.test.ts
│       └── updatePreferences.test.ts
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `api/package.json`
- Create: `api/tsconfig.json`
- Create: `api/host.json`
- Create: `.gitignore`

- [ ] **Step 1: Initialise frontend project**

```bash
cd c:\repos\DemoCockpit
npm create vite@latest . -- --template react-ts
npm install
npm install lucide-react marked tailwindcss @tailwindcss/vite
npm install -D @types/node
```

- [ ] **Step 2: Initialise Tailwind**

```bash
npx tailwindcss init
```

Update `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Replace `src/index.css` content with:
```css
@import "tailwindcss";
```

- [ ] **Step 3: Initialise API project**

```bash
mkdir api
cd api
npm init -y
npm install @azure/functions @azure/storage-blob @azure/identity uuid
npm install -D typescript @types/node vitest
```

Create `api/tsconfig.json`:
```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

Create `api/host.json`:
```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": { "samplingSettings": { "isEnabled": true } }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  }
}
```

Create `api/local.settings.json` (gitignored):
```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "STORAGE_CONNECTION_STRING": "UseDevelopmentStorage=true",
    "STORAGE_CONTAINER_NAME": "launchpad"
  }
}
```

- [ ] **Step 4: Add `.gitignore` entries**

Append to `.gitignore`:
```
api/local.settings.json
api/dist/
node_modules/
dist/
```

- [ ] **Step 5: Commit**

```bash
cd c:\repos\DemoCockpit
git add .
git commit -m "feat: project scaffold — Vite React TS frontend + Azure Functions API"
```

---

## Task 2: Shared Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create types file**

```ts
// src/types.ts

export interface DemoOwner {
  id: string;
  name: string;
  email: string;
}

export interface Demo {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  icon: string;           // Lucide icon name e.g. "zap"
  visibility: 'public' | 'private';
  owner: DemoOwner;
  clickCount: number;
  notes: string;          // Markdown
  createdAt: string;      // ISO 8601
  updatedAt: string;      // ISO 8601
}

export interface UserPreferences {
  userId: string;
  pinnedDemoIds: string[];
  sortField: 'alphabetical' | 'clickCount' | 'lastUsed';
  sortDirection: 'asc' | 'desc';
  lastClicked: Record<string, string>;  // demoId → ISO 8601
}

export interface AuthUser {
  userId: string;
  userDetails: string;    // Display name
  userRoles: string[];
  claims: Array<{ typ: string; val: string }>;
}

export type SortField = UserPreferences['sortField'];
export type SortDirection = UserPreferences['sortDirection'];
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: shared types — Demo, UserPreferences, AuthUser"
```

---

## Task 3: SWA Configuration

**Files:**
- Create: `staticwebapp.config.json`

- [ ] **Step 1: Create config**

```json
{
  "platform": {
    "apiRuntime": "node:20"
  },
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "userDetailsClaim": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/a7ed0222-1883-488c-8bbb-6ee4f043da6d/v2.0",
          "clientIdSettingName": "AAD_CLIENT_ID",
          "clientSecretSettingName": "AAD_CLIENT_SECRET"
        }
      }
    }
  },
  "routes": [
    {
      "route": "/*",
      "allowedRoles": ["authenticated"]
    }
  ],
  "responseOverrides": {
    "401": {
      "statusCode": 302,
      "redirect": "/.auth/login/aad?post_login_redirect_uri=.referrer"
    }
  },
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/*.{png,jpg,gif,svg,ico,css,js,woff2}"]
  },
  "globalHeaders": {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "content-security-policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://cdn.simpleicons.org; connect-src 'self'; font-src 'self'"
  }
}
```

> **Note:** `AAD_CLIENT_ID` and `AAD_CLIENT_SECRET` are set as Application Settings in the Azure Portal after resource creation. You must register an app in Entra ID (tenant `a7ed0222-1883-488c-8bbb-6ee4f043da6d`) and use its client ID/secret.

- [ ] **Step 2: Commit**

```bash
git add staticwebapp.config.json
git commit -m "feat: SWA config — Entra custom provider, auth, security headers, fallback"
```

---

## Task 4: API — Auth Helper

**Files:**
- Create: `api/src/auth.ts`
- Create: `api/tests/auth.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// api/tests/auth.test.ts
import { describe, it, expect } from 'vitest'
import { getUser } from '../src/auth'

describe('getUser', () => {
  it('returns null when header is missing', () => {
    expect(getUser(undefined)).toBeNull()
  })

  it('decodes a valid x-ms-client-principal header', () => {
    const payload = {
      userId: 'abc123',
      userDetails: 'Jon Vöge',
      userRoles: ['authenticated'],
      claims: [{ typ: 'preferred_username', val: 'jon@inspari.dk' }]
    }
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
    const user = getUser(encoded)
    expect(user).not.toBeNull()
    expect(user!.userId).toBe('abc123')
    expect(user!.userDetails).toBe('Jon Vöge')
    expect(user!.claims[0].val).toBe('jon@inspari.dk')
  })

  it('returns null when header is malformed base64', () => {
    expect(getUser('!!!not-base64!!!')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd api
npx vitest run tests/auth.test.ts
```
Expected: FAIL — `Cannot find module '../src/auth'`

- [ ] **Step 3: Implement**

```ts
// api/src/auth.ts
import type { AuthUser } from '../../src/types'

export function getUser(header: string | undefined): AuthUser | null {
  if (!header) return null
  try {
    const decoded = Buffer.from(header, 'base64').toString('utf8')
    return JSON.parse(decoded) as AuthUser
  } catch {
    return null
  }
}

export function getUserEmail(user: AuthUser): string {
  const emailClaim = user.claims.find(
    c => c.typ === 'preferred_username' ||
         c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
  )
  return emailClaim?.val ?? user.userDetails
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run tests/auth.test.ts
```
Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
cd c:\repos\DemoCockpit
git add api/src/auth.ts api/tests/auth.test.ts
git commit -m "feat: API auth helper — decode x-ms-client-principal"
```

---

## Task 5: API — Blob Storage Client

**Files:**
- Create: `api/src/blobClient.ts`
- Create: `api/tests/blobClient.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// api/tests/blobClient.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @azure/storage-blob before importing blobClient
vi.mock('@azure/storage-blob', () => ({
  BlobServiceClient: {
    fromConnectionString: vi.fn(() => ({
      getContainerClient: vi.fn(() => ({
        getBlobClient: vi.fn(() => ({
          getBlockBlobClient: vi.fn(() => ({
            download: vi.fn(),
            upload: vi.fn(),
          })),
        })),
      })),
    })),
  },
}))

import { readBlob, writeBlob } from '../src/blobClient'

describe('readBlob / writeBlob types', () => {
  it('readBlob and writeBlob are functions', () => {
    expect(typeof readBlob).toBe('function')
    expect(typeof writeBlob).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd api
npx vitest run tests/blobClient.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

```ts
// api/src/blobClient.ts
import { BlobServiceClient } from '@azure/storage-blob'

const CONTAINER = process.env.STORAGE_CONTAINER_NAME ?? 'launchpad'

function getClient() {
  const connStr = process.env.STORAGE_CONNECTION_STRING
  if (!connStr) throw new Error('STORAGE_CONNECTION_STRING not set')
  return BlobServiceClient.fromConnectionString(connStr)
    .getContainerClient(CONTAINER)
}

export async function readBlob<T>(blobName: string): Promise<{ data: T; etag: string } | null> {
  try {
    const blockClient = getClient().getBlobClient(blobName).getBlockBlobClient()
    const download = await blockClient.download()
    const etag = download.etag ?? ''
    const body = await streamToString(download.readableStreamBody!)
    return { data: JSON.parse(body) as T, etag }
  } catch (err: any) {
    if (err.statusCode === 404) return null
    throw err
  }
}

export async function writeBlob<T>(
  blobName: string,
  data: T,
  etag?: string
): Promise<void> {
  const content = JSON.stringify(data, null, 2)
  const blockClient = getClient().getBlobClient(blobName).getBlockBlobClient()
  const conditions = etag ? { ifMatch: etag } : {}
  await blockClient.upload(content, Buffer.byteLength(content), {
    blobHTTPHeaders: { blobContentType: 'application/json' },
    conditions,
  })
}

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    stream.on('error', reject)
  })
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run tests/blobClient.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd c:\repos\DemoCockpit
git add api/src/blobClient.ts api/tests/blobClient.test.ts
git commit -m "feat: blob client — readBlob/writeBlob with ETag support"
```

---

## Task 6: API — GET /api/demos

**Files:**
- Create: `api/src/demos/getDemos.ts`
- Create: `api/tests/getDemos.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// api/tests/getDemos.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Demo } from '../../src/types'

const mockDemos: Demo[] = [
  {
    id: '1', title: 'Public Demo', description: 'desc', url: 'https://a.com',
    category: 'Fabric', icon: 'zap', visibility: 'public',
    owner: { id: 'user1', name: 'Alice', email: 'alice@inspari.dk' },
    clickCount: 5, notes: '', createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z'
  },
  {
    id: '2', title: 'Private Demo', description: 'desc', url: 'https://b.com',
    category: 'Power BI', icon: 'bar-chart-2', visibility: 'private',
    owner: { id: 'user2', name: 'Bob', email: 'bob@inspari.dk' },
    clickCount: 2, notes: '', createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z'
  },
]

vi.mock('../src/blobClient', () => ({
  readBlob: vi.fn(async () => ({ data: mockDemos, etag: '"abc"' })),
}))

vi.mock('../src/auth', () => ({
  getUser: vi.fn(() => ({
    userId: 'user1',
    userDetails: 'Alice',
    userRoles: ['authenticated'],
    claims: []
  })),
}))

import { filterDemosForUser } from '../src/demos/getDemos'

describe('filterDemosForUser', () => {
  it('returns public demos for any user', () => {
    const result = filterDemosForUser(mockDemos, 'user1')
    expect(result.find(d => d.id === '1')).toBeDefined()
  })

  it('returns own private demos', () => {
    const result = filterDemosForUser(mockDemos, 'user2')
    expect(result.find(d => d.id === '2')).toBeDefined()
  })

  it('hides other users private demos', () => {
    const result = filterDemosForUser(mockDemos, 'user1')
    expect(result.find(d => d.id === '2')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd api
npx vitest run tests/getDemos.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

```ts
// api/src/demos/getDemos.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { readBlob } from '../blobClient'
import { getUser } from '../auth'
import type { Demo } from '../../../src/types'

export function filterDemosForUser(demos: Demo[], userId: string): Demo[] {
  return demos.filter(d => d.visibility === 'public' || d.owner.id === userId)
}

app.http('getDemos', {
  methods: ['GET'],
  route: 'demos',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const user = getUser(req.headers.get('x-ms-client-principal') ?? undefined)
    if (!user) return { status: 401, body: 'Unauthorized' }

    const result = await readBlob<Demo[]>('demos/demos.json')
    const demos: Demo[] = result?.data ?? []
    const filtered = filterDemosForUser(demos, user.userId)

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filtered),
    }
  }
})
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run tests/getDemos.test.ts
```
Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
cd c:\repos\DemoCockpit
git add api/src/demos/getDemos.ts api/tests/getDemos.test.ts
git commit -m "feat: GET /api/demos — filtered by visibility and user"
```

---

## Task 7: API — POST /api/demos

**Files:**
- Create: `api/src/demos/createDemo.ts`
- Create: `api/tests/createDemo.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// api/tests/createDemo.test.ts
import { describe, it, expect, vi } from 'vitest'
import type { Demo } from '../../src/types'

const existingDemos: Demo[] = []

vi.mock('../src/blobClient', () => ({
  readBlob: vi.fn(async () => ({ data: existingDemos, etag: '"abc"' })),
  writeBlob: vi.fn(async () => {}),
}))

vi.mock('../src/auth', () => ({
  getUser: vi.fn(() => ({ userId: 'u1', userDetails: 'Jon', userRoles: ['authenticated'], claims: [{ typ: 'preferred_username', val: 'jon@inspari.dk' }] })),
  getUserEmail: vi.fn(() => 'jon@inspari.dk'),
}))

import { buildDemo } from '../src/demos/createDemo'

describe('buildDemo', () => {
  it('sets owner from user context', () => {
    const user = { userId: 'u1', userDetails: 'Jon', userRoles: ['authenticated'], claims: [{ typ: 'preferred_username', val: 'jon@inspari.dk' }] }
    const input = { title: 'Test', description: 'desc', url: 'https://x.com', category: 'Fabric', icon: 'zap', visibility: 'public' as const, notes: '' }
    const demo = buildDemo(input, user, 'jon@inspari.dk')
    expect(demo.owner.id).toBe('u1')
    expect(demo.owner.email).toBe('jon@inspari.dk')
    expect(demo.clickCount).toBe(0)
    expect(demo.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('sets createdAt and updatedAt to same value', () => {
    const user = { userId: 'u1', userDetails: 'Jon', userRoles: ['authenticated'], claims: [] }
    const input = { title: 'T', description: 'd', url: 'https://x.com', category: 'Fabric', icon: 'zap', visibility: 'public' as const, notes: '' }
    const demo = buildDemo(input, user, 'jon@inspari.dk')
    expect(demo.createdAt).toBe(demo.updatedAt)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd api
npx vitest run tests/createDemo.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// api/src/demos/createDemo.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { randomUUID } from 'crypto'
import { readBlob, writeBlob } from '../blobClient'
import { getUser, getUserEmail } from '../auth'
import type { Demo, AuthUser } from '../../../src/types'

type DemoInput = Pick<Demo, 'title' | 'description' | 'url' | 'category' | 'icon' | 'visibility' | 'notes'>

export function buildDemo(input: DemoInput, user: AuthUser, email: string): Demo {
  const now = new Date().toISOString()
  return {
    id: randomUUID(),
    ...input,
    owner: { id: user.userId, name: user.userDetails, email },
    clickCount: 0,
    createdAt: now,
    updatedAt: now,
  }
}

app.http('createDemo', {
  methods: ['POST'],
  route: 'demos',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const user = getUser(req.headers.get('x-ms-client-principal') ?? undefined)
    if (!user) return { status: 401, body: 'Unauthorized' }

    const input = await req.json() as DemoInput
    if (!input.title || !input.url) return { status: 400, body: 'title and url required' }

    const email = getUserEmail(user)
    const newDemo = buildDemo(input, user, email)

    const result = await readBlob<Demo[]>('demos/demos.json')
    const demos = result?.data ?? []
    demos.push(newDemo)
    await writeBlob('demos/demos.json', demos, result?.etag)

    return {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDemo),
    }
  }
})
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run tests/createDemo.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd c:\repos\DemoCockpit
git add api/src/demos/createDemo.ts api/tests/createDemo.test.ts
git commit -m "feat: POST /api/demos — create demo with owner from auth"
```

---

## Task 8: API — PUT + DELETE /api/demos/{id}

**Files:**
- Create: `api/src/demos/updateDemo.ts`
- Create: `api/src/demos/deleteDemo.ts`
- Create: `api/tests/updateDemo.test.ts`
- Create: `api/tests/deleteDemo.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// api/tests/updateDemo.test.ts
import { describe, it, expect } from 'vitest'
import { canModify } from '../src/demos/updateDemo'
import type { Demo, AuthUser } from '../../src/types'

const demo: Demo = {
  id: '1', title: 'T', description: 'd', url: 'https://x.com',
  category: 'Fabric', icon: 'zap', visibility: 'public',
  owner: { id: 'owner1', name: 'Alice', email: 'alice@inspari.dk' },
  clickCount: 0, notes: '', createdAt: '', updatedAt: ''
}

describe('canModify', () => {
  it('allows owner to modify', () => {
    const user: AuthUser = { userId: 'owner1', userDetails: 'Alice', userRoles: ['authenticated'], claims: [] }
    expect(canModify(demo, user)).toBe(true)
  })

  it('allows admin to modify', () => {
    const user: AuthUser = { userId: 'other', userDetails: 'Admin', userRoles: ['authenticated', 'admin'], claims: [] }
    expect(canModify(demo, user)).toBe(true)
  })

  it('blocks non-owner non-admin', () => {
    const user: AuthUser = { userId: 'other', userDetails: 'Bob', userRoles: ['authenticated'], claims: [] }
    expect(canModify(demo, user)).toBe(false)
  })
})
```

```ts
// api/tests/deleteDemo.test.ts
import { describe, it, expect } from 'vitest'
import { removeDemoById } from '../src/demos/deleteDemo'
import type { Demo } from '../../src/types'

const demos: Demo[] = [
  { id: '1', title: 'A', description: '', url: '', category: '', icon: '', visibility: 'public', owner: { id: 'u1', name: '', email: '' }, clickCount: 0, notes: '', createdAt: '', updatedAt: '' },
  { id: '2', title: 'B', description: '', url: '', category: '', icon: '', visibility: 'public', owner: { id: 'u2', name: '', email: '' }, clickCount: 0, notes: '', createdAt: '', updatedAt: '' },
]

describe('removeDemoById', () => {
  it('removes the matching demo', () => {
    const result = removeDemoById(demos, '1')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('2')
  })

  it('returns same array if id not found', () => {
    const result = removeDemoById(demos, 'nonexistent')
    expect(result.length).toBe(2)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd api
npx vitest run tests/updateDemo.test.ts tests/deleteDemo.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement updateDemo**

```ts
// api/src/demos/updateDemo.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { readBlob, writeBlob } from '../blobClient'
import { getUser } from '../auth'
import type { Demo, AuthUser } from '../../../src/types'

export function canModify(demo: Demo, user: AuthUser): boolean {
  return demo.owner.id === user.userId || user.userRoles.includes('admin')
}

app.http('updateDemo', {
  methods: ['PUT'],
  route: 'demos/{id}',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const user = getUser(req.headers.get('x-ms-client-principal') ?? undefined)
    if (!user) return { status: 401, body: 'Unauthorized' }

    const id = req.params.id
    const result = await readBlob<Demo[]>('demos/demos.json')
    const demos = result?.data ?? []
    const index = demos.findIndex(d => d.id === id)
    if (index === -1) return { status: 404, body: 'Not found' }
    if (!canModify(demos[index], user)) return { status: 403, body: 'Forbidden' }

    const updates = await req.json() as Partial<Demo>
    demos[index] = { ...demos[index], ...updates, id, owner: demos[index].owner, updatedAt: new Date().toISOString() }
    await writeBlob('demos/demos.json', demos, result?.etag)

    return { status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(demos[index]) }
  }
})
```

- [ ] **Step 4: Implement deleteDemo**

```ts
// api/src/demos/deleteDemo.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { readBlob, writeBlob } from '../blobClient'
import { getUser } from '../auth'
import { canModify } from './updateDemo'
import type { Demo } from '../../../src/types'

export function removeDemoById(demos: Demo[], id: string): Demo[] {
  return demos.filter(d => d.id !== id)
}

app.http('deleteDemo', {
  methods: ['DELETE'],
  route: 'demos/{id}',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const user = getUser(req.headers.get('x-ms-client-principal') ?? undefined)
    if (!user) return { status: 401, body: 'Unauthorized' }

    const id = req.params.id
    const result = await readBlob<Demo[]>('demos/demos.json')
    const demos = result?.data ?? []
    const demo = demos.find(d => d.id === id)
    if (!demo) return { status: 404, body: 'Not found' }
    if (!canModify(demo, user)) return { status: 403, body: 'Forbidden' }

    await writeBlob('demos/demos.json', removeDemoById(demos, id), result?.etag)
    return { status: 204 }
  }
})
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run tests/updateDemo.test.ts tests/deleteDemo.test.ts
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd c:\repos\DemoCockpit
git add api/src/demos/updateDemo.ts api/src/demos/deleteDemo.ts api/tests/updateDemo.test.ts api/tests/deleteDemo.test.ts
git commit -m "feat: PUT + DELETE /api/demos/{id} — owner/admin auth enforcement"
```

---

## Task 9: API — POST /api/demos/{id}/click + Preferences

**Files:**
- Create: `api/src/demos/clickDemo.ts`
- Create: `api/src/preferences/getPreferences.ts`
- Create: `api/src/preferences/updatePreferences.ts`
- Create: `api/tests/clickDemo.test.ts`
- Create: `api/tests/getPreferences.test.ts`
- Create: `api/tests/updatePreferences.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// api/tests/clickDemo.test.ts
import { describe, it, expect } from 'vitest'
import { incrementClick } from '../src/demos/clickDemo'
import type { Demo } from '../../src/types'

const demo: Demo = {
  id: '1', title: 'T', description: '', url: '', category: '', icon: '',
  visibility: 'public', owner: { id: 'u1', name: '', email: '' },
  clickCount: 5, notes: '', createdAt: '', updatedAt: ''
}

describe('incrementClick', () => {
  it('increments clickCount by 1', () => {
    const updated = incrementClick(demo)
    expect(updated.clickCount).toBe(6)
  })

  it('does not mutate the original', () => {
    incrementClick(demo)
    expect(demo.clickCount).toBe(5)
  })
})
```

```ts
// api/tests/getPreferences.test.ts
import { describe, it, expect } from 'vitest'
import { defaultPreferences } from '../src/preferences/getPreferences'

describe('defaultPreferences', () => {
  it('returns sensible defaults for a user', () => {
    const prefs = defaultPreferences('user1')
    expect(prefs.userId).toBe('user1')
    expect(prefs.pinnedDemoIds).toEqual([])
    expect(prefs.sortField).toBe('alphabetical')
    expect(prefs.sortDirection).toBe('asc')
    expect(prefs.lastClicked).toEqual({})
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd api
npx vitest run tests/clickDemo.test.ts tests/getPreferences.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement clickDemo**

```ts
// api/src/demos/clickDemo.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { readBlob, writeBlob } from '../blobClient'
import { getUser } from '../auth'
import type { Demo, UserPreferences } from '../../../src/types'

export function incrementClick(demo: Demo): Demo {
  return { ...demo, clickCount: demo.clickCount + 1 }
}

app.http('clickDemo', {
  methods: ['POST'],
  route: 'demos/{id}/click',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const user = getUser(req.headers.get('x-ms-client-principal') ?? undefined)
    if (!user) return { status: 401, body: 'Unauthorized' }

    const id = req.params.id

    // Increment global click count
    const demosResult = await readBlob<Demo[]>('demos/demos.json')
    const demos = demosResult?.data ?? []
    const idx = demos.findIndex(d => d.id === id)
    if (idx === -1) return { status: 404, body: 'Not found' }
    demos[idx] = incrementClick(demos[idx])
    await writeBlob('demos/demos.json', demos, demosResult?.etag)

    // Record lastClicked in user preferences
    const prefKey = `prefs/${user.userId}.json`
    const prefResult = await readBlob<UserPreferences>(prefKey)
    const prefs = prefResult?.data ?? { userId: user.userId, pinnedDemoIds: [], sortField: 'alphabetical', sortDirection: 'asc', lastClicked: {} }
    prefs.lastClicked[id] = new Date().toISOString()
    await writeBlob(prefKey, prefs, prefResult?.etag)

    return { status: 204 }
  }
})
```

- [ ] **Step 4: Implement getPreferences**

```ts
// api/src/preferences/getPreferences.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { readBlob, writeBlob } from '../blobClient'
import { getUser } from '../auth'
import type { UserPreferences } from '../../../src/types'

export function defaultPreferences(userId: string): UserPreferences {
  return {
    userId,
    pinnedDemoIds: [],
    sortField: 'alphabetical',
    sortDirection: 'asc',
    lastClicked: {},
  }
}

app.http('getPreferences', {
  methods: ['GET'],
  route: 'preferences',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const user = getUser(req.headers.get('x-ms-client-principal') ?? undefined)
    if (!user) return { status: 401, body: 'Unauthorized' }

    const key = `prefs/${user.userId}.json`
    const result = await readBlob<UserPreferences>(key)
    const prefs = result?.data ?? defaultPreferences(user.userId)
    if (!result) await writeBlob(key, prefs)

    return { status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prefs) }
  }
})
```

- [ ] **Step 5: Implement updatePreferences**

```ts
// api/src/preferences/updatePreferences.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { readBlob, writeBlob } from '../blobClient'
import { getUser } from '../auth'
import type { UserPreferences } from '../../../src/types'

app.http('updatePreferences', {
  methods: ['PUT'],
  route: 'preferences',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const user = getUser(req.headers.get('x-ms-client-principal') ?? undefined)
    if (!user) return { status: 401, body: 'Unauthorized' }

    const updates = await req.json() as Partial<UserPreferences>
    const key = `prefs/${user.userId}.json`
    const result = await readBlob<UserPreferences>(key)
    const prefs: UserPreferences = { ...(result?.data ?? { userId: user.userId, pinnedDemoIds: [], sortField: 'alphabetical', sortDirection: 'asc', lastClicked: {} }), ...updates, userId: user.userId }
    await writeBlob(key, prefs, result?.etag)

    return { status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prefs) }
  }
})
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
cd api
npx vitest run tests/clickDemo.test.ts tests/getPreferences.test.ts
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
cd c:\repos\DemoCockpit
git add api/src/demos/clickDemo.ts api/src/preferences/ api/tests/clickDemo.test.ts api/tests/getPreferences.test.ts api/tests/updatePreferences.test.ts
git commit -m "feat: click tracking + GET/PUT /api/preferences"
```

---

## Task 10: Frontend — Auth Hook + API Client

**Files:**
- Create: `src/hooks/useAuth.ts`
- Create: `src/api.ts`

- [ ] **Step 1: Create useAuth hook**

```ts
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react'
import type { AuthUser } from '../types'

interface SWAAuthResponse {
  clientPrincipal: AuthUser | null
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/.auth/me')
      .then(r => r.json() as Promise<SWAAuthResponse>)
      .then(data => setUser(data.clientPrincipal))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}
```

- [ ] **Step 2: Create typed API client**

```ts
// src/api.ts
import type { Demo, UserPreferences } from './types'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  demos: {
    list: () => apiFetch<Demo[]>('/api/demos'),
    create: (demo: Omit<Demo, 'id' | 'owner' | 'clickCount' | 'createdAt' | 'updatedAt'>) =>
      apiFetch<Demo>('/api/demos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(demo) }),
    update: (id: string, updates: Partial<Demo>) =>
      apiFetch<Demo>(`/api/demos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }),
    delete: (id: string) =>
      apiFetch<void>(`/api/demos/${id}`, { method: 'DELETE' }),
    click: (id: string) =>
      apiFetch<void>(`/api/demos/${id}/click`, { method: 'POST' }),
  },
  preferences: {
    get: () => apiFetch<UserPreferences>('/api/preferences'),
    update: (prefs: Partial<UserPreferences>) =>
      apiFetch<UserPreferences>('/api/preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prefs) }),
  },
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAuth.ts src/api.ts
git commit -m "feat: useAuth hook + typed API client"
```

---

## Task 11: Frontend — DemoCard Component

**Files:**
- Create: `src/components/DemoCard.tsx`

- [ ] **Step 1: Implement DemoCard**

```tsx
// src/components/DemoCard.tsx
import { Pin, Copy, MessageSquare, Info, Lock } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { Demo, AuthUser } from '../types'
import { isNewDemo } from '../utils/demoUtils'

interface Props {
  demo: Demo
  isPinned: boolean
  currentUser: AuthUser
  onPin: (id: string) => void
  onCopy: (url: string) => void
  onInfo: (demo: Demo) => void
  onClick: (demo: Demo) => void
}

export function DemoCard({ demo, isPinned, currentUser, onPin, onCopy, onInfo, onClick }: Props) {
  const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>>)[
    demo.icon.split('-').map((s, i) => i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s.charAt(0).toUpperCase() + s.slice(1)).join('')
  ] ?? LucideIcons.Zap

  const teamsUrl = `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(demo.owner.email)}`
  const isNew = isNewDemo(demo.createdAt)
  const isOwner = demo.owner.id === currentUser.userId || currentUser.userRoles.includes('admin')

  return (
    <div
      className={`group relative bg-white border rounded-xl p-5 cursor-pointer transition-all hover:border-[#00A4BD] hover:shadow-md hover:-translate-y-0.5 ${isPinned ? 'border-l-4 border-l-[#00A4BD] border-[#e0e0db]' : 'border-[#e0e0db]'}`}
      onClick={() => onClick(demo)}
    >
      <div className="flex gap-4 items-start">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#CCEFF3] text-[#005862]">
          <IconComponent size={22} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[0.95rem] text-[#003C43]">{demo.title}</span>
            {isNew && <span className="text-[0.6rem] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#00A4BD] text-white">New</span>}
            {demo.visibility === 'private' && <span className="flex items-center gap-1 text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full bg-[#ECECEC] text-[#454545] border border-[#d5d5d0]"><Lock size={10} />Private</span>}
          </div>
          <p className="text-[0.8rem] text-[#454545] leading-snug">{demo.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center text-[0.7rem] font-medium px-2 py-0.5 rounded-full bg-[#CCEFF3] text-[#005862]">{demo.category}</span>
            <span className="text-[0.7rem] text-[#454545]">· {demo.owner.name}</span>
            <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              <button onClick={() => onPin(demo.id)} title={isPinned ? 'Unpin' : 'Pin'} className="p-1 rounded hover:bg-[#ECECEC]"><Pin size={14} /></button>
              <button onClick={() => onCopy(demo.url)} title="Copy URL" className="p-1 rounded hover:bg-[#ECECEC]"><Copy size={14} /></button>
              <a href={teamsUrl} target="_blank" rel="noreferrer" title={`Chat with ${demo.owner.name}`} className="p-1 rounded hover:bg-[#ECECEC] flex items-center"><MessageSquare size={14} /></a>
              <button onClick={() => onInfo(demo)} title="Notes & Instructions" className="p-1 rounded hover:bg-[#ECECEC]"><Info size={14} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create demoUtils helper**

```ts
// src/utils/demoUtils.ts
export function isNewDemo(createdAt: string): boolean {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return new Date(createdAt) > sevenDaysAgo
}

export function sortDemos(
  demos: import('../types').Demo[],
  sortField: import('../types').SortField,
  sortDirection: import('../types').SortDirection,
  lastClicked: Record<string, string>
): import('../types').Demo[] {
  return [...demos].sort((a, b) => {
    let cmp = 0
    if (sortField === 'alphabetical') cmp = a.title.localeCompare(b.title)
    else if (sortField === 'clickCount') cmp = b.clickCount - a.clickCount
    else if (sortField === 'lastUsed') {
      const aTime = lastClicked[a.id] ?? '0'
      const bTime = lastClicked[b.id] ?? '0'
      cmp = bTime.localeCompare(aTime)
    }
    return sortDirection === 'asc' ? cmp : -cmp
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/DemoCard.tsx src/utils/demoUtils.ts
git commit -m "feat: DemoCard component + sortDemos/isNewDemo utils"
```

---

## Task 12: Frontend — TopBar + FilterBar

**Files:**
- Create: `src/components/TopBar.tsx`
- Create: `src/components/FilterBar.tsx`

- [ ] **Step 1: Implement TopBar**

```tsx
// src/components/TopBar.tsx
import { Search } from 'lucide-react'
import type { AuthUser } from '../types'

interface Props {
  user: AuthUser
  search: string
  onSearch: (q: string) => void
}

export function TopBar({ user, search, onSearch }: Props) {
  const initials = user.userDetails.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-[#003C43] rounded-t-xl mb-6">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00A4BD]" />
        <span className="text-white font-semibold text-[1rem]">Demo Launchpad</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a0a09a]" />
          <input
            type="text"
            placeholder="Search demos..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-[#a0a09a] text-[0.8rem] w-52 focus:outline-none focus:ring-1 focus:ring-[#00A4BD]"
          />
        </div>
        <div className="w-8 h-8 rounded-full bg-[#00A4BD] text-white flex items-center justify-center text-[0.75rem] font-semibold">
          {initials}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement FilterBar**

```tsx
// src/components/FilterBar.tsx
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { SortField, SortDirection } from '../types'

interface Props {
  categories: string[]
  activeCategory: string
  onCategory: (cat: string) => void
  showPrivate: boolean
  onPrivate: () => void
  sortField: SortField
  sortDirection: SortDirection
  onSortField: (f: SortField) => void
  onSortDirection: () => void
}

export function FilterBar({ categories, activeCategory, onCategory, showPrivate, onPrivate, sortField, sortDirection, onSortField, onSortDirection }: Props) {
  return (
    <div className="flex items-center justify-between px-4 mb-5">
      <div className="flex gap-2 flex-wrap">
        {['All', ...categories].map(cat => (
          <button
            key={cat}
            onClick={() => onCategory(cat)}
            className={`px-3 py-1 rounded-full text-[0.78rem] font-medium border transition-colors ${activeCategory === cat ? 'bg-[#00A4BD] text-white border-[#00A4BD]' : 'bg-white text-[#454545] border-[#d5d5d0] hover:border-[#00A4BD]'}`}
          >
            {cat}
          </button>
        ))}
        <button
          onClick={onPrivate}
          className={`px-3 py-1 rounded-full text-[0.78rem] font-medium border border-dashed transition-colors ${showPrivate ? 'bg-[#00A4BD] text-white border-[#00A4BD]' : 'bg-white text-[#454545] border-[#d5d5d0] hover:border-[#00A4BD]'}`}
        >
          Private
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <select
          value={sortField}
          onChange={e => onSortField(e.target.value as SortField)}
          className="px-2 py-1 rounded-md border border-[#d5d5d0] bg-white text-[#454545] text-[0.78rem] font-[inherit] focus:outline-none"
        >
          <option value="alphabetical">A → Z</option>
          <option value="clickCount">Most clicked</option>
          <option value="lastUsed">Last used</option>
        </select>
        <button onClick={onSortDirection} className="w-7 h-7 flex items-center justify-center rounded-md border border-[#d5d5d0] bg-white hover:bg-[#ECECEC]">
          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TopBar.tsx src/components/FilterBar.tsx
git commit -m "feat: TopBar + FilterBar components"
```

---

## Task 13: Frontend — DetailDrawer

**Files:**
- Create: `src/components/DetailDrawer.tsx`

- [ ] **Step 1: Implement DetailDrawer**

```tsx
// src/components/DetailDrawer.tsx
import { useEffect } from 'react'
import { X, ExternalLink, Copy, MessageSquare } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { marked } from 'marked'
import type { Demo } from '../types'

interface Props {
  demo: Demo | null
  onClose: () => void
  onOpen: (demo: Demo) => void
  onCopy: (url: string) => void
}

export function DetailDrawer({ demo, onClose, onOpen, onCopy }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!demo) return null

  const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>>)[
    demo.icon.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
  ] ?? LucideIcons.Zap

  const teamsUrl = `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(demo.owner.email)}`
  const ownerInitials = demo.owner.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const notesHtml = demo.notes ? marked.parse(demo.notes) as string : ''

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 w-[420px] h-full bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#e0e0db]">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#CCEFF3] text-[#005862] flex-shrink-0">
            <IconComponent size={22} strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[#003C43]">{demo.title}</div>
            <span className="inline-flex items-center text-[0.7rem] font-medium px-2 py-0.5 rounded-full bg-[#CCEFF3] text-[#005862] mt-1">{demo.category}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#ECECEC] text-[#a0a09a]"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          <div>
            <div className="text-[0.72rem] font-semibold uppercase tracking-wider text-[#a0a09a] mb-2">Description</div>
            <p className="text-[0.88rem] text-[#454545] leading-relaxed">{demo.description}</p>
          </div>

          {demo.notes && (
            <div>
              <div className="text-[0.72rem] font-semibold uppercase tracking-wider text-[#a0a09a] mb-2">Notes &amp; Instructions</div>
              <div
                className="text-[0.85rem] text-[#454545] leading-relaxed bg-[#f5f5f3] rounded-lg p-4 border border-[#e0e0db] prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: notesHtml }}
              />
            </div>
          )}

          <div>
            <div className="text-[0.72rem] font-semibold uppercase tracking-wider text-[#a0a09a] mb-2">Owner</div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#00A4BD] text-white flex items-center justify-center text-[0.7rem] font-semibold flex-shrink-0">{ownerInitials}</div>
              <span className="text-[0.88rem] font-medium text-[#003C43]">{demo.owner.name}</span>
              <a href={teamsUrl} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#d5d5d0] text-[0.78rem] text-[#454545] hover:bg-[#ECECEC]">
                <MessageSquare size={13} /> Chat in Teams
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e0e0db] flex gap-3">
          <button
            onClick={() => onOpen(demo)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#00A4BD] text-white font-semibold text-[0.88rem] hover:bg-[#008392] transition-colors"
          >
            <ExternalLink size={15} /> Open Demo
          </button>
          <button
            onClick={() => onCopy(demo.url)}
            className="px-4 py-2 rounded-lg border border-[#d5d5d0] text-[#454545] text-[0.88rem] hover:bg-[#ECECEC] transition-colors"
          >
            <Copy size={15} />
          </button>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DetailDrawer.tsx
git commit -m "feat: DetailDrawer — slide-in panel with markdown notes, Teams link, open CTA"
```

---

## Task 14: Frontend — AddDemoModal + EditDemoModal

**Files:**
- Create: `src/components/AddDemoModal.tsx`
- Create: `src/components/EditDemoModal.tsx`
- Create: `src/components/IconPicker.tsx`

- [ ] **Step 1: Implement IconPicker**

```tsx
// src/components/IconPicker.tsx
import * as LucideIcons from 'lucide-react'

const GENERAL_ICONS = [
  'BarChart2','PieChart','TrendingUp','Database','Table','LineChart','Activity',
  'Brain','Bot','Sparkles','MessageSquare','Lightbulb',
  'Cloud','Server','Globe','Network','Layers',
  'Monitor','Smartphone','Layout','ExternalLink',
  'Users','Building','Briefcase','Target','Rocket',
  'Zap','Shield','Code','Settings','Wrench','Search','Star','Tag','Link',
  'FileText','Play','Map','Compass','Clock','Eye','Package','Presentation'
]

interface Props {
  value: string
  onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto p-1 border border-[#e0e0db] rounded-lg bg-[#f5f5f3]">
      {GENERAL_ICONS.map(name => {
        const Icon = (LucideIcons as Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>>)[name]
        if (!Icon) return null
        const slug = name.replace(/([A-Z])/g, (m, l, i) => (i > 0 ? '-' : '') + l.toLowerCase())
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChange(slug)}
            className={`p-2 rounded-md flex items-center justify-center transition-colors ${value === slug ? 'bg-[#00A4BD] text-white' : 'hover:bg-[#CCEFF3] text-[#454545]'}`}
            title={name}
          >
            <Icon size={16} strokeWidth={1.75} />
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Implement AddDemoModal**

```tsx
// src/components/AddDemoModal.tsx
import { useState } from 'react'
import { X } from 'lucide-react'
import { IconPicker } from './IconPicker'
import type { Demo } from '../types'

type DemoFormData = Omit<Demo, 'id' | 'owner' | 'clickCount' | 'createdAt' | 'updatedAt'>

interface Props {
  onSubmit: (data: DemoFormData) => Promise<void>
  onClose: () => void
}

const EMPTY: DemoFormData = { title: '', description: '', url: '', category: '', icon: 'zap', visibility: 'public', notes: '' }

export function AddDemoModal({ onSubmit, onClose }: Props) {
  const [form, setForm] = useState<DemoFormData>(EMPTY)
  const [saving, setSaving] = useState(false)

  const set = (field: keyof DemoFormData, value: string) => setForm(f => ({ ...f, [field]: value }))
  const valid = form.title.trim() && form.url.trim() && form.category.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setSaving(true)
    await onSubmit(form)
    setSaving(false)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-white rounded-xl shadow-2xl z-50 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[1rem] font-semibold text-[#003C43]">Add Demo</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#ECECEC] text-[#a0a09a]"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Title *"><input required className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} /></Field>
          <Field label="Description *"><textarea required rows={2} className={inputCls} value={form.description} onChange={e => set('description', e.target.value)} /></Field>
          <Field label="URL *"><input required type="url" className={inputCls} value={form.url} onChange={e => set('url', e.target.value)} /></Field>
          <Field label="Category *"><input required className={inputCls} placeholder="e.g. Fabric, Power BI, Website" value={form.category} onChange={e => set('category', e.target.value)} /></Field>
          <Field label="Icon"><IconPicker value={form.icon} onChange={v => set('icon', v)} /></Field>
          <Field label="Visibility">
            <div className="flex gap-3">
              {(['public', 'private'] as const).map(v => (
                <label key={v} className="flex items-center gap-1.5 text-[0.85rem] cursor-pointer">
                  <input type="radio" name="visibility" value={v} checked={form.visibility === v} onChange={() => set('visibility', v)} />
                  {v === 'public' ? 'Everyone' : 'Only me'}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Notes & Instructions (Markdown)">
            <textarea rows={4} className={inputCls} placeholder="Access requirements, demo tips, walkthrough notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={!valid || saving} className="flex-1 py-2 rounded-lg bg-[#00A4BD] text-white font-semibold text-[0.88rem] disabled:opacity-50 hover:bg-[#008392]">
              {saving ? 'Saving…' : 'Add Demo'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[#d5d5d0] text-[#454545] text-[0.88rem] hover:bg-[#ECECEC]">Cancel</button>
          </div>
        </form>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[0.78rem] font-semibold text-[#454545]">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'px-3 py-2 rounded-lg border border-[#d5d5d0] text-[0.85rem] focus:outline-none focus:ring-1 focus:ring-[#00A4BD] w-full'
```

- [ ] **Step 3: Implement EditDemoModal (thin wrapper)**

```tsx
// src/components/EditDemoModal.tsx
import { useState } from 'react'
import { X } from 'lucide-react'
import { IconPicker } from './IconPicker'
import type { Demo } from '../types'

type DemoFormData = Omit<Demo, 'id' | 'owner' | 'clickCount' | 'createdAt' | 'updatedAt'>

interface Props {
  demo: Demo
  onSubmit: (updates: Partial<Demo>) => Promise<void>
  onDelete: () => Promise<void>
  onClose: () => void
}

const inputCls = 'px-3 py-2 rounded-lg border border-[#d5d5d0] text-[0.85rem] focus:outline-none focus:ring-1 focus:ring-[#00A4BD] w-full'

export function EditDemoModal({ demo, onSubmit, onDelete, onClose }: Props) {
  const [form, setForm] = useState<DemoFormData>({ title: demo.title, description: demo.description, url: demo.url, category: demo.category, icon: demo.icon, visibility: demo.visibility, notes: demo.notes })
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const set = (field: keyof DemoFormData, value: string) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSubmit(form)
    setSaving(false)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-white rounded-xl shadow-2xl z-50 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[1rem] font-semibold text-[#003C43]">Edit Demo</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#ECECEC] text-[#a0a09a]"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1"><label className="text-[0.78rem] font-semibold text-[#454545]">Title *</label><input required className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className="text-[0.78rem] font-semibold text-[#454545]">Description *</label><textarea required rows={2} className={inputCls} value={form.description} onChange={e => set('description', e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className="text-[0.78rem] font-semibold text-[#454545]">URL *</label><input required type="url" className={inputCls} value={form.url} onChange={e => set('url', e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className="text-[0.78rem] font-semibold text-[#454545]">Category *</label><input required className={inputCls} value={form.category} onChange={e => set('category', e.target.value)} /></div>
          <div className="flex flex-col gap-1"><label className="text-[0.78rem] font-semibold text-[#454545]">Icon</label><IconPicker value={form.icon} onChange={v => set('icon', v)} /></div>
          <div className="flex flex-col gap-1"><label className="text-[0.78rem] font-semibold text-[#454545]">Visibility</label>
            <div className="flex gap-3">{(['public', 'private'] as const).map(v => (<label key={v} className="flex items-center gap-1.5 text-[0.85rem] cursor-pointer"><input type="radio" name="visibility" value={v} checked={form.visibility === v} onChange={() => set('visibility', v)} />{v === 'public' ? 'Everyone' : 'Only me'}</label>))}</div>
          </div>
          <div className="flex flex-col gap-1"><label className="text-[0.78rem] font-semibold text-[#454545]">Notes & Instructions (Markdown)</label><textarea rows={4} className={inputCls} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-[#00A4BD] text-white font-semibold text-[0.88rem] disabled:opacity-50 hover:bg-[#008392]">{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[#d5d5d0] text-[#454545] text-[0.88rem] hover:bg-[#ECECEC]">Cancel</button>
          </div>
        </form>
        <div className="mt-4 pt-4 border-t border-[#e0e0db]">
          {!confirming
            ? <button type="button" onClick={() => setConfirming(true)} className="text-[0.8rem] text-red-500 hover:underline">Delete demo</button>
            : <div className="flex items-center gap-3">
                <span className="text-[0.8rem] text-[#454545]">Are you sure?</span>
                <button type="button" onClick={onDelete} className="text-[0.8rem] text-red-600 font-semibold hover:underline">Yes, delete</button>
                <button type="button" onClick={() => setConfirming(false)} className="text-[0.8rem] text-[#a0a09a] hover:underline">Cancel</button>
              </div>
          }
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/IconPicker.tsx src/components/AddDemoModal.tsx src/components/EditDemoModal.tsx
git commit -m "feat: IconPicker, AddDemoModal, EditDemoModal"
```

---

## Task 15: Frontend — DemoGrid + App Shell

**Files:**
- Create: `src/components/DemoGrid.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement DemoGrid**

```tsx
// src/components/DemoGrid.tsx
import { Pin } from 'lucide-react'
import { DemoCard } from './DemoCard'
import type { Demo, AuthUser } from '../types'

interface Props {
  pinnedDemos: Demo[]
  otherDemos: Demo[]
  pinnedIds: string[]
  currentUser: AuthUser
  onPin: (id: string) => void
  onCopy: (url: string) => void
  onInfo: (demo: Demo) => void
  onClick: (demo: Demo) => void
}

export function DemoGrid({ pinnedDemos, otherDemos, pinnedIds, currentUser, onPin, onCopy, onInfo, onClick }: Props) {
  return (
    <div>
      {pinnedDemos.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-1.5 px-4 mb-3 text-[0.8rem] font-semibold text-[#a0a09a] uppercase tracking-wider">
            <Pin size={12} /> Pinned
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 px-4">
            {pinnedDemos.map(d => <DemoCard key={d.id} demo={d} isPinned={true} currentUser={currentUser} onPin={onPin} onCopy={onCopy} onInfo={onInfo} onClick={onClick} />)}
          </div>
        </div>
      )}
      <div>
        <div className="px-4 mb-3 text-[0.8rem] font-semibold text-[#a0a09a] uppercase tracking-wider">All demos</div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 px-4">
          {otherDemos.map(d => <DemoCard key={d.id} demo={d} isPinned={false} currentUser={currentUser} onPin={onPin} onCopy={onCopy} onInfo={onInfo} onClick={onClick} />)}
        </div>
        {otherDemos.length === 0 && <p className="px-4 text-[0.85rem] text-[#a0a09a]">No demos match your filters.</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement App.tsx**

```tsx
// src/App.tsx
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { api } from './api'
import { TopBar } from './components/TopBar'
import { FilterBar } from './components/FilterBar'
import { DemoGrid } from './components/DemoGrid'
import { DetailDrawer } from './components/DetailDrawer'
import { AddDemoModal } from './components/AddDemoModal'
import { EditDemoModal } from './components/EditDemoModal'
import { sortDemos } from './utils/demoUtils'
import type { Demo, UserPreferences, SortField, SortDirection } from './types'

export default function App() {
  const { user, loading } = useAuth()
  const [demos, setDemos] = useState<Demo[]>([])
  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [showPrivate, setShowPrivate] = useState(false)
  const [drawerDemo, setDrawerDemo] = useState<Demo | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editDemo, setEditDemo] = useState<Demo | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([api.demos.list(), api.preferences.get()]).then(([d, p]) => {
      setDemos(d)
      setPrefs(p)
    })
  }, [user])

  const categories = useMemo(() => [...new Set(demos.map(d => d.category))].sort(), [demos])

  const filtered = useMemo(() => {
    if (!prefs) return []
    let result = demos
    if (showPrivate) result = result.filter(d => d.owner.id === user?.userId)
    if (activeCategory !== 'All') result = result.filter(d => d.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(d => d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q))
    }
    return sortDemos(result, prefs.sortField, prefs.sortDirection, prefs.lastClicked)
  }, [demos, prefs, search, activeCategory, showPrivate, user])

  const pinnedDemos = filtered.filter(d => prefs?.pinnedDemoIds.includes(d.id))
  const otherDemos = filtered.filter(d => !prefs?.pinnedDemoIds.includes(d.id))

  const handlePin = useCallback(async (id: string) => {
    if (!prefs) return
    const pinned = prefs.pinnedDemoIds.includes(id)
      ? prefs.pinnedDemoIds.filter(p => p !== id)
      : [...prefs.pinnedDemoIds, id]
    const updated = await api.preferences.update({ pinnedDemoIds: pinned })
    setPrefs(updated)
  }, [prefs])

  const handleCopy = useCallback((url: string) => navigator.clipboard.writeText(url), [])

  const handleDemoClick = useCallback(async (demo: Demo) => {
    window.open(demo.url, '_blank', 'noreferrer')
    await api.demos.click(demo.id)
    setDemos(prev => prev.map(d => d.id === demo.id ? { ...d, clickCount: d.clickCount + 1 } : d))
    if (prefs) setPrefs(p => p ? { ...p, lastClicked: { ...p.lastClicked, [demo.id]: new Date().toISOString() } } : p)
  }, [prefs])

  const handleSortField = useCallback(async (field: SortField) => {
    if (!prefs) return
    const updated = await api.preferences.update({ sortField: field })
    setPrefs(updated)
  }, [prefs])

  const handleSortDirection = useCallback(async () => {
    if (!prefs) return
    const dir: SortDirection = prefs.sortDirection === 'asc' ? 'desc' : 'asc'
    const updated = await api.preferences.update({ sortDirection: dir })
    setPrefs(updated)
  }, [prefs])

  const handleAddDemo = useCallback(async (data: Omit<Demo, 'id' | 'owner' | 'clickCount' | 'createdAt' | 'updatedAt'>) => {
    const created = await api.demos.create(data)
    setDemos(prev => [...prev, created])
    setShowAdd(false)
  }, [])

  const handleEditDemo = useCallback(async (updates: Partial<Demo>) => {
    if (!editDemo) return
    const updated = await api.demos.update(editDemo.id, updates)
    setDemos(prev => prev.map(d => d.id === editDemo.id ? updated : d))
    setEditDemo(null)
  }, [editDemo])

  const handleDeleteDemo = useCallback(async () => {
    if (!editDemo) return
    await api.demos.delete(editDemo.id)
    setDemos(prev => prev.filter(d => d.id !== editDemo.id))
    setEditDemo(null)
  }, [editDemo])

  if (loading) return <div className="h-screen flex items-center justify-center text-[#a0a09a]">Loading…</div>
  if (!user) return <div className="h-screen flex items-center justify-center text-[#a0a09a]">Redirecting to login…</div>
  if (!prefs) return <div className="h-screen flex items-center justify-center text-[#a0a09a]">Loading…</div>

  return (
    <div className="min-h-screen bg-[#f5f5f3] py-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-[#e0e0db]">
        <TopBar user={user} search={search} onSearch={setSearch} />
        <FilterBar
          categories={categories}
          activeCategory={activeCategory}
          onCategory={setActiveCategory}
          showPrivate={showPrivate}
          onPrivate={() => setShowPrivate(v => !v)}
          sortField={prefs.sortField}
          sortDirection={prefs.sortDirection}
          onSortField={handleSortField}
          onSortDirection={handleSortDirection}
        />
        <DemoGrid
          pinnedDemos={pinnedDemos}
          otherDemos={otherDemos}
          pinnedIds={prefs.pinnedDemoIds}
          currentUser={user}
          onPin={handlePin}
          onCopy={handleCopy}
          onInfo={setDrawerDemo}
          onClick={handleDemoClick}
        />
        <div className="h-6" />
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[#00A4BD] text-white shadow-lg flex items-center justify-center text-2xl hover:bg-[#008392] transition-colors hover:scale-105"
        title="Add demo"
      >
        <Plus size={24} />
      </button>

      <DetailDrawer
        demo={drawerDemo}
        onClose={() => setDrawerDemo(null)}
        onOpen={handleDemoClick}
        onCopy={handleCopy}
      />

      {showAdd && <AddDemoModal onSubmit={handleAddDemo} onClose={() => setShowAdd(false)} />}
      {editDemo && <EditDemoModal demo={editDemo} onSubmit={handleEditDemo} onDelete={handleDeleteDemo} onClose={() => setEditDemo(null)} />}
    </div>
  )
}
```

- [ ] **Step 3: Update src/main.tsx**

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 4: Commit**

```bash
git add src/components/DemoGrid.tsx src/App.tsx src/main.tsx
git commit -m "feat: DemoGrid + App shell — full frontend wired up"
```

---

## Task 16: Azure Infrastructure

> Do this after the code is working locally with the SWA CLI emulator.

**Prerequisites:**
- Azure CLI installed and logged in (`az login`)
- Azure subscription available

- [ ] **Step 1: Register Entra app**

```bash
az ad app create \
  --display-name "Demo Launchpad" \
  --sign-in-audience AzureADMyOrg \
  --web-redirect-uris "https://democockpit.azurestaticapps.net/.auth/login/aad/callback"
```

Note the `appId` from the output. Then create a client secret:

```bash
az ad app credential reset --id <appId> --display-name "swa-auth"
```

Note the `password` from the output. These become `AAD_CLIENT_ID` and `AAD_CLIENT_SECRET`.

- [ ] **Step 2: Create Storage Account + container**

```bash
az group create --name rg-democockpit --location northeurope

az storage account create \
  --name stdemocockpit \
  --resource-group rg-democockpit \
  --location northeurope \
  --sku Standard_LRS \
  --kind StorageV2

az storage container create \
  --name launchpad \
  --account-name stdemocockpit
```

- [ ] **Step 3: Create Azure Static Web Apps resource**

```bash
az staticwebapp create \
  --name democockpit \
  --resource-group rg-democockpit \
  --location "northeurope" \
  --sku Free \
  --source https://github.com/<your-org>/DemoCockpit \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --output-location "dist"
```

Note the deployment token from the output (or retrieve it with `az staticwebapp secrets list --name democockpit --resource-group rg-democockpit`).

- [ ] **Step 4: Add Application Settings**

```bash
az staticwebapp appsettings set \
  --name democockpit \
  --resource-group rg-democockpit \
  --setting-names \
    AAD_CLIENT_ID=<appId> \
    AAD_CLIENT_SECRET=<password> \
    STORAGE_CONNECTION_STRING="$(az storage account show-connection-string --name stdemocockpit --resource-group rg-democockpit --query connectionString -o tsv)" \
    STORAGE_CONTAINER_NAME=launchpad
```

- [ ] **Step 5: Push to GitHub to trigger first deploy**

```bash
cd c:\repos\DemoCockpit
git remote add origin https://github.com/<your-org>/DemoCockpit.git
git push -u origin main
```

Expected: GitHub Actions workflow fires, SWA builds and deploys frontend + API.

- [ ] **Step 6: Verify**

Navigate to `https://democockpit.azurestaticapps.net`. You should be redirected to Entra login. After login you should see the Demo Launchpad app.

- [ ] **Step 7: Assign yourself the admin role**

Azure Portal → Static Web Apps → democockpit → Role Management → Invite user → enter your email → role: `admin`.

- [ ] **Step 8: Commit infra notes**

```bash
git add .
git commit -m "chore: infra provisioned — SWA democockpit + stdemocockpit storage"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| React + TypeScript + Vite | Task 1 |
| Azure Static Web Apps | Task 16 |
| Custom Entra ID provider (tenant-restricted) | Task 3, Task 16 |
| Blob Storage (demos.json + prefs/{userId}.json) | Task 5 |
| Managed identity → Note: Task 16 uses connection string for simplicity; switch to managed identity post-deploy by assigning Storage Blob Data Contributor role to the SWA managed identity and removing STORAGE_CONNECTION_STRING |
| ETag concurrency | Task 5 |
| GET/POST/PUT/DELETE /api/demos | Tasks 6-8 |
| POST /api/demos/{id}/click | Task 9 |
| GET/PUT /api/preferences | Task 9 |
| Owner/admin auth on edit/delete | Task 8 |
| Private demo server-side filtering | Task 6 |
| DemoCard with hover actions | Task 11 |
| TopBar + FilterBar | Task 12 |
| DetailDrawer with markdown | Task 13 |
| Add/Edit modals + IconPicker | Task 14 |
| DemoGrid (pinned + all sections) | Task 15 |
| Sort by alphabetical/clickCount/lastUsed + direction | Task 11 (sortDemos util), Task 15 (App) |
| "New" badge (7 days) | Task 11 (isNewDemo util) |
| "Private" badge | Task 11 |
| Pin/unpin persisted | Task 15 (App) |
| Teams deep link with owner name | Task 11, Task 13 |
| Copy URL to clipboard | Task 15 (App) |
| Open in new tab | Task 15 (App) |
| navigationFallback | Task 3 |
| Security headers (CSP, X-Content-Type-Options) | Task 3 |
| Node 20 runtime | Task 3 |
| `@tailwindcss/vite` Tailwind setup | Task 1 |

> **Managed identity note:** Task 16 provisions with a connection string for ease of initial setup. After first successful deploy, switch to managed identity: assign the `Storage Blob Data Contributor` role to the SWA system-assigned managed identity on the storage account, then remove `STORAGE_CONNECTION_STRING` and update `blobClient.ts` to use `DefaultAzureCredential` from `@azure/identity`.
