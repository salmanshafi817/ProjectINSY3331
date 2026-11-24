/**
 * Gatherly - Volunteer Management View
 * Displays volunteer names, skills, availability, assignment status,
 * "Add Volunteer" modal, volunteer deletion with UNDO support, and detailed profile modal.
 */

const VolunteersView = {
  searchQuery: "",
  skillFilter: "all",
  statusFilter: "all",
  lastDeletedBundle: null,
  undoTimeout: null,

  async render() {
    const data = await GatherlyStorage.getAllData();
    const volunteers = data.volunteers || [];
    const events = data.events || [];

    // Map volunteer assignments across all events
    const assignmentsMap = {};
    events.forEach(ev => {
      (ev.roles || []).forEach(r => {
        (r.assignedVolunteerIds || []).forEach(vid => {
          if (!assignmentsMap[vid]) {
            assignmentsMap[vid] = [];
          }
          const checkStatus = (ev.checkIns || {})[vid]?.status;
          assignmentsMap[vid].push({
            eventId: ev.id,
            eventTitle: ev.title,
            eventDate: ev.date,
            roleName: r.name,
            checkStatus
          });
        });
      });
    });

    // Collect all unique skills for filter dropdown
    const allSkills = new Set();
    volunteers.forEach(v => (v.skills || []).forEach(s => allSkills.add(s)));

    // Filter volunteers
    const filteredVolunteers = volunteers.filter(v => {
      const assignedCount = (assignmentsMap[v.id] || []).length;
      const isAssigned = assignedCount > 0;

      const matchSearch = !this.searchQuery ||
        v.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        v.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        v.major.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (v.skills || []).some(s => s.toLowerCase().includes(this.searchQuery.toLowerCase()));

      const matchSkill = this.skillFilter === "all" || (v.skills || []).includes(this.skillFilter);

      const matchStatus = this.statusFilter === "all" ||
        (this.statusFilter === "assigned" && isAssigned) ||
        (this.statusFilter === "available" && !isAssigned);

      return matchSearch && matchSkill && matchStatus;
    });

    return `
      <!-- UNDO NOTIFICATION FLOATING BANNER (IF ACTIVE) -->
      ${this.lastDeletedBundle ? `
        <div style="background: linear-gradient(135deg, #10214C, #1E1B4B); border: 1px solid #C084FC; box-shadow: 0 10px 25px rgba(0,0,0,0.7), 0 0 15px rgba(168,85,247,0.3); border-radius: 12px; padding: 14px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; gap: 14px; animation: slideDown 0.3s ease;">
          <div style="display: flex; align-items: center; gap: 10px; color: #FFFFFF; font-size: 0.9rem;">
            <span style="font-size: 1.25rem;">🗑️</span>
            <span>Removed <strong>${this.lastDeletedBundle.volunteer.name}</strong> from roster.</span>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #A855F7, #EC4899); border: none;" onclick="VolunteersView.undoDelete()">
              <span>↩</span> Undo Removal
            </button>
            <button class="btn btn-secondary btn-sm" style="padding: 4px 8px;" onclick="VolunteersView.dismissUndo()">
              ✕
            </button>
          </div>
        </div>
      ` : ''}

      <!-- HEADER BAR -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-size: 1.55rem; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">Volunteer Directory</h2>
          <p style="font-size: 0.875rem; color: #94A3B8;">
            Manage student volunteer profiles, verified skills, scheduling availability, and live assignments.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" onclick="App.openAddVolunteerModal()">
            <span>➕</span> Register New Volunteer
          </button>
        </div>
      </div>

      <!-- FILTER & SEARCH BAR -->
      <div class="filter-bar">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search volunteers by name, skill, or major..."
            value="${this.searchQuery}"
            oninput="VolunteersView.handleSearch(this.value)"
          />
        </div>
        <div class="filter-group">
          <select class="filter-select" onchange="VolunteersView.handleSkillFilter(this.value)">
            <option value="all">All Skills (${allSkills.size})</option>
            ${Array.from(allSkills).sort().map(s => `
              <option value="${s}" ${this.skillFilter === s ? 'selected' : ''}>${s}</option>
            `).join('')}
          </select>

          <select class="filter-select" onchange="VolunteersView.handleStatusFilter(this.value)">
            <option value="all" ${this.statusFilter === 'all' ? 'selected' : ''}>All Assignment Status</option>
            <option value="available" ${this.statusFilter === 'available' ? 'selected' : ''}>Available (Unassigned)</option>
            <option value="assigned" ${this.statusFilter === 'assigned' ? 'selected' : ''}>Currently Assigned</option>
          </select>
        </div>
      </div>

      <!-- VOLUNTEERS GRID -->
      ${filteredVolunteers.length === 0 ? `
        <div class="card" style="text-align: center; padding: 48px 24px; background: linear-gradient(145deg, #10214C 0%, #0B1736 100%); border: 1px solid rgba(59, 130, 246, 0.25);">
          <div style="font-size: 3rem; margin-bottom: 12px;">👥</div>
          <h3 style="font-size: 1.15rem; color: #FFFFFF; margin-bottom: 6px;">No volunteers found</h3>
          <p style="color: #94A3B8; font-size: 0.875rem; max-width: 400px; margin: 0 auto 16px;">
            No volunteer records match your search or filter settings.
          </p>
          <button class="btn btn-secondary" onclick="VolunteersView.resetFilters()">
            Reset Filters
          </button>
        </div>
      ` : `
        <div class="volunteers-grid">
          ${filteredVolunteers.map(v => {
            const myAssignments = assignmentsMap[v.id] || [];
            const isAssigned = myAssignments.length > 0;
            const initials = v.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            return `
              <div class="volunteer-card">
                <div class="volunteer-profile-header">
                  <div class="vol-avatar">${initials}</div>
                  <div class="vol-title-info" style="flex: 1;">
                    <h4>${v.name}</h4>
                    <p style="color: #94A3B8;">${v.major}</p>
                  </div>
                  <span class="badge ${isAssigned ? 'badge-blue' : 'badge-green'}">
                    <span class="badge-dot"></span>
                    ${isAssigned ? `Assigned (${myAssignments.length})` : 'Available'}
                  </span>
                </div>

                <div class="volunteer-detail-row">
                  <span style="color: #94A3B8;">Availability:</span>
                  <strong style="color: #E2E8F0;">${v.availability}</strong>
                </div>

                <div class="volunteer-detail-row">
                  <span style="color: #94A3B8;">Max Weekly Hours:</span>
                  <span style="color: #E2E8F0;">${v.maxHoursPerWeek} hrs</span>
                </div>

                <div class="volunteer-detail-row">
                  <span style="color: #94A3B8;">Contact:</span>
                  <span style="font-size: 0.775rem; color: #00E5FF;">${v.email}</span>
                </div>

                <!-- SKILLS CHIPS -->
                <div style="margin-top: 10px;">
                  <span style="font-size: 0.725rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94A3B8;">
                    Verified Skills:
                  </span>
                  <div class="skill-chips">
                    ${(v.skills || []).map(skill => `
                      <span class="skill-chip">${skill}</span>
                    `).join('')}
                  </div>
                </div>

                <!-- ASSIGNED ROLES LIST IF ANY -->
                ${isAssigned ? `
                  <div style="background: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: var(--radius-sm); padding: 8px 10px; margin-top: 12px; font-size: 0.775rem;">
                    <strong style="color: #00E5FF; display: block; margin-bottom: 4px;">Current Assignments:</strong>
                    ${myAssignments.map(a => `
                      <div style="color: #E2E8F0; margin-bottom: 2px;">
                        &bull; <strong>${a.roleName}</strong> @ ${a.eventTitle.substring(0, 20)}...
                        ${a.checkStatus === 'checked_in' ? '<span style="color: #34D399; font-weight: 700;"> (✓ On Duty)</span>' : (a.checkStatus === 'missing' ? '<span style="color: #F87171; font-weight: 700;"> (🚨 Missing)</span>' : '')}
                      </div>
                    `).join('')}
                  </div>
                ` : `
                  <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-sm); padding: 8px 10px; margin-top: 12px; font-size: 0.775rem; color: #34D399;">
                    <span>✓ Ready for event assignment</span>
                  </div>
                `}

                <!-- CARD ACTIONS (PROFILE & DELETE WITH UNDO) -->
                <div style="display: flex; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                  <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="VolunteersView.openProfileModal('${v.id}')">
                    <span>👤</span> View Profile
                  </button>
                  <button class="btn btn-danger-outline btn-sm" style="padding: 6px 12px;" title="Delete Volunteer" onclick="VolunteersView.deleteVolunteer('${v.id}')">
                    <span>🗑️</span> Remove
                  </button>
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

  handleSkillFilter(skill) {
    this.skillFilter = skill;
    AppRouter.refreshCurrentView();
  },

  handleStatusFilter(status) {
    this.statusFilter = status;
    AppRouter.refreshCurrentView();
  },

  resetFilters() {
    this.searchQuery = "";
    this.skillFilter = "all";
    this.statusFilter = "all";
    AppRouter.refreshCurrentView();
  },

  async deleteVolunteer(volunteerId) {
    const data = await GatherlyStorage.getAllData();
    const volunteer = (data.volunteers || []).find(v => v.id === volunteerId);
    if (!volunteer) return;

    if (!confirm(`Are you sure you want to remove ${volunteer.name} from the active volunteer roster? You will have an undo option.`)) {
      return;
    }

    const result = await GatherlyStorage.deleteVolunteer(volunteerId);
    if (result.success) {
      this.lastDeletedBundle = result.deletedBundle;
      
      // Clear any prior timer and set 15-second undo window
      if (this.undoTimeout) clearTimeout(this.undoTimeout);
      this.undoTimeout = setTimeout(() => {
        this.lastDeletedBundle = null;
        AppRouter.refreshCurrentView();
      }, 15000);

      App.showToast(`Removed ${volunteer.name} from roster. Click Undo if this was an accident.`, "info");
      AppRouter.refreshCurrentView();
      App.updateQuickPills();
    } else {
      App.showToast("Failed to delete volunteer.", "error");
    }
  },

  async undoDelete() {
    if (!this.lastDeletedBundle) return;

    const bundle = this.lastDeletedBundle;
    const result = await GatherlyStorage.restoreVolunteer(bundle);
    if (result.success) {
      const volName = bundle.volunteer.name;
      this.lastDeletedBundle = null;
      if (this.undoTimeout) clearTimeout(this.undoTimeout);
      
      App.showToast(`✓ Restored ${volName} to roster with previous assignments.`, "success");
      AppRouter.refreshCurrentView();
      App.updateQuickPills();
    } else {
      App.showToast("Failed to undo deletion.", "error");
    }
  },

  dismissUndo() {
    this.lastDeletedBundle = null;
    if (this.undoTimeout) clearTimeout(this.undoTimeout);
    AppRouter.refreshCurrentView();
  },

  async openProfileModal(volunteerId) {
    const data = await GatherlyStorage.getAllData();
    const v = (data.volunteers || []).find(vol => vol.id === volunteerId);
    if (!v) return;

    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div id="active-profile-modal" class="modal-backdrop open">
        <div class="modal-box" style="max-width: 520px;">
          <div class="modal-header">
            <h3><span>👤</span> Volunteer Profile</h3>
            <button class="modal-close-btn" onclick="document.getElementById('active-profile-modal').remove()">✕</button>
          </div>
          <div class="modal-body">
            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
              <div class="vol-avatar" style="width: 56px; height: 56px; font-size: 1.4rem;">
                ${v.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
              </div>
              <div>
                <h3 style="font-size: 1.25rem; font-weight: 800; color: #FFFFFF;">${v.name}</h3>
                <p style="color: #00E5FF; font-size: 0.85rem; font-weight: 600;">${v.major}</p>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.85rem;">
              <div class="volunteer-detail-row">
                <span style="color: #94A3B8;">Email:</span>
                <span style="color: #FFFFFF;">${v.email}</span>
              </div>
              <div class="volunteer-detail-row">
                <span style="color: #94A3B8;">Phone:</span>
                <span style="color: #FFFFFF;">${v.phone || '(817) 555-0100'}</span>
              </div>
              <div class="volunteer-detail-row">
                <span style="color: #94A3B8;">Availability Schedule:</span>
                <strong style="color: #00E5FF;">${v.availability}</strong>
              </div>
              <div class="volunteer-detail-row">
                <span style="color: #94A3B8;">Max Weekly Commitment:</span>
                <strong style="color: #C084FC;">${v.maxHoursPerWeek} hrs/week</strong>
              </div>
            </div>

            <div style="margin-top: 16px;">
              <strong style="color: #FFFFFF; font-size: 0.85rem; display: block; margin-bottom: 8px;">Verified Skills:</strong>
              <div class="skill-chips">
                ${(v.skills || []).map(s => `<span class="skill-chip">${s}</span>`).join('')}
              </div>
            </div>

            ${v.notes ? `
              <div style="margin-top: 16px; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
                <strong style="color: #94A3B8; font-size: 0.75rem; text-transform: uppercase;">Coordinator Notes:</strong>
                <p style="color: #CBD5E1; font-size: 0.8rem; margin-top: 4px;">${v.notes}</p>
              </div>
            ` : ''}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('active-profile-modal').remove()">Close</button>
            <button class="btn btn-danger-outline" onclick="document.getElementById('active-profile-modal').remove(); VolunteersView.deleteVolunteer('${v.id}')">
              <span>🗑️</span> Remove Volunteer
            </button>
          </div>
        </div>
      </div>
    `;
  }
};
