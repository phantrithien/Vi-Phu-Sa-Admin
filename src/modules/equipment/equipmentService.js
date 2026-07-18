import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
} from 'firebase/firestore';

import { db } from '../../config/firebase';
import { getDefaultEquipment } from './equipmentDefaults';
import { validateEquipmentPayload } from './equipmentValidators';

const EQUIPMENT_COLLECTION = 'equipment';

const normalizeEquipment = (docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
});

export const listEquipment = async ({ status = null, category = null, search = '' } = {}) => {
    const snapshot = await getDocs(collection(db, EQUIPMENT_COLLECTION));
    const term = String(search || '').trim().toLowerCase();

    return snapshot.docs
        .map(normalizeEquipment)
        .filter((item) => (status ? item.status === status : true))
        .filter((item) => (category ? item.category === category : true))
        .filter((item) => {
            if (!term) return true;
            const haystack = [item.name, item.serialNumber, item.category].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(term);
        })
        .sort((left, right) => Number(right.updatedAt || 0) - Number(left.updatedAt || 0));
};

export const getEquipmentById = async (id) => {
    const snapshot = await getDoc(doc(db, EQUIPMENT_COLLECTION, id));
    return snapshot.exists() ? normalizeEquipment(snapshot) : null;
};

export const createEquipment = async (payload = {}, userId = null) => {
    const nextPayload = {
        ...getDefaultEquipment(),
        ...payload,
        name: String(payload.name || '').trim(),
        serialNumber: String(payload.serialNumber || '').trim(),
        condition: String(payload.condition || 'good').trim(),
        currentHolderId: String(payload.currentHolderId || '').trim(),
        notes: String(payload.notes || '').trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: userId,
        updatedBy: userId,
    };

    const validation = validateEquipmentPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    const ref = await addDoc(collection(db, EQUIPMENT_COLLECTION), nextPayload);
    return { id: ref.id, ...nextPayload };
};

export const updateEquipment = async (id, payload = {}, userId = null) => {
    const nextPayload = {
        ...payload,
        name: String(payload.name || '').trim(),
        serialNumber: String(payload.serialNumber || '').trim(),
        condition: String(payload.condition || 'good').trim(),
        currentHolderId: String(payload.currentHolderId || '').trim(),
        notes: String(payload.notes || '').trim(),
        updatedAt: Date.now(),
        updatedBy: userId,
    };

    const validation = validateEquipmentPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    await updateDoc(doc(db, EQUIPMENT_COLLECTION, id), nextPayload);
    return { id, ...nextPayload };
};

export const deleteEquipment = async (id) => {
    await deleteDoc(doc(db, EQUIPMENT_COLLECTION, id));
    return true;
};
