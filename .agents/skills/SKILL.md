name: gatherly-team-skill description: >- Shared team skill for Gatherly. Explains our project goals, main features, design preferences, AI behavior, security rules, coding guidelines, and testing checklist. Use this skill whenever building, changing, fixing, or testing anything in Gatherly.
Gatherly Team Skill
1. About Our Project
Gatherly is an AI-powered event staffing app made for student organizations.

The goal of Gatherly is to help club officers spend less time organizing volunteers and make sure their events have enough people to help.

We want to solve problems like:

Not having enough volunteers for an event.
Volunteers canceling at the last minute.
Having trouble finding replacements.
Not knowing which positions still need people.
Spending too much time organizing schedules.
Our goal is to make organizing events easier, faster, and more reliable.

Our tagline: Better teams. Better events.

2. Who Will Use Our App?
Our main users are:

Student organization event coordinators.
Club presidents.
Volunteer coordinators.
Student volunteers.
The app should be easy to understand, even for someone who has never used it before.

We want users to be able to figure out how everything works without needing a lot of instructions.

3. Main Features We Want
Our application should include the following features:

Dashboard
Show upcoming events.
Show how many volunteers are needed.
Display staffing progress.
Show important alerts.
Make it easy to access different parts of the app.
Event Management
Allow organizers to create and edit events.
Add event dates, times, and locations.
Create different volunteer positions.
Track how many volunteers are assigned to each event.
Show which positions still need volunteers.
Volunteer Profiles
Allow volunteers to create profiles.
Show volunteer skills and qualifications.
Track volunteer availability.
Show their upcoming assignments.
AI Recommendations
Recommend volunteers based on their skills and availability.
Help organizers figure out how many volunteers they need.
Identify positions that are understaffed.
Suggest backup volunteers when someone cancels.
Explain why the AI recommends certain volunteers.
Alerts and Notifications
Alert organizers when an event needs more volunteers.
Notify organizers about cancellations.
Show upcoming staffing problems.
Send reminders about assignments when appropriate.
Backup Volunteers
Help organizers find replacements when volunteers cancel.
Recommend people who are available and qualified.
Allow organizers to approve replacements.
Event Check-In
Allow volunteers to check in when they arrive.
Help organizers see who has arrived.
Track attendance.
Reports
Show how well events were staffed.
Track volunteer attendance.
Show cancellations.
Help organizers understand what went well and what could improve.
4. How We Want the App to Look
We want Gatherly to look like a modern website instead of a basic school project.

Design Preferences
Clean and simple layouts.
Dark navy and eccentric blue as the main colors.
White backgrounds and light gray sections.
Easy-to-read text.
Rounded cards and buttons.
Interactive elements.
Consistent spacing throughout the app.
A sidebar for navigating between pages.
Responsive design for phones, tablets, and computers.
Status Colors
Green for completed staffing.
Amber for staffing warnings.
Red for urgent staffing problems.
Avoid cluttered layouts, unnecessary animations, and too many colors.

Keep the design consistent across every page so the app feels like one complete product.

5. How We Want the AI to Work
The AI copilot should help organizers make better staffing decisions.

It should:

Recommend volunteers based on their skills and availability.
Help identify positions that need more people.
Suggest possible replacements when someone cancels.
Explain why it recommends certain volunteers.
Help organizers understand staffing problems.
Important AI Rules
AI recommendations must use actual application data or clearly labeled sample data.
Never make up volunteer skills or availability.
Never pretend a volunteer accepted an assignment when they have not.
Organizers should be able to review and change AI recommendations.
The AI should explain when it does not have enough information.
AI-generated information should be checked before it is saved.
The AI should help people make decisions, not make every decision for them.

It must not independently confirm assignments, cancel shifts, change important event information, or send messages without the proper approval.

6. Security Rules
Security is very important because Gatherly will store information about student organizations and volunteers.

Always follow these rules when working on the app.

Account Security
Make sure users have to log in to access private parts of the app.
Never store passwords as plain text.
Use a trusted authentication system.
Make sure users can only access features they have permission to use.
Do not rely only on hiding buttons to protect private features.
Protecting User Information
Do not expose private volunteer information.
Do not allow one organization to see another organization's private information.
Only collect information that the app actually needs.
Do not show passwords, private tokens, or other sensitive information in error messages or logs.
Keep private information out of places where everyone can access it.
Protecting the Code
Never put API keys or passwords directly into frontend code.
Store secret information in environment variables.
Never upload real secret keys or passwords to GitHub.
Use a .env.example file with fake example values instead of real credentials.
Check user input before saving it.
Protect the app from common security problems like SQL injection and cross-site scripting.
Use secure database queries.
Make sure private API requests are protected.
Database Security
Make sure users can only access records they are allowed to see.
Check that organizers can only manage their own organizations and events.
Use database security rules, such as row-level security (RLS), when supported.
Do not trust information sent from the frontend without checking it on the backend.
Prevent users from changing records that do not belong to them.
For example, Club A should never be able to access Club B's private volunteer profiles or event information.

Third-Party Services
Keep AI API keys on the backend.
Do not send unnecessary private information to AI services.
Check AI-generated information before using or saving it.
Never allow AI-generated responses to bypass security rules.
Handle third-party service errors without breaking the rest of the app.
7. Development Guidelines
Whenever making changes to Gatherly, follow these steps.

Before Making Changes
Look through the existing project first.
Understand how the current files and folders are organized.
Check which features already exist.
Look at existing components before creating new ones.
Understand how the database and authentication currently work.
Do not treat the project like a brand-new app every time you make a change.

While Making Changes
Keep the same overall design and structure.
Reuse existing components when possible.
Make sure buttons and forms actually work.
Keep the code organized and easy for teammates to understand.
Make sure new features work with existing features.
Use sample data when real data is not available.
Make sure the app works on desktop and mobile.
Follow the security rules in this skill.
Protect Existing Work
Do not remove features that are already working.
Do not rewrite large parts of the app unless necessary.
Do not delete important files without checking first.
Do not overwrite environment files.
Do not reset or delete database information without permission.
Before making major changes, explain what you plan to change.
Make sure there is a way to recover important work before risky changes.
If something is unclear, ask before making a change that could cause problems.

8. Database and Staffing Rules
The staffing information in Gatherly needs to be accurate.

Always make sure:

Volunteers cannot be assigned to overlapping shifts.
Volunteer availability is checked before confirming an assignment.
Volunteers have the required skills for positions when qualifications are required.
Canceled assignments are not counted as confirmed volunteers.
Staffing numbers update when assignments change.
Duplicate assignments are prevented.
Event and volunteer information stays connected correctly.
Keep track of different assignment statuses, such as:

Recommended.
Pending.
Confirmed.
Canceled.
Completed.
Make sure the app handles situations where two people try to claim the same position at the same time.

9. Testing the App
Before finishing any development task, test the changes.

General Testing
Does the application run?
Does navigation work?
Do buttons perform their intended actions?
Do forms work correctly?
Can organizers create and manage events?
Can volunteers create and update profiles?
Can volunteers sign up for shifts?
Are staffing numbers accurate?
Does the app prevent overlapping assignments?
Do alerts appear correctly?
Does check-in work?
Security Testing
Do private pages require users to log in?
Can users access only the information they are allowed to see?
Can one organization access another organization's private data?
Are passwords and API keys protected?
Is user input checked before being saved?
Are database permissions set up correctly?
Are private details hidden from error messages?
AI Testing
Does the AI use real or clearly labeled sample data?
Does it avoid making up volunteer information?
Does it explain its recommendations?
Does it require approval before making important changes?
Does the app still work if the AI service stops working?
Design Testing
Does the app look good on desktop?
Does it work on mobile?
Are buttons and text easy to read?
Are colors and spacing consistent?
Are loading and error messages displayed correctly?
If something does not work, try to fix it before considering the task finished.

Never say something was tested successfully if it was not actually tested.

10. Deployment Rules
Before putting Gatherly online:

Make sure all environment variables are set up correctly.
Check that API keys and passwords are not exposed.
Make sure debug mode is turned off in production.
Test login and permissions.
Check database security settings.
Make sure the app uses HTTPS.
Check for known security problems in dependencies.
Test important features before releasing the app.
Make sure important data can be recovered through backups.
Never deploy with known critical security problems.

Never reset a production database or delete important user information without approval and a recovery plan.

11. Final Checklist Before Finishing a Task
Before saying a development task is complete, check the following:

Application
The app runs correctly.
The requested feature works.
Existing features still work.
Navigation works.
Desktop and mobile layouts work.
Functionality
Buttons and forms work.
Staffing numbers are accurate.
Volunteers cannot have conflicting assignments.
Alerts work correctly.
Errors are handled properly.
Security
Login is required for private features.
Users can only access information they are allowed to see.
Private information is protected.
API keys and passwords are not exposed.
Database permissions are correct.
User input is checked.
AI
Recommendations use correct information.
AI does not make up volunteer details.
Organizers approve important actions.
AI errors do not break the rest of the app.
Testing
New features have been tested.
Existing features have been checked.
Any known problems are documented.
After finishing a task, provide a short summary explaining:

What was changed.
Which files were updated.
What was tested.
Whether anything is still not working.
Whether any security problems were found.
