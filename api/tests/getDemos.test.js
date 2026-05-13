"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const mockDemos = [
    {
        id: '1', title: 'Public Demo', description: 'desc', url: 'https://a.com',
        category: 'Fabric', icon: 'zap', visibility: 'public',
        owner: { id: 'user1', name: 'Alice', email: 'alice@inspari.dk' },
        clickCount: 5, notes: '', createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z'
    },
    {
        id: '2', title: 'Private Demo', description: 'desc', url: 'https://b.com',
        category: 'Power BI', icon: 'bar-chart-2', visibility: 'private',
        owner: { id: 'user2', name: 'Bob', email: 'bob@inspari.dk' },
        clickCount: 2, notes: '', createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z'
    },
];
vitest_1.vi.mock('../src/blobClient', () => ({
    readBlob: vitest_1.vi.fn(async () => ({ data: mockDemos, etag: '"abc"' })),
    writeBlob: vitest_1.vi.fn(async () => { }),
}));
vitest_1.vi.mock('../src/auth', () => ({
    getUser: vitest_1.vi.fn(() => ({ userId: 'user1', userDetails: 'Alice', userRoles: ['authenticated'], claims: [] })),
    getUserEmail: vitest_1.vi.fn(() => 'alice@inspari.dk'),
}));
const getDemos_1 = require("../src/demos/getDemos");
(0, vitest_1.describe)('filterDemosForUser', () => {
    (0, vitest_1.it)('returns public demos for any user', () => {
        const result = (0, getDemos_1.filterDemosForUser)(mockDemos, 'user1');
        (0, vitest_1.expect)(result.find(d => d.id === '1')).toBeDefined();
    });
    (0, vitest_1.it)('returns own private demos', () => {
        const result = (0, getDemos_1.filterDemosForUser)(mockDemos, 'user2');
        (0, vitest_1.expect)(result.find(d => d.id === '2')).toBeDefined();
    });
    (0, vitest_1.it)('hides other users private demos', () => {
        const result = (0, getDemos_1.filterDemosForUser)(mockDemos, 'user1');
        (0, vitest_1.expect)(result.find(d => d.id === '2')).toBeUndefined();
    });
});
