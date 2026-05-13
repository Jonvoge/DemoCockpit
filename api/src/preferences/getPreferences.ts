import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions'
import { readBlob, writeBlob } from '../blobClient.js'
import { getUser } from '../auth.js'
import type { UserPreferences } from '../../../src/types.js'

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
  handler: async (req: HttpRequest, _ctx: InvocationContext): Promise<HttpResponseInit> => {
    const user = getUser(req.headers.get('x-ms-client-principal') ?? undefined)
    if (!user) return { status: 401, body: 'Unauthorized' }

    const key = `prefs/${user.userId}.json`
    const result = await readBlob<UserPreferences>(key)
    const prefs = result?.data ?? defaultPreferences(user.userId)
    if (!result) await writeBlob(key, prefs)

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    }
  }
})
