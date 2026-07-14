# MVP QA Checklist

Use this checklist for RC validation on branch `release/mvp-1.0`.

## A. Auth / Layout
- [ ] Login works.
- [ ] Logout works.
- [ ] Unauthenticated user cannot access `/app/*`.
- [ ] Sidebar opens/collapses and navigation links work.
- [ ] Header shows correct user info.
- [ ] Refresh on each route does not break app.

## B. SOP Center
- [ ] Create SOP.
- [ ] Create SOP with multiple steps.
- [ ] Edit SOP.
- [ ] Archive SOP (with confirm).
- [ ] Duplicate SOP.
- [ ] Search SOP.

## C. Projects
- [ ] Create project.
- [ ] Edit project.
- [ ] Change project status.
- [ ] Open project detail.
- [ ] Tabs open: Overview, Checklist, Tasks, Budget, Files, Archive.

## D. Project Checklist
- [ ] Attach active SOP to project.
- [ ] Generate checklist from SOP steps.
- [ ] Tick checklist items.
- [ ] Completion rate updates correctly.
- [ ] Reload keeps checklist state.

## E. TaskBoard
- [ ] Create task from Project detail.
- [ ] Create task from TaskBoard.
- [ ] Drag/drop task across columns.
- [ ] Status persists after reload.
- [ ] My Tasks shows assigned tasks only.

## F. Finance Basic
- [ ] Create expense per project.
- [ ] Create invoice per project.
- [ ] Budget tab shows Revenue/Cost/Profit.
- [ ] Profit margin is calculated and shown.
- [ ] Edit expense keeps totals correct.
- [ ] Delete expense keeps totals correct.

## G. Archive / File Links
- [ ] Add Google Drive link.
- [ ] Add OneDrive link.
- [ ] Add YouTube link.
- [ ] Links open correctly.
- [ ] Archive project from detail tab.
- [ ] Archive detail shows summary + lessons learned.
- [ ] Archived project keeps file links.

## Smoke Commands
```bash
npm install
node --test src/services/__tests__/mvpFeatures.test.js src/services/__tests__/taskService.test.js src/services/__tests__/financeService.test.js src/services/__tests__/fileLinkService.test.js src/services/__tests__/archiveService.test.js
npm run build
npm run dev
```
