"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const deleteDemo_1 = require("../src/demos/deleteDemo");
const demos = [
    { id: '1', title: 'A', description: '', url: '', category: '', icon: '', visibility: 'public', owner: { id: 'u1', name: '', email: '' }, clickCount: 0, notes: '', createdAt: '', updatedAt: '' },
    { id: '2', title: 'B', description: '', url: '', category: '', icon: '', visibility: 'public', owner: { id: 'u2', name: '', email: '' }, clickCount: 0, notes: '', createdAt: '', updatedAt: '' },
];
(0, vitest_1.describe)('removeDemoById', () => {
    (0, vitest_1.it)('removes the matching demo', () => {
        const result = (0, deleteDemo_1.removeDemoById)(demos, '1');
        (0, vitest_1.expect)(result.length).toBe(1);
        (0, vitest_1.expect)(result[0].id).toBe('2');
    });
    (0, vitest_1.it)('returns same array if id not found', () => {
        const result = (0, deleteDemo_1.removeDemoById)(demos, 'nonexistent');
        (0, vitest_1.expect)(result.length).toBe(2);
    });
});
