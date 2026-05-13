import { describe, it, expect, vi } from 'vitest'

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

describe('readBlob / writeBlob', () => {
  it('readBlob and writeBlob are exported functions', () => {
    expect(typeof readBlob).toBe('function')
    expect(typeof writeBlob).toBe('function')
  })
})
