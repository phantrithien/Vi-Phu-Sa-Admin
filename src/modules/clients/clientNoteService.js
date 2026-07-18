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
import { getDefaultClientNote } from './clientDefaults';
import { validateClientNotePayload } from './clientValidators';

const NOTES_COLLECTION = 'clientNotes';

const normalizeNote = (docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
});

export const listClientNotes = async (clientId) => {
    const q = query(
        collection(db, NOTES_COLLECTION),
        where('clientId', '==', clientId),
        orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(normalizeNote);
};

export const createClientNote = async (payload = {}, userId = null) => {
    const nextPayload = {
        ...getDefaultClientNote(),
        ...payload,
        clientId: String(payload.clientId || '').trim(),
        content: String(payload.content || '').trim(),
        type: String(payload.type || 'note').trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: userId,
        updatedBy: userId,
    };

    const validation = validateClientNotePayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    const docRef = await addDoc(collection(db, NOTES_COLLECTION), nextPayload);
    return { id: docRef.id, ...nextPayload };
};

export const updateClientNote = async (id, payload = {}, userId = null) => {
    const nextPayload = {
        ...payload,
        clientId: String(payload.clientId || '').trim(),
        content: String(payload.content || '').trim(),
        type: String(payload.type || 'note').trim(),
        updatedAt: Date.now(),
        updatedBy: userId,
    };

    const validation = validateClientNotePayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    await updateDoc(doc(db, NOTES_COLLECTION, id), nextPayload);
    return { id, ...nextPayload };
};

export const deleteClientNote = async (id) => {
    await deleteDoc(doc(db, NOTES_COLLECTION, id));
    return true;
};