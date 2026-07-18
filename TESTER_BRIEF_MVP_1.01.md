# BRIEF TESTER - Vi Phu Sa Production OS MVP 1.01

## 1. Muc tieu kiem thu
Tester can kiem tra toan bo MVP truoc khi dua website vao dung thu noi bo (staging).

Muc tieu chinh:
- Dang nhap va phan quyen hoat dong dung.
- Cac module chinh chay on dinh.
- Du lieu luu dung vao Firebase/Firestore.
- Nguoi dung khong co quyen khong the xem/sua du lieu nhay cam.
- Khong co loi nghiem trong anh huong luong van hanh production house.
- Website co the dung cho 1 project that tu dau den cuoi.

## 2. Pham vi kiem thu MVP
Cac module can test:
1. Auth / Dang nhap
2. Layout / Giao dien quan tri
3. Dashboard
4. SOP Center
5. Projects
6. Project Checklist
7. TaskBoard
8. Finance Basic
9. File Links
10. Archive
11. Settings
12. Firebase Security Rules / Phan quyen du lieu

## 3. Khong nam trong pham vi test lan nay
Neu chua phat trien, chua can test:
- CRM khach hang nang cao
- Client Portal
- Public Website / Portfolio
- Crew / Freelancer Database
- Equipment Booking
- Call Sheet / Run Sheet
- Advanced Reports
- Notification Center
- Google Drive API Sync

## 4. Moi truong kiem thu
Tester thuc hien test tren:
- Environment: Staging
- URL: [Dien link staging]
- Firebase Project: [Dien ten Firebase project]
- Browser: Chrome, Edge
- Device: Desktop/Laptop
- Screen size: >= 1366px

Khuyen nghi test responsive co ban them tren:
- Tablet
- Mobile width

## 5. Tai khoan test theo role
Su dung nhieu role de test phan quyen:
- Owner: [email] / [password]
- Admin: [email] / [password]
- Producer: [email] / [password]
- Accountant: [email] / [password]
- Editor: [email] / [password]
- Viewer: [email] / [password]

## 6. Checklist kiem thu chi tiet

### A. Auth / Dang nhap
Tester can kiem tra:
- User chua dang nhap khong vao duoc /app/*.
- Login thanh cong chuyen ve Dashboard.
- Logout thanh cong.
- Refresh trang sau login khong mat session bat thuong.
- Sai email/password hien thong bao loi ro rang.
- Role khac nhau thay menu/action khac nhau (neu co phan quyen).

Ket qua mong muon:
- Chi user da dang nhap moi vao duoc khu vuc noi bo.
- Phan quyen co ban dung theo role.

### B. Layout / Giao dien quan tri
Tester can kiem tra:
- Sidebar hien thi dung menu.
- Sidebar highlight dung trang dang mo.
- Topbar hien thi dung user.
- Cac trang co title/header ro rang.
- Khong co man hinh trang.
- Khong vo layout nghiem trong.
- Co loading state khi dang tai.
- Co empty state khi chua co du lieu.

Menu can kiem tra:
- Dashboard
- Projects
- SOP Center
- TaskBoard
- Finance
- Archive
- Settings

### C. Dashboard
Tester can kiem tra:
- Mo duoc Dashboard sau login.
- Hien thi summary project/task/finance.
- Chua co du lieu thi hien empty state.
- So lieu khong bi NaN/null/undefined.
- Card/list co link thi dieu huong dung.

Ket qua mong muon:
- Dashboard hien trang thai tong quan he thong hoac trang thai trong ro rang.

### D. SOP Center
Tester can kiem tra:

SOP List:
- Mo duoc trang SOP Center.
- Danh sach SOP hien thi dung.
- Search SOP hoat dong.
- Filter status/category hoat dong.
- Click SOP mo duoc detail.

Tao/Sua SOP:
- Tao SOP moi.
- Nhap title/category/status.
- Them nhieu step.
- Sua step.
- Xoa step.
- Luu SOP thanh cong.
- Reload van con du lieu SOP.
- Sua SOP khong mat step.

Archive/Duplicate:
- Archive SOP hoat dong.
- Duplicate SOP hoat dong.
- Viewer khong tao/sua/archive SOP neu khong co quyen.

Ket qua mong muon:
- SOP tao, sua, xem, duplicate, archive duoc va co the gan vao project.

### E. Projects
Tester can kiem tra:

Project List:
- Mo duoc trang Projects.
- Tao project moi.
- Search theo ten/code/client.
- Filter status/type/priority.
- Click project mo Project Detail.

Project Form:
- Tao project voi cac field bat buoc.
- Thieu field bat buoc thi hien loi.
- Sua project.
- Doi status project.
- Reload van giu du lieu.

Project Detail tabs phai mo duoc:
- Overview
- Checklist
- Tasks
- Budget
- Files
- Archive

Kiem tra them:
- Overview hien thi thong tin project.
- Chuyen tab khong reload toan app.
- Project khong ton tai co not found/empty state.
- Viewer khong sua project neu khong co quyen.

Ket qua mong muon:
- Project la trung tam van hanh, day du checklist/task/budget/files/archive.

### F. Project Checklist
Tester can kiem tra:
- Vao Project Detail -> Checklist.
- Bam gan SOP.
- Danh sach chi hien SOP active.
- Chon SOP va sinh checklist.
- Checklist sinh dung theo SOP steps.
- Tick checklist item.
- Reload van giu trang thai tick.
- Completion rate cap nhat dung.
- User khong co quyen khong tick/sua checklist (neu rule quy dinh).

Ket qua mong muon:
- SOP co the chuyen thanh checklist thuc thi trong project.

### G. TaskBoard
Tester can kiem tra:

Tao task:
- Tao task tu TaskBoard.
- Tao task tu Project Detail -> Tasks.
- Task co projectId.
- Task co title/status/priority/assignee/dueDate.
- Sua task.
- Xoa/archive task (neu co).

Kanban:
- Task hien dung cot.
- Keo task Todo -> In Progress.
- Keo task sang Review/Done/Blocked.
- Status luu lai sau reload.
- Filter theo project/user/status.

My Tasks:
- User chi thay task duoc assign.
- Task overdue/today/upcoming hien dung (neu co).
- Viewer khong tao/sua task neu khong co quyen.

Ket qua mong muon:
- TaskBoard quan ly cong viec theo project va drag-drop on dinh.

### H. Finance Basic
Tester can kiem tra:

Expense:
- Mo Finance -> Expenses.
- Tao expense theo project.
- Nhap amount/category/paymentStatus.
- Sua expense.
- Xoa/archive expense (neu co).
- Expense hien trong Project Budget tab.

Invoice:
- Mo Finance -> Invoices.
- Tao invoice theo project.
- Nhap amount/status/dueDate/paidAmount.
- Sua invoice.
- Invoice hien trong Project Budget tab.

Project Budget:
- Revenue tinh dung.
- Cost tinh dung.
- Profit = Revenue - Cost.
- Profit margin tinh dung.
- Sua/xoa expense hoac invoice cap nhat lai so lieu.

Permission:
- Accountant/Admin/Owner duoc quan ly finance.
- Editor/Viewer khong truy cap hoac khong sua finance (neu rule quy dinh).
- Producer co quyen finance dung theo cau hinh thuc te.

Ket qua mong muon:
- Finance Basic cho thay project dang loi/lo co ban.

### I. File Links
Tester can kiem tra:
- Vao Project Detail -> Files.
- Them link file.
- Nhap name/url/provider/type.
- Validate URL sai.
- Link Google Drive mo duoc.
- Link OneDrive mo duoc.
- Link YouTube/Vimeo mo duoc (neu co).
- Sua file link.
- Xoa file link neu co quyen.
- Reload van con file link.

Provider can test:
- Google Drive
- OneDrive
- YouTube
- Vimeo
- Other

Ket qua mong muon:
- He thong chi luu link file, khong upload file nang vao app.

### J. Archive
Tester can kiem tra:
- Vao Project Detail -> Archive.
- Archive project.
- Nhap summary.
- Nhap lessons learned.
- Project doi status sang archived (neu co logic nay).
- Archive xuat hien trong Archive List.
- Mo Archive Detail.
- Archive Detail hien thi file links lien quan.
- Archive khong lam mat project data.
- Viewer chi xem archive, khong sua neu khong co quyen.

Ket qua mong muon:
- Project hoan tat co the luu tru cung bai hoc va file links.

### K. Settings
Tester can kiem tra:
- Mo duoc /app/settings.
- Role khong co quyen khong vao duoc Settings.
- Trang khong bi 404.
- Placeholder ro rang neu chua co tinh nang day du.

### L. Firebase Security Rules
Test theo tung role:

Unauthenticated:
- Khong doc duoc projects.
- Khong doc duoc SOP.
- Khong doc duoc tasks.
- Khong doc duoc finance.
- Khong ghi duoc bat ky collection noi bo nao.

Viewer:
- Doc duoc du lieu duoc phep.
- Khong tao project.
- Khong sua SOP.
- Khong tao expense.
- Khong xoa task.
- Khong archive project.

Producer:
- Tao/sua project.
- Tao/sua SOP (neu duoc phep).
- Gan checklist.
- Tao/sua task.
- Khong tao/sua finance neu rule gioi han finance cho Accountant/Admin/Owner.

Accountant:
- Doc project can thiet.
- Tao/sua expense.
- Tao/sua invoice.
- Khong sua SOP/project neu rule khong cho phep.

Editor:
- Tao/sua task (neu duoc phep).
- Them file link (neu duoc phep).
- Khong xem/sua finance neu rule khong cho phep.

Owner/Admin:
- Co toan quyen can thiet.
- Delete/archive nhay cam hoat dong dung.

## 7. Quy chuan ghi bug
Tester ghi bug theo format:

```markdown
## Bug ID
BUG-001

## Module
Projects

## Muc do
Critical / High / Medium / Low

## Mo ta
Khong tao duoc project khi nhap du thong tin.

## Buoc tai hien
1. Login bang Producer
2. Vao Projects
3. Bam New Project
4. Nhap du field
5. Bam Save

## Ket qua thuc te
Hien loi permission denied.

## Ket qua mong muon
Project duoc tao thanh cong.

## Anh/video
Dinh kem neu co.

## Browser/Device
Chrome / Desktop

## Ghi chu
Co the lien quan Firebase Security Rules.
```

## 8. Muc do loi

Critical (chan van hanh):
- Khong login duoc
- Khong tao project duoc
- Khong luu du lieu
- Security rules mo sai lam lo du lieu

High (anh huong module quan trong):
- Checklist khong luu
- Task khong keo-tha duoc
- Finance tinh sai
- Viewer sua duoc du lieu

Medium (anh huong trai nghiem, co workaround):
- Filter sai
- Empty state thieu
- Validate chua ro

Low (nhe):
- Sai text
- Lech UI nhe
- Icon chua dep

## 9. Dieu kien pass MVP
MVP duoc xem la pass neu:
- Khong con loi Critical.
- Khong con loi High lien quan bao mat/du lieu.
- Auth hoat dong.
- SOP hoat dong.
- Project hoat dong.
- Checklist hoat dong.
- TaskBoard hoat dong.
- Finance tinh dung.
- File links luu duoc.
- Archive hoat dong.
- npm run build pass.
- npm run test:rules pass.

## 10. Tai lieu ban giao tester
Tester can gui lai:
1. QA_MVP_CHECKLIST da tick.
2. Danh sach bug.
3. Video/anh loi (neu co).
4. Ket qua test tung role.
5. Ket qua test tren browser/device.
6. Ket luan: Pass / Pass with issues / Failed.

## Tom tat luong test end-to-end
Login -> Tao SOP -> Tao Project -> Gan SOP thanh Checklist -> Tao Task -> Keo Task tren Kanban -> Nhap Expense/Invoice -> Them File Links -> Archive Project -> Kiem tra phan quyen tung role.

## 11. Viec can lam ngay sau bai test
Truoc khi them tinh nang moi, tong ket ket qua test thanh 3 nhom:

### A. Bug can sua ngay
Neu con bug nhom nay thi sua truoc, khong them module moi:
- Loi dang nhap.
- Loi phan quyen.
- Loi luu project.
- Checklist khong luu dung.
- TaskBoard keo-tha loi.
- Finance tinh sai.
- File link khong mo duoc.
- Archive project bi mat du lieu.

### B. UX can cai thien
Xu ly sau khi da dong bug nghiem trong:
- Form qua dai.
- Nguoi dung khong biet bam nut nao.
- Thieu trang thai loading.
- Thieu thong bao luu thanh cong.
- Search/filter kho dung.
- Giao dien dashboard chua ro uu tien.

### C. Field con thieu khi van hanh that
Nhom nay de chot scope Phase 2:
- Project thieu dia diem.
- Thieu nguoi phu trach chinh.
- Thieu ngay quay/ngay event.
- Thieu trang thai thanh toan.
- Thieu link folder Drive/OneDrive chinh.
- Thieu ghi chu khach hang.
- Thieu checklist nghiem thu.

## 12. Huong phat trien tiep theo: Phase 2 - Operation Core
Thu tu uu tien de phat trien sau MVP:
1. Clients / CRM nhe
2. Production Plan / Call Sheet
3. Crew / Freelancer
4. Equipment
5. Reports
6. Export / Backup

MVP hien da co:
- Auth
- Layout
- SOP Center
- Projects
- Project Checklist
- TaskBoard
- Finance Basic
- Archive/File Links

Muc tieu Phase 2 la bo sung cac module giup van hanh project that o production house.

## 13. Uu tien 1: Clients / CRM nhe
### Vi sao nen lam truoc
Project hien co the luu clientName dang text, nhung de scale can co client entity rieng vi mot khach co the lap lai nhieu job.

### Tinh nang nen lam
- Danh sach khach hang.
- Ho so khach hang.
- Nguoi lien he.
- Lich su project.
- Ghi chu cham soc.
- Nguon khach hang.
- Trang thai khach hang.

### Collection de xuat
- clients
- clientContacts
- clientNotes

### Field co ban
```js
clients {
	name,
	type,
	industry,
	source,
	status,
	phone,
	email,
	address,
	taxCode,
	notes,
	createdAt,
	updatedAt
}
```

### Ket qua mong muon
Moi project gan voi mot client that, khong nhap ten khach bang text tu do.

## 14. Uu tien 2: Production Plan / Call Sheet
### Vi sao quan trong
Day la buoc nang cap he thong tu quan ly task thanh he thong van hanh production house.

### Tinh nang nen lam
- Ngay quay/ngay event.
- Dia diem.
- Call time.
- Wrap time.
- Lich trinh trong ngay.
- Nguoi phu trach tung moc.
- Ghi chu hien truong.
- Checklist truoc ngay san xuat.

### Route/module nen them
- /app/production
- /app/projects/:projectId/production-plan
- /app/projects/:projectId/call-sheet

### Schema goi y
```js
productionDays {
	projectId,
	date,
	location,
	callTime,
	wrapTime,
	mainContact,
	schedule: [
		{
			time,
			activity,
			owner,
			note
		}
	],
	notes,
	createdAt,
	updatedAt
}
```

### Ket qua mong muon
Moi project xuat duoc Call Sheet/Run Sheet cho team di quay hoac chay event.

## 15. Uu tien 3: Crew / Freelancer Database
### Vi sao nen lam
Can quan ly ekip linh hoat de biet:
- Ai tung lam job nao.
- Ai dang ranh.
- Ai rate bao nhieu.
- Ai phu hop vai tro nao.
- Ai lam tot/chua tot.

### Tinh nang nen lam
- Danh sach nhan su/freelancer.
- Vai tro.
- Ky nang.
- Rate/ngay.
- So dien thoai/email.
- Lich su tham gia project.
- Danh gia noi bo.
- Trang thai kha dung.

### Role crew goi y
- Producer
- Director
- DOP
- Camera Operator
- Editor
- Designer
- Sound
- Lighting
- Livestream Operator
- Event Coordinator
- Assistant

### Schema goi y
```js
crew {
	name,
	type,
	roles,
	skills,
	dayRate,
	phone,
	email,
	status,
	rating,
	notes,
	createdAt,
	updatedAt
}
```

### Ket qua mong muon
Khi tao project/call sheet co the chon crew tu database thay vi nhap tay.

## 16. Uu tien 4: Equipment Management
### Vi sao can
Quan ly thiet bi de tranh:
- Quen thiet bi.
- Trung lich thiet bi.
- Khong biet ai dang giu.
- Khong biet thiet bi hong/mat.
- Khong biet thiet bi dang dung cho project nao.

### Tinh nang nen lam
- Danh sach thiet bi.
- Loai thiet bi.
- Tinh trang.
- Nguoi dang giu.
- Project dang dung.
- Lich booking.
- Bao tri.
- Bao hong/mat.

### Schema goi y
```js
equipment {
	name,
	category,
	serialNumber,
	status,
	condition,
	currentHolderId,
	notes,
	createdAt,
	updatedAt
}

equipmentBookings {
	equipmentId,
	projectId,
	startDate,
	endDate,
	bookedBy,
	status,
	notes
}
```

### Ket qua mong muon
Moi project biet thiet bi can dung va thiet bi do co dang ranh hay khong.

## 17. Uu tien 5: Reports
Reports co y nghia khi da co du lieu day du tu project/task/finance/archive/client/production/crew/equipment.

### Reports nen co
Business Report:
- Doanh thu theo thang.
- Chi phi theo thang.
- Loi nhuan theo project.
- Project dang chay.
- Project da hoan tat.
- Cong no.

Operation Report:
- Task qua han.
- SOP completion rate.
- Project tre deadline.
- So project theo trang thai.

Production Report:
- So ngay quay/event.
- Crew duoc dung nhieu nhat.
- Thiet bi duoc dung nhieu nhat.
- Incident/rui ro (neu co).

### Ket qua mong muon
Dashboard phuc vu quyet dinh:
- Job nao loi/lo?
- Phong ban nao dang nghen?
- SOP nao hay bi bo sot?
- Client nao dem lai nhieu doanh thu?
- Crew nao lam hieu qua?

## 18. Khuyen nghi uu tien: chua lam Public Website ngay
Chua nen uu tien public website. Hoan thien van hanh noi bo truoc.

Ly do:
- Public website giup co khach.
- Production OS giup khong mat kiem soat khi co khach.
- Neu van hanh noi bo chua on, cang nhieu khach cang de roi.

Thu tu nen di:
MVP noi bo -> CRM -> Production Plan -> Crew/Equipment -> Reports -> Client Portal -> Public Website.

## 19. Roadmap de xuat 4 tuan tiep theo
### Tuan 1: Clients / CRM nhe
- Tao collection clients.
- Tao client list.
- Tao client detail.
- Gan client vao project.
- Hien thi lich su project theo client.

### Tuan 2: Production Plan / Call Sheet
- Tao productionDays.
- Tao schedule trong ngay.
- Tao call sheet view.
- Gan production plan vao project.

### Tuan 3: Crew / Freelancer
- Tao crew database.
- Gan crew vao project.
- Gan crew vao production day.
- Them rate/ngay.

### Tuan 4: Equipment + Reports co ban
- Tao equipment list.
- Tao equipment booking.
- Gan equipment vao project.
- Bao cao project/finance/task co ban.

## 20. Phase 2 backlog nen chot
Nen lam:
- Clients / CRM
- Production Plan
- Call Sheet
- Crew / Freelancer
- Equipment
- Reports Basic
- Export CSV

Chua lam:
- Client Portal
- Public Website
- Automation
- AI Assistant
- Advanced Permission
- Google Drive Sync that

## 21. Tieu chi thanh cong Phase 2
Phase 2 thanh cong khi quan ly duoc mot job that theo luong:

Tao client
-> Tao project cho client
-> Gan SOP
-> Tao task
-> Lap production plan
-> Gan crew
-> Gan equipment
-> Nhap chi phi
-> Theo doi profit
-> Luu file link
-> Archive
-> Xem report

Neu dat duoc luong nay, he thong da tro thanh Production OS thuc te, khong chi la dashboard.

## 22. Tai lieu trien khai chi tiet Phase 2
Xem backlog sprint/commit chi tiet tai:
- docs/PHASE2_OPERATION_CORE_PLAN.md
