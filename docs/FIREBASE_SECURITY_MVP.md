# Firebase Security MVP Notes

## Protected Collections
- users
- sops
- projects
- projectChecklists
- projectTasks
- tasks
- expenses
- invoices
- payments
- files
- file_links
- archives

## Role Policy (MVP)
- Unauthenticated: no read/write access.
- viewer: read-only.
- producer/admin/owner: create/update project/task/checklist.
- accountant/admin/owner: create/update finance collections.
- editor: update only assigned tasks.
- archives: create/update only producer/admin/owner.

## Files
- firestore rules: [firestore.rules](../firestore.rules)
- firestore indexes: [firestore.indexes.json](../firestore.indexes.json)

## Deploy Rules
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Important
Do not open public access before validating with staging users and role claims.
