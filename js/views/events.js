/**
 * Gatherly - My Events View
 * Displays all events with search, category filters, staffing stats,
 * and working "Create New Event" modal with dynamic roles.
 */

const EventsView = {
  currentFilter: "all",
  searchQuery: "",

  async render() {
    const events = await GatherlyStorage.getEvents();
    
    // Apply filters
    const filteredEvents = events.filter(ev => {
      const matchSearch = !this.searchQuery || 
        ev.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        ev.location.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        ev.category.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchFilter = this.currentFilter === "all" || 
        (this.currentFilter === "upcoming" && ev.status === "Upcoming") ||
        (this.currentFilter === "past" && ev.status === "Past");

      return matchSearch && matchFilter;
    });

    return `
      <!-- HEADER BAR -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--navy-900); letter-spacing: -0.5px;">My Events</h2>
          <p style="font-size: 0.875rem; color: var(--text-muted);">
            Manage your student organization's event roster, track role quotas, and organize staffing teams.
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
            <option value="upcoming" ${this.currentFilter === 'upcoming' ? 'selected' : ''}>Upcoming Events</option>
            <option value="past" ${this.currentFilter === 'past' ? 'selected' : ''}>Past Events</option>
          </select>
        </div>
      </div>

      <!-- EVENTS CARDS GRID -->
      ${filteredEvents.length === 0 ? `
        <div class="card" style="text-align: center; padding: 48px 24px;">
          <div style="font-size: 3rem; margin-bottom: 12px;">📅</div>
          <h3 style="font-size: 1.15rem; color: var(--navy-900); margin-bottom: 6px;">No events found</h3>
          <p style="color: var(--text-muted); font-size: 0.875rem; max-width: 400px; margin: 0 auto 16px;">
            Try adjusting your search criteria or create your first student organization event now.
          </p>
          <button class="btn btn-primary" onclick="App.openCreateEventModal()">
            <span>➕</span> Create Event
          </button>
        </div>
      ` : `
        <div class="events-grid">
          ${filteredEvents.map(ev => {
            const roles = ev.roles || [];
            const req = roles.reduce((sum, r) => sum + parseInt(r.required || 0), 0);
            const ass = roles.reduce((sum, r) => sum + (r.assignedVolunteerIds || []).length, 0);
            const pct = req > 0 ? Math.round((ass / req) * 100) : 100;
            
            let statusBadge = "badge-green";
            let barColor = "green";
            let statusText = "Fully Staffed";
            
            if (pct < 50) {
              statusBadge = "badge-red";
              barColor = "red";
              statusText = "Critical Gaps";
            } else if (pct < 100) {
              statusBadge = "badge-amber";
              barColor = "amber";
              statusText = "Partial Coverage";
            }

            return `
              <div class="event-card">
                <div class="event-card-top">
                  <div>
                    <span class="badge badge-blue" style="margin-bottom: 6px;">${ev.category}</span>
                    <h3 class="event-card-title">${ev.title}</h3>
                  </div>
                  <span class="badge ${statusBadge}">
                    <span class="badge-dot"></span> ${statusText}
                  </span>
                </div>

                <div class="event-card-meta">
                  <div class="event-meta-row">
                    <span>📅</span>
                    <strong>${ev.date}</strong> &bull; <span>${ev.time}</span>
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

                <div style="display: flex; gap: 8px; margin-top: auto;">
                  <button class="btn btn-primary" style="flex: 1;" onclick="App.goToEventStaffing('${ev.id}')">
                    <span>📋</span> Manage Staffing
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

  handleFilterChange(filter) {
    this.currentFilter = filter;
    AppRouter.refreshCurrentView();
  }
};
