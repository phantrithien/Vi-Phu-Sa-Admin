import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
} from 'firebase/firestore';

import { db } from '../../config/firebase';
import { getDefaultEquipmentMaintenanceLog } from './equipmentDefaults';
import { validateEquipmentMaintenanceLogPayload } from './equipmentValidators';

const EQUIPMENT_MAINTENANCE_COLLECTION = 'equipmentMaintenanceLogs';

const normalizeLog = (docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
});

export const createMaintenanceLog = async (payload = {}, userId = null) => {
    const nextPayload = {
        ...getDefaultEquipmentMaintenanceLog(),
        ...payload,
        equipmentId: String(payload.equipmentId || '').trim(),
        type: String(payload.type || 'maintenance').trim(),
        description: String(payload.description || '').trim(),
        date: String(payload.date || '').trim(),
        createdAt: Date.now(),
        createdBy: userId,
    };

    const validation = validateEquipmentMaintenanceLogPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    const ref = await addDoc(collection(db, EQUIPMENT_MAINTENANCE_COLLECTION), nextPayload);
    return { id: ref.id, ...nextPayload };
};

export const listMaintenanceLogsByEquipment = async (equipmentId) => {
    const snapshot = await getDocs(query(collection(db, EQUIPMENT_MAINTENANCE_COLLECTION), where('equipmentId', '==', equipmentId)));
    return snapshot.docs
        .map(normalizeLog)
        .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0));
};

export const deleteMaintenanceLog = async (id) => {
    await deleteDoc(doc(db, EQUIPMENT_MAINTENANCE_COLLECTION, id));
    return true;
};
