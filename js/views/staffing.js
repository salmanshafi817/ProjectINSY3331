/**
 * Gatherly - Staffing Management View
 * Displays event positions, required volunteer counts, assigned volunteers,
 * remaining openings, and interactive assignment workflows with overlap prevention.
 */

const StaffingView = {
  selectedEventId: null,

  async render() {
    const data = await GatherlyStorage.getAllData();
    const events = data.events || [];
    const volunteers = data.volunteers || [];
    const volunteersMap = {};
    volunteers.forEach(v => volunteersMap[v.id] = v);

    if (events.length === 0) {
      return `
        <div class="card" style="text-align: center; padding: 48px;">
          <h3>No events found to staff</h3>
          <p style="color: var(--text-muted); margin: 8px 0 16px;">Create your first event to start staffing.</p>
          <button class="btn btn-primary" onclick="App.openCreateEventModal()">Create Event</button>
        </div>
      `;
    }

    // Default to first event or active event
    if (!this.selectedEventId || !events.find(e => e.id === this.selectedEventId)) {
      this.selectedEventId = events[0].id;
    }

    const currentEvent = events.find(e => e.id === this.selectedEventId);
    const roles = currentEvent.roles || [];

    // Calculate totals for selected event
    const totalRequired = roles.reduce((sum, r) => sum + parseInt(r.required || 0), 0);
    const totalAssigned = roles.reduce((sum, r) => sum + (r.assignedVolunteerIds || []).length, 0);
    const remainingOpenings = Math.max(0, totalRequired - totalAssigned);
    const coveragePct = totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 100;

    // Status styling
    let statusClass = "badge-green";
    let barColor = "green";
    let statusLabel = "Fully Staffed";

    if (coveragePct < 50) {
      statusClass = "badge-red";
      barColor = "red";
      statusLabel = "Critical Shortage";
    } else if (coveragePct < 100) {
      statusClass = "badge-amber";
      barColor = "amber";
      statusLabel = "Understaffed";
    }

    return `
      <!-- EVENT SELECTOR TOP BAR -->
      <div class="staffing-header-bar">
        <div class="staffing-header-info">
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--blue-400); margin-bottom: 4px; font-weight: 700;">
            Event Staffing Matrix
          </div>
          <h3>${currentEvent.title}</h3>
          <p>📅 ${currentEvent.date} &bull; ⏰ ${currentEvent.time} &bull; 📍 ${currentEvent.location}</p>
        </div>

        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <button class="btn btn-secondary" onclick="App.goToLiveOps('${currentEvent.id}')" style="background: rgba(239, 68, 68, 0.15); color: #FCA5A5; border-color: rgba(239, 68, 68, 0.3);">
            <span>🚨</span> Live Operations
          </button>
          <button class="btn btn-primary" onclick="App.goToEventCopilot('${currentEvent.id}')" style="box-shadow: 0 2px 10px rgba(59, 130, 246, 0.4);">
            <span>🤖</span> Analyze with AI Copilot
          </button>
          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="color: #CBD5E1; font-size: 0.85rem; font-weight: 500;">Switch Event:</label>
            <select 
              class="filter-select" 
              style="background: var(--navy-800); color: #FFFFFF; border-color: rgba(255, 255, 255, 0.2);"
              onchange="StaffingView.selectEvent(this.value)"
            >
              ${events.map(ev => `
                <option value="${ev.id}" ${ev.id === currentEvent.id ? 'selected' : ''}>
                  ${ev.title} (${ev.date})
                </option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- EVENT METRICS SUMMARY BAR -->
      <div class="stats-grid" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Required Positions</span>
            <div class="stat-icon blue">🎯</div>
          </div>
          <div class="stat-value">${totalRequired}</div>
          <div class="stat-subtext">Total volunteer slots for event</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Assigned Volunteers</span>
            <div class="stat-icon green">✅</div>
          </div>
          <div class="stat-value" style="color: var(--status-green-solid);">${totalAssigned}</div>
          <div class="stat-subtext">Confirmed on roster</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Remaining Openings</span>
            <div class="stat-icon ${remainingOpenings > 0 ? 'red' : 'green'}">⚠️</div>
          </div>
          <div class="stat-value" style="color: ${remainingOpenings > 0 ? 'var(--status-red-solid)' : 'var(--status-green-solid)'};">
            ${remainingOpenings}
          </div>
          <div class="stat-subtext">Unfilled positions needing coverage</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Staffing Coverage</span>
            <div class="stat-icon ${barColor}">📊</div>
          </div>
          <div style="display: flex; align-items: baseline; justify-content: space-between;">
            <div class="stat-value">${coveragePct}%</div>
            <span class="badge ${statusClass}">${statusLabel}</span>
          </div>
          <div style="margin-top: 10px;">
            <div class="progress-container">
              <div class="progress-bar ${barColor}" style="width: ${coveragePct}%;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- POSITIONS & ROLES ROSTER -->
      <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--navy-900);">
          Event Positions Breakdown (${roles.length} Roles)
        </h3>
      </div>

      <div class="role-cards-list">
        ${roles.map(role => {
          const req = parseInt(role.required || 0);
          const assignedIds = role.assignedVolunteerIds || [];
          const ass = assignedIds.length;
          const openSlots = Math.max(0, req - ass);
          const rolePct = req > 0 ? Math.round((ass / req) * 100) : 100;

          let roleStatus = "badge-green";
          let roleBar = "green";
          let roleLabel = "Staffed";

          if (ass === 0) {
            roleStatus = "badge-red";
            roleBar = "red";
            roleLabel = "0% Staffed (Critical)";
          } else if (rolePct < 50) {
            roleStatus = "badge-red";
            roleBar = "red";
            roleLabel = `${rolePct}% Shortage`;
          } else if (rolePct < 100) {
            roleStatus = "badge-amber";
            roleBar = "amber";
            roleLabel = `${openSlots} Vacanc${openSlots > 1 ? 'ies' : 'y'}`;
          }

          return `
            <div class="role-card">
              <div class="role-card-header">
                <div>
                  <div class="role-card-title">
                    <span>💼</span>
                    <span>${role.name}</span>
                    <span class="badge ${roleStatus}">
                      <span class="badge-dot"></span> ${roleLabel}
                    </span>
                  </div>
                  <div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Recommended Skills:</span>
                    ${(role.skillsRequired || []).map(s => `
                      <span class="skill-chip">${s}</span>
                    `).join('')}
                  </div>
                </div>

                <div style="text-align: right; min-width: 180px;">
                  <div style="font-size: 0.9rem; font-weight: 700; color: var(--navy-900); margin-bottom: 4px;">
                    ${ass} of ${req} Volunteers Assigned
                  </div>
                  <div class="progress-container" style="height: 10px;">
                    <div class="progress-bar ${roleBar}" style="width: ${rolePct}%;"></div>
                  </div>
                </div>
              </div>

              <!-- ASSIGNED VOLUNTEERS DISPLAY -->
              <div style="margin-top: 14px;">
                <div style="font-size: 0.8rem; font-weight: 700; color: var(--navy-800); margin-bottom: 8px;">
                  Assigned Team Members (${ass}/${req}):
                </div>

                ${assignedIds.length === 0 ? `
                  <div style="padding: 12px 14px; background: var(--status-red-bg); border: 1px dashed var(--status-red-border); border-radius: var(--radius-md); font-size: 0.825rem; color: var(--status-red-text);">
                    ⚠️ No volunteers assigned yet. This position needs immediate volunteer coverage.
                  </div>
                ` : `
                  <div class="assigned-volunteers-list">
                    ${assignedIds.map(vid => {
                      const v = volunteersMap[vid] || { name: "Unknown Volunteer", major: "Student" };
                      const cIns = (currentEvent.checkIns || {})[vid];
                      const isCheck = cIns?.status === "checked_in";
                      const isMissing = cIns?.status === "missing";
                      let checkDot = "";
                      if (isCheck) {
                        checkDot = `<span style="font-size: 0.65rem; background: var(--status-green-bg); color: var(--status-green-text); padding: 1px 5px; border-radius: 4px; font-weight: 700;">✓ Checked In</span>`;
                      } else if (isMissing) {
                        checkDot = `<span style="font-size: 0.65rem; background: var(--status-red-bg); color: var(--status-red-text); padding: 1px 5px; border-radius: 4px; font-weight: 700;">🚨 Missing</span>`;
                      } else {
                        checkDot = `<span style="font-size: 0.65rem; background: var(--bg-subtle); color: var(--navy-600); padding: 1px 5px; border-radius: 4px;">⏰ Awaiting</span>`;
                      }

                      return `
                        <div class="assigned-vol-pill">
                          <span style="font-weight: 700; color: var(--blue-600);">${v.name}</span>
                          <span style="color: var(--text-muted); font-size: 0.75rem;">(${v.major})</span>
                          ${checkDot}
                          <button 
                            class="unassign-btn" 
                            title="Remove volunteer from this role"
                            onclick="StaffingView.handleUnassign('${currentEvent.id}', '${role.id}', '${vid}')"
                          >
                            &times;
                          </button>
                        </div>
                      `;
                    }).join('')}
                  </div>
                `}
              </div>

              <!-- ASSIGN ACTION BUTTON -->
              <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
                ${openSlots > 0 ? `
                  <button 
                    class="btn btn-primary btn-sm"
                    onclick="App.openAssignModal('${currentEvent.id}', '${role.id}', '${role.name.replace(/'/g, "\\'")}', ${openSlots})"
                  >
                    <span>➕</span> Assign Volunteer (${openSlots} remaining)
                  </button>
                ` : `
                  <span class="badge badge-green" style="padding: 6px 14px;">
                    ✓ Role is at full capacity
                  </span>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  selectEvent(eventId) {
    this.selectedEventId = eventId;
    AppRouter.refreshCurrentView();
  },

  async handleUnassign(eventId, roleId, volunteerId) {
    if (confirm("Are you sure you want to remove this volunteer from the position?")) {
      const res = await GatherlyStorage.unassignVolunteer(eventId, roleId, volunteerId);
      if (res.success) {
        App.showToast("Volunteer removed from role", "info");
        AppRouter.refreshCurrentView();
      } else {
        App.showToast(res.error || "Failed to unassign", "error");
      }
    }
  }
};
