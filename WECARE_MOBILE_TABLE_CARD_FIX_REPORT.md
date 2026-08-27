# WeCare Mobile Table Card Fix Report

Date: 2026-05-25  
Scope: React/Vite Admin Web frontend only

## A. Summary of Mobile Table/Card Fixes

Dense admin tables now switch to readable mobile card rows under `768px` instead of relying only on horizontal scrolling. This prevents letter-by-letter wrapping, squeezed columns, and tiny action/status controls on mobile screens.

Desktop and large tablet behavior remains table-based.

No backend APIs, service calls, routes, auth guards, or response contracts were changed.

## B. Files Changed

- `src/components/DataTable.jsx`
- `src/components/FilterBar.jsx`
- `src/pages/dashboard/CaregiverManagementPage.jsx`
- `src/pages/dashboard/UserManagementPage.jsx`
- `src/pages/dashboard/EarningsPage.jsx`
- `src/index.css`
- `WECARE_MOBILE_TABLE_CARD_FIX_REPORT.md`

Deployment settings verified and preserved:

- `vite.config.js`: `base: '/admin/'`
- `src/App.jsx`: `<BrowserRouter basename="/admin">`
- `.env`: `VITE_API_BASE_URL=https://we-care.eu.cc/wecare/api/v1`

## C. Reusable Components Added/Changed

### `DataTable.jsx`

`DataTable` now renders two responsive views:

- Desktop/tablet `>= 768px`: existing table UI.
- Mobile `< 768px`: card list UI.

New optional prop:

```text
renderMobileCard(row, rowIndex)
```

If a page provides `renderMobileCard`, it gets a tailored mobile card. If not, `DataTable` automatically creates a generic label/value mobile card from the existing columns.

This means other dense pages using `DataTable` also get a safer mobile layout without changing their API logic.

### `FilterBar.jsx`

Filter chips now wrap instead of forcing a single horizontal row. This keeps filters usable on `320px` screens and avoids squeezed chip text.

## D. Page-by-Page Mobile Layout Changes

| Page | Mobile Change |
|---|---|
| Caretaker Verification | Custom mobile caretaker cards with avatar, name, ID, email, phone, tier, rating, experience, availability, city, status, and View action. |
| Caretakers | Same custom caretaker card pattern as verification page. |
| Users | Custom user cards with avatar/initial, name, email, role badge, phone, city, status, joined date, View and Suspend/Activate actions. |
| Earnings / Payout Operations | Custom payout cards with caretaker name, booking ID, completed date, amount, payout status, hold until, hold reason, Detail/Create Payout/Mark Paid actions. |
| Bookings | Generic mobile cards from existing `DataTable` columns. |
| Active Visits | Generic mobile cards from existing `DataTable` columns. |
| SOS Alerts | Generic mobile cards from existing `DataTable` columns. |
| Complaints | Generic mobile cards from existing `DataTable` columns. |
| Replacements | Generic mobile cards from existing `DataTable` columns. |
| Refund Management | Generic mobile cards from existing `DataTable` columns. |
| Pricing Tiers | Generic mobile cards from existing `DataTable` columns. |

## E. CSS Table Wrapping Fixes

Global table behavior was corrected:

- Table headers no longer use aggressive text breaking.
- Table cells no longer globally use `overflow-wrap: anywhere`.
- Headers and action cells keep readable nowrap behavior on desktop/tablet.
- Table wrappers can still scroll horizontally when table layout is active.
- Under `768px`, `.admin-table-wrap` is hidden and `.mobile-data-list` is shown.
- Mobile cards use full-width layout with clear rows and action sections.
- Under `420px`, card label/value rows stack vertically for maximum readability.

Mobile card styling includes:

- Full-width cards.
- 12-14px readable text.
- Dedicated top row.
- Label/value field rows.
- Badges remain readable.
- Buttons wrap naturally in the card action area.
- Long emails, names, notes, IDs, and dates wrap safely inside card content.

## F. Validation Results

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

## G. Manual Live Testing Checklist

After deploying to `https://we-care.eu.cc/admin/`, test at `425px`, `375px`, `360px`, and `320px`:

- [ ] Caretaker Verification shows mobile cards instead of compressed table text.
- [ ] Caretakers shows mobile cards instead of compressed table text.
- [ ] Users shows mobile cards with usable View and Suspend/Activate buttons.
- [ ] Earnings shows mobile cards with usable Detail/Create Payout/Mark Paid actions.
- [ ] Bookings mobile cards are readable.
- [ ] SOS Alerts mobile cards are readable.
- [ ] Complaints mobile cards are readable.
- [ ] Replacements mobile cards are readable.
- [ ] Refund Management mobile cards are readable.
- [ ] Pricing Tiers mobile cards are readable.
- [ ] Filter chips wrap cleanly and remain tappable.
- [ ] No body-level horizontal overflow appears at `320px`.
- [ ] Desktop table layout remains unchanged at `>= 768px`.

## H. Remaining Limitations

- Pages using the generic mobile card renderer may not be as visually optimized as the custom cards for Caretakers, Users, and Earnings. They are still significantly more usable than compressed mobile tables.
- Some rendered values may include compact JSX from the desktop table column renderers. This is expected and preserves the existing frontend mapping without changing backend contracts.
