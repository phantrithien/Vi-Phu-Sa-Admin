import test from 'node:test';
import assert from 'node:assert/strict';

import { validateArchiveData } from '../archiveService.js';

test('archive validation rejects missing project fields', () => {
    const result = validateArchiveData({});

    assert.equal(result.isValid, false);
    assert.ok(result.errors.includes('projectId'));
    assert.ok(result.errors.includes('projectTitle'));
});

test('archive validation accepts required project fields', () => {
    const result = validateArchiveData({
        projectId: 'project-1',
        projectTitle: 'Campaign A',
    });

    assert.equal(result.isValid, true);
    assert.deepEqual(result.errors, []);
});
