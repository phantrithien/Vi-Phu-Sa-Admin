import { describe, it, beforeAll, afterAll } from 'vitest';
import {
    initializeTestEnvironment,
    assertSucceeds,
    assertFails,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import fs from 'fs';

let testEnv;

const resolveEmulatorConfig = () => {
    const hostPort = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    const [host, portString] = hostPort.split(':');
    const port = Number(portString || 8080);

    return {
        host,
        port: Number.isFinite(port) ? port : 8080,
    };
};

beforeAll(async () => {
    const emulatorConfig = resolveEmulatorConfig();

    testEnv = await initializeTestEnvironment({
        projectId: 'viphusa-admin-test',
        firestore: {
            host: emulatorConfig.host,
            port: emulatorConfig.port,
            rules: fs.readFileSync('firestore.rules', 'utf8'),
        },
    });

    await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        await setDoc(doc(db, 'users/owner_uid'), {
            role: 'owner',
            displayName: 'Owner',
        });
        await setDoc(doc(db, 'users/admin_uid'), {
            role: 'admin',
            displayName: 'Admin',
        });
        await setDoc(doc(db, 'users/producer_uid'), {
            role: 'producer',
            displayName: 'Producer',
        });
        await setDoc(doc(db, 'users/accountant_uid'), {
            role: 'accountant',
            displayName: 'Accountant',
        });
        await setDoc(doc(db, 'users/editor_uid'), {
            role: 'editor',
            displayName: 'Editor',
        });
        await setDoc(doc(db, 'users/viewer_uid'), {
            role: 'viewer',
            displayName: 'Viewer',
        });
    });
});

afterAll(async () => {
    if (testEnv) {
        await testEnv.cleanup();
    }
});

describe('MVP Firestore Security Rules', () => {
    it('denies unauthenticated project read', async () => {
        const db = testEnv.unauthenticatedContext().firestore();
        await assertFails(getDoc(doc(db, 'projects/demo_project')));
    });

    it('allows producer to create project', async () => {
        const db = testEnv.authenticatedContext('producer_uid').firestore();
        await assertSucceeds(
            setDoc(doc(db, 'projects/project_1'), {
                name: 'Demo Project',
                type: 'event',
                status: 'pre_production',
                isDeleted: false,
            })
        );
    });

    it('denies viewer creating project', async () => {
        const db = testEnv.authenticatedContext('viewer_uid').firestore();
        await assertFails(
            setDoc(doc(db, 'projects/project_2'), {
                name: 'Viewer Project',
                type: 'event',
                status: 'lead',
                isDeleted: false,
            })
        );
    });

    it('allows producer to create SOP', async () => {
        const db = testEnv.authenticatedContext('producer_uid').firestore();
        await assertSucceeds(
            setDoc(doc(db, 'sops/sop_1'), {
                title: 'SOP Test',
                category: 'production',
                status: 'active',
                steps: [],
                isDeleted: false,
            })
        );
    });

    it('denies viewer creating SOP', async () => {
        const db = testEnv.authenticatedContext('viewer_uid').firestore();
        await assertFails(
            setDoc(doc(db, 'sops/sop_2'), {
                title: 'Viewer SOP',
                category: 'production',
                status: 'draft',
                steps: [],
                isDeleted: false,
            })
        );
    });

    it('allows accountant to create expense', async () => {
        const db = testEnv.authenticatedContext('accountant_uid').firestore();
        await assertSucceeds(
            setDoc(doc(db, 'expenses/expense_1'), {
                projectId: 'project_1',
                amount: 1500000,
                category: 'crew',
                paymentStatus: 'paid',
                isDeleted: false,
            })
        );
    });

    it('denies producer creating expense', async () => {
        const db = testEnv.authenticatedContext('producer_uid').firestore();
        await assertFails(
            setDoc(doc(db, 'expenses/expense_2'), {
                projectId: 'project_1',
                amount: 2000000,
                category: 'equipment',
                paymentStatus: 'pending',
                isDeleted: false,
            })
        );
    });

    it('allows editor to create task', async () => {
        const db = testEnv.authenticatedContext('editor_uid').firestore();
        await assertSucceeds(
            setDoc(doc(db, 'projectTasks/task_1'), {
                projectId: 'project_1',
                title: 'Edit video',
                status: 'todo',
                priority: 'medium',
                isDeleted: false,
            })
        );
    });

    it('denies viewer deleting task', async () => {
        const db = testEnv.authenticatedContext('viewer_uid').firestore();
        await assertFails(deleteDoc(doc(db, 'projectTasks/task_1')));
    });
});
