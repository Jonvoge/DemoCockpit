"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const getPreferences_1 = require("../src/preferences/getPreferences");
(0, vitest_1.describe)('defaultPreferences', () => {
    (0, vitest_1.it)('returns sensible defaults for a user', () => {
        const prefs = (0, getPreferences_1.defaultPreferences)('user1');
        (0, vitest_1.expect)(prefs.userId).toBe('user1');
        (0, vitest_1.expect)(prefs.pinnedDemoIds).toEqual([]);
        (0, vitest_1.expect)(prefs.sortField).toBe('alphabetical');
        (0, vitest_1.expect)(prefs.sortDirection).toBe('asc');
        (0, vitest_1.expect)(prefs.lastClicked).toEqual({});
    });
});
