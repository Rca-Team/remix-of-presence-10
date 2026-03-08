

# School Deployment Plan — Full Setup Guide

This is a step-by-step plan to deploy the face attendance system in a large school (1000+ students) using dedicated cameras and teacher phones.

---

## Phase 1: Publish & Go Live

1. **Publish the app** so it's accessible on a public URL (e.g., `yourschool.lovable.app` or a custom domain).
2. Share the URL with school staff — works on any device with a browser (phones, tablets, laptops connected to cameras).

---

## Phase 2: Admin & Staff Account Setup

1. **Primary admin** (`gauravraj10226@gmail.com`) is already configured.
2. **Create principal account**: Sign up via the app → admin promotes to `moderator` (principal) role via Admin → Access tab.
3. **Create teacher accounts**: Each teacher signs up → admin assigns teacher permissions with their class/section via Admin → Access tab.

**Recommended structure:**
```text
Admin (you)
├── Principal (moderator role — full dashboard access)
└── Teachers (teacher permissions — class-specific attendance only)
```

---

## Phase 3: Bulk Student Registration (1000+ students)

For a large school, use these methods in order of efficiency:

1. **PDF Import** (Admin → PDF Import): Upload a class-wise PDF list with student names, IDs, sections, and classes. The system extracts and creates records automatically.

2. **ID Card Batch Extract** (Admin → ID Extract): Upload scanned ID card images. AI extracts name, photo, ID number, and class from each card.

3. **Bulk Image Registration** (Admin → Bulk Register): Upload a folder of student photos with names. System registers face descriptors in batch.

4. **Quick Registration** (Admin → Register): For individual students — capture face via webcam with name, ID, class, and section.

**Data needed per student:**
- Full name
- Employee/Student ID
- Class (1-12) and Section (A, B, C, D)
- At least 1 clear face photo (3 angles recommended for accuracy)
- Parent phone number (for WhatsApp notifications)

---

## Phase 4: Device Setup

### Dedicated Cameras (Gate Mode)
1. Connect a webcam or IP camera to a laptop at each school entrance.
2. Open the app → navigate to **Gate Mode** (`/gate-mode`).
3. Select the gate name and start the session.
4. The system runs continuous face scanning — auto-marks attendance as students enter.
5. Unrecognized faces trigger a **Stranger Alert**.

### Teacher Phones (Classroom Mode)
1. Teachers open the app on their phone browser.
2. Navigate to **Attendance** → use the camera to scan the classroom.
3. The multi-face scanner detects and marks all visible students simultaneously.
4. Works offline — syncs when connectivity returns.

**Tip:** Install the PWA (the app will prompt "Add to Home Screen") for a native app-like experience on phones.

---

## Phase 5: Configure Notifications

Already set up:
- **WhatsApp** (via Meta Business API — secrets configured)
- **Email** (via Resend — secret configured)

**Action needed:**
- Ensure each student's profile has `parent_phone` filled (with country code, e.g., `+91XXXXXXXXXX`).
- Set the **attendance cutoff time** in Admin → Settings (e.g., 8:30 AM — arrivals after this are marked "late").
- Enable **auto-notifications** in Admin → Settings so parents receive instant WhatsApp messages when their child is marked present/late/absent.

---

## Phase 6: Daily Operations Workflow

```text
Morning:
  Gate cameras auto-scan → attendance marked → parents notified via WhatsApp

During school:
  Teachers can take classroom attendance via phone camera
  Late entries logged automatically

End of day:
  Admin reviews dashboard → export reports → identify absentees
  Auto-notifications sent for absent students
```

---

## Phase 7: Ongoing Management

| Task | Where |
|------|-------|
| View real-time attendance | Admin → Dashboard |
| Check class-wise breakdown | Admin → Sections |
| Generate reports | Admin → Reports |
| Export attendance data | Admin → Export (sidebar) |
| View notification delivery | Admin → Delivery Log |
| Manage holidays | Features → Holiday Calendar |
| Handle visitors | Features → Visitor Management |

---

## Implementation Steps (Technical)

No code changes are needed — the system is fully built. The steps are:

1. **Publish the app** (I can do this now)
2. **Set up admin accounts** (sign up + role promotion)
3. **Bulk register students** (PDF import or ID card batch extract)
4. **Add parent phone numbers** to student profiles
5. **Configure cutoff time and auto-notifications**
6. **Set up gate mode on entrance devices**
7. **Train teachers** on using the phone-based attendance

Would you like me to start with publishing the app, or help with any specific phase first?

