import test from 'node:test';
import assert from 'node:assert/strict';

import { ROLES } from '../src/constants/roles.js';
import { EMPLOYEE_STATUSES, EMPLOYEE_STATUS_LABELS } from '../src/constants/statuses.js';
import { APP_ROUTES } from '../src/constants/routes.js';

test('shared constants expose the expected role, status, and route values', () => {
    assert.equal(ROLES.STAFF, 'staff');
    assert.equal(EMPLOYEE_STATUSES.ACTIVE, 'active');
    assert.equal(EMPLOYEE_STATUS_LABELS[EMPLOYEE_STATUSES.ACTIVE], 'Đang làm việc');
    assert.equal(APP_ROUTES.HR, '/hr');
});
