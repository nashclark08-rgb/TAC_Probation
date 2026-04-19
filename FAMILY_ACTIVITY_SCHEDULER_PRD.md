# Product Requirements Document
## Family Activity Scheduler — Web Application

**Version:** 1.0  
**Date:** April 2026  
**Status:** Draft

---

## 1. Overview

A mobile-first web application that helps busy families coordinate after-school activities across multiple children. The app enables parents and caregivers to schedule activities, assign drop-off and pick-up responsibilities to adults, and notify those adults directly through the app. It replaces group chats, spreadsheets, and verbal coordination with a single source of truth.

---

## 2. Goals

- Eliminate scheduling conflicts and missed pickups for families with multiple children in multiple activities.
- Ensure every allocated adult receives a timely notification of their responsibility.
- Give the family a clear at-a-glance view of the week ahead.
- Record and explain any absences so the history remains accurate.

---

## 3. Non-Goals (v1.0)

- Integration with external calendars (Google Calendar, Apple Calendar) — future release.
- Public sharing or inviting other families — single family use only.
- Payment or financial tracking for activity fees.
- Automatic routing / navigation to venues.

---

## 4. Users

| Role | Description |
|------|-------------|
| **Family Admin** | The parent who sets up and maintains the app (children, sports, venues, adults). |
| **Allocated Adult** | Any adult (parent, grandparent, carer) who receives drop-off / pick-up assignments and views notifications on their phone. |

All users access the same family account. There is no separate login per adult in v1.0 — notifications are delivered via the web app to devices that have it open or installed as a PWA.

---

## 5. Tech Stack Recommendation

Given the existing codebase (Next.js, TypeScript, Tailwind CSS, Prisma + PostgreSQL, Vercel):

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Database | PostgreSQL via Prisma ORM |
| Notifications | Web Push API (PWA) + in-app notification feed |
| Hosting | Vercel |
| PWA / iOS | `next-pwa` manifest, `apple-touch-icon`, viewport meta tag |

The app should be installable as a **Progressive Web App (PWA)** on iOS via Safari "Add to Home Screen" so it behaves like a native app.

---

## 6. Feature Requirements

### 6.1 Setup / Configuration Page

**Purpose:** One-time (and ongoing) configuration of the family's data.

#### 6.1.1 Children Management
- Add, edit, and delete children by first name (or nickname).
- Each child has a display colour used in the calendar views.

#### 6.1.2 Sports / Activities Management
- User-defined list of sports and activities (e.g. "Soccer", "Swimming", "Piano").
- Add, rename, and delete activities from a management screen.
- Activities appear as a dropdown when creating a scheduled session.

#### 6.1.3 Venues Management
- User-defined list of venues (name + optional short address or note).
- Add, rename, and delete venues.
- Venues appear as a dropdown when creating a session.

#### 6.1.4 Adults Management
- Add adults by name and a contact label (e.g. "Mum", "Dad", "Grandma").
- Each adult has a device token or is associated with a browser session for push notifications.
- Delete or deactivate adults.

#### 6.1.5 Recurring Session Templates
- From the setup page the admin can define a recurring weekly pattern for each child:
  - Child → Activity → Venue → Day of week → Start time → End time.
  - Sessions auto-populate the calendar going forward.
  - Templates can be edited or deleted; changes apply from a chosen date forward.

---

### 6.2 Scheduling a Session

A session is a single occurrence of a child attending an activity.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Child | Dropdown | Yes | From children list |
| Activity | Dropdown | Yes | From activities list |
| Venue | Dropdown | Yes | From venues list |
| Date | Date picker | Yes | |
| Start time | Time picker | Yes | |
| End time | Time picker | Yes | |
| Drop-off adult | Dropdown | Yes | From adults list |
| Pick-up adult | Dropdown | Yes | From adults list; may be same as drop-off |
| Notes | Text (optional) | No | E.g. "Bring shin guards" |

Sessions can be added:
- Manually (one-off) from any calendar view via a "+" button.
- Automatically from a recurring template (see 6.1.5).

---

### 6.3 Adult Notifications

When a drop-off or pick-up adult is saved on a session, the system immediately sends them a notification containing:

- Child's name
- Activity name
- Venue name
- Date and time (drop-off or pick-up)
- Any session notes

**Notification delivery:**
- **In-app:** A notification badge and feed visible when the adult opens the app.
- **Push notification (PWA):** Sent via the Web Push API to any device that has granted permission.

If an assignment changes (different adult, time change), the newly assigned adult is notified and the previously assigned adult receives a cancellation notification.

---

### 6.4 Calendar Views

#### 6.4.1 Week View (Default)
- Displays Mon–Sun (or Sun–Sat, configurable).
- Each day column shows all sessions for that day as cards.
- Each session card shows: child name (with colour indicator), activity, venue, start/end time, drop-off adult, pick-up adult.
- Tap a card to view full detail or edit.
- Navigate previous / next week via arrows or swipe gesture.
- "Today" button resets to the current week.

#### 6.4.2 Month View
- A standard monthly grid.
- Sessions appear as compact coloured dots or short labels.
- Tap a day to see a list of that day's sessions.
- Navigate previous / next month via arrows.

#### 6.4.3 Filter / Focus
- Toggle to show only sessions for a specific child.
- Toggle to show only sessions allocated to a specific adult (useful for each adult to check their own duties).

---

### 6.5 Absence Recording

When a child does not attend a planned session:

1. The family admin (or any adult) taps the session and selects **"Mark Absent"**.
2. A **reason is mandatory** before the absence can be saved.
   - Dropdown of common reasons: "Sick", "School event", "Away / Holiday", "Activity cancelled", "Other".
   - If "Other" is selected, a free-text field is required.
3. The session card displays a visual "Absent" indicator (e.g. greyed out with a badge).
4. The allocated drop-off and pick-up adults receive a notification that the session is cancelled.
5. Absence history is retained and visible in session detail.

---

### 6.6 Session Detail View

Tapping any session opens a detail sheet containing:

- All session fields (read-only with an Edit button)
- Drop-off adult name + time
- Pick-up adult name + time
- Absence status and reason (if applicable)
- Notification log (who was notified and when)
- Edit and Delete actions

---

## 7. iOS / Mobile UX Requirements

| Requirement | Detail |
|-------------|--------|
| PWA installable | `manifest.json` with `display: standalone`, `apple-touch-icon`, `apple-mobile-web-app-capable` meta tags |
| Viewport | `width=device-width, initial-scale=1, viewport-fit=cover` to handle iPhone notch |
| Touch targets | Minimum 44×44 pt tap targets (Apple HIG) |
| Swipe gestures | Horizontal swipe to navigate weeks / months |
| Font size | Minimum 16 px for inputs to prevent iOS auto-zoom |
| Bottom navigation | Primary nav in a bottom tab bar (week, month, setup, notifications) |
| Safe areas | CSS `env(safe-area-inset-*)` padding applied to nav bars |
| Offline-capable | Service worker caches the app shell so it opens without connectivity |

---

## 8. Data Model (Prisma Outline)

```prisma
model Child {
  id        String    @id @default(cuid())
  name      String
  colour    String    // hex colour for calendar display
  sessions  Session[]
  createdAt DateTime  @default(now())
}

model Activity {
  id       String    @id @default(cuid())
  name     String
  sessions Session[]
}

model Venue {
  id       String    @id @default(cuid())
  name     String
  note     String?
  sessions Session[]
}

model Adult {
  id           String    @id @default(cuid())
  name         String
  label        String    // "Mum", "Dad", etc.
  pushToken    String?   // Web Push subscription (JSON)
  dropOffs     Session[] @relation("DropOff")
  pickUps      Session[] @relation("PickUp")
}

model Session {
  id            String    @id @default(cuid())
  child         Child     @relation(fields: [childId], references: [id])
  childId       String
  activity      Activity  @relation(fields: [activityId], references: [id])
  activityId    String
  venue         Venue     @relation(fields: [venueId], references: [id])
  venueId       String
  date          DateTime
  startTime     DateTime
  endTime       DateTime
  dropOffAdult  Adult     @relation("DropOff", fields: [dropOffAdultId], references: [id])
  dropOffAdultId String
  pickUpAdult   Adult     @relation("PickUp", fields: [pickUpAdultId], references: [id])
  pickUpAdultId String
  notes         String?
  isAbsent      Boolean   @default(false)
  absenceReason String?
  absenceNote   String?   // free text if reason is "Other"
  templateId    String?   // link back to recurring template if auto-generated
  notifications Notification[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model RecurringTemplate {
  id           String   @id @default(cuid())
  childId      String
  activityId   String
  venueId      String
  dayOfWeek    Int      // 0=Sun … 6=Sat
  startTime    String   // "HH:MM"
  endTime      String
  activeFrom   DateTime
  activeTo     DateTime?
}

model Notification {
  id        String   @id @default(cuid())
  session   Session  @relation(fields: [sessionId], references: [id])
  sessionId String
  adultId   String
  type      String   // "dropoff_assigned" | "pickup_assigned" | "session_cancelled" | "assignment_changed"
  sentAt    DateTime @default(now())
  delivered Boolean  @default(false)
}
```

---

## 9. Page / Route Map

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/calendar/week` |
| `/calendar/week` | Default week view |
| `/calendar/month` | Month view |
| `/session/new` | Create a new one-off session |
| `/session/[id]` | Session detail / edit / absence |
| `/setup` | Main setup hub |
| `/setup/children` | Manage children |
| `/setup/activities` | Manage activities / sports |
| `/setup/venues` | Manage venues |
| `/setup/adults` | Manage adults |
| `/setup/templates` | Manage recurring templates |
| `/notifications` | Notification feed for the current device |

---

## 10. Out-of-Scope Deferred to v2.0

- Multi-family / shared scheduling (e.g. carpooling with another family)
- SMS or email notifications (v1 uses push only)
- Apple / Google Calendar sync
- Activity fee tracking
- Photo attachments on sessions
- Dark mode

---

## 11. Success Metrics (Post-Launch)

- Zero missed pickups attributable to the app within the first month of use.
- All adults confirm they received their notifications within 5 minutes of assignment.
- Setup completes in under 10 minutes for a new family.

---

## 12. Open Questions

1. Should adults be able to **decline** or **swap** an assignment, or is it admin-only?
2. How many weeks ahead should recurring templates auto-generate sessions?
3. Should the app support **multiple family profiles** on one device (e.g. separated parents)?
4. Is there a need to **export** the schedule (PDF / print) for the fridge?
5. Should absence reasons be **customisable** by the admin, or is a fixed list acceptable?

---

*End of PRD v1.0*
