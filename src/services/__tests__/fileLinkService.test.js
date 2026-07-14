import test from 'node:test';
import assert from 'node:assert/strict';

import { validateFileLinkData } from '../fileLinkService.js';

test('file link validation rejects invalid URL', () => {
    const result = validateFileLinkData({
        projectId: 'project-1',
        title: 'Drive brief',
        url: 'not-a-url',
    });

    assert.equal(result.isValid, false);
    assert.ok(result.errors.includes('url'));
});

test('file link validation accepts a valid https URL', () => {
    const result = validateFileLinkData({
        projectId: 'project-1',
        title: 'Drive brief',
        url: 'https://drive.google.com/file/d/123/view',
    });

    assert.equal(result.isValid, true);
    assert.deepEqual(result.errors, []);
});
