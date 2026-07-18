import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    updateDoc,
} from 'firebase/firestore';

import { db } from '../../config/firebase';
import { getDefaultClient } from './clientDefaults';
import { validateClientPayload } from './clientValidators';

const CLIENTS_COLLECTION = 'clients';

const normalizeClient = (docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
});

export const listClients = async ({
    status = null,
    type = null,
    search = '',
    includeDeleted = false,
} = {}) => {
    const baseQuery = query(collection(db, CLIENTS_COLLECTION), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(baseQuery);
    const term = String(search || '').trim().toLowerCase();

    return snapshot.docs
        .map(normalizeClient)
        .filter((item) => (includeDeleted ? true : !item.isDeleted))
        .filter((item) => (status ? item.status === status : true))
        .filter((item) => (type ? item.type === type : true))
        .filter((item) => {
            if (!term) return true;
            const haystack = [item.name, item.email, item.phone].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(term);
        });
};

export const getClientById = async (id) => {
    const snapshot = await getDoc(doc(db, CLIENTS_COLLECTION, id));
    if (!snapshot.exists()) return null;
    const data = normalizeClient(snapshot);
    if (data.isDeleted) return null;
    return data;
};

export const createClient = async (payload = {}, userId = null) => {
    const nextPayload = {
        ...getDefaultClient(),
        ...payload,
        name: String(payload.name || '').trim(),
        email: String(payload.email || '').trim(),
        phone: String(payload.phone || '').trim(),
        address: String(payload.address || '').trim(),
        taxCode: String(payload.taxCode || '').trim(),
        notes: String(payload.notes || '').trim(),
        industry: String(payload.industry || '').trim(),
        source: String(payload.source || '').trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: userId,
        updatedBy: userId,
        isDeleted: false,
    };

    const validation = validateClientPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), nextPayload);
    return { id: docRef.id, ...nextPayload };
};

export const updateClient = async (id, payload = {}, userId = null) => {
    const current = await getClientById(id);
    if (!current) {
        throw new Error('Khách hàng không tồn tại hoặc đã bị xóa.');
    }

    const nextPayload = {
        ...current,
        ...payload,
        name: String(payload.name ?? current.name ?? '').trim(),
        email: String(payload.email ?? current.email ?? '').trim(),
        phone: String(payload.phone ?? current.phone ?? '').trim(),
        address: String(payload.address ?? current.address ?? '').trim(),
        taxCode: String(payload.taxCode ?? current.taxCode ?? '').trim(),
        notes: String(payload.notes ?? current.notes ?? '').trim(),
        industry: String(payload.industry ?? current.industry ?? '').trim(),
        source: String(payload.source ?? current.source ?? '').trim(),
        updatedAt: Date.now(),
        updatedBy: userId,
    };

    const validation = validateClientPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    const docPayload = { ...nextPayload };
    delete docPayload.id;
    await updateDoc(doc(db, CLIENTS_COLLECTION, id), docPayload);

    return { id, ...nextPayload };
};

export const softDeleteClient = async (id, userId = null) => {
    await updateDoc(doc(db, CLIENTS_COLLECTION, id), {
        isDeleted: true,
        status: 'archived',
        updatedAt: Date.now(),
        updatedBy: userId,
    });
    return true;
};