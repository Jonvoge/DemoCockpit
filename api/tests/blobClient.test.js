"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock('@azure/storage-blob', () => ({
    BlobServiceClient: {
        fromConnectionString: vitest_1.vi.fn(() => ({
            getContainerClient: vitest_1.vi.fn(() => ({
                getBlobClient: vitest_1.vi.fn(() => ({
                    getBlockBlobClient: vitest_1.vi.fn(() => ({
                        download: vitest_1.vi.fn(),
                        upload: vitest_1.vi.fn(),
                    })),
                })),
            })),
        })),
    },
}));
const blobClient_1 = require("../src/blobClient");
(0, vitest_1.describe)('readBlob / writeBlob', () => {
    (0, vitest_1.it)('readBlob and writeBlob are exported functions', () => {
        (0, vitest_1.expect)(typeof blobClient_1.readBlob).toBe('function');
        (0, vitest_1.expect)(typeof blobClient_1.writeBlob).toBe('function');
    });
});
