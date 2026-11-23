/**
 * Gatherly - Volunteer Management View
 * Displays volunteer names, skills, availability, assignment status,
 * and working "Add Volunteer" modal.
 */

const VolunteersView = {
  searchQuery: "",
  skillFilter: "all",
  statusFilter: "all",

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
      <!-- HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--navy-900); letter-spacing: -0.5px;">Volunteer Directory</h2>
          <p style="font-size: 0.875rem; color: var(--text-muted);">
            Manage student volunteer profiles, verified skills, scheduling availability, and live assignments.
          </p>
        </div>
        <div>
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
        <div class="card" style="text-align: center; padding: 48px 24px;">
          <div style="font-size: 3rem; margin-bottom: 12px;">👥</div>
          <h3 style="font-size: 1.15rem; color: var(--navy-900); margin-bottom: 6px;">No volunteers found</h3>
          <p style="color: var(--text-muted); font-size: 0.875rem; max-width: 400px; margin: 0 auto 16px;">
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
                    <p>${v.major}</p>
                  </div>
                  <span class="badge ${isAssigned ? 'badge-blue' : 'badge-green'}">
                    <span class="badge-dot"></span>
                    ${isAssigned ? `Assigned (${myAssignments.length})` : 'Available'}
                  </span>
                </div>

                <div class="volunteer-detail-row">
                  <span style="color: var(--text-muted);">Availability:</span>
                  <strong>${v.availability}</strong>
                </div>

                <div class="volunteer-detail-row">
                  <span style="color: var(--text-muted);">Max Weekly Hours:</span>
                  <span>${v.maxHoursPerWeek} hrs</span>
                </div>

                <div class="volunteer-detail-row">
                  <span style="color: var(--text-muted);">Contact:</span>
                  <span style="font-size: 0.775rem;">${v.email}</span>
                </div>

                <!-- SKILLS CHIPS -->
                <div style="margin-top: 10px;">
                  <span style="font-size: 0.725rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--navy-600);">
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
                  <div style="background-color: var(--bg-subtle); border-radius: var(--radius-sm); padding: 8px 10px; margin-top: auto; font-size: 0.775rem;">
                    <strong style="color: var(--navy-900); display: block; margin-bottom: 4px;">Current Assignments:</strong>
                    ${myAssignments.map(a => `
                      <div style="color: var(--navy-700); margin-bottom: 2px;">
                        &bull; <strong>${a.roleName}</strong> @ ${a.eventTitle.substring(0, 20)}...
                        ${a.checkStatus === 'checked_in' ? '<span style="color: var(--status-green-solid); font-weight: 700;"> (✓ On Duty)</span>' : (a.checkStatus === 'missing' ? '<span style="color: var(--status-red-solid); font-weight: 700;"> (🚨 Missing)</span>' : '')}
                      </div>
                    `).join('')}
                  </div>
                ` : `
                  <div style="background-color: var(--status-green-bg); border-radius: var(--radius-sm); padding: 8px 10px; margin-top: auto; font-size: 0.775rem; color: var(--status-green-text);">
                    <span>Ready for event assignment</span>
                  </div>
                `}
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
  }
};
