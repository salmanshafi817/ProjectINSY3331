/**
 * Gatherly - Dashboard View
 * Displays:
 * 1. Upcoming events count & list
 * 2. Total registered volunteers
 * 3. Open staffing positions
 * 4. Staffing coverage percentage
 * 5. Recent staffing alerts (Urgent Red, Warning Amber, Complete Green)
 */

const DashboardView = {
  async render() {
    const data = await GatherlyStorage.getAllData();
    const stats = data.stats || {};
    const alerts = data.alerts || [];
    const events = data.events || [];
    const volunteers = data.volunteers || [];

    // Coverage color classification
    let coverageBadgeClass = "badge-red";
    let progressColorClass = "red";
    if (stats.coveragePercentage >= 85) {
      coverageBadgeClass = "badge-green";
      progressColorClass = "green";
    } else if (stats.coveragePercentage >= 50) {
      coverageBadgeClass = "badge-amber";
      progressColorClass = "amber";
    }

    const upcomingEvents = events.filter(e => e.status === "Upcoming").slice(0, 4);

    return `
      <!-- TOP OVERVIEW HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--navy-900); letter-spacing: -0.5px;">Operations Overview</h2>
          <p style="font-size: 0.875rem; color: var(--text-muted);">
            Real-time volunteer coverage, open positions, and proactive staffing alerts for ${data.organization?.name || 'Student Organization'}.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" onclick="AppRouter.navigate('staffing')">
            <span>📋</span> View Staffing Board
          </button>
          <button class="btn btn-primary" onclick="App.openCreateEventModal()">
            <span>➕</span> Create Event
          </button>
        </div>
      </div>

      <!-- 4 MAIN METRIC STAT CARDS -->
      <div class="stats-grid">
        <!-- Upcoming Events -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Upcoming Events</span>
            <div class="stat-icon blue">📅</div>
          </div>
          <div class="stat-value">${stats.upcomingEvents}</div>
          <div class="stat-subtext">
            <span>Next: ${upcomingEvents[0] ? upcomingEvents[0].title.substring(0, 22) + '...' : 'None'}</span>
          </div>
        </div>

        <!-- Total Volunteers -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Total Volunteers</span>
            <div class="stat-icon blue">👥</div>
          </div>
          <div class="stat-value">${stats.totalVolunteers}</div>
          <div class="stat-subtext">
            <span>Active roster & profiles</span>
          </div>
        </div>

        <!-- Open Staffing Positions -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Open Positions</span>
            <div class="stat-icon ${stats.openPositions > 0 ? 'amber' : 'green'}">⚠️</div>
          </div>
          <div class="stat-value" style="color: ${stats.openPositions > 0 ? 'var(--status-amber-solid)' : 'var(--status-green-solid)'}">
            ${stats.openPositions}
          </div>
          <div class="stat-subtext">
            <span>Across all scheduled events</span>
          </div>
        </div>

        <!-- Staffing Coverage Percentage -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Staffing Coverage</span>
            <div class="stat-icon ${progressColorClass}">📊</div>
          </div>
          <div style="display: flex; align-items: baseline; gap: 8px;">
            <div class="stat-value">${stats.coveragePercentage}%</div>
            <span class="badge ${coverageBadgeClass}">${stats.totalAssignedPositions}/${stats.totalRequiredPositions} filled</span>
          </div>
          <div style="margin-top: 10px;">
            <div class="progress-container">
              <div class="progress-bar ${progressColorClass}" style="width: ${stats.coveragePercentage}%;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN DASHBOARD SPLIT GRID -->
      <div class="dashboard-grid">
        <!-- LEFT: UPCOMING EVENTS & LIVE STAFFING STATUS -->
        <div class="card">
          <div class="card-header">
            <h3><span>📌</span> Upcoming Events & Staffing Status</h3>
            <button class="btn btn-secondary btn-sm" onclick="AppRouter.navigate('events')">
              View All Events &rarr;
            </button>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date & Location</th>
                    <th>Staffing Progress</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${upcomingEvents.map(ev => {
                    const roles = ev.roles || [];
                    const req = roles.reduce((sum, r) => sum + parseInt(r.required || 0), 0);
                    const ass = roles.reduce((sum, r) => sum + (r.assignedVolunteerIds || []).length, 0);
                    const pct = req > 0 ? Math.round((ass / req) * 100) : 100;
                    
                    let statusBadge = "badge-green";
                    let barColor = "green";
                    let label = "Fully Staffed";
                    
                    if (pct < 50) {
                      statusBadge = "badge-red";
                      barColor = "red";
                      label = "Critical Shortage";
                    } else if (pct < 100) {
                      statusBadge = "badge-amber";
                      barColor = "amber";
                      label = "Needs Volunteers";
                    }

                    return `
                      <tr>
                        <td>
                          <strong style="color: var(--navy-900); display: block; font-size: 0.925rem;">${ev.title}</strong>
                          <span style="font-size: 0.75rem; color: var(--text-muted);">${ev.category} • ${ev.expectedAttendees} expected</span>
                        </td>
                        <td>
                          <div style="font-weight: 500; font-size: 0.85rem;">${ev.date}</div>
                          <div style="font-size: 0.775rem; color: var(--text-muted);">${ev.location}</div>
                        </td>
                        <td style="min-width: 140px;">
                          <div style="display: flex; justify-content: space-between; font-size: 0.775rem; margin-bottom: 4px; font-weight: 600;">
                            <span>${ass}/${req} volunteers</span>
                            <span>${pct}%</span>
                          </div>
                          <div class="progress-container">
                            <div class="progress-bar ${barColor}" style="width: ${pct}%;"></div>
                          </div>
                        </td>
                        <td>
                          <span class="badge ${statusBadge}">
                            <span class="badge-dot"></span> ${label}
                          </span>
                        </td>
                        <td>
                          <button class="btn btn-secondary btn-sm" onclick="App.goToEventStaffing('${ev.id}')">
                            Manage Staffing
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- RIGHT: RECENT STAFFING ALERTS -->
        <div class="card">
          <div class="card-header">
            <h3>
              <span>⚡</span> Staffing Alerts
              <span class="badge badge-red" style="font-size: 0.7rem; padding: 2px 7px;">${alerts.filter(a => a.severity === 'urgent').length} Urgent</span>
            </h3>
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Auto-Detected</span>
          </div>
          <div class="card-body">
            <div class="alerts-list">
              ${alerts.length === 0 ? `
                <div style="text-align: center; padding: 24px; color: var(--text-muted);">
                  <div style="font-size: 2rem; margin-bottom: 8px;">✅</div>
                  <p>All positions are fully staffed! No active alerts.</p>
                </div>
              ` : alerts.slice(0, 5).map(alt => `
                <div class="alert-item ${alt.severity}">
                  <div class="alert-top">
                    <span class="alert-title">${alt.title}</span>
                    <span class="badge ${alt.severity === 'urgent' ? 'badge-red' : (alt.severity === 'warning' ? 'badge-amber' : 'badge-green')}" style="font-size: 0.65rem;">
                      ${alt.level}
                    </span>
                  </div>
                  <span class="alert-event-tag">📌 ${alt.event} • ${alt.date}</span>
                  <div class="alert-desc">${alt.message}</div>
                  <div style="margin-top: 6px;">
                    <button class="btn btn-sm btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="App.goToEventStaffing('${alt.eventId}')">
                      Fill Vacancy &rarr;
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
