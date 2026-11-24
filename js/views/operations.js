/**
 * Gatherly - Live Event Operations Center View
 * 
 * Provides real-time event-day coordination:
 * 1. Event-day volunteer check-in with timestamps and status logging
 * 2. Real-time staffing status and health metrics
 * 3. Proactive Missing Volunteer alerts with 1-click contact & rapid backup replacement
 * 4. Understaffed position alerts highlighting skill requirements and open slots
 * 5. Full volunteer assignment visibility across all positions
 * 6. High-contrast classification of positions that are "Covered" vs "Need Attention"
 * 7. Integrated Post-Event Staffing Performance Retrospective
 */

const OperationsView = {
  selectedEventId: null,
  activeTab: "positions", // "positions", "roster", "retrospective"
  positionFilter: "all",  // "all", "attention", "covered"
  searchQuery: "",

  async render() {
    const allData = await GatherlyStorage.getAllData();
    const events = allData.events || [];

    if (events.length === 0) {
      return `
        <div class="card" style="text-align: center; padding: 48px;">
          <h3>No events found</h3>
          <p style="color: var(--text-muted); margin: 8px 0 16px;">Create your first event to start live operations.</p>
          <button class="btn btn-primary" onclick="App.openCreateEventModal()">Create Event</button>
        </div>
      `;
    }

    // Default to first event or active event
    if (!this.selectedEventId || !events.find(e => e.id === this.selectedEventId)) {
      this.selectedEventId = events[0].id;
    }

    const opsData = await GatherlyStorage.getEventOperationsData(this.selectedEventId);
    if (!opsData) {
      return `<div class="card" style="padding: 32px;"><p>Loading operations center...</p></div>`;
    }

    const event = opsData.event;
    const summary = opsData.summary;
    const missingAlerts = opsData.missingAlerts || [];
    const understaffedAlerts = opsData.understaffedAlerts || [];
    const coveredPositions = opsData.coveredPositions || [];
    const positionsNeedingAttention = opsData.positionsNeedingAttention || [];

    // Filter positions according to active filter and search
    let displayedRoles = opsData.roles;
    if (this.positionFilter === "attention") {
      displayedRoles = positionsNeedingAttention;
    } else if (this.positionFilter === "covered") {
      displayedRoles = coveredPositions;
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      displayedRoles = displayedRoles.filter(r => 
        r.name.toLowerCase().includes(q) ||
        (r.skillsRequired || []).some(s => s.toLowerCase().includes(q)) ||
        r.volunteers.some(v => v.name.toLowerCase().includes(q))
      );
    }

    const isLive = event.status === "In-Progress" || event.status === "Upcoming";

    return `
      <!-- LIVE OPERATIONS HEADER -->
      <div class="ops-header-bar">
        <div class="ops-header-info">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <span class="live-badge ${event.status === 'In-Progress' ? 'live-active' : (event.status === 'Completed' ? 'live-completed' : 'live-upcoming')}">
              ${event.status === 'In-Progress' ? '<span class="live-dot"></span> LIVE OPERATIONS' : (event.status === 'Completed' ? '✓ EVENT CONCLUDED' : '⏰ SCHEDULED EVENT')}
            </span>
            <span style="font-size: 0.8rem; color: #94A3B8;">Event Operations Center</span>
          </div>
          <h3>${event.title}</h3>
          <p>
            <span>📅 ${event.date}</span>
            <span>&bull;</span>
            <span>⏰ ${event.time}</span>
            <span>&bull;</span>
            <span>📍 ${event.location}</span>
            <span>&bull;</span>
            <span>👥 Expected: <strong>${event.expectedAttendees}</strong> students</span>
          </p>
        </div>

        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="color: #CBD5E1; font-size: 0.85rem; font-weight: 500;">Select Event:</label>
            <select 
              class="filter-select" 
              style="background: var(--navy-800); color: #FFFFFF; border-color: rgba(255, 255, 255, 0.2);"
              onchange="OperationsView.switchEvent(this.value)"
            >
              ${events.map(ev => `
                <option value="${ev.id}" ${ev.id === event.id ? 'selected' : ''}>
                  ${ev.title} (${ev.date})
                </option>
              `).join('')}
            </select>
          </div>

          <button class="btn btn-secondary btn-sm" onclick="OperationsView.toggleEventStatus('${event.id}', '${event.status === 'In-Progress' ? 'Upcoming' : 'In-Progress'}')">
            <span>⚡</span> ${event.status === 'In-Progress' ? 'Set as Upcoming' : 'Set as Live In-Progress'}
          </button>

          <button class="btn btn-primary btn-sm" onclick="OperationsView.openRapidCheckInModal('${event.id}')">
            <span>✓</span> Rapid Check-in
          </button>
        </div>
      </div>

      <!-- REAL-TIME STAFFING STATUS METRIC CARDS -->
      <div class="stats-grid" style="margin-bottom: 24px;">
        <!-- Required Positions -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Required Positions</span>
            <div class="stat-icon blue">🎯</div>
          </div>
          <div class="stat-value">${summary.totalRequired}</div>
          <div class="stat-subtext" style="color: #FFFFFF !important; font-weight: 600;">Total volunteer slots needed</div>
        </div>

        <!-- Assigned on Roster -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Roster Assigned</span>
            <div class="stat-icon ${summary.coveragePct >= 100 ? 'green' : 'amber'}">👥</div>
          </div>
          <div class="stat-value" style="color: ${summary.coveragePct >= 100 ? 'var(--status-green-solid)' : 'var(--status-amber-solid)'};">
            ${summary.totalAssigned}
          </div>
          <div class="stat-subtext">
            <span>${summary.coveragePct}% overall staffing coverage</span>
          </div>
        </div>

        <!-- Checked In / On Duty -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Checked-In / On-Duty</span>
            <div class="stat-icon green">✅</div>
          </div>
          <div class="stat-value" style="color: var(--status-green-solid);">
            ${summary.checkedInCount} <span style="font-size: 1rem; color: var(--text-muted); font-weight: normal;">/ ${summary.totalAssigned}</span>
          </div>
          <div class="stat-subtext">
            <span><strong>${summary.checkInRate}%</strong> check-in arrival rate</span>
          </div>
        </div>

        <!-- Missing / Awaiting Arrival -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Missing / Awaiting</span>
            <div class="stat-icon ${summary.missingCount > 0 ? 'red' : 'amber'}">⚠️</div>
          </div>
          <div class="stat-value" style="color: ${summary.missingCount > 0 ? 'var(--status-red-solid)' : 'var(--navy-800)'};">
            ${summary.missingCount + summary.pendingCount}
          </div>
          <div class="stat-subtext">
            <span>${summary.missingCount} missing &bull; ${summary.pendingCount} pending</span>
          </div>
        </div>

        <!-- Health Status -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Operations Health</span>
            <div class="stat-icon ${summary.healthStatus}">📊</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge ${summary.healthStatus === 'green' ? 'badge-green' : (summary.healthStatus === 'amber' ? 'badge-amber' : 'badge-red')}" style="font-size: 0.85rem; padding: 4px 10px;">
              <span class="badge-dot"></span>
              ${summary.healthStatus === 'green' ? 'Optimal Coverage' : (summary.healthStatus === 'amber' ? 'Attention Needed' : 'Critical Shortage')}
            </span>
          </div>
          <div class="stat-subtext" style="margin-top: 8px;">
            <span>${summary.openSlots > 0 ? `${summary.openSlots} unfilled slots` : 'All role slots filled'}</span>
          </div>
        </div>
      </div>

      <!-- ACTIVE ALERTS CENTER (MISSING VOLUNTEERS & UNDERSTAFFED POSITIONS) -->
      ${missingAlerts.length > 0 || understaffedAlerts.length > 0 ? `
        <div style="margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px;">
          <!-- Missing Volunteer Alerts -->
          ${missingAlerts.map(alt => `
            <div style="background: var(--status-red-bg); border: 1px solid var(--status-red-border); border-left: 5px solid var(--status-red-solid); border-radius: var(--radius-md); padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
              <div style="flex: 1; min-width: 260px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span class="badge badge-red" style="font-size: 0.7rem; font-weight: 800;">🚨 NO-SHOW ALERT</span>
                  <strong style="color: var(--status-red-text); font-size: 0.95rem;">Missing Volunteer: ${alt.volunteer.name}</strong>
                </div>
                <div style="font-size: 0.85rem; color: var(--navy-800);">
                  Assigned Position: <strong>${alt.role.name}</strong> &bull; Major: ${alt.volunteer.major}
                </div>
                <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 2px;">
                  Phone: <strong>${alt.volunteer.phone}</strong> &bull; Email: <strong>${alt.volunteer.email}</strong>
                  ${alt.checkRecord.notes ? ` &bull; <em>"${alt.checkRecord.notes}"</em>` : ''}
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <button 
                  class="btn btn-secondary btn-sm"
                  onclick="OperationsView.contactVolunteer('${alt.volunteer.name}', '${alt.volunteer.phone}', '${alt.volunteer.email}')"
                >
                  <span>📞</span> Contact
                </button>
                <button 
                  class="btn btn-secondary btn-sm"
                  onclick="OperationsView.checkInVolunteer('${event.id}', '${alt.volunteer.id}', 'checked_in', 'Arrived after missing alert')"
                >
                  <span>✓</span> Mark Present
                </button>
                <button 
                  class="btn btn-primary btn-sm"
                  style="background: var(--status-red-solid); border-color: var(--status-red-solid);"
                  onclick="OperationsView.openBackupModal('${event.id}', '${alt.role.id}', '${alt.volunteer.id}', '${alt.volunteer.name}', '${alt.role.name}')"
                >
                  <span>🔄</span> Find Backup & Replace
                </button>
              </div>
            </div>
          `).join('')}

          <!-- Understaffed Position Alerts -->
          ${understaffedAlerts.map(alt => `
            <div style="background: var(--status-amber-bg); border: 1px solid var(--status-amber-border); border-left: 5px solid var(--status-amber-solid); border-radius: var(--radius-md); padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div style="flex: 1; min-width: 260px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span class="badge badge-amber" style="font-size: 0.7rem; font-weight: 800;">⚠️ UNDERSTAFFED POSITION</span>
                  <strong style="color: var(--status-amber-text); font-size: 0.95rem;">${alt.role.name}</strong>
                </div>
                <div style="font-size: 0.825rem; color: #CBD5E1;">
                  Currently <strong>${alt.assigned}</strong> of <strong style="color: #FFFFFF !important;">${alt.required} volunteers needed</strong> (${alt.openSlots} open slot${alt.openSlots > 1 ? 's' : ''} remaining).
                </div>
                <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 2px;">
                  Required Skills: <strong>${(alt.role.skillsRequired || ['General Staff']).join(', ')}</strong>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 8px;">
                <button 
                  class="btn btn-primary btn-sm"
                  onclick="App.openAssignModal('${event.id}', '${alt.role.id}', '${alt.role.name}', ${alt.openSlots})"
                >
                  <span>➕</span> Assign Volunteer
                </button>
                <button 
                  class="btn btn-secondary btn-sm"
                  onclick="App.goToEventCopilot('${event.id}')"
                >
                  <span>🤖</span> Copilot Recommend
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="margin-bottom: 24px; padding: 14px 18px; background: var(--status-green-bg); border: 1px solid var(--status-green-border); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.4rem;">🎉</span>
            <div>
              <strong style="color: var(--status-green-text); font-size: 0.95rem;">All Positions Fully Staffed & Accounted For</strong>
              <div style="font-size: 0.8rem; color: var(--status-green-text);">
                Zero active missing volunteer alerts or unfilled role slots. Great operations management!
              </div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="AppRouter.navigate('reports')">
            <span>📈</span> View Retrospective Analytics
          </button>
        </div>
      `}

      <!-- PRIMARY NAVIGATION TABS -->
      <div class="ops-tabs-nav">
        <button 
          class="ops-tab-btn ${this.activeTab === 'positions' ? 'active' : ''}" 
          onclick="OperationsView.switchTab('positions')"
        >
          <span>📋</span> Positions & Coverage Board (${opsData.roles.length})
        </button>

        <button 
          class="ops-tab-btn ${this.activeTab === 'roster' ? 'active' : ''}" 
          onclick="OperationsView.switchTab('roster')"
        >
          <span>👥</span> Event-Day Check-in Roster (${opsData.volunteersList.length})
        </button>

        <button 
          class="ops-tab-btn ${this.activeTab === 'retrospective' ? 'active' : ''}" 
          onclick="OperationsView.switchTab('retrospective')"
        >
          <span>📈</span> Post-Event Performance Report
        </button>
      </div>

      <!-- TAB 1: POSITIONS & COVERAGE VISIBILITY BOARD -->
      ${this.activeTab === 'positions' ? this.renderPositionsTab(event, displayedRoles, coveredPositions, positionsNeedingAttention) : ''}

      <!-- TAB 2: VOLUNTEER CHECK-IN ROSTER TAB -->
      ${this.activeTab === 'roster' ? this.renderRosterTab(event, opsData.volunteersList) : ''}

      <!-- TAB 3: POST-EVENT PERFORMANCE REPORT TAB -->
      ${this.activeTab === 'retrospective' ? this.renderRetrospectiveTab(event) : ''}
    `;
  },

  /* ------------------------------------------------------------------------
     TAB 1: POSITIONS & COVERAGE VISIBILITY
     ------------------------------------------------------------------------ */
  renderPositionsTab(event, displayedRoles, coveredPositions, positionsNeedingAttention) {
    return `
      <!-- SUBFILTER & SEARCH BAR -->
      <div class="filter-bar" style="margin-bottom: 20px;">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search roles, required skills, or volunteer names..."
            value="${this.searchQuery}"
            oninput="OperationsView.handleSearch(this.value)"
          />
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button 
            class="btn ${this.positionFilter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm"
            onclick="OperationsView.setPositionFilter('all')"
          >
            All Positions (${coveredPositions.length + positionsNeedingAttention.length})
          </button>

          <button 
            class="btn ${this.positionFilter === 'attention' ? 'btn-primary' : 'btn-secondary'} btn-sm"
            style="${this.positionFilter === 'attention' ? 'background: var(--status-amber-solid); border-color: var(--status-amber-solid);' : ''}"
            onclick="OperationsView.setPositionFilter('attention')"
          >
            ⚠️ Needs Attention (${positionsNeedingAttention.length})
          </button>

          <button 
            class="btn ${this.positionFilter === 'covered' ? 'btn-primary' : 'btn-secondary'} btn-sm"
            style="${this.positionFilter === 'covered' ? 'background: var(--status-green-solid); border-color: var(--status-green-solid);' : ''}"
            onclick="OperationsView.setPositionFilter('covered')"
          >
            ✅ Covered & On-Duty (${coveredPositions.length})
          </button>
        </div>
      </div>

      <!-- ROLES GRID -->
      ${displayedRoles.length === 0 ? `
        <div class="card" style="text-align: center; padding: 40px;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🔍</div>
          <h4 style="color: var(--navy-900);">No matching positions found</h4>
          <p style="color: var(--text-muted); font-size: 0.85rem;">Try clearing your search query or switching position filters.</p>
        </div>
      ` : `
        <div class="ops-role-grid">
          ${displayedRoles.map(role => {
            const pct = role.required > 0 ? Math.round((role.assignedCount / role.required) * 100) : 100;
            const checkPct = role.assignedCount > 0 ? Math.round((role.checkedInCount / role.assignedCount) * 100) : 0;

            let cardBadge = "badge-green";
            let statusLabel = "Covered & On-Duty";

            if (role.roleStatus === "urgent") {
              cardBadge = "badge-red";
              statusLabel = role.assignedCount === 0 ? "Unstaffed (0 Assigned)" : "Critical Deficit";
            } else if (role.roleStatus === "attention") {
              cardBadge = "badge-amber";
              statusLabel = role.openSlots > 0 ? `Understaffed (${role.openSlots} open)` : "Awaiting Check-in";
            }

            return `
              <div class="ops-role-card ${role.roleStatus}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <div>
                    <h4 style="font-size: 1.05rem; font-weight: 700; color: #FFFFFF !important; margin-bottom: 2px;">
                      ${role.name}
                    </h4>
                    <div style="font-size: 0.8rem; color: #CBD5E1;">
                      Quota: <strong style="color: #FFFFFF !important; font-weight: 700; text-shadow: 0 0 10px rgba(0, 229, 255, 0.3);">${role.required} volunteers needed</strong>
                    </div>
                  </div>
                  <span class="badge ${cardBadge}" style="font-size: 0.725rem;">
                    <span class="badge-dot"></span> ${statusLabel}
                  </span>
                </div>

                <!-- PROGRESS BARS -->
                <div style="margin: 10px 0 14px;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.775rem; margin-bottom: 4px;">
                    <span style="color: #CBD5E1;">
                      Roster: <strong style="color: #FFFFFF !important;">${role.assignedCount}</strong> of ${role.required} (${pct}%)
                    </span>
                    <span style="color: #CBD5E1;">
                      Checked In: <strong style="color: #FFFFFF !important;">${role.checkedInCount}</strong> of ${role.assignedCount} (${checkPct}%)
                    </span>
                  </div>
                  <div class="progress-container" style="height: 6px;">
                    <div 
                      class="progress-bar ${role.roleStatus === 'covered' ? 'green' : (role.roleStatus === 'attention' ? 'amber' : 'red')}"
                      style="width: ${pct}%;"
                    ></div>
                  </div>
                </div>

                <!-- SKILLS TAGS -->
                <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 12px;">
                  ${(role.skillsRequired || ['General Staff']).map(s => `
                    <span class="skill-chip" style="font-size: 0.7rem; padding: 2px 7px;">${s}</span>
                  `).join('')}
                </div>

                <!-- ASSIGNED VOLUNTEERS LIST -->
                <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; margin-top: auto;">
                  <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 6px;">
                    Assigned Volunteers (${role.volunteers.length})
                  </div>

                  ${role.volunteers.length === 0 ? `
                    <div style="padding: 12px; background: var(--status-red-bg); border: 1px dashed var(--status-red-border); border-radius: var(--radius-md); text-align: center;">
                      <div style="font-size: 0.8rem; color: var(--status-red-text); font-weight: 600; margin-bottom: 6px;">
                        ⚠️ Zero volunteers assigned to this position
                      </div>
                      <button 
                        class="btn btn-primary btn-sm"
                        onclick="App.openAssignModal('${event.id}', '${role.id}', '${role.name}', ${role.required})"
                      >
                        + Assign Volunteer Now
                      </button>
                    </div>
                  ` : `
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                      ${role.volunteers.map(vol => {
                        const isCheckedIn = vol.checkInStatus === "checked_in";
                        const isMissing = vol.checkInStatus === "missing";
                        const itemClass = isCheckedIn ? "checked-in" : (isMissing ? "missing" : "");

                        return `
                          <div class="ops-vol-item ${itemClass}">
                            <div style="flex: 1; min-width: 0; margin-right: 8px;">
                              <div style="display: flex; align-items: center; gap: 6px;">
                                <strong style="font-size: 0.85rem; color: var(--navy-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                  ${vol.name}
                                </strong>
                                <span class="checkin-badge ${vol.checkInStatus}">
                                  ${isCheckedIn ? '✓ On Duty' : (isMissing ? '🚨 Missing' : '⏰ Awaiting')}
                                </span>
                              </div>
                              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                                ${isCheckedIn ? `Checked in at <strong>${vol.timestamp || 'Today'}</strong>` : `Phone: ${vol.phone}`}
                              </div>
                            </div>

                            <div style="display: flex; align-items: center; gap: 4px;">
                              ${!isCheckedIn ? `
                                <button 
                                  class="btn btn-primary btn-sm"
                                  style="padding: 3px 8px; font-size: 0.75rem;"
                                  onclick="OperationsView.checkInVolunteer('${event.id}', '${vol.id}', 'checked_in', 'Checked in via position board')"
                                  title="Check In Volunteer"
                                >
                                  ✓ Check In
                                </button>
                                <button 
                                  class="btn btn-secondary btn-sm"
                                  style="padding: 3px 7px; font-size: 0.75rem; color: var(--status-red-solid);"
                                  onclick="OperationsView.checkInVolunteer('${event.id}', '${vol.id}', 'missing', 'Reported missing/no-show on position board')"
                                  title="Mark as Missing/No-Show"
                                >
                                  ⚠️
                                </button>
                              ` : `
                                <button 
                                  class="btn btn-secondary btn-sm"
                                  style="padding: 3px 8px; font-size: 0.75rem;"
                                  onclick="OperationsView.checkInVolunteer('${event.id}', '${vol.id}', 'pending', 'Check-in undone')"
                                  title="Undo Check-In"
                                >
                                  Undo
                                </button>
                              `}
                              <button 
                                class="btn btn-secondary btn-sm"
                                style="padding: 3px 7px; font-size: 0.75rem;"
                                onclick="OperationsView.openBackupModal('${event.id}', '${role.id}', '${vol.id}', '${vol.name}', '${role.name}')"
                                title="Replace with backup volunteer"
                              >
                                🔄
                              </button>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `}

                  <!-- FILL OPEN SLOT BUTTON -->
                  ${role.openSlots > 0 ? `
                    <div style="margin-top: 10px;">
                      <button 
                        class="btn btn-secondary btn-sm" 
                        style="width: 100%; font-size: 0.8rem; border-style: dashed;"
                        onclick="App.openAssignModal('${event.id}', '${role.id}', '${role.name}', ${role.openSlots})"
                      >
                        + Fill Open Slot (${role.openSlots} needed)
                      </button>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;
  },

  /* ------------------------------------------------------------------------
     TAB 2: EVENT-DAY CHECK-IN ROSTER
     ------------------------------------------------------------------------ */
  renderRosterTab(event, volunteersList) {
    let filteredList = volunteersList;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filteredList = filteredList.filter(v => 
        v.name.toLowerCase().includes(q) ||
        v.roleName.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q)
      );
    }

    return `
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3><span>📋</span> Event-Day Volunteer Check-In Roster</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
              Live attendance confirmation for all volunteers stationed at ${event.title}.
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="OperationsView.checkInAllPresent('${event.id}')">
              <span>✓</span> Check In All Present
            </button>
          </div>
        </div>

        <div class="card-body" style="padding: 0;">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Assigned Role</th>
                  <th>Academic Major</th>
                  <th>Check-In Status</th>
                  <th>Time Logged</th>
                  <th>Contact Info</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${filteredList.length === 0 ? `
                  <tr>
                    <td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted);">
                      No volunteers found matching your query.
                    </td>
                  </tr>
                ` : filteredList.map(v => {
                  const isCheckedIn = v.checkInStatus === "checked_in";
                  const isMissing = v.checkInStatus === "missing";
                  let statusBadge = "badge-amber";
                  let label = "⏰ Pending Arrival";

                  if (isCheckedIn) {
                    statusBadge = "badge-green";
                    label = "✓ Checked In / On Duty";
                  } else if (isMissing) {
                    statusBadge = "badge-red";
                    label = "🚨 Missing / No-Show";
                  }

                  return `
                    <tr style="${isMissing ? 'background: #FEF2F2;' : ''}">
                      <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <div class="vol-avatar" style="width: 32px; height: 32px; font-size: 0.8rem;">
                            ${v.name.charAt(0)}
                          </div>
                          <div>
                            <strong>${v.name}</strong>
                            <div style="font-size: 0.725rem; color: var(--text-muted);">${v.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style="color: var(--navy-900); font-size: 0.85rem;">${v.roleName}</strong>
                      </td>
                      <td>
                        <span style="font-size: 0.825rem; color: var(--navy-700);">${v.major}</span>
                      </td>
                      <td>
                        <span class="badge ${statusBadge}">
                          <span class="badge-dot"></span> ${label}
                        </span>
                      </td>
                      <td>
                        <span style="font-size: 0.825rem; color: var(--navy-800); font-family: monospace;">
                          ${v.timestamp || '&mdash;'}
                        </span>
                      </td>
                      <td>
                        <span style="font-size: 0.8rem; color: var(--navy-700);">${v.phone}</span>
                      </td>
                      <td style="text-align: right;">
                        <div style="display: flex; justify-content: flex-end; gap: 6px;">
                          ${!isCheckedIn ? `
                            <button 
                              class="btn btn-primary btn-sm"
                              onclick="OperationsView.checkInVolunteer('${event.id}', '${v.id}', 'checked_in', 'Checked in on roster')"
                            >
                              ✓ Check In
                            </button>
                            <button 
                              class="btn btn-secondary btn-sm"
                              style="color: var(--status-red-solid);"
                              onclick="OperationsView.checkInVolunteer('${event.id}', '${v.id}', 'missing', 'Flagged missing on roster')"
                              title="Flag as Missing"
                            >
                              Flag Absent
                            </button>
                          ` : `
                            <button 
                              class="btn btn-secondary btn-sm"
                              onclick="OperationsView.checkInVolunteer('${event.id}', '${v.id}', 'pending', 'Undo checkin')"
                            >
                              Undo
                            </button>
                          `}
                          <button 
                            class="btn btn-secondary btn-sm"
                            onclick="OperationsView.openBackupModal('${event.id}', '${v.roleId}', '${v.id}', '${v.name}', '${v.roleName}')"
                            title="Replace with Backup"
                          >
                            Replace
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  /* ------------------------------------------------------------------------
     TAB 3: POST-EVENT PERFORMANCE RETROSPECTIVE
     ------------------------------------------------------------------------ */
  async renderRetrospectiveTab(event) {
    const reportData = await GatherlyStorage.getPostEventReport(event.id);
    if (!reportData) {
      return `<div class="card" style="padding: 32px;"><p>Generating post-event report...</p></div>`;
    }

    const s = reportData.summary;

    return `
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3><span>📈</span> Post-Event Staffing Performance Retrospective</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
              Staffing outcomes, attendance rates, volunteer-hour audit, and AI post-event learnings for <strong>${event.title}</strong>.
            </p>
          </div>
          <div>
            <button class="btn btn-secondary btn-sm" onclick="App.showToast('Exporting post-event performance PDF...', 'info')">
              <span>📥</span> Export Report
            </button>
          </div>
        </div>

        <div class="card-body">
          <!-- RETROSPECTIVE STATS GRID -->
          <div class="stats-grid" style="margin-bottom: 24px;">
            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-title">Volunteer Fill Rate</span>
                <div class="stat-icon green">🎯</div>
              </div>
              <div class="stat-value">${s.completionRate}%</div>
              <div class="stat-subtext">${s.checkedInCount} of ${s.plannedSlots} slots fulfilled</div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-title">Check-in Attendance</span>
                <div class="stat-icon blue">✅</div>
              </div>
              <div class="stat-value">${s.actualStaffed > 0 ? Math.round((s.checkedInCount / s.actualStaffed) * 100) : 0}%</div>
              <div class="stat-subtext">${s.checkedInCount} of ${s.actualStaffed} rostered arrived</div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-title">No-Show / Drop-out Rate</span>
                <div class="stat-icon ${s.noShowRate > 0 ? 'red' : 'green'}">⚠️</div>
              </div>
              <div class="stat-value" style="color: ${s.noShowRate > 0 ? 'var(--status-red-solid)' : 'var(--status-green-solid)'};">
                ${s.noShowRate}%
              </div>
              <div class="stat-subtext">${s.missingCount} volunteer dropouts recorded</div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-title">Total Hours Delivered</span>
                <div class="stat-icon blue">⏱️</div>
              </div>
              <div class="stat-value">${s.hoursDelivered} hrs</div>
              <div class="stat-subtext">Estimated volunteer effort</div>
            </div>
          </div>

          <!-- ROLE BY ROLE FULFILLMENT AUDIT -->
          <h4 style="font-size: 1rem; color: var(--navy-900); font-weight: 700; margin-bottom: 12px;">
            Position Fulfillment Breakdown
          </h4>

          <div class="table-responsive" style="margin-bottom: 24px;">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Position Name</th>
                  <th>Slots Required</th>
                  <th>Slots Assigned</th>
                  <th>Checked In</th>
                  <th>Fulfillment Rate</th>
                  <th>Staffing Outcome</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.roleFulfillment.map(r => `
                  <tr>
                    <td><strong>${r.roleName}</strong></td>
                    <td>${r.required}</td>
                    <td>${r.assigned}</td>
                    <td>${r.checkedIn}</td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <strong>${r.fillRate}%</strong>
                        <div class="progress-container" style="width: 80px; height: 6px;">
                          <div class="progress-bar ${r.fillRate >= 100 ? 'green' : (r.fillRate >= 70 ? 'amber' : 'red')}" style="width: ${r.fillRate}%;"></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge ${r.status === 'Optimal' ? 'badge-green' : (r.status === 'Adequate' ? 'badge-amber' : 'badge-red')}">
                        <span class="badge-dot"></span> ${r.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- AI COPILOT RETROSPECTIVE ANALYSIS -->
          <div style="background: var(--blue-50); border: 1px solid var(--blue-100); border-radius: var(--radius-md); padding: 18px 20px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 1.25rem;">🤖</span>
              <strong style="color: var(--blue-600); font-size: 0.95rem;">AI Copilot Staffing Retrospective</strong>
            </div>
            <p style="color: var(--navy-900); font-size: 0.875rem; line-height: 1.6; margin-bottom: 0;">
              ${reportData.aiRetrospective}
            </p>
          </div>
        </div>
      </div>
    `;
  },

  /* ------------------------------------------------------------------------
     INTERACTIVE METHODS & ACTIONS
     ------------------------------------------------------------------------ */
  async switchEvent(eventId) {
    this.selectedEventId = eventId;
    await AppRouter.refreshCurrentView();
  },

  async switchTab(tab) {
    this.activeTab = tab;
    await AppRouter.refreshCurrentView();
  },

  async setPositionFilter(filter) {
    this.positionFilter = filter;
    await AppRouter.refreshCurrentView();
  },

  handleSearch(query) {
    this.searchQuery = query;
    AppRouter.refreshCurrentView();
  },

  async checkInVolunteer(eventId, volunteerId, status, notes = "") {
    const res = await GatherlyStorage.checkInVolunteer(eventId, volunteerId, status, notes);
    if (res.success) {
      const msg = status === "checked_in" ? "Volunteer marked as Checked In!" : (status === "missing" ? "Volunteer marked as Missing" : "Status updated");
      App.showToast(msg, status === "missing" ? "error" : "success");
      await AppRouter.refreshCurrentView();
      await App.updateQuickPills();
    } else {
      App.showToast(res.error || "Failed to update volunteer status", "error");
    }
  },

  async checkInAllPresent(eventId) {
    const opsData = await GatherlyStorage.getEventOperationsData(eventId);
    if (!opsData) return;

    let updatedCount = 0;
    for (const v of opsData.volunteersList) {
      if (v.checkInStatus !== "checked_in") {
        await GatherlyStorage.checkInVolunteer(eventId, v.id, "checked_in", "Batch check-in");
        updatedCount++;
      }
    }

    App.showToast(`Checked in ${updatedCount} volunteer(s) on roster!`, "success");
    await AppRouter.refreshCurrentView();
    await App.updateQuickPills();
  },

  async toggleEventStatus(eventId, newStatus) {
    const res = await GatherlyStorage.updateEventStatus(eventId, newStatus);
    if (res.success) {
      App.showToast(`Event status updated to ${newStatus}`, "success");
      await AppRouter.refreshCurrentView();
    }
  },

  contactVolunteer(name, phone, email) {
    App.showToast(`Contacting ${name} at ${phone} / ${email}...`, "info");
  },

  // Rapid Check-in Modal
  async openRapidCheckInModal(eventId) {
    const opsData = await GatherlyStorage.getEventOperationsData(eventId);
    if (!opsData) return;

    const modalHtml = `
      <div class="modal-backdrop" onclick="if(event.target === this) App.closeModal()">
        <div class="modal-box" style="max-width: 600px;">
          <div class="modal-header">
            <div>
              <h3><span>✓</span> Rapid Volunteer Check-in</h3>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                Event: <strong>${opsData.event.title}</strong>
              </div>
            </div>
            <button class="modal-close-btn" onclick="App.closeModal()">&times;</button>
          </div>

          <div class="modal-body">
            <div style="margin-bottom: 14px;">
              <input 
                type="text" 
                id="rapid-checkin-search" 
                class="form-control" 
                placeholder="Type volunteer name or email to filter..."
                oninput="OperationsView.filterRapidCheckinModal(this.value)"
              />
            </div>

            <div id="rapid-checkin-list" style="max-height: 360px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
              ${opsData.volunteersList.map(v => `
                <div class="rapid-item" data-name="${v.name.toLowerCase()}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: ${v.checkInStatus === 'checked_in' ? 'var(--status-green-bg)' : 'var(--bg-surface)'};">
                  <div>
                    <strong style="color: var(--navy-900); font-size: 0.9rem;">${v.name}</strong>
                    <div style="font-size: 0.775rem; color: var(--text-muted);">
                      Position: <strong>${v.roleName}</strong> &bull; ${v.major}
                    </div>
                  </div>

                  <div>
                    ${v.checkInStatus === 'checked_in' ? `
                      <span class="badge badge-green" style="font-size: 0.75rem;">✓ On Duty (${v.timestamp || 'Logged'})</span>
                    ` : `
                      <button 
                        class="btn btn-primary btn-sm"
                        onclick="OperationsView.checkInVolunteer('${eventId}', '${v.id}', 'checked_in', 'Rapid check-in modal'); App.closeModal();"
                      >
                        ✓ Check In
                      </button>
                    `}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Close</button>
          </div>
        </div>
      </div>
    `;
    App.openModal(modalHtml);
  },

  filterRapidCheckinModal(query) {
    const q = (query || "").toLowerCase();
    const rows = document.querySelectorAll("#rapid-checkin-list .rapid-item");
    rows.forEach(r => {
      const name = r.dataset.name || "";
      r.style.display = name.includes(q) ? "flex" : "none";
    });
  },

  // Rapid Backup Replacement Modal
  async openBackupModal(eventId, roleId, oldVolunteerId, oldVolunteerName, roleName) {
    const allData = await GatherlyStorage.getAllData();
    const event = (allData.events || []).find(e => e.id === eventId);
    const role = (event?.roles || []).find(r => r.id === roleId);
    const volunteers = allData.volunteers || [];
    const roleSkills = (role?.skillsRequired || []).map(s => s.toLowerCase());

    // Gather all volunteers already assigned to this event
    const eventAssignedVolunteers = new Set();
    (event?.roles || []).forEach(r => {
      (r.assignedVolunteerIds || []).forEach(id => eventAssignedVolunteers.add(id));
    });

    // Candidates: Not assigned to this event
    const eligibleCandidates = volunteers.filter(v => !eventAssignedVolunteers.has(v.id)).map(v => {
      const matchingSkills = (v.skills || []).filter(s => roleSkills.includes(s.toLowerCase()));
      return {
        ...v,
        matchingSkills,
        matchCount: matchingSkills.length
      };
    }).sort((a, b) => b.matchCount - a.matchCount);

    const modalHtml = `
      <div class="modal-backdrop" onclick="if(event.target === this) App.closeModal()">
        <div class="modal-box" style="max-width: 650px;">
          <div class="modal-header">
            <div>
              <h3><span>🔄</span> Rapid Backup Replacement</h3>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                Replacing <strong>${oldVolunteerName}</strong> in <strong>${roleName}</strong>
              </div>
            </div>
            <button class="modal-close-btn" onclick="App.closeModal()">&times;</button>
          </div>

          <div class="modal-body">
            <div style="padding: 10px 14px; background: var(--status-red-bg); border: 1px solid var(--status-red-border); border-radius: var(--radius-md); font-size: 0.825rem; color: var(--status-red-text); margin-bottom: 16px;">
              🚨 <strong>Drop-out Resolution:</strong> Select an available student volunteer to take over this assignment. Overlap prevention ensures only unassigned volunteers are shown.
            </div>

            <div style="max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
              ${eligibleCandidates.length === 0 ? `
                <div style="text-align: center; padding: 24px; color: var(--text-muted);">
                  No unassigned volunteers currently available in roster.
                </div>
              ` : eligibleCandidates.map(c => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--bg-surface);">
                  <div style="flex: 1; margin-right: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <strong style="color: var(--navy-900); font-size: 0.9rem;">${c.name}</strong>
                      <span style="font-size: 0.75rem; color: var(--text-muted);">(${c.major})</span>
                      ${c.matchCount > 0 ? `
                        <span class="badge badge-green" style="font-size: 0.65rem; padding: 1px 6px;">
                          ${c.matchCount} skill match
                        </span>
                      ` : ''}
                    </div>

                    <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 2px;">
                      Availability: <strong>${c.availability}</strong> &bull; Phone: ${c.phone}
                    </div>

                    <div style="display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap;">
                      ${(c.skills || []).map(s => {
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
                    <button 
                      class="btn btn-primary btn-sm"
                      onclick="OperationsView.handleExecuteReplacement('${eventId}', '${roleId}', '${oldVolunteerId}', '${c.id}', '${c.name}')"
                    >
                      Assign as Backup &rarr;
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          </div>
        </div>
      </div>
    `;
    App.openModal(modalHtml);
  },

  async handleExecuteReplacement(eventId, roleId, oldVolunteerId, newVolunteerId, newVolunteerName) {
    const res = await GatherlyStorage.replaceVolunteer(eventId, roleId, oldVolunteerId, newVolunteerId, "Rapid emergency replacement");
    if (res.success) {
      App.closeModal();
      App.showToast(`Backup volunteer ${newVolunteerName} assigned and checked in!`, "success");
      await AppRouter.refreshCurrentView();
      await App.updateQuickPills();
    } else {
      App.showToast(res.error || "Replacement failed", "error");
    }
  }
};
