import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions'
import { readBlob, writeBlob } from '../blobClient.js'
import { getUser } from '../auth.js'
import { defaultPreferences } from '../preferences/getPreferences.js'
import type { Demo, UserPreferences } from '../types.js'

app.http('clickDemo', {
  methods: ['POST'],
  route: 'demos/{id}/click',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, _ctx: InvocationContext): Promise<HttpResponseInit> => {
    const user = getUser(req.headers.get('x-ms-client-principal') ?? undefined)
    if (!user) return { status: 401, body: 'Unauthorized' }

    const id = req.params.id

    const demosResult = await readBlob<Demo[]>('demos/demos.json')
    const demos = demosResult?.data ?? []
    const idx = demos.findIndex(d => d.id === id)
    if (idx === -1) return { status: 404, body: 'Not found' }
    demos[idx] = { ...demos[idx], clickCount: demos[idx].clickCount + 1 }
    await writeBlob('demos/demos.json', demos, demosResult?.etag)

    const prefKey = `prefs/${user.userId}.json`
    const prefResult = await readBlob<UserPreferences>(prefKey)
    const prefs: UserPreferences = prefResult?.data ?? defaultPreferences(user.userId)
    prefs.lastClicked[id] = new Date().toISOString()
    await writeBlob(prefKey, prefs, prefResult?.etag)

    return { status: 204 }
  }
})
