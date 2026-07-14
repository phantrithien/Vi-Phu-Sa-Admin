import test from 'node:test';
import assert from 'node:assert/strict';

import {
    EXPENSE_CATEGORIES,
    INVOICE_STATUSES,
    validateExpenseData,
    validateInvoiceData,
    calculateFinanceSummary,
} from '../financeService.js';

test('expense validation rejects missing required fields', () => {
    const result = validateExpenseData({ title: 'Camera rent' });

    assert.equal(result.isValid, false);
    assert.ok(result.errors.includes('projectId'));
    assert.ok(result.errors.includes('category'));
    assert.ok(result.errors.includes('amount'));
});

test('invoice validation accepts complete payload', () => {
    const result = validateInvoiceData({
        projectId: 'project-1',
        code: 'INV-2026-001',
        status: INVOICE_STATUSES.SENT,
        amount: 5000000,
        issueDate: '2026-07-01',
    });

    assert.equal(result.isValid, true);
    assert.deepEqual(result.errors, []);
});

test('finance summary computes revenue cost and profit', () => {
    const summary = calculateFinanceSummary({
        expenses: [{ amount: 2000000 }, { amount: 500000 }],
        invoices: [{ amount: 7000000 }, { amount: 1000000 }],
    });

    assert.equal(summary.revenue, 8000000);
    assert.equal(summary.cost, 2500000);
    assert.equal(summary.profit, 5500000);
});

test('expense validation accepts a valid expense', () => {
    const result = validateExpenseData({
        projectId: 'project-2',
        title: 'Set design',
        category: EXPENSE_CATEGORIES.PRODUCTION,
        amount: 3000000,
        date: '2026-07-10',
    });

    assert.equal(result.isValid, true);
    assert.deepEqual(result.errors, []);
});