# WeCare Mobile Layout Fix Report

Date: 2026-05-25  
Scope: React/Vite Admin Web frontend only

## A. Summary of Mobile Issues Fixed

The mobile admin shell was adjusted to address the live layout issues seen on the hosted WeCare Admin Panel. The hamburger button now sits inside a dedicated mobile header instead of floating over the dashboard title. The main content is pushed below that mobile header, and the off-canvas sidebar uses a more comfortable drawer width with a stronger backdrop and cleaner stacking order.

No backend APIs, service calls, auth guards, routes, or API base URL settings were changed.

## B. Files Changed

- `src/components/AdminLayout.jsx`
- `src/index.css`
- `WECARE_MOBILE_LAYOUT_FIX_REPORT.md`

Deployment settings verified and preserved:

- `vite.config.js`: `base: '/admin/'`
- `src/App.jsx`: `<BrowserRouter basename="/admin">`
- `.env`: `VITE_API_BASE_URL=https://we-care.eu.cc/wecare/api/v1`

## C. Sidebar Width / Backdrop Behavior

Mobile sidebar changes:

- Sidebar width is now `min(82vw, 300px)` on tablet/mobile.
- Screens under 360px use `calc(100vw - 24px)` so the drawer remains usable without feeling squeezed.
- Sidebar logo/close-button row has cleaner spacing.
- Sidebar content remains vertically scrollable.
- Existing nav link click behavior still closes the sidebar.
- Existing logout remains accessible inside the sidebar.

Backdrop changes:

- Backdrop covers the full viewport.
- Backdrop uses a darker transparent overlay.
- Backdrop sits above content and below the sidebar.
- Clicking the backdrop closes the sidebar.
- Page content is not interactable while the sidebar is open.

## D. Hamburger / Header Spacing Fix

The hamburger button was moved into a new mobile header:

- `mobile-app-header` is fixed at the top only on tablet/mobile.
- It contains the hamburger button and a compact `WeCare Admin` label.
- `.main-area` receives `padding-top: 56px` on tablet/mobile so page titles and dashboard content start below the mobile header.
- Topbar padding was reset so the hamburger no longer overlaps search or page titles.

Result:

- Dashboard title `WeCare Admin Demo` is no longer hidden behind the hamburger.
- Other page titles also start below the fixed mobile header.
- Dashboard cards are not pushed under the hamburger.

## E. Z-index Changes

Stacking order was cleaned up:

| Layer | z-index | Notes |
|---|---:|---|
| Normal page content | default | Content remains below mobile chrome. |
| Mobile header | 1000 | Header/hamburger stays above content. |
| Sidebar backdrop | 1100 | Blocks interaction with page content. |
| Mobile sidebar | 1200 | Drawer appears above backdrop/header. |
| Modals/drawers | 1400 | Dialogs and detail drawers appear above sidebar if opened. |
| Toasts | 9999 | Existing toast priority preserved. |

## F. Mobile Viewport Testing Notes

Code-level checks covered:

- Main content no longer starts under the fixed hamburger.
- Sidebar width is constrained for 320px-425px screens.
- Body/root horizontal overflow protection remains active.
- Tables continue using horizontal scroll wrappers.
- Dashboard/stat cards continue using tablet/mobile grid rules.
- Modals/drawers remain viewport-constrained.

Recommended live visual checks:

- 320px
- 375px
- 425px
- 768px
- 1024px
- 1440px

## G. Validation Results

Commands run:

```text
npm.cmd run lint
```

Result:

```text
Passed
```

```text
npm.cmd run build
```

Result:

```text
Passed
Vite production build completed successfully.
```

Build/deployment checks:

- `dist/index.html` still contains `/admin/assets/...` paths.
- `dist/index.html` still contains `/admin/favicon.svg`.
- `dist/index.html` still contains `<title>WeCare Admin Panel</title>`.

## H. Remaining Manual Checks

After deploying to `https://we-care.eu.cc/admin/`, verify:

- [ ] Dashboard title is fully visible on 320px.
- [ ] Hamburger does not cover title or cards.
- [ ] Sidebar width feels comfortable on 320px, 375px, and 425px.
- [ ] Sidebar close button is visible.
- [ ] Backdrop closes the sidebar.
- [ ] Page content cannot be clicked while sidebar is open.
- [ ] Clicking each nav item closes the sidebar.
- [ ] Logout remains visible and usable in the sidebar.
- [ ] No unwanted horizontal body overflow at 320px.
- [ ] Tables remain scrollable on mobile.
- [ ] Modals/drawers appear above sidebar and fit mobile screens.
