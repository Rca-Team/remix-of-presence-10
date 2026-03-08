

## Plan: Parent Portal Page at `/parent`

A dedicated, standalone page where parents log in and see their child's attendance — designed as a separate experience from the admin/teacher interface.

### What Gets Built

1. **New page: `src/pages/ParentPortal.tsx`**
   - Self-contained page with its own login flow (parents use the same auth system)
   - After login, fetches children linked via `profiles.parent_phone` or `profiles.parent_email` matching the logged-in user's profile
   - Three main sections:
     - **Today's Status** — big card showing Present/Late/Absent with check-in time
     - **Monthly Attendance History** — calendar-style grid with color-coded days (green/yellow/red)
     - **Trends Card** — attendance rate %, late count, streak info, line chart of last 30 days
   - Clean, mobile-first design (parents will use phones)
   - School branding header with Logo component
   - Logout button

2. **Route in `src/App.tsx`**
   - Add `/parent` route wrapped in `ProtectedRoute` (no admin requirement)

3. **Data flow**
   - On mount: get logged-in user → fetch their profile → use `parent_phone`/`parent_email` to find linked students in `attendance_records` where `device_info->metadata->parent_phone` matches
   - Fetch attendance records for matched students for current month
   - No new database tables needed — uses existing `attendance_records`, `profiles`

4. **Navigation**
   - Add "Parent Portal" link on the landing page and login page
   - Parents navigate directly to `/parent` or get redirected there based on context

### Technical Details

- Reuses existing `supabase` client, `ProtectedRoute`, `Logo`, UI components
- Uses `recharts` LineChart for trend visualization
- Uses `date-fns` for date calculations (working days, weekends)
- Mobile-responsive with Tailwind — card layout stacks vertically on small screens
- No new database migrations required

### Layout (mobile-first)
```text
┌─────────────────────────┐
│ Logo    Parent Portal  ⏻│
├─────────────────────────┤
│ [Child 1] [Child 2]     │
├─────────────────────────┤
│ TODAY'S STATUS           │
│ ✅ Present at 8:12 AM   │
│ Class 7-A               │
├─────────────────────────┤
│ THIS MONTH (March 2026) │
│ 🟢🟢🟡🔴🟢🟢🟢...     │
│ 92% attendance          │
├─────────────────────────┤
│ TRENDS (30 days)        │
│ ~~~line chart~~~        │
│ Late: 3  Absent: 2      │
└─────────────────────────┘
```

