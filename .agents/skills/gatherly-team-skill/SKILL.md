---
name: gatherly-team-skill
description: >-
  Shared team skill and master specification for Gatherly: product goals, target audience,
  core feature set, design language and color system, AI copilot behaviors and constraints,
  development guidelines, and pre-iteration testing checklist. Use whenever designing,
  building, modifying, or testing any feature of Gatherly.
---

# Gatherly Team Skill

## 1. About our project

Gatherly is an AI-powered event staffing copilot designed for student organizations.

We help club officers spend less time organizing volunteers and avoid problems like last-minute cancellations and understaffed events.

Our goal is to make organizing event teams easier, smarter, and more reliable.

**Tagline:** Better teams. Better events.

## 2. Who will use our app?

Our main users are:
- Student organization event coordinators.
- Club presidents.
- Volunteer coordinators.
- Student volunteers.

The app should be easy to understand, even for someone who has never used it before.

## 3. Main features we want

Our application should include:

- A dashboard showing upcoming events and staffing status.
- A page where organizers can create and manage events.
- Volunteer profiles with skills and availability.
- AI recommendations for assigning volunteers.
- Alerts for positions that still need volunteers.
- A system for finding backup volunteers when someone cancels.
- Event-day volunteer check-in.
- Reports showing how staffing went after an event.

## 4. How we want the app to look

We want Gatherly to look like a modern website rather than a basic school project.

### Design preferences:
- Clean and simple layout.
- Dark navy and eccentric blue as the main colors.
- White backgrounds and light gray sections.
- Easy-to-read text.
- Rounded cards and buttons.
- Interactive elements.
- **Status colors:**
  - Green for completed staffing.
  - Amber for staffing warnings.
  - Red for urgent staffing problems.
- Consistent spacing throughout the app.
- A sidebar for navigating between pages.
- Responsive design for phones and computers.

Avoid cluttered layouts and unnecessary animations.

## 5. How the AI should work

The AI copilot should help organizers:
- Decide how many volunteers are needed for each role.
- Identify positions that are understaffed.
- Find possible replacements for volunteers who cancel.
- Recommend volunteers based on their availability and skills.
- Explain why it is recommending certain assignments.

### Important:
- Recommendations should be based on actual application data or clearly labeled sample data.
- Organizers should be able to edit AI suggestions.
- Never assume a volunteer accepted an assignment without their confirmation.
- Do not invent volunteer availability or skills.

## 6. Development guidelines

Whenever making changes to Gatherly:

1. Look at the existing project before changing anything.
2. Keep the same design and overall structure.
3. Reuse existing components when possible.
4. Make sure buttons and forms actually work.
5. Use sample data when real data is unavailable.
6. Make sure the app works on desktop and mobile.
7. Do not remove features that are already working.
8. Keep the code organized and easy for teammates to understand.

## 7. Testing checklist

Before finishing a build iteration, check:

- Does the application run?
- Does the navigation work?
- Do buttons perform their intended actions?
- Can users create and manage events?
- Are staffing numbers accurate?
- Can volunteers sign up for shifts?
- Does the app prevent overlapping assignments?
- Are staffing alerts displayed correctly?
- Does the design look consistent across pages?

Fix any major problems before considering the iteration complete.

## 8. Team rule

Every team member must read and follow this skill before leading their own build iteration.

Everyone should follow the same design preferences, product goals, and development guidelines so that Gatherly feels like one application instead of different projects put together.
