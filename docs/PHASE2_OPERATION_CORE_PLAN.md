# Phase 2 - Operation Core

## Muc tieu
Bien Vi Phu Sa Production OS tu MVP quan ly noi bo co ban thanh he thong van hanh production house thuc te hon, tap trung vao:
- Clients / CRM
- Production Plan
- Call Sheet
- Crew / Freelancer
- Equipment
- Reports Basic
- Export / Backup

## Sprint tong quan
- Sprint 6: Clients / CRM nhe
- Sprint 7: Production Plan / Call Sheet
- Sprint 8: Crew / Freelancer
- Sprint 9: Equipment
- Sprint 10: Reports Basic + Export / Backup
- Sprint 11: QA + Security Rules + Release Phase 2

Luu y: backlog duoi day la ban chot trien khai dua tren scope Phase 2 da thong nhat.

## Sprint 6 - Clients / CRM nhe

### Commit 41 - feat: add client constants and schema
Muc tieu: Chuan hoa du lieu khach hang.

Files can tao:
- src/constants/clientStatus.js
- src/constants/clientTypes.js
- src/modules/clients/clientDefaults.js
- src/modules/clients/clientValidators.js

Task:
- Tao CLIENT_STATUS: lead, active, inactive, vip, archived.
- Tao CLIENT_TYPES: company, individual, agency, partner, internal.
- Tao default client object.
- Validate field bat buoc: name, type, status.

Done khi:
- Co constants status/type dung chung cho client.
- Form client co validate co ban.

### Commit 42 - feat: add client service
Muc tieu: Tao tang du lieu cho khach hang.

Files can tao:
- src/modules/clients/clientService.js
- src/modules/clients/clientContactService.js
- src/modules/clients/clientNoteService.js

Collections:
- clients
- clientContacts
- clientNotes

Task:
- CRUD clients.
- CRUD clientContacts.
- CRUD clientNotes.
- Soft delete client.
- Query client theo status/type.
- Query contact theo clientId.
- Query notes theo clientId.

Done khi:
- Tao/sua/xem/xoa mem client duoc.
- Them nguoi lien he cho client duoc.

### Commit 43 - feat: build client list page
Muc tieu: Tao trang danh sach khach hang.

Files can tao:
- src/modules/clients/pages/ClientListPage.jsx
- src/modules/clients/components/ClientCard.jsx
- src/modules/clients/components/ClientFilters.jsx
- src/modules/clients/components/ClientStatusBadge.jsx

Route:
- /app/clients

Task:
- Hien thi danh sach clients.
- Search theo ten/email/so dien thoai.
- Filter theo status/type.
- Button tao client moi.
- Click client mo detail.

Done khi:
- /app/clients hoat dong.
- Search/filter client hoat dong.

### Commit 44 - feat: build client form drawer
Muc tieu: Tao/sua khach hang.

Files can tao:
- src/modules/clients/components/ClientFormDrawer.jsx
- src/modules/clients/components/ClientContactForm.jsx

Task:
- Form tao client.
- Form sua client.
- Field: name, type, status, industry, source, phone, email, address, taxCode, notes.
- Them contact chinh.
- Validate field bat buoc.
- Toast success/error.

Done khi:
- Tao client moi duoc.
- Sua client duoc.
- Khong luu neu thieu field bat buoc.

### Commit 45 - feat: build client detail page
Muc tieu: Tao ho so khach hang.

Files can tao:
- src/modules/clients/pages/ClientDetailPage.jsx
- src/modules/clients/components/ClientOverview.jsx
- src/modules/clients/components/ClientContactList.jsx
- src/modules/clients/components/ClientNoteList.jsx
- src/modules/clients/components/ClientProjectHistory.jsx

Route:
- /app/clients/:clientId

Task:
- Hien thi thong tin khach hang.
- Hien thi danh sach nguoi lien he.
- Them/sua/xoa contact.
- Them note cham soc khach.
- Hien thi project history theo client.
- Empty state neu chua co project.

Done khi:
- Client detail xem duoc day du.
- Co lich su project cua khach.

### Commit 46 - feat: link clients to projects
Muc tieu: Ket noi Clients voi Projects.

Files can chinh:
- src/modules/projects/projectService.js
- src/modules/projects/pages/ProjectFormPage.jsx
- src/modules/projects/components/ProjectForm.jsx
- src/modules/projects/tabs/ProjectOverviewTab.jsx
- src/modules/clients/components/ClientProjectHistory.jsx

Task:
- Them clientId vao project schema.
- Project form chon client tu danh sach.
- Van cho nhap clientName fallback neu can.
- Project overview hien thi client clickable.
- Client detail hien thi project history.

Done khi:
- Project gan duoc voi client.
- Client co lich su project.

### Commit 47 - feat: wire clients navigation and permissions
Muc tieu: Dua CRM vao app navigation.

Files can chinh:
- src/app/routes.jsx
- src/constants/routes.js
- src/components/layout/Sidebar.jsx
- src/config/permissions.js

Task:
- Them menu Clients.
- Them permissions: client.read, client.create, client.update, client.delete.
- Owner/Admin/Producer doc va sua client.
- Viewer chi doc neu duoc phep.
- Settings route khong anh huong.

Done khi:
- Sidebar co Clients.
- Role guard hoat dong.

## Sprint 7 - Production Plan / Call Sheet

### Commit 48 - feat: add production constants and schema
Files can tao:
- src/constants/productionStatus.js
- src/constants/productionTypes.js
- src/modules/production/productionDefaults.js
- src/modules/production/productionValidators.js

Constants:
- productionStatus: draft, confirmed, in_progress, completed, cancelled
- productionTypes: shooting, event, livestream, meeting, setup, rehearsal

Done khi:
- Co status/type dung chung cho production plan.
- Validate production day co ban.

### Commit 49 - feat: add production service
Files can tao:
- src/modules/production/productionService.js
- src/modules/production/runSheetService.js
- src/modules/production/callSheetService.js

Collections:
- productionDays
- runSheetItems
- callSheets

Task:
- CRUD productionDays.
- CRUD runSheetItems.
- Query production day theo project.
- Query production day theo ngay.
- Tao call sheet draft tu production day.

Done khi:
- Tao ngay san xuat cho project duoc.
- Them lich trinh trong ngay duoc.

### Commit 50 - feat: build production plan tab in project
Files can tao/chinh:
- src/modules/projects/tabs/ProjectProductionTab.jsx
- src/modules/projects/components/ProjectDetailTabs.jsx
- src/modules/production/components/ProductionDayList.jsx
- src/modules/production/components/ProductionDayFormDrawer.jsx

Task:
- Them tab Production.
- Hien thi production days theo project.
- Tao/sua production day.
- Xoa/huy production day neu co quyen.
- Field co ban: date, type, location, callTime, wrapTime, status, notes.

Done khi:
- Project detail co tab Production.
- Tao ngay san xuat trong project duoc.

### Commit 51 - feat: build run sheet editor
Files can tao:
- src/modules/production/components/RunSheetEditor.jsx
- src/modules/production/components/RunSheetItem.jsx
- src/modules/production/components/RunSheetTimeInput.jsx

Task:
- Them item vao run sheet.
- Moi item co: time, activity, owner, location, note, order.
- Sua/xoa/reorder item.
- Luu theo production day.

Done khi:
- Production day co run sheet.
- Lich trinh hien thi dung thu tu.

### Commit 52 - feat: build call sheet view
Files can tao:
- src/modules/production/pages/CallSheetDetailPage.jsx
- src/modules/production/components/CallSheetHeader.jsx
- src/modules/production/components/CallSheetSchedule.jsx
- src/modules/production/components/CallSheetNotes.jsx

Route:
- /app/production/call-sheets/:productionDayId

Task:
- Hien thi thong tin project.
- Hien thi ngay/dia diem/call time/wrap time.
- Hien thi run sheet.
- Hien thi notes.
- Toi uu layout de in/export sau nay.
- Button Open Call Sheet tu production tab.

Done khi:
- Call Sheet xem duoc ro rang.
- Team co the dung lam ban dieu phoi.

### Commit 53 - feat: build production calendar page
Files can tao:
- src/modules/production/pages/ProductionCalendarPage.jsx
- src/modules/production/components/ProductionCalendarList.jsx
- src/modules/production/components/ProductionDateFilter.jsx

Route:
- /app/production

Task:
- Hien thi production days theo tuan/thang dang list.
- Filter theo project/status/type.
- Click mo project hoac call sheet.
- Empty state neu chua co lich.

Done khi:
- Menu Production mo duoc lich san xuat.
- De biet ngay nao co quay/event.

### Commit 54 - feat: wire production navigation and permissions
Files can chinh:
- src/app/routes.jsx
- src/constants/routes.js
- src/components/layout/Sidebar.jsx
- src/config/permissions.js

Task:
- Them route /app/production.
- Them permissions: production.read, production.create, production.update, production.delete.
- Owner/Admin/Producer quan ly production.
- Editor doc production/call sheet.
- Viewer chi doc neu duoc phep.

Done khi:
- Production co menu va route.
- Phan quyen co ban hoat dong.

## Sprint 8 - Crew / Freelancer

### Commit 55 - feat: add crew constants and schema
Files can tao:
- src/constants/crewRoles.js
- src/constants/crewStatus.js
- src/modules/crew/crewDefaults.js
- src/modules/crew/crewValidators.js

Constants goi y:
- crewStatus: available, busy, inactive, blacklisted, archived
- crewRoles: producer, director, dop, camera_operator, editor, designer, sound, lighting, livestream_operator, event_coordinator, assistant

Done khi:
- Co role/status dung chung cho crew.
- Validate crew co ban.

### Commit 56 - feat: add crew service
Files can tao:
- src/modules/crew/crewService.js
- src/modules/crew/crewAssignmentService.js
- src/modules/crew/crewReviewService.js

Collections:
- crew
- crewAssignments
- crewReviews

Task:
- CRUD crew.
- Gan crew vao project.
- Gan crew vao production day.
- Luu rate/ngay.
- Luu review/rating noi bo.

Done khi:
- Quan ly freelancer/nhan su duoc.
- Assign crew vao project duoc.

### Commit 57 - feat: build crew list page
Files can tao:
- src/modules/crew/pages/CrewListPage.jsx
- src/modules/crew/components/CrewCard.jsx
- src/modules/crew/components/CrewFilters.jsx
- src/modules/crew/components/CrewStatusBadge.jsx

Route:
- /app/crew

Task:
- List crew.
- Search theo ten/so dien thoai/role.
- Filter theo role/status.
- Button them crew.
- Click crew mo detail.

Done khi:
- /app/crew hoat dong.
- Search/filter crew hoat dong.

### Commit 58 - feat: build crew form drawer
Files can tao:
- src/modules/crew/components/CrewFormDrawer.jsx
- src/modules/crew/components/CrewRoleSelector.jsx
- src/modules/crew/components/CrewRateInput.jsx

Task:
- Tao/sua crew.
- Field: name, type, roles, skills, dayRate, phone, email, status, notes.
- Validate field bat buoc.
- Toast success/error.

Done khi:
- Tao/sua crew duoc.

### Commit 59 - feat: build crew detail page
Files can tao:
- src/modules/crew/pages/CrewDetailPage.jsx
- src/modules/crew/components/CrewOverview.jsx
- src/modules/crew/components/CrewProjectHistory.jsx
- src/modules/crew/components/CrewReviewList.jsx

Route:
- /app/crew/:crewId

Task:
- Hien thi thong tin crew.
- Hien thi project history.
- Hien thi production day history.
- Them review noi bo.
- Hien thi rate/role/status.

Done khi:
- Xem ho so crew duoc.
- Biet crew tung lam project nao.

### Commit 60 - feat: assign crew to project and production day
Files can tao/chinh:
- src/modules/projects/tabs/ProjectCrewTab.jsx
- src/modules/production/components/ProductionCrewSection.jsx
- src/modules/crew/components/CrewAssignmentPicker.jsx
- src/modules/projects/components/ProjectDetailTabs.jsx

Task:
- Them tab Crew trong project detail.
- Gan crew vao project.
- Gan crew vao production day.
- Hien thi role/rate.
- Remove crew khoi project neu co quyen.
- Call Sheet hien thi crew list neu co.

Done khi:
- Project co danh sach crew.
- Call Sheet co crew tham gia.

### Commit 61 - feat: wire crew navigation and permissions
Files can chinh:
- src/app/routes.jsx
- src/constants/routes.js
- src/components/layout/Sidebar.jsx
- src/config/permissions.js

Task:
- Them menu Crew.
- Them permissions: crew.read, crew.create, crew.update, crew.delete.
- Owner/Admin/Producer quan ly crew.
- Editor chi doc neu can.

Done khi:
- Crew co route/menu.
- Permission hoat dong.

## Sprint 9 - Equipment

### Commit 62 - feat: add equipment constants and schema
Files can tao:
- src/constants/equipmentStatus.js
- src/constants/equipmentCategories.js
- src/modules/equipment/equipmentDefaults.js
- src/modules/equipment/equipmentValidators.js

Constants goi y:
- equipmentStatus: available, booked, maintenance, damaged, lost, archived
- equipmentCategories: camera, lens, lighting, audio, tripod, gimbal, computer, storage, livestream, accessory, other

Done khi:
- Co status/category dung chung.
- Validate equipment co ban.

### Commit 63 - feat: add equipment service
Files can tao:
- src/modules/equipment/equipmentService.js
- src/modules/equipment/equipmentBookingService.js
- src/modules/equipment/equipmentMaintenanceService.js

Collections:
- equipment
- equipmentBookings
- equipmentMaintenanceLogs

Task:
- CRUD equipment.
- Tao booking thiet bi.
- Query booking theo project.
- Query booking theo equipment.
- Kiem tra trung lich co ban.
- Ghi maintenance log.

Done khi:
- Quan ly thiet bi duoc.
- Booking thiet bi cho project duoc.

### Commit 64 - feat: build equipment list page
Files can tao:
- src/modules/equipment/pages/EquipmentListPage.jsx
- src/modules/equipment/components/EquipmentCard.jsx
- src/modules/equipment/components/EquipmentFilters.jsx
- src/modules/equipment/components/EquipmentStatusBadge.jsx

Route:
- /app/equipment

Task:
- List equipment.
- Search theo ten/serial/category.
- Filter status/category.
- Button them thiet bi.
- Click equipment mo detail.

Done khi:
- /app/equipment hoat dong.
- Search/filter thiet bi hoat dong.

### Commit 65 - feat: build equipment form drawer
Files can tao:
- src/modules/equipment/components/EquipmentFormDrawer.jsx
- src/modules/equipment/components/EquipmentCategorySelect.jsx

Task:
- Tao/sua equipment.
- Fields: name, category, serialNumber, status, condition, currentHolderId, notes.
- Validate field bat buoc.
- Toast success/error.

Done khi:
- Tao/sua thiet bi duoc.

### Commit 66 - feat: build equipment detail page
Files can tao:
- src/modules/equipment/pages/EquipmentDetailPage.jsx
- src/modules/equipment/components/EquipmentOverview.jsx
- src/modules/equipment/components/EquipmentBookingHistory.jsx
- src/modules/equipment/components/EquipmentMaintenanceLog.jsx

Route:
- /app/equipment/:equipmentId

Task:
- Hien thi thong tin thiet bi.
- Hien thi lich booking.
- Hien thi maintenance log.
- Cap nhat trang thai thiet bi.
- Ghi chu hong/mat/bao tri.

Done khi:
- Xem ho so thiet bi duoc.
- Biet thiet bi tung dung o project nao.

### Commit 67 - feat: assign equipment to project and production day
Files can tao/chinh:
- src/modules/projects/tabs/ProjectEquipmentTab.jsx
- src/modules/production/components/ProductionEquipmentSection.jsx
- src/modules/equipment/components/EquipmentBookingDrawer.jsx
- src/modules/equipment/components/EquipmentBookingConflictWarning.jsx
- src/modules/projects/components/ProjectDetailTabs.jsx

Task:
- Them tab Equipment trong Project Detail.
- Booking equipment cho project.
- Booking equipment cho production day.
- Canh bao trung lich.
- Remove booking neu co quyen.
- Call Sheet hien thi equipment list neu co.

Done khi:
- Project co danh sach thiet bi.
- Canh bao trung booking hoat dong co ban.

### Commit 68 - feat: wire equipment navigation and permissions
Files can chinh:
- src/app/routes.jsx
- src/constants/routes.js
- src/components/layout/Sidebar.jsx
- src/config/permissions.js

Task:
- Them menu Equipment.
- Them permissions: equipment.read, equipment.create, equipment.update, equipment.delete, equipment.book.
- Owner/Admin/Producer quan ly thiet bi.
- Editor/Viewer chi doc neu duoc phep.

Done khi:
- Equipment co route/menu.
- Permission hoat dong.

## Sprint 10 - Reports Basic + Export / Backup

### Commit 69 - feat: add report service
Files can tao:
- src/modules/reports/reportService.js
- src/modules/reports/reportCalculations.js
- src/modules/reports/reportFilters.js

Task:
- Tong hop project theo status.
- Tong hop task overdue.
- Tong hop revenue/cost/profit.
- Tong hop SOP completion.
- Tong hop production days.
- Tong hop crew/equipment usage co ban.

Done khi:
- Co service tra du lieu reports co ban.

### Commit 70 - feat: build reports overview page
Files can tao:
- src/modules/reports/pages/ReportsPage.jsx
- src/modules/reports/components/ReportDateFilter.jsx
- src/modules/reports/components/ReportStatGrid.jsx
- src/modules/reports/components/ProjectStatusReport.jsx

Route:
- /app/reports

Task:
- Hien thi filter thoi gian.
- Hien thi stat: Total projects, Active projects, Completed projects, Overdue tasks, Revenue, Cost, Profit.
- Bieu do project theo status.
- Empty state neu chua co du lieu.

Done khi:
- Reports page mo duoc.
- So lieu co ban hien thi dung.

### Commit 71 - feat: build finance and operation reports
Files can tao:
- src/modules/reports/components/FinanceReport.jsx
- src/modules/reports/components/TaskReport.jsx
- src/modules/reports/components/SopComplianceReport.jsx
- src/modules/reports/components/ProductionReport.jsx

Task:
- Finance report: revenue, cost, profit, unpaid invoices.
- Task report: todo, in_progress, done, overdue.
- SOP compliance: checklist completion rate, incomplete checklist items.
- Production report: production days, upcoming shoots/events.

Done khi:
- Reports giup nhin tinh hinh van hanh thuc te.

### Commit 72 - feat: add export utilities
Files can tao:
- src/utils/exportCsv.js
- src/utils/exportJson.js
- src/services/exportService.js

Task:
- Export CSV.
- Export JSON.
- Chuan hoa filename: vps-projects-YYYY-MM-DD.csv, vps-finance-YYYY-MM-DD.csv.
- Handle empty data.

Done khi:
- Co utility export dung chung.

### Commit 73 - feat: build export data page
Files can tao:
- src/modules/settings/pages/ExportDataPage.jsx
- src/modules/settings/components/ExportDataCard.jsx

Route:
- /app/settings/export

Task:
- Export: clients, projects, tasks, expenses, invoices, files, archives, crew, equipment.
- Chon format CSV/JSON.
- Chi Owner/Admin thay export.
- Toast khi export thanh cong.

Done khi:
- Owner/Admin xuat du lieu co ban duoc.

### Commit 74 - feat: wire reports navigation and permissions
Files can chinh:
- src/app/routes.jsx
- src/constants/routes.js
- src/components/layout/Sidebar.jsx
- src/config/permissions.js

Task:
- Them menu Reports.
- Them permissions: reports.read, export.read, export.create.
- Owner/Admin xem toan bo reports.
- Producer xem operation reports.
- Accountant xem finance reports.
- Viewer han che theo config.

Done khi:
- Reports route hoat dong.
- Export route duoc bao ve.

## Sprint 11 - QA + Security Rules + Release Phase 2

### Commit 75 - test: update firestore rules for phase 2
Files can chinh:
- firestore.rules
- tests/firestore.rules.test.js

Collections moi can rules:
- clients
- clientContacts
- clientNotes
- productionDays
- runSheetItems
- callSheets
- crew
- crewAssignments
- crewReviews
- equipment
- equipmentBookings
- equipmentMaintenanceLogs

Task:
- Clients rules.
- Production rules.
- Crew rules.
- Equipment rules.
- Reports/export access khong lam lo finance cho role sai.
- Rules tests cho cac case:
  - viewer cannot create client
  - producer can create production day
  - editor can read call sheet
  - producer can assign crew
  - producer can book equipment
  - viewer cannot create equipment
  - accountant cannot edit SOP/project neu khong duoc phep

Done khi:
- npm run test:rules pass.
- Khong collection moi nao bi mo public.

### Commit 76 - docs: add phase 2 QA checklist
Files can tao:
- QA_PHASE_2_CHECKLIST.md

Checklist can bao phu:
- Clients
- Production Plan
- Call Sheet
- Crew
- Equipment
- Reports
- Export
- Role Permissions
- Build

Done khi:
- Tester co checklist Phase 2 ro rang.

### Commit 77 - fix: normalize phase 2 loading empty error states
Files can ra soat:
- src/modules/clients/**
- src/modules/production/**
- src/modules/crew/**
- src/modules/equipment/**
- src/modules/reports/**
- src/modules/settings/pages/ExportDataPage.jsx

Task:
- Tat ca list co loading.
- Tat ca list co empty state.
- Form co validation error.
- Save/delete/archive co toast.
- Delete/booking/remove co confirm dialog.
- Permission denied hien thi than thien.

Done khi:
- Khong con man hinh trang o module Phase 2.
- UX du on de UAT.

### Commit 78 - test: run phase 2 smoke test and build
Task smoke test:
- Login owner/admin/producer/accountant/editor/viewer.
- Tao client.
- Gan client vao project.
- Tao production day.
- Tao run sheet.
- Mo call sheet.
- Tao crew.
- Gan crew vao project/production day.
- Tao equipment.
- Booking equipment.
- Kiem tra canh bao trung lich.
- Mo reports.
- Export CSV/JSON.
- Chay rules test.
- Build app.

Commands:
- npm run test:rules
- npm run build

Done khi:
- Phase 2 demo duoc end-to-end.
- Build pass.
- Rules test pass.

### Commit 79 - release: prepare phase 2 release candidate
Files can tao:
- RELEASE_NOTES_PHASE_2.md

Noi dung release notes:
- Added: Clients / CRM, Production Plan, Call Sheet, Crew / Freelancer, Equipment, Reports Basic, Export CSV/JSON.
- Security: Updated Firestore rules for Phase 2 collections, added rules tests for new roles and collections.
- Known limitations: chua co Client Portal, Public Website, Google Drive API sync, automation notification nang cao.

Done khi:
- Co release notes.
- Da tag release candidate.

## Phase 2 commit range
- Commit 41 -> 47: Clients / CRM
- Commit 48 -> 54: Production Plan / Call Sheet
- Commit 55 -> 61: Crew / Freelancer
- Commit 62 -> 68: Equipment
- Commit 69 -> 74: Reports + Export
- Commit 75 -> 79: QA + Security + Release

## Definition of Done - Phase 2
Phase 2 duoc xem la hoan tat khi:
- Tao client duoc.
- Gan client vao project duoc.
- Xem lich su project theo client duoc.
- Tao production day duoc.
- Tao run sheet duoc.
- Mo call sheet duoc.
- Tao crew/freelancer duoc.
- Gan crew vao project/production day duoc.
- Tao equipment duoc.
- Booking equipment duoc.
- Co canh bao trung lich thiet bi co ban.
- Reports hien thi project/task/finance/production co ban.
- Export CSV/JSON duoc.
- Firestore rules cap nhat cho collection moi.
- npm run test:rules pass.
- npm run build pass.
- Khong con loi Critical/High truoc release.
