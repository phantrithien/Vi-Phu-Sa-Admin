import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';

import { db } from '../../config/firebase';
import { getDefaultClientContact } from './clientDefaults';
import { validateClientContactPayload } from './clientValidators';

const CONTACTS_COLLECTION = 'clientContacts';

const normalizeContact = (docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
});

export const listClientContacts = async (clientId) => {
    const q = query(
        collection(db, CONTACTS_COLLECTION),
        where('clientId', '==', clientId),
        orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(normalizeContact);
};

export const createClientContact = async (payload = {}, userId = null) => {
    const nextPayload = {
        ...getDefaultClientContact(),
        ...payload,
        clientId: String(payload.clientId || '').trim(),
        name: String(payload.name || '').trim(),
        role: String(payload.role || '').trim(),
        phone: String(payload.phone || '').trim(),
        email: String(payload.email || '').trim(),
        notes: String(payload.notes || '').trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: userId,
        updatedBy: userId,
    };

    const validation = validateClientContactPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    const docRef = await addDoc(collection(db, CONTACTS_COLLECTION), nextPayload);
    return { id: docRef.id, ...nextPayload };
};

export const updateClientContact = async (id, payload = {}, userId = null) => {
    const nextPayload = {
        ...payload,
        clientId: String(payload.clientId || '').trim(),
        name: String(payload.name || '').trim(),
        role: String(payload.role || '').trim(),
        phone: String(payload.phone || '').trim(),
        email: String(payload.email || '').trim(),
        notes: String(payload.notes || '').trim(),
        isPrimary: Boolean(payload.isPrimary),
        updatedAt: Date.now(),
        updatedBy: userId,
    };

    const validation = validateClientContactPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    await updateDoc(doc(db, CONTACTS_COLLECTION, id), nextPayload);
    return { id, ...nextPayload };
};

export const deleteClientContact = async (id) => {
    await deleteDoc(doc(db, CONTACTS_COLLECTION, id));
    return true;
};