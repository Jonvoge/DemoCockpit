import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions'
import { randomUUID } from 'crypto'
import { readBlob, writeBlob } from '../blobClient.js'
import { getUser, getUserEmail } from '../auth.js'
import type { Demo, AuthUser } from '../types.js'

type DemoInput = Pick<Demo, 'title' | 'description' | 'url' | 'category' | 'icon' | 'visibility' | 'notes'>

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

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
    try {
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
    } catch (error) {
      ctx.error('createDemo failed', error)
      return { status: 500, body: `createDemo failed: ${getErrorMessage(error)}` }
    }
  }
})
