"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const updateDemo_1 = require("../src/demos/updateDemo");
const demo = {
    id: '1', title: 'T', description: 'd', url: 'https://x.com',
    category: 'Fabric', icon: 'zap', visibility: 'public',
    owner: { id: 'owner1', name: 'Alice', email: 'alice@inspari.dk' },
    clickCount: 0, notes: '', createdAt: '', updatedAt: ''
};
(0, vitest_1.describe)('canModify', () => {
    (0, vitest_1.it)('allows owner to modify', () => {
        const user = { userId: 'owner1', userDetails: 'Alice', userRoles: ['authenticated'], claims: [] };
        (0, vitest_1.expect)((0, updateDemo_1.canModify)(demo, user)).toBe(true);
    });
    (0, vitest_1.it)('allows admin to modify', () => {
        const user = { userId: 'other', userDetails: 'Admin', userRoles: ['authenticated', 'admin'], claims: [] };
        (0, vitest_1.expect)((0, updateDemo_1.canModify)(demo, user)).toBe(true);
    });
    (0, vitest_1.it)('blocks non-owner non-admin', () => {
        const user = { userId: 'other', userDetails: 'Bob', userRoles: ['authenticated'], claims: [] };
        (0, vitest_1.expect)((0, updateDemo_1.canModify)(demo, user)).toBe(false);
    });
});
