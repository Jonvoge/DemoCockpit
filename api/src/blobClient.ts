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
