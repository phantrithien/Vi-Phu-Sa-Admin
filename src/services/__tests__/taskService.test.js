import test from 'node:test';
import assert from 'node:assert/strict';

import { TASK_PRIORITIES, TASK_STATUSES, validateTaskData, normalizeTaskRecord } from '../taskService.js';

test('task validation accepts a complete task payload', () => {
    const result = validateTaskData({
        title: 'Prepare launch assets',
        projectId: 'project-1',
        status: TASK_STATUSES.TODO,
        priority: TASK_PRIORITIES.HIGH,
        assignees: ['Mina'],
    });

    assert.equal(result.isValid, true);
    assert.deepEqual(result.errors, []);
});

test('task validation rejects missing title and invalid status', () => {
    const result = validateTaskData({
        projectId: 'project-1',
        status: 'unknown',
        priority: TASK_PRIORITIES.MEDIUM,
    });

    assert.equal(result.isValid, false);
    assert.ok(result.errors.includes('title'));
    assert.ok(result.errors.includes('status'));
});

test('normalize task record maps assignees and defaults', () => {
    const normalized = normalizeTaskRecord({
        title: 'Draft storyboards',
        assignees: ['Mina'],
        priority: 'high',
    });

    assert.equal(normalized.title, 'Draft storyboards');
    assert.deepEqual(normalized.assignees, ['Mina']);
    assert.equal(normalized.status, TASK_STATUSES.TODO);
    assert.equal(normalized.priority, TASK_PRIORITIES.HIGH);
});
