# Release Notes - Vi Phu Sa Production OS MVP 1.0

## Version

- v1.0.0-rc1

## Ngay phat hanh

- TBD

## Pham vi

- Hoan tat MVP cho 6 phong ban: Accounting, HR, Marketing, Production, Archive, TaskBoard.
- Hoan tat SOP CRUD, duplicate, archive.
- Hoan tat Projects workspace: detail tabs, budget, tasks, checklist, files, archive, notes.
- Hoan tat route va menu settings.
- Bo sung global toast feedback.
- Chuan hoa Firestore security rules theo role model users/{uid}.
- Bo sung test rules qua Firestore emulator.

## Diem noi bat

- Khong con man hinh trang o cac route MVP chinh.
- Refresh route an toan voi rewrite cau hinh.
- Co quy trinh QA/UAT va checklist release.

## Breaking changes

- Firestore rules da doi sang role-based model tu users collection.

## Known issues

- Chua co full automation e2e cho toan bo luong nghiep vu.

## Huong dan rollout

1. Deploy rules len staging.
2. Chay seed du lieu test neu can.
3. Chay UAT 7 ngay.
4. Xac nhan production checklist.
5. Tag production khi dat tieu chi.
