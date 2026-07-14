import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const EXPENSE_COLLECTION = 'expenses';
const INVOICE_COLLECTION = 'invoices';

export const EXPENSE_CATEGORIES = {
    PRODUCTION: 'production',
    MARKETING: 'marketing',
    LOGISTICS: 'logistics',
    OTHERS: 'others',
};

export const INVOICE_STATUSES = {
    DRAFT: 'draft',
    SENT: 'sent',
    PAID: 'paid',
    OVERDUE: 'overdue',
};

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const validateExpenseData = (payload = {}) => {
    const errors = [];
    if (!String(payload.projectId || '').trim()) errors.push('projectId');
    if (!String(payload.title || '').trim()) errors.push('title');
    if (!Object.values(EXPENSE_CATEGORIES).includes(payload.category)) errors.push('category');
    if (toNumber(payload.amount) <= 0) errors.push('amount');
    if (!String(payload.date || '').trim()) errors.push('date');
    return { isValid: errors.length === 0, errors };
};

export const validateInvoiceData = (payload = {}) => {
    const errors = [];
    if (!String(payload.projectId || '').trim()) errors.push('projectId');
    if (!String(payload.code || '').trim()) errors.push('code');
    if (!Object.values(INVOICE_STATUSES).includes(payload.status)) errors.push('status');
    if (toNumber(payload.amount) <= 0) errors.push('amount');
    if (!String(payload.issueDate || '').trim()) errors.push('issueDate');
    return { isValid: errors.length === 0, errors };
};

export const createExpense = async (payload) => {
    const validation = validateExpenseData(payload);
    if (!validation.isValid) {
        throw new Error(`Invalid expense payload: ${validation.errors.join(', ')}`);
    }

    const now = Date.now();
    const record = {
        projectId: String(payload.projectId).trim(),
        title: String(payload.title).trim(),
        category: payload.category,
        amount: toNumber(payload.amount),
        date: String(payload.date).trim(),
        notes: String(payload.notes || '').trim(),
        createdAt: now,
        updatedAt: now,
    };

    const ref = await addDoc(collection(db, EXPENSE_COLLECTION), record);
    return { id: ref.id, ...record };
};

export const updateExpense = async (id, payload) => {
    const validation = validateExpenseData(payload);
    if (!validation.isValid) {
        throw new Error(`Invalid expense payload: ${validation.errors.join(', ')}`);
    }

    await updateDoc(doc(db, EXPENSE_COLLECTION, id), {
        projectId: String(payload.projectId).trim(),
        title: String(payload.title).trim(),
        category: payload.category,
        amount: toNumber(payload.amount),
        date: String(payload.date).trim(),
        notes: String(payload.notes || '').trim(),
        updatedAt: Date.now(),
    });
};

export const deleteExpense = async (id) => {
    await deleteDoc(doc(db, EXPENSE_COLLECTION, id));
};

export const listExpenses = async ({ projectId = '' } = {}) => {
    const constraints = [];
    if (projectId) constraints.push(where('projectId', '==', projectId));
    const q = query(collection(db, EXPENSE_COLLECTION), ...constraints, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};

export const createInvoice = async (payload) => {
    const validation = validateInvoiceData(payload);
    if (!validation.isValid) {
        throw new Error(`Invalid invoice payload: ${validation.errors.join(', ')}`);
    }

    const now = Date.now();
    const record = {
        projectId: String(payload.projectId).trim(),
        code: String(payload.code).trim(),
        customer: String(payload.customer || '').trim(),
        status: payload.status,
        amount: toNumber(payload.amount),
        issueDate: String(payload.issueDate).trim(),
        dueDate: String(payload.dueDate || '').trim(),
        notes: String(payload.notes || '').trim(),
        createdAt: now,
        updatedAt: now,
    };

    const ref = await addDoc(collection(db, INVOICE_COLLECTION), record);
    return { id: ref.id, ...record };
};

export const updateInvoice = async (id, payload) => {
    const validation = validateInvoiceData(payload);
    if (!validation.isValid) {
        throw new Error(`Invalid invoice payload: ${validation.errors.join(', ')}`);
    }

    await updateDoc(doc(db, INVOICE_COLLECTION, id), {
        projectId: String(payload.projectId).trim(),
        code: String(payload.code).trim(),
        customer: String(payload.customer || '').trim(),
        status: payload.status,
        amount: toNumber(payload.amount),
        issueDate: String(payload.issueDate).trim(),
        dueDate: String(payload.dueDate || '').trim(),
        notes: String(payload.notes || '').trim(),
        updatedAt: Date.now(),
    });
};

export const deleteInvoice = async (id) => {
    await deleteDoc(doc(db, INVOICE_COLLECTION, id));
};

export const listInvoices = async ({ projectId = '' } = {}) => {
    const constraints = [];
    if (projectId) constraints.push(where('projectId', '==', projectId));
    const q = query(collection(db, INVOICE_COLLECTION), ...constraints, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};

export const calculateFinanceSummary = ({ expenses = [], invoices = [] } = {}) => {
    const revenue = invoices.reduce((sum, row) => sum + toNumber(row.amount), 0);
    const cost = expenses.reduce((sum, row) => sum + toNumber(row.amount), 0);
    const profit = revenue - cost;
    const profitMargin = revenue > 0 ? Math.round((profit / revenue) * 10000) / 100 : 0;

    return { revenue, cost, profit, profitMargin };
};

export const getProjectFinanceSummary = async (projectId) => {
    const [expenses, invoices] = await Promise.all([
        listExpenses({ projectId }),
        listInvoices({ projectId }),
    ]);

    return {
        expenses,
        invoices,
        ...calculateFinanceSummary({ expenses, invoices }),
    };
};