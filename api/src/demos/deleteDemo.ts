import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions'
import { readBlob, writeBlob } from '../blobClient.js'
import { getUser } from '../auth.js'
import { canModify } from './updateDemo.js'
import type { Demo } from '../types.js'

app.http('deleteDemo', {
  methods: ['DELETE'],
  route: 'demos/{id}',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, _ctx: InvocationContext): Promise<HttpResponseInit> => {
    const user = getUser(req.headers.get('x-ms-client-principal') ?? undefined)
    if (!user) return { status: 401, body: 'Unauthorized' }

    const id = req.params.id
    const result = await readBlob<Demo[]>('demos/demos.json')
    const demos = result?.data ?? []
    const demo = demos.find(d => d.id === id)
    if (!demo) return { status: 404, body: 'Not found' }
    if (!canModify(demo, user)) return { status: 403, body: 'Forbidden' }

    await writeBlob('demos/demos.json', demos.filter(d => d.id !== id), result?.etag)
    return { status: 204 }
  }
})
