import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
    orderBy,
    limit,
    startAfter,
} from 'firebase/firestore';

import { db } from '../config/firebase';

const buildBasePayload = (userId = null, overrides = {}) => ({
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: userId || null,
    updatedBy: userId || null,
    isDeleted: false,
    ...overrides,
});

export const createFirestoreService = (collectionName) => {
    const ref = collection(db, collectionName);

    const normalizeRecord = (item) => {
        const data = item?.data?.() || {};
        const normalized = { id: item.id, ...data };
        if (normalized.isDeleted === undefined) {
            normalized.isDeleted = false;
        }
        return normalized;
    };

    return {
        async getById(id) {
            const snapshot = await getDoc(doc(db, collectionName, id));
            if (!snapshot.exists()) return null;
            return normalizeRecord(snapshot);
        },

        async list({ filters = [], order = null, pageSize = 50, cursor = null } = {}) {
            let q = query(ref);

            filters.forEach((filter) => {
                q = query(q, where(filter.field, filter.operator, filter.value));
            });

            if (order) {
                q = query(q, orderBy(order.field, order.direction || 'asc'));
            }

            if (pageSize) {
                q = query(q, limit(pageSize));
            }

            if (cursor) {
                q = query(q, startAfter(cursor));
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map((item) => normalizeRecord(item));
        },

        async create(payload, userId = null) {
            const enriched = buildBasePayload(userId, payload);
            const documentRef = await addDoc(ref, enriched);
            return { id: documentRef.id, ...enriched };
        },

        async update(id, payload, userId = null) {
            const payloadWithAudit = buildBasePayload(userId, payload);
            await updateDoc(doc(db, collectionName, id), {
                ...payloadWithAudit,
                updatedAt: Date.now(),
                updatedBy: userId || null,
            });
            return { id, ...payloadWithAudit };
        },

        async softDelete(id, userId = null) {
            await updateDoc(doc(db, collectionName, id), {
                isDeleted: true,
                updatedAt: Date.now(),
                updatedBy: userId || null,
            });
            return true;
        },
    };
};
