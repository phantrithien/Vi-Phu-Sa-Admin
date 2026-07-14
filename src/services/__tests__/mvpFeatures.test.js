import test from 'node:test';
import assert from 'node:assert/strict';

import { PERMISSIONS, hasPermission, hasAnyPermission } from '../../constants/permissions.js';
import { buildProjectCode, validateProjectData } from '../projectService.js';
import { validateSopData } from '../sopService.js';
import { buildChecklistFromSop, calculateChecklistProgress, mergeChecklistFromSop } from '../projectChecklistService.js';

test('owner has project and sop permissions', () => {
    assert.equal(hasPermission('owner', PERMISSIONS.PROJECT), true);
    assert.equal(hasPermission('owner', PERMISSIONS.SOP), true);
    assert.equal(hasAnyPermission('viewer', [PERMISSIONS.PROJECT, PERMISSIONS.FINANCE]), false);
});

test('project code generation is deterministic', () => {
    assert.equal(buildProjectCode('2026', 1), 'PRJ-2026-001');
    assert.equal(buildProjectCode('2026', 12), 'PRJ-2026-012');
});

test('project data validation catches missing fields', () => {
    const result = validateProjectData({ title: 'Demo' });
    assert.equal(result.isValid, false);
    assert.ok(result.errors.includes('client'));
});

test('SOP validation accepts a well-formed SOP', () => {
    const result = validateSopData({
        title: 'Onboarding SOP',
        category: 'operations',
        status: 'draft',
        steps: [{ title: 'Prepare files', description: 'Collect required docs' }],
    });

    assert.equal(result.isValid, true);
    assert.deepEqual(result.errors, []);
});

test('checklist generation and progress calculation work for SOP steps', () => {
    const sop = {
        id: 'sop-1',
        title: 'Kickoff SOP',
        steps: [{ title: 'Confirm scope' }, { title: 'Share brief' }],
    };

    const checklist = buildChecklistFromSop(sop, 'project-1');
    assert.equal(checklist.length, 2);
    assert.equal(checklist[0].title, 'Confirm scope');

    const merged = mergeChecklistFromSop(checklist, sop, 'project-1');
    assert.equal(merged.length, 2);

    const progress = calculateChecklistProgress([
        { title: 'Confirm scope', completed: true },
        { title: 'Share brief', completed: false },
    ]);

    assert.equal(progress.total, 2);
    assert.equal(progress.completed, 1);
    assert.equal(progress.completionRate, 50);
});
