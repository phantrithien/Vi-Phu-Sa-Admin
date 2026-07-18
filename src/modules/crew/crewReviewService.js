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
import { getDefaultCrewReview } from './crewDefaults';
import { validateCrewReviewPayload } from './crewValidators';

const CREW_REVIEW_COLLECTION = 'crewReviews';

const normalizeReview = (docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
});

export const createCrewReview = async (payload = {}, userId = null) => {
    const nextPayload = {
        ...getDefaultCrewReview(),
        ...payload,
        crewId: String(payload.crewId || '').trim(),
        projectId: String(payload.projectId || '').trim(),
        rating: Number(payload.rating || 0),
        comment: String(payload.comment || '').trim(),
        createdAt: Date.now(),
        createdBy: userId,
    };

    const validation = validateCrewReviewPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    const ref = await addDoc(collection(db, CREW_REVIEW_COLLECTION), nextPayload);
    return { id: ref.id, ...nextPayload };
};

export const listCrewReviewsByCrew = async (crewId) => {
    const snapshot = await getDocs(query(collection(db, CREW_REVIEW_COLLECTION), where('crewId', '==', crewId)));
    return snapshot.docs
        .map(normalizeReview)
        .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0));
};

export const deleteCrewReview = async (id) => {
    await deleteDoc(doc(db, CREW_REVIEW_COLLECTION, id));
    return true;
};
