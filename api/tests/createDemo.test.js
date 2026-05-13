"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock('../src/blobClient', () => ({
    readBlob: vitest_1.vi.fn(async () => ({ data: [], etag: '"abc"' })),
    writeBlob: vitest_1.vi.fn(async () => { }),
}));
vitest_1.vi.mock('../src/auth', () => ({
    getUser: vitest_1.vi.fn(() => ({ userId: 'u1', userDetails: 'Jon', userRoles: ['authenticated'], claims: [{ typ: 'preferred_username', val: 'jon@inspari.dk' }] })),
    getUserEmail: vitest_1.vi.fn(() => 'jon@inspari.dk'),
}));
const createDemo_1 = require("../src/demos/createDemo");
(0, vitest_1.describe)('buildDemo', () => {
    (0, vitest_1.it)('sets owner from user context', () => {
        const user = { userId: 'u1', userDetails: 'Jon', userRoles: ['authenticated'], claims: [{ typ: 'preferred_username', val: 'jon@inspari.dk' }] };
        const input = { title: 'Test', description: 'desc', url: 'https://x.com', category: 'Fabric', icon: 'zap', visibility: 'public', notes: '' };
        const demo = (0, createDemo_1.buildDemo)(input, user, 'jon@inspari.dk');
        (0, vitest_1.expect)(demo.owner.id).toBe('u1');
        (0, vitest_1.expect)(demo.owner.email).toBe('jon@inspari.dk');
        (0, vitest_1.expect)(demo.clickCount).toBe(0);
        (0, vitest_1.expect)(demo.id).toMatch(/^[0-9a-f-]{36}$/);
    });
    (0, vitest_1.it)('sets createdAt and updatedAt to same value', () => {
        const user = { userId: 'u1', userDetails: 'Jon', userRoles: ['authenticated'], claims: [] };
        const input = { title: 'T', description: 'd', url: 'https://x.com', category: 'Fabric', icon: 'zap', visibility: 'public', notes: '' };
        const demo = (0, createDemo_1.buildDemo)(input, user, 'jon@inspari.dk');
        (0, vitest_1.expect)(demo.createdAt).toBe(demo.updatedAt);
    });
});
