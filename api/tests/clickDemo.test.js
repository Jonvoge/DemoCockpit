"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const clickDemo_1 = require("../src/demos/clickDemo");
const demo = {
    id: '1', title: 'T', description: '', url: '', category: '', icon: '',
    visibility: 'public', owner: { id: 'u1', name: '', email: '' },
    clickCount: 5, notes: '', createdAt: '', updatedAt: ''
};
(0, vitest_1.describe)('incrementClick', () => {
    (0, vitest_1.it)('increments clickCount by 1', () => {
        const updated = (0, clickDemo_1.incrementClick)(demo);
        (0, vitest_1.expect)(updated.clickCount).toBe(6);
    });
    (0, vitest_1.it)('does not mutate the original', () => {
        (0, clickDemo_1.incrementClick)(demo);
        (0, vitest_1.expect)(demo.clickCount).toBe(5);
    });
});
