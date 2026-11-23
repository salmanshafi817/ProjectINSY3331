/**
 * Gatherly - Dashboard View
 * High-signal, clean, uncluttered operations center.
 * Displays only key information so the user can easily scan and navigate.
 */

const DashboardView = {
  async render() {
    const data = await GatherlyStorage.getAllData();
    const stats = data.stats || {};
    const alerts = data.alerts || [];
    const events = data.events || [];

    // Coverage status color
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

    // Filter to top priority alerts (prioritize urgent, limit to 3 for clean scannability)
    const urgentAlerts = alerts.filter(a => a.severity === "urgent" || a.level === "URGENT" || a.level === "CRITICAL");
    const displayAlerts = (urgentAlerts.length > 0 ? urgentAlerts : alerts).slice(0, 3);

    return `
      <!-- CLEAN VIEW HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--navy-900); letter-spacing: -0.3px;">Dashboard</h2>
          <p style="font-size: 0.825rem; color: var(--text-muted); margin-top: 2px;">
            ${data.organization?.name || 'Student Organization'} &bull; ${data.organization?.term || 'Current Term'}
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" onclick="App.openCreateEventModal()">
            <span>➕</span> New Event
          </button>
        </div>
      </div>

      <!-- 4 KEY STAT CARDS (CLEAN & MINIMAL) -->
      <div class="stats-grid">
        <!-- Upcoming Events -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Upcoming Events</span>
            <div class="stat-icon blue">📅</div>
          </div>
          <div class="stat-value">${stats.upcomingEvents}</div>
          <div class="stat-subtext">Active on schedule</div>
        </div>

        <!-- Total Volunteers -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Registered Volunteers</span>
            <div class="stat-icon blue">👥</div>
          </div>
          <div class="stat-value">${stats.totalVolunteers}</div>
          <div class="stat-subtext">Active club roster</div>
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
          <div class="stat-subtext">${stats.openPositions > 0 ? 'Slots needing volunteers' : 'All positions filled'}</div>
        </div>

        <!-- Staffing Coverage Percentage -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Staffing Coverage</span>
            <div class="stat-icon ${progressColorClass}">📊</div>
          </div>
          <div style="display: flex; align-items: baseline; gap: 8px;">
            <div class="stat-value">${stats.coveragePercentage}%</div>
            <span class="badge ${coverageBadgeClass}">${stats.totalAssignedPositions}/${stats.totalRequiredPositions}</span>
          </div>
          <div style="margin-top: 8px;">
            <div class="progress-container" style="height: 6px;">
              <div class="progress-bar ${progressColorClass}" style="width: ${stats.coveragePercentage}%;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT: UPCOMING EVENTS & HIGH-PRIORITY ALERTS -->
      <div class="dashboard-grid">
        <!-- LEFT: UPCOMING EVENTS (STREAMLINED) -->
        <div class="card">
          <div class="card-header">
            <h3><span>📌</span> Upcoming Events</h3>
            <button class="btn btn-secondary btn-sm" onclick="AppRouter.navigate('events')">
              View All &rarr;
            </button>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date & Location</th>
                    <th>Coverage</th>
                    <th style="text-align: right;">Action</th>
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
                    let statusDot = "🟢";
                    
                    if (pct < 50) {
                      statusBadge = "badge-red";
                      barColor = "red";
                      statusDot = "🔴";
                    } else if (pct < 100) {
                      statusBadge = "badge-amber";
                      barColor = "amber";
                      statusDot = "🟡";
                    }

                    return `
                      <tr>
                        <td>
                          <div style="font-weight: 700; color: var(--navy-900); font-size: 0.9rem;">${ev.title}</div>
                          <span class="badge badge-gray" style="font-size: 0.7rem; padding: 1px 6px; margin-top: 3px;">${ev.category}</span>
                        </td>
                        <td>
                          <div style="font-size: 0.825rem; font-weight: 600; color: var(--navy-800);">${ev.date}</div>
                          <div style="font-size: 0.75rem; color: var(--text-muted);">${ev.location}</div>
                        </td>
                        <td style="min-width: 130px;">
                          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; margin-bottom: 4px;">
                            <span>${statusDot} ${ass}/${req}</span>
                            <span>${pct}%</span>
                          </div>
                          <div class="progress-container" style="height: 6px;">
                            <div class="progress-bar ${barColor}" style="width: ${pct}%;"></div>
                          </div>
                        </td>
                        <td style="text-align: right;">
                          <button class="btn btn-secondary btn-sm" onclick="App.goToEventStaffing('${ev.id}')">
                            Manage &rarr;
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

        <!-- RIGHT: PRIORITY STAFFING ALERTS (CONCISE) -->
        <div class="card">
          <div class="card-header">
            <h3>
              <span>⚡</span> Priority Alerts
              ${urgentAlerts.length > 0 ? `
                <span class="badge badge-red" style="font-size: 0.65rem; padding: 2px 6px;">${urgentAlerts.length} Urgent</span>
              ` : ''}
            </h3>
            <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 3px 8px;" onclick="AppRouter.navigate('staffing')">
              Staffing Board &rarr;
            </button>
          </div>
          <div class="card-body">
            <div class="alerts-list">
              ${displayAlerts.length === 0 ? `
                <div style="text-align: center; padding: 28px 12px; color: var(--status-green-text);">
                  <div style="font-size: 2rem; margin-bottom: 6px;">✅</div>
                  <strong style="font-size: 0.9rem;">Roster is in great shape</strong>
                  <p style="font-size: 0.775rem; color: var(--text-muted); margin-top: 2px;">No urgent shortages detected.</p>
                </div>
              ` : displayAlerts.map(alt => {
                const isUrgent = alt.severity === "urgent" || alt.level === "CRITICAL" || alt.level === "URGENT";
                return `
                  <div class="alert-item ${isUrgent ? 'urgent' : 'warning'}" style="padding: 10px 12px; gap: 2px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <strong style="font-size: 0.825rem; color: var(--navy-900);">${alt.title}</strong>
                      <span class="badge ${isUrgent ? 'badge-red' : 'badge-amber'}" style="font-size: 0.6rem; padding: 1px 5px;">
                        ${alt.level}
                      </span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                      📌 ${alt.event} &bull; ${alt.date}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                      <span style="font-size: 0.75rem; color: ${isUrgent ? 'var(--status-red-solid)' : 'var(--status-amber-solid)'}; font-weight: 600;">
                        ${alt.remaining ? `${alt.remaining} needed` : 'Action required'}
                      </span>
                      <button 
                        class="btn btn-sm btn-secondary" 
                        style="padding: 3px 8px; font-size: 0.725rem;"
                        onclick="App.goToEventStaffing('${alt.eventId}')"
                      >
                        Fill &rarr;
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- QUICK NAVIGATION BAR (CLEAN 3-CARD ROW) -->
      <div style="margin-top: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
        <div 
          class="card" 
          style="padding: 16px 18px; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease;"
          onclick="AppRouter.navigate('staffing')"
          onmouseover="this.style.transform='translateY(-2px)'"
          onmouseout="this.style.transform='translateY(0)'"
        >
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="stat-icon blue" style="width: 40px; height: 40px; font-size: 1.2rem;">📋</div>
            <div>
              <strong style="color: var(--navy-900); font-size: 0.9rem; display: block;">Staffing Matrix</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Assign volunteers & track open quotas</span>
            </div>
          </div>
        </div>

        <div 
          class="card" 
          style="padding: 16px 18px; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease;"
          onclick="AppRouter.navigate('copilot')"
          onmouseover="this.style.transform='translateY(-2px)'"
          onmouseout="this.style.transform='translateY(0)'"
        >
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="stat-icon blue" style="width: 40px; height: 40px; font-size: 1.2rem;">🤖</div>
            <div>
              <strong style="color: var(--navy-900); font-size: 0.9rem; display: block;">AI Staffing Copilot</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Smart recommendations & gap analysis</span>
            </div>
          </div>
        </div>

        <div 
          class="card" 
          style="padding: 16px 18px; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease;"
          onclick="AppRouter.navigate('volunteers')"
          onmouseover="this.style.transform='translateY(-2px)'"
          onmouseout="this.style.transform='translateY(0)'"
        >
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="stat-icon blue" style="width: 40px; height: 40px; font-size: 1.2rem;">👥</div>
            <div>
              <strong style="color: var(--navy-900); font-size: 0.9rem; display: block;">Volunteer Directory</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Browse skills & availability schedules</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
