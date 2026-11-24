/**
 * Gatherly - My Events View
 * Displays all events with search, category & status filters, staffing stats,
 * and working "Create New Event", "Reschedule Event", and "Cancel Event" workflows.
 */

const EventsView = {
  currentFilter: "all",
  searchQuery: "",
  lastCanceledEvent: null,

  async render() {
    const events = await GatherlyStorage.getEvents();
    const upcomingCount = events.filter(e => e.status === "Upcoming" || e.status === "In-Progress").length;
    const canceledCount = events.filter(e => e.status === "Canceled").length;
    const pastCount = events.filter(e => e.status === "Past" || e.status === "Completed").length;
    
    // Apply filters
    const filteredEvents = events.filter(ev => {
      const matchSearch = !this.searchQuery || 
        ev.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        ev.location.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        ev.category.toLowerCase().includes(this.searchQuery.toLowerCase());

      const isUpcoming = ev.status === "Upcoming" || ev.status === "In-Progress";
      const isCanceled = ev.status === "Canceled";
      const isPast = ev.status === "Past" || ev.status === "Completed";

      const matchFilter = this.currentFilter === "all" || 
        (this.currentFilter === "upcoming" && isUpcoming) ||
        (this.currentFilter === "canceled" && isCanceled) ||
        (this.currentFilter === "past" && isPast);

      return matchSearch && matchFilter;
    });

    return `
      <!-- HEADER BAR -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">My Events</h2>
          <p style="font-size: 0.875rem; color: var(--text-muted);">
            Manage your student organization's event roster, track role quotas, reschedule dates, and organize staffing teams.
          </p>
        </div>
        <div>
          <button class="btn btn-primary" onclick="App.openCreateEventModal()">
            <span>➕</span> Create New Event
          </button>
        </div>
      </div>

      <!-- SEARCH & FILTER BAR -->
      <div class="filter-bar">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search events by title, category, or location..."
            value="${this.searchQuery}"
            oninput="EventsView.handleSearch(this.value)"
          />
        </div>
        <div class="filter-group">
          <select class="filter-select" onchange="EventsView.handleFilterChange(this.value)">
            <option value="all" ${this.currentFilter === 'all' ? 'selected' : ''}>All Events (${events.length})</option>
            <option value="upcoming" ${this.currentFilter === 'upcoming' ? 'selected' : ''}>Upcoming Events (${upcomingCount})</option>
            <option value="canceled" ${this.currentFilter === 'canceled' ? 'selected' : ''}>Canceled Events (${canceledCount})</option>
            <option value="past" ${this.currentFilter === 'past' ? 'selected' : ''}>Past / Completed (${pastCount})</option>
          </select>
        </div>
      </div>

      <!-- EVENTS CARDS GRID -->
      ${filteredEvents.length === 0 ? `
        <div class="card" style="text-align: center; padding: 48px 24px;">
          <div style="font-size: 3rem; margin-bottom: 12px;">📅</div>
          <h3 style="font-size: 1.15rem; color: #FFFFFF; margin-bottom: 6px;">No events found</h3>
          <p style="color: var(--text-muted); font-size: 0.875rem; max-width: 400px; margin: 0 auto 16px;">
            ${this.currentFilter === 'canceled' ? 'No events are currently canceled.' : 'Try adjusting your search criteria or create your first student organization event now.'}
          </p>
          <button class="btn btn-primary" onclick="App.openCreateEventModal()">
            <span>➕</span> Create Event
          </button>
        </div>
      ` : `
        <div class="events-grid">
          ${filteredEvents.map(ev => {
            const isCanceled = ev.status === "Canceled";
            const roles = ev.roles || [];
            const req = roles.reduce((sum, r) => sum + parseInt(r.required || 0), 0);
            const ass = roles.reduce((sum, r) => sum + (r.assignedVolunteerIds || []).length, 0);
            const pct = req > 0 ? Math.round((ass / req) * 100) : 100;
            
            let statusBadge = "badge-green";
            let barColor = "green";
            let statusText = "Fully Staffed";
            
            if (isCanceled) {
              statusBadge = "badge-red";
              barColor = "red";
              statusText = "Canceled";
            } else if (pct < 50) {
              statusBadge = "badge-red";
              barColor = "red";
              statusText = "Critical Gaps";
            } else if (pct < 100) {
              statusBadge = "badge-amber";
              barColor = "amber";
              statusText = "Partial Coverage";
            }

            const latestReschedule = (ev.rescheduledHistory && ev.rescheduledHistory.length > 0)
              ? ev.rescheduledHistory[ev.rescheduledHistory.length - 1]
              : null;

            return `
              <div class="event-card" style="${isCanceled ? 'opacity: 0.88; border-color: rgba(239, 68, 68, 0.45);' : ''}">
                <div class="event-card-top">
                  <div>
                    <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 6px; flex-wrap: wrap;">
                      <span class="badge badge-blue">${ev.category}</span>
                      ${latestReschedule ? `
                        <span class="badge" style="background: rgba(0, 229, 255, 0.12); color: #00E5FF; border: 1px solid rgba(0, 229, 255, 0.3);">
                          🗓️ Rescheduled
                        </span>
                      ` : ''}
                    </div>
                    <h3 class="event-card-title">${ev.title}</h3>
                  </div>
                  <span class="badge ${statusBadge}">
                    <span class="badge-dot"></span> ${statusText}
                  </span>
                </div>

                <div class="event-card-meta">
                  <div class="event-meta-row">
                    <span>📅</span>
                    <strong style="${latestReschedule ? 'color: #00E5FF;' : ''}">${ev.date}</strong> &bull; <span>${ev.time}</span>
                  </div>
                  <div class="event-meta-row">
                    <span>📍</span>
                    <span>${ev.location}</span>
                  </div>
                  <div class="event-meta-row">
                    <span>👥</span>
                    <span>Expected Attendance: <strong>${ev.expectedAttendees}</strong> students</span>
                  </div>
                </div>

                <p class="event-card-desc">${ev.description}</p>

                ${isCanceled ? `
                  <!-- CANCELED EVENT NOTICE -->
                  <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 18px;">
                    <div style="display: flex; align-items: center; gap: 8px; color: #F87171; font-weight: 700; font-size: 0.85rem; margin-bottom: 4px;">
                      <span>⚠️</span> Event Was Canceled
                    </div>
                    <p style="font-size: 0.8rem; color: #CBD5E1; margin: 0;">
                      Reason: <em>"${ev.cancellationReason || 'Canceled by organizer'}"</em>
                    </p>
                  </div>
                ` : `
                  <!-- STAFFING PROGRESS BOX -->
                  <div class="event-staffing-box">
                    <div class="staffing-header">
                      <span>Volunteer Coverage</span>
                      <span><strong>${ass}</strong> of ${req} Staffed (${pct}%)</span>
                    </div>
                    <div class="progress-container">
                      <div class="progress-bar ${barColor}" style="width: ${pct}%;"></div>
                    </div>
                    
                    <div style="margin-top: 10px; font-size: 0.775rem; color: var(--navy-700);">
                      <strong>Roles (${roles.length}):</strong> 
                      ${roles.map(r => `${r.name} (${(r.assignedVolunteerIds||[]).length}/${r.required})`).join(', ')}
                    </div>
                  </div>
                `}

                <!-- ACTION BUTTONS -->
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: auto;">
                  ${isCanceled ? `
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                      <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="EventsView.handleRestoreEvent('${ev.id}')">
                        <span>🔄</span> Reactivate Event
                      </button>
                      <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="EventsView.openRescheduleModal('${ev.id}')">
                        <span>🗓️</span> Reschedule & Open
                      </button>
                    </div>
                  ` : `
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                      <button class="btn btn-secondary btn-sm" style="flex: 1; border-color: rgba(239, 68, 68, 0.4); color: var(--status-red-solid);" onclick="App.goToLiveOps('${ev.id}')">
                        <span>🚨</span> Live Ops
                      </button>
                      <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="App.goToEventStaffing('${ev.id}')">
                        <span>📋</span> Staffing
                      </button>
                      <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="App.goToEventCopilot('${ev.id}')">
                        <span>🤖</span> Copilot
                      </button>
                    </div>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-secondary btn-sm" style="flex: 1; background: rgba(0, 229, 255, 0.08); border-color: rgba(0, 229, 255, 0.3); color: #00E5FF;" onclick="EventsView.openRescheduleModal('${ev.id}')">
                        <span>🗓️</span> Reschedule
                      </button>
                      <button class="btn btn-secondary btn-sm" style="background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.3); color: #F87171;" onclick="EventsView.openCancelModal('${ev.id}')" title="Cancel this event">
                        <span>🚫</span> Cancel
                      </button>
                    </div>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;
  },

  handleSearch(query) {
    this.searchQuery = query;
    AppRouter.refreshCurrentView();
  },

  handleFilterChange(filter) {
    this.currentFilter = filter;
    AppRouter.refreshCurrentView();
  },

  /* ========================================================================
     RESCHEDULE MODAL & CONTROLLER
     ======================================================================== */
  async openRescheduleModal(eventId) {
    const events = await GatherlyStorage.getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const data = await GatherlyStorage.getAllData();
    const volunteers = data.volunteers || [];
    const volMap = {};
    volunteers.forEach(v => volMap[v.id] = v);

    // Get all assigned volunteers for this event
    const assignedIds = [];
    (event.roles || []).forEach(r => {
      (r.assignedVolunteerIds || []).forEach(vid => {
        if (!assignedIds.includes(vid)) assignedIds.push(vid);
      });
    });

    const modalHtml = `
      <div class="modal-backdrop" onclick="if(event.target === this) App.closeModal()">
        <div class="modal-box" style="max-width: 560px;">
          <div class="modal-header">
            <div>
              <h3><span>🗓️</span> Reschedule Event</h3>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                Update the scheduled date, time, and location for <strong>${event.title}</strong>
              </p>
            </div>
            <button class="modal-close-btn" onclick="App.closeModal()">&times;</button>
          </div>

          <div class="modal-body">
            <div style="background: rgba(0, 229, 255, 0.08); border: 1px solid rgba(0, 229, 255, 0.25); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 18px;">
              <div style="font-size: 0.8rem; color: #00E5FF; font-weight: 700; margin-bottom: 2px;">
                Current Scheduled Slot:
              </div>
              <div style="font-size: 0.875rem; color: #FFFFFF;">
                📅 <strong>${event.date}</strong> &bull; ⏰ <strong>${event.time}</strong> &bull; 📍 <strong>${event.location}</strong>
              </div>
              <div style="font-size: 0.775rem; color: #94A3B8; margin-top: 4px;">
                Assigned Team: <strong>${assignedIds.length}</strong> confirmed volunteer${assignedIds.length === 1 ? '' : 's'} on roster.
              </div>
            </div>

            <form id="reschedule-event-form" onsubmit="event.preventDefault(); EventsView.handleRescheduleSubmit('${event.id}');">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">New Event Date *</label>
                  <input 
                    type="date" 
                    id="reschedule-date" 
                    class="form-control" 
                    value="${event.date}" 
                    required 
                    onchange="EventsView.checkScheduleAdvisory('${event.id}', this.value)"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">New Event Time Range *</label>
                  <input type="text" id="reschedule-time" class="form-control" value="${event.time}" placeholder="e.g. 01:00 PM - 05:00 PM" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Location / Venue</label>
                <input type="text" id="reschedule-location" class="form-control" value="${event.location}" required />
              </div>

              <div class="form-group">
                <label class="form-label">Rescheduling Reason *</label>
                <select id="reschedule-reason-select" class="form-control" style="margin-bottom: 8px;" onchange="EventsView.handleReasonPreset(this.value)">
                  <option value="Venue / Facility Availability Conflict">Venue / Facility Availability Conflict</option>
                  <option value="Inclement Weather / Severe Conditions">Inclement Weather / Severe Conditions</option>
                  <option value="Speaker / Guest Schedule Adjustment">Speaker / Guest Schedule Adjustment</option>
                  <option value="Academic Calendar / Exam Week Shift">Academic Calendar / Exam Week Shift</option>
                  <option value="Student Organization Calendar Optimization">Student Organization Calendar Optimization</option>
                  <option value="Other">Other (Custom reason)</option>
                </select>
                <input type="text" id="reschedule-custom-reason" class="form-control" placeholder="Optional additional notes on reason..." />
              </div>

              <!-- AI AVAILABILITY PRE-CHECK ADVISORY -->
              <div id="reschedule-advisory-box" style="margin-top: 14px; display: none;"></div>

              <div class="modal-footer" style="padding: 16px 0 0; margin-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">
                  <span>✓</span> Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    App.openModal(modalHtml);
    this.checkScheduleAdvisory(eventId, event.date);
  },

  handleReasonPreset(val) {
    const custom = document.getElementById("reschedule-custom-reason");
    if (custom && val !== "Other") {
      custom.value = val;
    }
  },

  async checkScheduleAdvisory(eventId, proposedDate) {
    const box = document.getElementById("reschedule-advisory-box");
    if (!box || !proposedDate) return;

    const data = await GatherlyStorage.getAllData();
    const event = (data.events || []).find(e => e.id === eventId);
    if (!event) return;

    const volunteers = data.volunteers || [];
    const volMap = {};
    volunteers.forEach(v => volMap[v.id] = v);

    // Get all assigned volunteers
    const assignedVols = [];
    (event.roles || []).forEach(r => {
      (r.assignedVolunteerIds || []).forEach(vid => {
        if (volMap[vid] && !assignedVols.find(v => v.id === vid)) {
          assignedVols.push(volMap[vid]);
        }
      });
    });

    if (assignedVols.length === 0) {
      box.style.display = "none";
      return;
    }

    const proposedDay = CopilotEngine.getDayOfWeek(proposedDate);
    const conflicts = [];

    assignedVols.forEach(v => {
      const match = CopilotEngine.isScheduleCompatible(v.availability, proposedDate, event.time);
      if (!match.compatible) {
        conflicts.push({ volunteer: v, reason: match.reason });
      }
    });

    box.style.display = "block";
    if (conflicts.length > 0) {
      box.innerHTML = `
        <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: var(--radius-md); padding: 10px 12px;">
          <div style="display: flex; align-items: center; gap: 6px; color: #FBBF24; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">
            <span>🤖</span> AI Copilot Availability Advisory (${conflicts.length} Potential Conflict${conflicts.length > 1 ? 's' : ''})
          </div>
          <div style="font-size: 0.775rem; color: #CBD5E1; line-height: 1.4;">
            Moving to <strong>${proposedDay} (${proposedDate})</strong> may affect:
            <ul style="margin: 4px 0 0 16px; padding: 0;">
              ${conflicts.map(c => `<li><strong>${c.volunteer.name}</strong>: ${c.reason}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    } else {
      box.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: var(--radius-md); padding: 10px 12px;">
          <div style="display: flex; align-items: center; gap: 6px; color: #34D399; font-size: 0.8rem; font-weight: 700;">
            <span>✓</span> AI Copilot Pre-Check: All ${assignedVols.length} assigned volunteers appear compatible with ${proposedDay}!
          </div>
        </div>
      `;
    }
  },

  async handleRescheduleSubmit(eventId) {
    const newDate = document.getElementById("reschedule-date")?.value;
    const newTime = document.getElementById("reschedule-time")?.value.trim();
    const newLocation = document.getElementById("reschedule-location")?.value.trim();
    const reasonSelect = document.getElementById("reschedule-reason-select")?.value;
    const customReason = document.getElementById("reschedule-custom-reason")?.value.trim();
    const finalReason = customReason || reasonSelect || "Rescheduled by organizer";

    if (!newDate) {
      App.showToast("Please choose a valid date.", "error");
      return;
    }

    const res = await GatherlyStorage.rescheduleEvent(eventId, newDate, newTime, newLocation, finalReason);
    if (res.success) {
      App.closeModal();
      App.showToast(`🎉 Event rescheduled to ${newDate}!`, "success");
      await AppRouter.refreshCurrentView();
      await App.updateQuickPills();
    } else {
      App.showToast(res.error || "Failed to reschedule event", "error");
    }
  },

  /* ========================================================================
     CANCEL MODAL & CONTROLLER
     ======================================================================== */
  async openCancelModal(eventId) {
    const events = await GatherlyStorage.getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const modalHtml = `
      <div class="modal-backdrop" onclick="if(event.target === this) App.closeModal()">
        <div class="modal-box" style="max-width: 520px; border-color: rgba(239, 68, 68, 0.4);">
          <div class="modal-header">
            <div>
              <h3 style="color: #F87171;"><span>🚫</span> Cancel Event</h3>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                Are you sure you want to cancel <strong>${event.title}</strong>?
              </p>
            </div>
            <button class="modal-close-btn" onclick="App.closeModal()">&times;</button>
          </div>

          <div class="modal-body">
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 16px;">
              <div style="color: #F87171; font-weight: 700; font-size: 0.85rem; margin-bottom: 4px;">
                ⚠️ Important Notice:
              </div>
              <p style="font-size: 0.8rem; color: #CBD5E1; margin: 0; line-height: 1.45;">
                Canceling will mark this event as Canceled, relieve open volunteer quotas, and pause live check-ins. You can always reactivate or reschedule the event later.
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">Cancellation Reason *</label>
              <select id="cancel-reason-select" class="form-control" style="margin-bottom: 8px;">
                <option value="Inclement Weather / Severe Conditions">Inclement Weather / Severe Conditions</option>
                <option value="Speaker / Performer Cancellation">Speaker / Performer Cancellation</option>
                <option value="Venue / Facility Closure">Venue / Facility Closure</option>
                <option value="Insufficient Volunteer Attendance">Insufficient Volunteer Attendance</option>
                <option value="Campus Holiday / University Closure">Campus Holiday / University Closure</option>
                <option value="Other">Other reason</option>
              </select>
              <input type="text" id="cancel-custom-reason" class="form-control" placeholder="Optional notes for volunteers & chapter officers..." />
            </div>

            <div class="modal-footer" style="padding: 16px 0 0; margin-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Keep Event</button>
              <button 
                type="button" 
                class="btn btn-primary" 
                style="background: #EF4444; border-color: #EF4444;"
                onclick="EventsView.executeCancel('${event.id}')"
              >
                <span>🚫</span> Yes, Cancel Event
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    App.openModal(modalHtml);
  },

  async executeCancel(eventId) {
    const reasonSelect = document.getElementById("cancel-reason-select")?.value;
    const customReason = document.getElementById("cancel-custom-reason")?.value.trim();
    const reason = customReason || reasonSelect || "Canceled by organizer";

    const res = await GatherlyStorage.cancelEvent(eventId, reason);
    if (res.success) {
      App.closeModal();
      this.lastCanceledEvent = res.event;
      App.showToast("Event marked as Canceled", "info");
      this.showUndoCancelBanner(eventId, res.event.title);
      await AppRouter.refreshCurrentView();
      await App.updateQuickPills();
    } else {
      App.showToast(res.error || "Failed to cancel event", "error");
    }
  },

  showUndoCancelBanner(eventId, eventTitle) {
    // Remove any existing banner
    const existing = document.getElementById("undo-cancel-banner");
    if (existing) existing.remove();

    const banner = document.createElement("div");
    banner.id = "undo-cancel-banner";
    banner.style.position = "fixed";
    banner.style.bottom = "24px";
    banner.style.right = "24px";
    banner.style.zIndex = "99999";
    banner.style.background = "linear-gradient(135deg, #10214C, #0B1736)";
    banner.style.border = "1px solid rgba(239, 68, 68, 0.5)";
    banner.style.boxShadow = "0 10px 25px rgba(0,0,0,0.6)";
    banner.style.padding = "14px 18px";
    banner.style.borderRadius = "10px";
    banner.style.display = "flex";
    banner.style.alignItems = "center";
    banner.style.gap = "14px";
    banner.style.color = "#FFFFFF";
    banner.style.fontSize = "0.875rem";

    banner.innerHTML = `
      <div>
        <span>🚫</span> Canceled <strong>${eventTitle}</strong>
      </div>
      <button 
        class="btn btn-primary btn-sm" 
        style="background: #00E5FF; color: #070D1E; border: none; font-weight: 700;"
        onclick="EventsView.handleRestoreEvent('${eventId}'); document.getElementById('undo-cancel-banner')?.remove();"
      >
        <span>↩️</span> Undo Cancellation
      </button>
      <button 
        onclick="document.getElementById('undo-cancel-banner')?.remove();" 
        style="background: transparent; border: none; color: #94A3B8; cursor: pointer; font-size: 1.1rem; padding: 0 4px;"
      >
        &times;
      </button>
    `;

    document.body.appendChild(banner);

    // Auto dismiss after 10 seconds
    setTimeout(() => {
      if (banner.parentNode) banner.remove();
    }, 10000);
  },

  async handleRestoreEvent(eventId) {
    const res = await GatherlyStorage.restoreEvent(eventId);
    if (res.success) {
      App.showToast("🎉 Event reactivated successfully!", "success");
      const banner = document.getElementById("undo-cancel-banner");
      if (banner) banner.remove();
      this.lastCanceledEvent = null;
      await AppRouter.refreshCurrentView();
      await App.updateQuickPills();
    } else {
      App.showToast(res.error || "Failed to restore event", "error");
    }
  }
};

