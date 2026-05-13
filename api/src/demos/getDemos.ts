import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions'
import { readBlob } from '../blobClient.js'
import { getUser } from '../auth.js'
import type { Demo } from '../types.js'

export function filterDemosForUser(demos: Demo[], userId: string): Demo[] {
  return demos.filter(d => d.visibility === 'public' || d.owner.id === userId)
}

app.http('getDemos', {
  methods: ['GET'],
  route: 'demos',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, _ctx: InvocationContext): Promise<HttpResponseInit> => {
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
