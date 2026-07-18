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
import { getDefaultCallSheet } from './productionDefaults';
import { validateCallSheetPayload } from './productionValidators';
import { listRunSheetItemsByProductionDay } from './runSheetService';

const CALL_SHEET_COLLECTION = 'callSheets';

const normalizeCallSheet = (docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
});

export const listCallSheetsByProductionDay = async (productionDayId) => {
    const q = query(collection(db, CALL_SHEET_COLLECTION), where('productionDayId', '==', productionDayId));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(normalizeCallSheet)
        .sort((left, right) => Number(right.updatedAt || 0) - Number(left.updatedAt || 0));
};

export const createCallSheet = async (payload = {}, userId = null) => {
    const nextPayload = {
        ...getDefaultCallSheet(),
        ...payload,
        productionDayId: String(payload.productionDayId || '').trim(),
        projectId: String(payload.projectId || '').trim(),
        title: String(payload.title || '').trim(),
        date: String(payload.date || '').trim(),
        location: String(payload.location || '').trim(),
        crewBrief: String(payload.crewBrief || '').trim(),
        runSheetItems: Array.isArray(payload.runSheetItems) ? payload.runSheetItems : [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: userId,
        updatedBy: userId,
    };

    const validation = validateCallSheetPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    const ref = await addDoc(collection(db, CALL_SHEET_COLLECTION), nextPayload);
    return { id: ref.id, ...nextPayload };
};

export const updateCallSheet = async (id, payload = {}, userId = null) => {
    const nextPayload = {
        ...payload,
        productionDayId: String(payload.productionDayId || '').trim(),
        projectId: String(payload.projectId || '').trim(),
        title: String(payload.title || '').trim(),
        date: String(payload.date || '').trim(),
        location: String(payload.location || '').trim(),
        crewBrief: String(payload.crewBrief || '').trim(),
        runSheetItems: Array.isArray(payload.runSheetItems) ? payload.runSheetItems : [],
        updatedAt: Date.now(),
        updatedBy: userId,
    };

    const validation = validateCallSheetPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    await updateDoc(doc(db, CALL_SHEET_COLLECTION, id), nextPayload);
    return { id, ...nextPayload };
};

export const deleteCallSheet = async (id) => {
    await deleteDoc(doc(db, CALL_SHEET_COLLECTION, id));
    return true;
};

export const createCallSheetDraftFromProductionDay = async (productionDay, userId = null) => {
    if (!productionDay?.id) {
        throw new Error('Thiếu production day để tạo call sheet draft.');
    }

    const runSheetItems = await listRunSheetItemsByProductionDay(productionDay.id);

    return createCallSheet(
        {
            productionDayId: productionDay.id,
            projectId: productionDay.projectId,
            title: productionDay.title || `Call sheet - ${productionDay.date}`,
            date: productionDay.date,
            location: productionDay.location || '',
            callTime: productionDay.callTime || '',
            wrapTime: productionDay.wrapTime || '',
            crewBrief: productionDay.notes || '',
            runSheetItems,
            status: 'draft',
        },
        userId
    );
};