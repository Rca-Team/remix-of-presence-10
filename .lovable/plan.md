

# Full School Automation Plan for India

## Overview

Transform Presence into a complete India-specific school automation platform with practical features like **Gate Mode** (continuous entry scanning), **Assembly Bell System**, **Late Comer Gate Log**, **Parent SMS via Indian gateways**, **Holiday Calendar (Indian)**, and more. This makes it a truly unique, deployment-ready product for Indian schools.

---

## New Features to Build

### 1. Gate Mode - Continuous Entry Detection
A dedicated full-screen mode designed for a tablet/camera at the school gate that continuously scans faces as students walk through, auto-marking attendance without any user interaction.

- New page: `/gate-mode` - full-screen, no navbar, optimized for mounted devices
- Continuous camera feed with auto-detection loop (no button press needed)
- Large visual + audio feedback (green flash = recognized, red = unknown)
- Auto-records attendance with entry timestamp
- Shows running count: "142/350 students entered"
- Alerts for unregistered faces (stranger detection)
- Works offline, syncs when connected

### 2. Late Comer Gate Log
- Students arriving after assembly/cutoff get a special "late entry" screen
- Captures photo + timestamp + reason (dropdown: traffic, medical, personal)
- Requires parent SMS confirmation for repeated latecomers
- Admin report: chronic late-comer list with patterns

### 3. Assembly Attendance Mode
- Quick whole-school scan during morning assembly
- Camera sweeps across rows, counts and identifies in real-time
- Shows "Missing from Assembly" list instantly
- Integrates with class-wise reporting

### 4. Indian SMS/WhatsApp Notifications
- Integration-ready for Indian SMS gateways (MSG91, Textlocal, Fast2SMS)
- WhatsApp Business API notification templates
- Hindi + English bilingual message templates
- Messages: "आपका बच्चा [Name] स्कूल पहुंच गया है। समय: [Time]"
- Parent notification for: arrival, late, absent, early departure

### 5. Indian Academic Calendar & Holiday System
- Pre-loaded Indian holidays (Republic Day, Independence Day, Diwali, Holi, etc.)
- State-wise holiday support (different states have different holidays)
- Exam period marking (no attendance required)
- Half-day / Saturday schedule support
- Auto-skip attendance on holidays

### 6. Smart Alert System
- **Stranger Alert**: Unknown face detected at gate → instant admin notification
- **Absentee Alert**: Student absent 3+ consecutive days → auto-call parents
- **Early Departure Alert**: Student leaves before school ends
- **Unauthorized Zone Alert**: Student in restricted area
- **Emergency Broadcast**: One-tap alert to all staff phones

### 7. Multi-Gate Support
- Configure multiple gates (Main Gate, Back Gate, Bus Gate)
- Track which gate student entered from
- Separate camera feeds per gate
- Consolidated entry report

### 8. Student Diary / Circular System
- Digital circulars sent to parents via push notification
- Homework diary entries by teachers
- Parent acknowledgment tracking
- Fee reminder notifications

### 9. Transport Tracking (India-specific)
- Auto-rickshaw / van / bus tracking
- Student pickup/drop verification via face scan
- Driver attendance tracking
- Route-wise student listing
- "Student reached home" confirmation

### 10. Fee Reminder Integration
- Connect attendance with fee status
- Show fee-defaulter badge (admin-only visibility)
- Auto-reminder SMS to parents with pending fees
- Block features for chronic defaulters (admin configurable)

---

## Technical Implementation Plan

### Database Changes (Migration)
```sql
-- Gate mode sessions
CREATE TABLE gate_sessions (id, gate_name, started_at, ended_at, 
  total_entries, unknown_entries, device_info, started_by);

-- Gate entry log (every single entry)
CREATE TABLE gate_entries (id, student_id, gate_session_id, 
  entry_time, entry_type [entry/exit], photo_url, 
  is_recognized, confidence, gate_name);

-- Late entry reasons
CREATE TABLE late_entries (id, student_id, entry_time, 
  reason, parent_notified, photo_url, notes);

-- Indian holidays
CREATE TABLE school_holidays (id, name, name_hindi, date, 
  holiday_type [national/state/school], state, is_half_day);

-- Circulars
CREATE TABLE circulars (id, title, content, created_by, 
  target_categories, sent_at, acknowledgments_count);

-- SMS/notification log
CREATE TABLE notification_log (id, recipient_phone, 
  message_template, language, status, gateway_response, 
  sent_at, notification_type);

-- Multi-gate config
CREATE TABLE school_gates (id, name, location, camera_id, 
  is_active, gate_type [main/back/bus]);
```

### New Pages & Components

| Route | Component | Purpose |
|-------|-----------|---------|
| `/gate-mode` | `GateMode.tsx` | Full-screen continuous scanning |
| `/gate-mode/setup` | `GateModeSetup.tsx` | Configure gate before starting |

### New Components
- `src/components/gate/GateModeScanner.tsx` - Continuous auto-scan engine
- `src/components/gate/GateEntryFeedback.tsx` - Large visual/audio feedback
- `src/components/gate/GateStatsOverlay.tsx` - Running entry count overlay
- `src/components/gate/StrangerAlert.tsx` - Unknown face alert popup
- `src/components/gate/LateEntryForm.tsx` - Late reason capture form
- `src/components/alerts/SmartAlertSystem.tsx` - Centralized alert manager
- `src/components/alerts/StrangerDetectionAlert.tsx` - Stranger notification
- `src/components/alerts/AbsenteeTracker.tsx` - Consecutive absence tracker
- `src/components/features/IndianHolidayCalendar.tsx` - Holiday management
- `src/components/features/CircularSystem.tsx` - Digital circular/diary
- `src/components/features/SMSNotificationConfig.tsx` - SMS gateway config

### New Edge Functions
- `supabase/functions/gate-entry-processor/index.ts` - Process gate entries, determine late/on-time, trigger parent SMS
- `supabase/functions/stranger-alert/index.ts` - Send instant admin alerts for unrecognized faces
- `supabase/functions/absence-tracker/index.ts` - Daily job to find consecutive absentees and alert parents
- `supabase/functions/send-indian-sms/index.ts` - SMS gateway integration (MSG91/Fast2SMS)

### Gate Mode Technical Details
- Uses existing `TurboRecognitionService` for GPU-accelerated continuous scanning
- Detection loop runs at 5 FPS (sufficient for walking speed)
- Audio feedback using Web Audio API (beep on recognition)
- Fullscreen API for kiosk-style deployment
- Wake Lock API to prevent screen sleep
- Service Worker for offline gate operation

### Feature Access Map

| Feature | Where to Access | Who Can Use |
|---------|----------------|-------------|
| Gate Mode | `/gate-mode` (new route) | Admin/Teacher |
| Late Entry Log | Admin Panel → new tab | Admin |
| Stranger Alerts | Real-time push notifications | Admin |
| Holiday Calendar | Features → new tab | All users |
| Circulars | Features → new tab | Admin (create), All (view) |
| SMS Config | Admin Panel → Settings | Admin |
| Assembly Mode | Attendance → new tab | Admin/Teacher |
| Multi-Gate | Admin Panel → Gates | Admin |
| Alert Dashboard | Admin Panel → Alerts | Admin |

---

## What Makes This Different from Competitors

1. **Gate Mode** - No other Indian attendance app offers continuous walk-through detection
2. **Stranger Detection** - Security feature unique to Presence
3. **Bilingual SMS** - Hindi + English parent notifications
4. **Indian Holiday Presets** - State-wise holiday awareness
5. **Offline Gate Operation** - Works without internet, syncs later
6. **Assembly Mode** - Mass scanning for morning assembly
7. **Multi-Gate Tracking** - Know which gate each student used
8. **Late Reason Capture** - Structured late-comer management with photo proof

---

## Implementation Order

**Batch 1** (Core Differentiators):
- Gate Mode page + continuous scanner
- Stranger detection alerts
- Late entry form with reason capture

**Batch 2** (India-Specific):
- Indian holiday calendar with presets
- Bilingual SMS templates + gateway integration
- Assembly attendance mode

**Batch 3** (Advanced):
- Multi-gate support
- Circular/diary system
- Smart alert dashboard (consecutive absence, early departure)
- Fee reminder integration

