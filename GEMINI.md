# Gatherly Team Skill & Guidelines

> **Tagline:** Better teams. Better events.  
> **Mission:** Gatherly is an AI-powered event staffing app made for student organizations to help club officers spend less time organizing volunteers and make sure their events have enough people to help.

---

## 1. About Our Project
Gatherly solves core student organization staffing problems:
- Not having enough volunteers for an event.
- Volunteers canceling at the last minute.
- Having trouble finding replacements.
- Not knowing which positions still need people.
- Spending too much time organizing schedules.

---

## 2. Target Users
- Student organization event coordinators.
- Club presidents.
- Volunteer coordinators.
- Student volunteers.
*The app must be intuitive and easy to use without requiring extensive instructions.*

---

## 3. Main Features
1. **Dashboard:** Upcoming events, needed volunteers count, staffing progress, important alerts, and quick access.
2. **Event Management:** Create/edit events, dates/times/locations, volunteer positions, assigned counts, and vacancy tracking.
3. **Volunteer Profiles:** Qualifications, skills, availability schedules, and upcoming assignments.
4. **AI Recommendations:** Skill- and availability-based matching, role sizing, understaffing detection, backup candidate replacement, and transparent explanations.
5. **Alerts & Notifications:** Staffing shortage warnings, cancellation notices, and upcoming staffing problem alerts.
6. **Backup Volunteers:** Finding and approving qualified replacements when someone cancels.
7. **Event Check-In:** On-site arrival check-in and attendance tracking.
8. **Reports:** Staffing outcomes, attendance analytics, cancellations, and retrospective metrics.

---

## 4. Design System & Aesthetics
- **Primary Colors:** Dark navy and eccentric blue.
- **Backgrounds:** Crisp white backgrounds with light gray sections.
- **Typography:** High readability, clean visual hierarchy.
- **UI Elements:** Rounded cards, modern buttons, interactive elements, consistent padding/margins.
- **Status Colors:**
  - 🟢 **Green:** Completed staffing.
  - 🟡 **Amber:** Staffing warnings.
  - 🔴 **Red:** Urgent staffing problems.
- **Layout:** Persistent navigation sidebar, responsive design for phones, tablets, and computers.
- **Rule:** Avoid cluttered layouts, unnecessary animations, and excessive colors.

---

## 5. AI Copilot Principles & Boundaries
- AI recommendations must use actual application data or clearly labeled sample data.
- Never make up volunteer skills or availability.
- Never pretend a volunteer accepted an assignment when they have not.
- Organizers must always be able to review, override, and edit AI recommendations.
- The AI must explain when it does not have enough information.
- AI-generated information must be reviewed before saving.
- The AI assists human decision-making; it must NOT independently confirm assignments, cancel shifts, alter critical event details, or send messages without organizer approval.

---

## 6. Security Rules
- **Account Security:** Authentication required for private sections; passwords never stored in plain text; role-based access control.
- **Protecting User Information:** Strict organization isolation (Club A cannot see Club B's data); no PII in logs/errors; minimal data collection.
- **Protecting the Code:** No API keys or credentials in frontend code; use environment variables and `.env.example`; sanitize/validate all input against SQLi and XSS; secure database queries.
- **Database Security:** Enforce row-level security (RLS) / organization-level authorization; validate all data server-side; prevent unauthorized cross-organization record modification.
- **Third-Party Services:** Keep AI API keys on the backend; never send unnecessary private data to AI services; handle service outages gracefully.

---

## 7. Development Guidelines & Protecting Existing Work
- **Inspect First:** Check existing files, components, and patterns before changing anything.
- **Design Continuity:** Maintain established styling, color tokens, and structure.
- **Component Reuse:** Reuse existing components instead of duplicating code.
- **Protect Existing Work:** Do not remove working features, delete critical files, or rewrite large parts of the application unnecessarily.
- **Database Safety:** Do not reset or delete database information without permission.
- **Realistic Sample Data:** Use realistic sample data when live data is unavailable.
- **Responsiveness:** Test on desktop, tablet, and mobile viewports.

---

## 8. Database and Staffing Rules
- Prevent overlapping/conflicting shift assignments.
- Check volunteer availability before confirming assignments.
- Verify required skills for specialized roles.
- Do not count canceled assignments as confirmed.
- Staffing numbers and quotas must update immediately when assignments change.
- Track distinct assignment statuses: `Recommended`, `Pending`, `Confirmed`, `Canceled`, `Completed`.
- Handle concurrent assignment attempts gracefully.

---

## 9. Testing & Quality Assurance
- **General Testing:** App runs, navigation functions, buttons/forms perform intended actions, quotas accurate, conflicts prevented.
- **Security Testing:** Access control verified, tenant isolation maintained, secrets protected.
- **AI Testing:** Real data used, no hallucinated attributes, transparent explanations provided, fail-safe operation.
- **Rule:** Never claim something was tested successfully if it was not actually tested.

---

## 10. Deployment Rules
- Verify environment variables, secrets protection, HTTPS, and production error handling before release.
- Never deploy with known critical security vulnerabilities.

---

## 11. Final Summary Structure
Every development turn must conclude with a concise summary stating:
1. What was changed.
2. Which files were updated.
3. What was tested.
4. Whether anything is still not working.
5. Whether any security problems were found.
