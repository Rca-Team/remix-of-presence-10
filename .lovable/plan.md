

## Plan: Replace Category Breakdown with Student Directory Table

**What changes**: Remove the Category Breakdown card from PrincipalDashboard and replace it with a searchable, filterable student data table showing all registered students with their attendance status for today.

### Changes to `src/components/admin/PrincipalDashboard.tsx`

1. **Remove** the Category Breakdown card (lines 271-315) and the Distribution Pie chart card (lines 347-398)

2. **Add a new "All Students" section** with:
   - Search input to filter by name or employee ID
   - Filter chips for status (All / Present / Late / Absent)
   - A compact table/list showing each student:
     - Avatar + Name
     - Employee ID
     - Category badge
     - Today's status (Present/Late/Absent) with colored indicator
     - Check-in time (if present/late)
   - Student count summary at the top
   - Mobile-responsive: card layout on mobile, table on desktop

3. **Data source**: Use the existing `processedUsers` array already fetched, cross-referenced with `presentIds` and `lateIds` to determine each student's status. Add state for search query and status filter.

4. **Keep intact**: Metric cards, Weekly Trend chart, Attendance Rate Ring, and Live Activity feed.

### Layout
```text
┌──────────────────────────────────────────┐
│ [Live] Updated 10:30 AM        [Refresh] │
├──────────────────────────────────────────┤
│ Registered │ Present  │  Late  │ Absent  │
│    120     │   95     │   10   │   15    │
├──────────────────────────┬───────────────┤
│ All Students (120)       │ Attendance    │
│ [Search...] [All][P][L][A]│ Rate Ring    │
│ ┌─────────────────────┐  │              │
│ │ Name  ID  Cat Status│  ├──────────────┤
│ │ ...   ... ... ...   │  │ Live Activity│
│ │ ...   ... ... ...   │  │ ...          │
│ └─────────────────────┘  │              │
├──────────────────────────┤              │
│ Weekly Trend Chart       │              │
└──────────────────────────┴──────────────┘
```

### Technical details
- New state: `allStudents` array with name, employee_id, category, status, time, image_url
- New state: `searchQuery` string, `statusFilter` ('all' | 'present' | 'late' | 'absent')
- Filter with `useMemo` for performance
- ScrollArea with max height for the student list
- No database changes needed - all data already fetched

