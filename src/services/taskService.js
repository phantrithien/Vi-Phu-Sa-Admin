import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const TASK_COLLECTION = 'tasks';

export const TASK_STATUSES = {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    DONE: 'done',
};

export const TASK_PRIORITIES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
};

const normalizeStatus = (status) => {
    return Object.values(TASK_STATUSES).includes(status) ? status : TASK_STATUSES.TODO;
};

const normalizePriority = (priority) => {
    return Object.values(TASK_PRIORITIES).includes(priority) ? priority : TASK_PRIORITIES.MEDIUM;
};

export const normalizeTaskRecord = (payload = {}) => {
    const assignees = Array.isArray(payload.assignees) ? payload.assignees.filter(Boolean) : [];

    return {
        title: String(payload.title || '').trim(),
        description: String(payload.description || '').trim(),
        projectId: String(payload.projectId || '').trim(),
        assignee: String(payload.assignee || '').trim(),
        assignees,
        status: normalizeStatus(payload.status),
        priority: normalizePriority(payload.priority),
        dueDate: String(payload.dueDate || '').trim(),
        createdAt: payload.createdAt || Date.now(),
        updatedAt: payload.updatedAt || Date.now(),
    };
};

export const validateTaskData = (payload = {}) => {
    const errors = [];

    const normalized = normalizeTaskRecord(payload);

    if (!normalized.title) {
        errors.push('title');
    }
    if (!normalized.projectId) {
        errors.push('projectId');
    }
    if (!payload.status || !Object.values(TASK_STATUSES).includes(payload.status)) {
        errors.push('status');
    }
    if (!payload.priority || !Object.values(TASK_PRIORITIES).includes(payload.priority)) {
        errors.push('priority');
    }

    return { isValid: errors.length === 0, errors };
};

export const listTasks = async ({ projectId = '', assignee = '' } = {}) => {
    const constraints = [];
    if (projectId) constraints.push(where('projectId', '==', projectId));
    if (assignee) constraints.push(where('assignees', 'array-contains', assignee));

    const q = query(collection(db, TASK_COLLECTION), ...constraints, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};

export const getTaskById = async (id) => {
    const snapshot = await getDoc(doc(db, TASK_COLLECTION, id));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const createTask = async (payload) => {
    const validation = validateTaskData(payload);
    if (!validation.isValid) {
        throw new Error(`Invalid task payload: ${validation.errors.join(', ')}`);
    }

    const normalized = normalizeTaskRecord(payload);
    const ref = await addDoc(collection(db, TASK_COLLECTION), {
        ...normalized,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });

    return { id: ref.id, ...normalized };
};

export const updateTask = async (id, payload) => {
    const validation = validateTaskData(payload);
    if (!validation.isValid) {
        throw new Error(`Invalid task payload: ${validation.errors.join(', ')}`);
    }

    const normalized = normalizeTaskRecord(payload);
    await updateDoc(doc(db, TASK_COLLECTION, id), {
        ...normalized,
        updatedAt: Date.now(),
    });
};

export const deleteTask = async (id) => {
    await deleteDoc(doc(db, TASK_COLLECTION, id));
};
