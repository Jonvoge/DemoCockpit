"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const auth_1 = require("../src/auth");
(0, vitest_1.describe)('getUser', () => {
    (0, vitest_1.it)('returns null when header is missing', () => {
        (0, vitest_1.expect)((0, auth_1.getUser)(undefined)).toBeNull();
    });
    (0, vitest_1.it)('decodes a valid x-ms-client-principal header', () => {
        const payload = {
            userId: 'abc123',
            userDetails: 'Jon Vöge',
            userRoles: ['authenticated'],
            claims: [{ typ: 'preferred_username', val: 'jon@inspari.dk' }]
        };
        const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
        const user = (0, auth_1.getUser)(encoded);
        (0, vitest_1.expect)(user).not.toBeNull();
        (0, vitest_1.expect)(user.userId).toBe('abc123');
        (0, vitest_1.expect)(user.userDetails).toBe('Jon Vöge');
        (0, vitest_1.expect)(user.claims[0].val).toBe('jon@inspari.dk');
    });
    (0, vitest_1.it)('returns null when header is malformed base64', () => {
        (0, vitest_1.expect)((0, auth_1.getUser)('!!!not-base64!!!')).toBeNull();
    });
});
(0, vitest_1.describe)('getUserEmail', () => {
    (0, vitest_1.it)('returns preferred_username claim', () => {
        const user = {
            userId: 'u1', userDetails: 'Jon', userRoles: ['authenticated'],
            claims: [{ typ: 'preferred_username', val: 'jon@inspari.dk' }]
        };
        (0, vitest_1.expect)((0, auth_1.getUserEmail)(user)).toBe('jon@inspari.dk');
    });
    (0, vitest_1.it)('falls back to userDetails when no email claim', () => {
        const user = {
            userId: 'u1', userDetails: 'Jon Vöge', userRoles: ['authenticated'],
            claims: []
        };
        (0, vitest_1.expect)((0, auth_1.getUserEmail)(user)).toBe('Jon Vöge');
    });
});
