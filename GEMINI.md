# Gatherly Team Guidelines & Rules

> **Tagline:** Better teams. Better events.  
> **Mission:** Gatherly is an AI-powered event staffing copilot designed for student organizations to help club officers spend less time organizing volunteers and avoid problems like last-minute cancellations and understaffed events.

---

## 1. Target Audience & Users
- Student organization event coordinators
- Club presidents
- Volunteer coordinators
- Student volunteers
*The app must be immediately intuitive even for first-time users.*

---

## 2. Core Feature Requirements
1. **Dashboard:** Upcoming events and live staffing status.
2. **Event Management:** Create, edit, and organize events and roles.
3. **Volunteer Profiles:** Track skills, interests, and availability.
4. **AI Recommendations:** Intelligent matching of volunteers to positions based on skills/availability with explicit reasoning.
5. **Staffing Alerts:** Proactive warnings for roles that still need volunteers.
6. **Cancellation & Backup System:** Rapid replacement workflow for volunteer dropouts.
7. **Event-Day Check-in:** Real-time volunteer check-in on event day.
8. **Post-Event Reports:** Staffing outcome analytics and retrospective metrics.

---

## 3. Design System & Aesthetics
Gatherly must look like a polished, modern product rather than a basic school project.

- **Primary Palette:** Dark navy and eccentric blue.
- **Backgrounds:** Crisp white backgrounds with light gray section contrast.
- **Typography:** High readability, clean visual hierarchy.
- **UI Elements:** Rounded cards, modern buttons, interactive elements, consistent padding/margins.
- **Status Color Code:**
  - 🟢 **Green:** Completed staffing.
  - 🟡 **Amber:** Staffing warnings / partial coverage.
  - 🔴 **Red:** Urgent staffing shortages / critical gaps.
- **Layout:** Persistent navigation sidebar, fully responsive layout (mobile & desktop).
- **Aesthetic Rule:** Avoid cluttered layouts and unnecessary animations.

---

## 4. AI Copilot Principles & Boundaries
- **Capabilities:**
  - Estimate volunteer requirements per role.
  - Detect understaffed positions and alert organizers.
  - Propose backup candidates when volunteers cancel.
  - Recommend volunteers matching skills and schedules.
  - Explain the reasoning behind every suggested match.
- **Strict Guardrails:**
  - Ground all recommendations in actual application data or clearly labeled sample data.
  - Never invent volunteer availability or skills.
  - Organizers must always be able to review, override, or edit AI suggestions.
  - Never assume a volunteer accepted an assignment without explicit confirmation.

---

## 5. Development Guidelines
1. **Inspect First:** Check existing project code and patterns before modifying anything.
2. **Design Continuity:** Maintain established layout, color tokens, and structure.
3. **Component Reuse:** Reuse existing components instead of duplicating code.
4. **Functionality:** Every button, modal, form, and link must be functional.
5. **Realistic Mock Data:** Use realistic sample data when backend/live data is unavailable.
6. **Responsiveness:** Test on both desktop and mobile viewports.
7. **Preserve Working Features:** Never regress or remove previously working features.
8. **Code Cleanliness:** Keep code modular, well-commented, and readable for teammates.

---

## 6. Pre-Commit / Iteration Testing Checklist
Before concluding any build iteration, verify:
- [ ] Does the application run without errors?
- [ ] Does navigation between pages work smoothly?
- [ ] Do all buttons and interactive elements perform their intended actions?
- [ ] Can users create and manage events successfully?
- [ ] Are staffing calculations and quotas accurate?
- [ ] Can volunteers sign up for shifts?
- [ ] Does the app prevent overlapping/conflicting assignments?
- [ ] Are staffing status alerts (Green/Amber/Red) displayed accurately?
- [ ] Does the UI render consistently across both desktop and mobile?

---

## 7. Team Rule
Every team member and AI assistant working in this repository must adhere to this document and the `gatherly-team-skill` (`.agents/skills/gatherly-team-skill/SKILL.md`) so that Gatherly feels like one unified, cohesive application.
