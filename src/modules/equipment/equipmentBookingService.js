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
import { getDefaultEquipmentBooking } from './equipmentDefaults';
import { validateEquipmentBookingPayload } from './equipmentValidators';

const EQUIPMENT_BOOKING_COLLECTION = 'equipmentBookings';

const normalizeBooking = (docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
});

const rangesOverlap = (startA, endA, startB, endB) => String(startA) <= String(endB) && String(startB) <= String(endA);

export const listEquipmentBookingsByEquipment = async (equipmentId) => {
    const snapshot = await getDocs(query(collection(db, EQUIPMENT_BOOKING_COLLECTION), where('equipmentId', '==', equipmentId)));
    return snapshot.docs
        .map(normalizeBooking)
        .sort((left, right) => String(left.startDate || '').localeCompare(String(right.startDate || '')));
};

export const listEquipmentBookingsByProject = async (projectId) => {
    const snapshot = await getDocs(query(collection(db, EQUIPMENT_BOOKING_COLLECTION), where('projectId', '==', projectId)));
    return snapshot.docs
        .map(normalizeBooking)
        .sort((left, right) => String(left.startDate || '').localeCompare(String(right.startDate || '')));
};

export const listEquipmentBookingsByProductionDay = async (productionDayId) => {
    const snapshot = await getDocs(query(collection(db, EQUIPMENT_BOOKING_COLLECTION), where('productionDayId', '==', productionDayId)));
    return snapshot.docs.map(normalizeBooking);
};

export const checkBookingConflict = async (equipmentId, startDate, endDate, excludeBookingId = null) => {
    const bookings = await listEquipmentBookingsByEquipment(equipmentId);
    return bookings.some((booking) => booking.id !== excludeBookingId && rangesOverlap(startDate, endDate, booking.startDate, booking.endDate));
};

export const createEquipmentBooking = async (payload = {}, userId = null) => {
    const nextPayload = {
        ...getDefaultEquipmentBooking(),
        ...payload,
        equipmentId: String(payload.equipmentId || '').trim(),
        projectId: String(payload.projectId || '').trim(),
        productionDayId: String(payload.productionDayId || '').trim(),
        startDate: String(payload.startDate || '').trim(),
        endDate: String(payload.endDate || payload.startDate || '').trim(),
        notes: String(payload.notes || '').trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: userId,
        updatedBy: userId,
    };

    const validation = validateEquipmentBookingPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    const hasConflict = await checkBookingConflict(nextPayload.equipmentId, nextPayload.startDate, nextPayload.endDate);
    if (hasConflict) {
        throw new Error('Thiết bị đã được đặt trong khoảng thời gian này.');
    }

    const ref = await addDoc(collection(db, EQUIPMENT_BOOKING_COLLECTION), nextPayload);
    return { id: ref.id, ...nextPayload };
};

export const updateEquipmentBooking = async (id, payload = {}, userId = null) => {
    const nextPayload = {
        ...payload,
        startDate: String(payload.startDate || '').trim(),
        endDate: String(payload.endDate || payload.startDate || '').trim(),
        notes: String(payload.notes || '').trim(),
        updatedAt: Date.now(),
        updatedBy: userId,
    };

    const hasConflict = await checkBookingConflict(payload.equipmentId, nextPayload.startDate, nextPayload.endDate, id);
    if (hasConflict) {
        throw new Error('Thiết bị đã được đặt trong khoảng thời gian này.');
    }

    await updateDoc(doc(db, EQUIPMENT_BOOKING_COLLECTION, id), nextPayload);
    return { id, ...nextPayload };
};

export const deleteEquipmentBooking = async (id) => {
    await deleteDoc(doc(db, EQUIPMENT_BOOKING_COLLECTION, id));
    return true;
};
