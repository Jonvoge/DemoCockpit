import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions'
import { readBlob, writeBlob } from '../blobClient.js'
import { getUser } from '../auth.js'
import type { UserPreferences } from '../../../src/types.js'

app.http('updatePreferences', {
  methods: ['PUT'],
  route: 'preferences',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, _ctx: InvocationContext): Promise<HttpResponseInit> => {
    const user = getUser(req.headers.get('x-ms-client-principal') ?? undefined)
    if (!user) return { status: 401, body: 'Unauthorized' }

    const updates = await req.json() as Partial<UserPreferences>
    const key = `prefs/${user.userId}.json`
    const result = await readBlob<UserPreferences>(key)
    const prefs: UserPreferences = {
      ...(result?.data ?? { userId: user.userId, pinnedDemoIds: [], sortField: 'alphabetical', sortDirection: 'asc', lastClicked: {} }),
      ...updates,
      userId: user.userId,
    }
    await writeBlob(key, prefs, result?.etag)

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    }
  }
})
