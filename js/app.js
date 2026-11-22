/**
 * Gatherly - Main Application Coordinator
 * Handles Modals, Form Submissions, Notifications, and Event Dispatch
 */

const App = {
  activeModal: null,

  async init() {
    // Initialize Router
    AppRouter.init();

    // Setup sidebar navigation clicks
    document.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const route = item.dataset.route;
        if (route) {
          AppRouter.navigate(route);
        }
      });
    });

    // Close modal on Escape key
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.activeModal) {
        this.closeModal();
      }
    });

    // Update quick stats in topbar
    await this.updateQuickPills();
  },

  async updateQuickPills() {
    try {
      const stats = await GatherlyStorage.getStats();
      const openCountEl = document.getElementById("topbar-open-count");
      const coverageEl = document.getElementById("topbar-coverage-pct");
      if (openCountEl) openCountEl.textContent = `${stats.openPositions} Open Slots`;
      if (coverageEl) coverageEl.textContent = `${stats.coveragePercentage}% Staffed`;
    } catch (e) {}
  },

  goToEventStaffing(eventId) {
    StaffingView.selectedEventId = eventId;
    AppRouter.navigate("staffing");
  },

  goToEventCopilot(eventId) {
    CopilotView.selectedEventId = eventId;
    CopilotView.draftPlan = null;
    CopilotView.lastLoadedEventId = null;
    AppRouter.navigate("copilot");
  },

  toggleMobileSidebar() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (sidebar) sidebar.classList.toggle("open");
    if (backdrop) backdrop.classList.toggle("show");
  },

  closeMobileSidebar() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("show");
  },

  /* ========================================================================
     MODAL CONTROLLERS
     ======================================================================== */
  openModal(modalHtml) {
    const container = document.getElementById("modal-container");
    if (!container) return;
    container.innerHTML = modalHtml;
    const backdrop = container.querySelector(".modal-backdrop");
    if (backdrop) {
      setTimeout(() => backdrop.classList.add("open"), 10);
      this.activeModal = backdrop;
    }
  },

  closeModal() {
    const container = document.getElementById("modal-container");
    if (!container) return;
    const backdrop = container.querySelector(".modal-backdrop");
    if (backdrop) {
      backdrop.classList.remove("open");
      setTimeout(() => {
        container.innerHTML = "";
        this.activeModal = null;
      }, 200);
    }
  },

  // 1. CREATE EVENT MODAL
  openCreateEventModal() {
    const modalHtml = `
      <div class="modal-backdrop" onclick="if(event.target === this) App.closeModal()">
        <div class="modal-box">
          <div class="modal-header">
            <h3><span>➕</span> Create Student Event</h3>
            <button class="modal-close-btn" onclick="App.closeModal()">&times;</button>
          </div>
          <form id="create-event-form" onsubmit="App.handleCreateEventSubmit(event)">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Event Title *</label>
                <input type="text" name="title" class="form-control" placeholder="e.g. Spring Tech Symposium 2026" required />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Event Category</label>
                  <select name="category" class="form-control">
                    <option value="Conference">Conference</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Networking">Networking Mixer</option>
                    <option value="Community Outreach">Community Outreach</option>
                    <option value="Social">Social / Celebration</option>
                    <option value="Workshop">Hands-on Workshop</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Expected Attendees</label>
                  <input type="number" name="expectedAttendees" class="form-control" value="250" min="10" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Event Date *</label>
                  <input type="date" name="date" class="form-control" value="2026-12-15" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Time Frame</label>
                  <input type="text" name="time" class="form-control" placeholder="e.g. 10:00 AM - 03:00 PM" value="10:00 AM - 03:00 PM" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Location / Building</label>
                <input type="text" name="location" class="form-control" placeholder="e.g. Student Union Grand Hall" value="Student Union Grand Hall" />
              </div>

              <div class="form-group">
                <label class="form-label">Event Description</label>
                <textarea name="description" class="form-control" rows="2" placeholder="Brief summary of the event purpose and target audience..."></textarea>
              </div>

              <!-- DYNAMIC STAFFING ROLES BUILDER -->
              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <label class="form-label" style="margin-bottom: 0;">Required Volunteer Roles</label>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="App.addDynamicRoleRow()">
                    + Add Another Role
                  </button>
                </div>
                <div id="dynamic-roles-list" class="dynamic-roles-container">
                  <div class="dynamic-role-row">
                    <input type="text" class="form-control role-name-input" placeholder="Role name (e.g. Welcome & Check-in)" value="Check-in & Registration" required style="flex: 2;" />
                    <input type="number" class="form-control role-req-input" placeholder="Quota" value="4" min="1" max="50" style="width: 80px;" title="Volunteers needed" required />
                    <input type="text" class="form-control role-skills-input" placeholder="Skills (comma separated)" value="Check-in, Customer Service" style="flex: 2;" />
                  </div>
                  <div class="dynamic-role-row">
                    <input type="text" class="form-control role-name-input" placeholder="Role name" value="A/V & Equipment Tech" required style="flex: 2;" />
                    <input type="number" class="form-control role-req-input" placeholder="Quota" value="2" min="1" max="50" style="width: 80px;" required />
                    <input type="text" class="form-control role-skills-input" placeholder="Skills" value="Audio/Visual, Tech Setup" style="flex: 2;" />
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Event & Roster</button>
            </div>
          </form>
        </div>
      </div>
    `;
    this.openModal(modalHtml);
  },

  addDynamicRoleRow() {
    const list = document.getElementById("dynamic-roles-list");
    if (!list) return;
    const row = document.createElement("div");
    row.className = "dynamic-role-row";
    row.innerHTML = `
      <input type="text" class="form-control role-name-input" placeholder="Role name (e.g. Stage Marshall)" required style="flex: 2;" />
      <input type="number" class="form-control role-req-input" placeholder="Quota" value="3" min="1" max="50" style="width: 80px;" required />
      <input type="text" class="form-control role-skills-input" placeholder="Skills" value="General Staff" style="flex: 2;" />
      <button type="button" class="unassign-btn" onclick="this.parentElement.remove()" title="Remove role" style="color: var(--status-red-solid); font-size: 1.25rem;">&times;</button>
    `;
    list.appendChild(row);
  },

  async handleCreateEventSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const roles = [];
    const rows = form.querySelectorAll(".dynamic-role-row");
    rows.forEach(r => {
      const name = r.querySelector(".role-name-input")?.value?.trim();
      const required = parseInt(r.querySelector(".role-req-input")?.value) || 1;
      const skillsStr = r.querySelector(".role-skills-input")?.value || "";
      const skillsRequired = skillsStr.split(",").map(s => s.trim()).filter(Boolean);

      if (name) {
        roles.push({
          name,
          required,
          skillsRequired: skillsRequired.length > 0 ? skillsRequired : ["General Staff"]
        });
      }
    });

    const payload = {
      title: formData.get("title"),
      category: formData.get("category"),
      expectedAttendees: formData.get("expectedAttendees"),
      date: formData.get("date"),
      time: formData.get("time"),
      location: formData.get("location"),
      description: formData.get("description"),
      roles
    };

    const res = await GatherlyStorage.createEvent(payload);
    if (res.success) {
      this.closeModal();
      this.showToast(`Event "${payload.title}" created successfully!`, "success");
      StaffingView.selectedEventId = res.event.id;
      AppRouter.navigate("events");
    } else {
      this.showToast("Failed to create event", "error");
    }
  },

  // 2. REGISTER VOLUNTEER MODAL
  openAddVolunteerModal() {
    const modalHtml = `
      <div class="modal-backdrop" onclick="if(event.target === this) App.closeModal()">
        <div class="modal-box">
          <div class="modal-header">
            <h3><span>➕</span> Register Student Volunteer</h3>
            <button class="modal-close-btn" onclick="App.closeModal()">&times;</button>
          </div>
          <form id="add-volunteer-form" onsubmit="App.handleAddVolunteerSubmit(event)">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input type="text" name="name" class="form-control" placeholder="e.g. Jordan Smith" required />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Student Email *</label>
                  <input type="email" name="email" class="form-control" placeholder="jordan.smith@student.uta.edu" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <input type="text" name="phone" class="form-control" placeholder="(817) 555-0199" value="(817) 555-0199" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Academic Major & Year</label>
                  <input type="text" name="major" class="form-control" placeholder="e.g. Information Systems '26" value="Information Systems '26" />
                </div>
                <div class="form-group">
                  <label class="form-label">Max Weekly Hours</label>
                  <input type="number" name="maxHoursPerWeek" class="form-control" value="8" min="1" max="40" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Weekly Availability Schedule</label>
                <select name="availability" class="form-control">
                  <option value="Flexible">Flexible Schedule</option>
                  <option value="Weekends Only">Weekends Only</option>
                  <option value="Weekdays & Friday Evenings">Weekdays & Friday Evenings</option>
                  <option value="Evenings & Weekends">Evenings & Weekends</option>
                  <option value="Mornings & Weekends">Mornings & Weekends</option>
                  <option value="Fridays & Saturdays">Fridays & Saturdays</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Skills & Experience (comma separated)</label>
                <input type="text" name="skills" class="form-control" placeholder="e.g. Check-in, Audio/Visual, Crowd Management, First Aid" value="Check-in, Customer Service, Greeter" />
              </div>

              <div class="form-group">
                <label class="form-label">Volunteer Notes / Certifications</label>
                <textarea name="notes" class="form-control" rows="2" placeholder="e.g. First Aid certified, past club treasurer, experience with AV..."></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Volunteer Profile</button>
            </div>
          </form>
        </div>
      </div>
    `;
    this.openModal(modalHtml);
  },

  async handleAddVolunteerSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      major: formData.get("major"),
      availability: formData.get("availability"),
      skills: formData.get("skills"),
      maxHoursPerWeek: formData.get("maxHoursPerWeek"),
      notes: formData.get("notes")
    };

    const res = await GatherlyStorage.addVolunteer(payload);
    if (res.success) {
      this.closeModal();
      this.showToast(`Volunteer ${payload.name} added to roster!`, "success");
      AppRouter.refreshCurrentView();
    } else {
      this.showToast("Failed to add volunteer", "error");
    }
  },

  // 3. ASSIGN VOLUNTEER MODAL
  async openAssignModal(eventId, roleId, roleName, openSlots) {
    const data = await GatherlyStorage.getAllData();
    const event = (data.events || []).find(e => e.id === eventId);
    const role = (event?.roles || []).find(r => r.id === roleId);
    const volunteers = data.volunteers || [];
    const assignedIds = role?.assignedVolunteerIds || [];

    // Identify volunteers already assigned to THIS event (prevent overlap)
    const eventAssignedVolunteers = new Set();
    (event?.roles || []).forEach(r => {
      (r.assignedVolunteerIds || []).forEach(id => eventAssignedVolunteers.add(id));
    });

    const roleSkills = (role?.skillsRequired || []).map(s => s.toLowerCase());

    // Sort volunteers: matching skills first, then available
    const sortedVolunteers = [...volunteers].map(vol => {
      const isAlreadyInThisEvent = eventAssignedVolunteers.has(vol.id);
      const isAlreadyInThisRole = assignedIds.includes(vol.id);
      const matchingSkillsCount = (vol.skills || []).filter(s => roleSkills.includes(s.toLowerCase())).length;

      return {
        ...vol,
        isAlreadyInThisEvent,
        isAlreadyInThisRole,
        matchingSkillsCount
      };
    }).sort((a, b) => {
      if (a.isAlreadyInThisEvent !== b.isAlreadyInThisEvent) {
        return a.isAlreadyInThisEvent ? 1 : -1;
      }
      return b.matchingSkillsCount - a.matchingSkillsCount;
    });

    const modalHtml = `
      <div class="modal-backdrop" onclick="if(event.target === this) App.closeModal()">
        <div class="modal-box" style="max-width: 640px;">
          <div class="modal-header">
            <div>
              <h3><span>📋</span> Assign Volunteer</h3>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                Position: <strong>${roleName}</strong> &bull; Event: ${event?.title}
              </div>
            </div>
            <button class="modal-close-btn" onclick="App.closeModal()">&times;</button>
          </div>

          <div class="modal-body" style="padding-top: 14px;">
            <div style="padding: 10px 14px; background: var(--blue-50); border: 1px solid var(--blue-100); border-radius: var(--radius-md); font-size: 0.825rem; color: var(--blue-600); margin-bottom: 16px;">
              💡 <strong>Vacancy:</strong> ${openSlots} slot${openSlots > 1 ? 's' : ''} available. Voluntarily matching skills are highlighted below. Overlap prevention blocks double-booking.
            </div>

            <div style="max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
              ${sortedVolunteers.map(vol => {
                const disabled = vol.isAlreadyInThisEvent;
                return `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: ${disabled ? 'var(--bg-subtle)' : 'var(--bg-surface)'}; opacity: ${disabled ? '0.6' : '1'};">
                    <div style="flex: 1; margin-right: 12px;">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <strong style="color: var(--navy-900); font-size: 0.9rem;">${vol.name}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">(${vol.major})</span>
                        ${vol.matchingSkillsCount > 0 ? `
                          <span class="badge badge-green" style="font-size: 0.65rem; padding: 1px 6px;">
                            ${vol.matchingSkillsCount} skill match
                          </span>
                        ` : ''}
                      </div>

                      <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 2px;">
                        Schedule: <strong>${vol.availability}</strong> &bull; Max ${vol.maxHoursPerWeek}h/wk
                      </div>

                      <div style="display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap;">
                        ${(vol.skills || []).map(s => {
                          const isMatch = roleSkills.includes(s.toLowerCase());
                          return `
                            <span class="skill-chip" style="${isMatch ? 'background: var(--status-green-bg); border-color: var(--status-green-border); color: var(--status-green-text); font-weight: 700;' : ''}">
                              ${isMatch ? '✓ ' : ''}${s}
                            </span>
                          `;
                        }).join('')}
                      </div>
                    </div>

                    <div>
                      ${disabled ? `
                        <span class="badge badge-amber" title="Already scheduled for another role in this event" style="font-size: 0.75rem;">
                          Already Assigned
                        </span>
                      ` : `
                        <button 
                          class="btn btn-primary btn-sm"
                          onclick="App.handleAssignSubmit('${eventId}', '${roleId}', '${vol.id}')"
                        >
                          Assign &rarr;
                        </button>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Close</button>
          </div>
        </div>
      </div>
    `;
    this.openModal(modalHtml);
  },

  async handleAssignSubmit(eventId, roleId, volunteerId) {
    const res = await GatherlyStorage.assignVolunteer(eventId, roleId, volunteerId);
    if (res.success) {
      this.closeModal();
      this.showToast("Volunteer successfully assigned to position!", "success");
      await AppRouter.refreshCurrentView();
    } else {
      this.showToast(res.error || "Assignment conflict detected", "error");
    }
  },

  // Toast notifications
  showToast(message, type = "info") {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon = type === "success" ? "✅" : (type === "error" ? "⚠️" : "ℹ️");
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};
