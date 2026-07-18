import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';

import { db } from '../../config/firebase';
import { getDefaultCrewAssignment } from './crewDefaults';
import { validateCrewAssignmentPayload } from './crewValidators';

const CREW_ASSIGNMENT_COLLECTION = 'crewAssignments';

const normalizeAssignment = (docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
});

export const createCrewAssignment = async (payload = {}, userId = null) => {
    const nextPayload = {
        ...getDefaultCrewAssignment(),
        ...payload,
        crewId: String(payload.crewId || '').trim(),
        projectId: String(payload.projectId || '').trim(),
        productionDayId: String(payload.productionDayId || '').trim(),
        role: String(payload.role || '').trim(),
        rate: Number(payload.rate || 0),
        date: String(payload.date || '').trim(),
        notes: String(payload.notes || '').trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: userId,
        updatedBy: userId,
    };

    const validation = validateCrewAssignmentPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    const ref = await addDoc(collection(db, CREW_ASSIGNMENT_COLLECTION), nextPayload);
    return { id: ref.id, ...nextPayload };
};

export const updateCrewAssignment = async (id, payload = {}, userId = null) => {
    const nextPayload = {
        ...payload,
        role: String(payload.role || '').trim(),
        rate: Number(payload.rate || 0),
        notes: String(payload.notes || '').trim(),
        updatedAt: Date.now(),
        updatedBy: userId,
    };

    await updateDoc(doc(db, CREW_ASSIGNMENT_COLLECTION, id), nextPayload);
    return { id, ...nextPayload };
};

export const deleteCrewAssignment = async (id) => {
    await deleteDoc(doc(db, CREW_ASSIGNMENT_COLLECTION, id));
    return true;
};

export const listCrewAssignmentsByProject = async (projectId) => {
    const snapshot = await getDocs(query(collection(db, CREW_ASSIGNMENT_COLLECTION), where('projectId', '==', projectId)));
    return snapshot.docs
        .map(normalizeAssignment)
        .sort((left, right) => String(left.date || '').localeCompare(String(right.date || '')));
};

export const listCrewAssignmentsByProductionDay = async (productionDayId) => {
    const snapshot = await getDocs(query(collection(db, CREW_ASSIGNMENT_COLLECTION), where('productionDayId', '==', productionDayId)));
    return snapshot.docs.map(normalizeAssignment);
};

export const listCrewAssignmentsByCrew = async (crewId) => {
    const snapshot = await getDocs(query(collection(db, CREW_ASSIGNMENT_COLLECTION), where('crewId', '==', crewId)));
    return snapshot.docs
        .map(normalizeAssignment)
        .sort((left, right) => Number(right.updatedAt || 0) - Number(left.updatedAt || 0));
};
