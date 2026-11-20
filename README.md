# Gatherly — AI-Powered Event Staffing Copilot

> **Tagline:** Better teams. Better events.  
> **Course / Project:** INSY 3331  
> **Mission:** Gatherly is an AI-powered event staffing copilot designed specifically for student organizations to help club officers spend less time organizing volunteers and avoid problems like last-minute cancellations and understaffed events.

---

## 🚀 Quick Start

### Option 1: 1-Click Launch (Windows)
Double-click `run.bat` in the project root. This starts the Python server and opens `http://localhost:8000` in your default browser.

### Option 2: Command Line
```bash
python server.py
# or
py server.py
```
Then navigate to: [http://localhost:8000](http://localhost:8000)

### Option 3: Direct Static File
If Python is not available, simply open `index.html` directly in any modern web browser (Chrome, Edge, Firefox, Safari). The app automatically falls back to local storage and in-browser state with full interactivity.

---

## 🌟 Features Implemented in Iteration 1

### 1. Persistent Sidebar Navigation
- **Dashboard:** Operations center with high-level metrics and alerts.
- **My Events:** Event catalogue with date, time, expected attendees, progress bars, and event creation modal.
- **Volunteers:** Volunteer directory with verified skills chips, availability schedule, hours limit, and assignment status.
- **Staffing:** Detailed staffing matrix with role breakdowns, required headcount, assigned student volunteers, remaining vacancies, and collision-checked assignment workflows.
- **AI Copilot:** Core architecture and grounding framework (ratio estimation models, data-backed heuristics, zero hallucinations).
- **Reports:** Post-event staffing outcome metrics and fulfillment audits.
- **Settings:** Chapter profile, officer in charge, and status color threshold configurations.

### 2. Operations Dashboard
- **Upcoming Events:** Real-time count of active upcoming events.
- **Total Volunteers:** Headcount of registered student volunteers.
- **Open Staffing Positions:** Real-time calculation of unfilled role vacancies.
- **Staffing Coverage Percentage:** Live percentage gauge with dynamic status color badges.
- **Recent Staffing Alerts:** Categorized by severity (🔴 Red for urgent shortages, 🟡 Amber for partial coverage, 🟢 Green for fully staffed).
- **Upcoming Events Quick Roster:** Instant view of upcoming events with direct link to manage staffing.

### 3. Event Management (`My Events`)
- View all events with tags, dates, venues, attendee estimates, and role quotas.
- Search by keyword or filter by Upcoming/Past.
- **Create Event Modal:** Add event with title, category, date, time, location, expected attendance, description, and dynamic volunteer roles builder.

### 4. Volunteer Management
- Search by name, major, email, or skill.
- Filter by skill categories and assignment status (Available vs Assigned).
- **Register Volunteer Modal:** Form to add volunteers with verified skills, contact details, major, and weekly availability.

### 5. Staffing Matrix & Assignment Engine
- Switch between scheduled events.
- Role-by-role quota visualization (Required vs Assigned vs Remaining Openings).
- Visual capacity progress bar with Gatherly status color tokens:
  - 🟢 **Green:** 100% staffed.
  - 🟡 **Amber:** 50% - 99% partial coverage.
  - 🔴 **Red:** <50% or 0 volunteers (urgent shortage).
- **Assign Volunteer Workflow:** Suggests volunteers, prioritizes matching skills, and **blocks overlapping/conflicting assignments in the same event**.
- **Unassign Volunteer:** One-click removal of volunteers from roles with instant recalculation of metrics.

---

## 🎨 Design System
- **Primary Colors:** Dark Navy (`#0F172A`, `#1E293B`) & Eccentric Blue (`#2563EB`, `#3B82F6`).
- **Surfaces:** Crisp white (`#FFFFFF`) with light gray contrast backgrounds (`#F8FAFC`, `#F1F5F9`).
- **Status Color Code:**
  - 🟢 Green: Complete staffing.
  - 🟡 Amber: Staffing warnings / partial coverage.
  - 🔴 Red: Urgent staffing shortages / critical gaps.
- **Aesthetic:** Clean, modern SaaS aesthetic with rounded cards, responsive mobile sidebar, and high-readability typography.

---

## 🧪 Architecture & Technologies
- **Frontend:** Vanilla HTML5, modern CSS3 (Custom Properties & Flexbox/Grid), ES6+ JavaScript modules.
- **Backend:** Python 3 standard library (`http.server`, `json`, `urllib`) — Zero external pip dependencies required.
- **Data Layer:** Hybrid API (`/api/data`, `/api/events`, `/api/volunteers`, `/api/staffing/assign`, `/api/staffing/unassign`) with automated `localStorage` resilience.
