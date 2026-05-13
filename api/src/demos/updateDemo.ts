import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions'
import { readBlob, writeBlob } from '../blobClient.js'
import { getUser } from '../auth.js'
import type { Demo, AuthUser } from '../../../src/types.js'

export function canModify(demo: Demo, user: AuthUser): boolean {
  return demo.owner.id === user.userId || user.userRoles.includes('admin')
}

app.http('updateDemo', {
  methods: ['PUT'],
  route: 'demos/{id}',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, _ctx: InvocationContext): Promise<HttpResponseInit> => {
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

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(demos[index]),
    }
  }
})
