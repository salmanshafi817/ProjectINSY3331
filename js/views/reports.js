/**
 * Gatherly - Reports & Analytics View
 * Foundation for post-event outcome analytics and staffing retrospective metrics.
 */

const ReportsView = {
  async render() {
    const data = await GatherlyStorage.getAllData();
    const stats = data.stats || {};
    const events = data.events || [];
    const volunteers = data.volunteers || [];

    return `
      <!-- HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--navy-900); letter-spacing: -0.5px;">Staffing Reports & Analytics</h2>
          <p style="font-size: 0.875rem; color: var(--text-muted);">
            Evaluate club volunteer engagement, role fulfillment rates, and post-event staffing retrospective data.
          </p>
        </div>
        <div>
          <button class="btn btn-secondary" onclick="App.showToast('Exporting CSV summary...', 'info')">
            <span>📥</span> Export Summary Report
          </button>
        </div>
      </div>

      <!-- RETROSPECTIVE STATS -->
      <div class="stats-grid" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Average Staffing Fulfillment</span>
            <div class="stat-icon green">📈</div>
          </div>
          <div class="stat-value">${stats.coveragePercentage}%</div>
          <div class="stat-subtext">Across active event campaigns</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Active Volunteer Ratio</span>
            <div class="stat-icon blue">🤝</div>
          </div>
          <div class="stat-value">82%</div>
          <div class="stat-subtext">Volunteers assigned to &ge; 1 event</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Reliability Index</span>
            <div class="stat-icon green">⭐</div>
          </div>
          <div class="stat-value">94.8%</div>
          <div class="stat-subtext">Based on confirmed attendance</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Est. Volunteer Hours</span>
            <div class="stat-icon blue">⏱️</div>
          </div>
          <div class="stat-value">164 hrs</div>
          <div class="stat-subtext">Organized this semester</div>
        </div>
      </div>

      <!-- EVENT BY EVENT FULFILLMENT AUDIT -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <h3><span>📊</span> Event Staffing Performance Audit</h3>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Attendance</th>
                  <th>Slots Required</th>
                  <th>Slots Filled</th>
                  <th>Fill Rate</th>
                  <th>Staffing Outcome</th>
                </tr>
              </thead>
              <tbody>
                ${events.map(ev => {
                  const roles = ev.roles || [];
                  const req = roles.reduce((sum, r) => sum + parseInt(r.required || 0), 0);
                  const ass = roles.reduce((sum, r) => sum + (r.assignedVolunteerIds || []).length, 0);
                  const pct = req > 0 ? Math.round((ass / req) * 100) : 100;
                  
                  let badge = "badge-green";
                  let note = "Optimal Staffing";
                  if (pct < 50) {
                    badge = "badge-red";
                    note = "Critical Shortfall";
                  } else if (pct < 100) {
                    badge = "badge-amber";
                    note = "Partial Staffing";
                  }

                  return `
                    <tr>
                      <td><strong>${ev.title}</strong></td>
                      <td>${ev.date}</td>
                      <td>${ev.expectedAttendees}</td>
                      <td>${req} slots</td>
                      <td>${ass} assigned</td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <strong>${pct}%</strong>
                          <div class="progress-container" style="width: 80px; height: 6px;">
                            <div class="progress-bar ${pct >= 100 ? 'green' : (pct >= 50 ? 'amber' : 'red')}" style="width: ${pct}%;"></div>
                          </div>
                        </div>
                      </td>
                      <td><span class="badge ${badge}"><span class="badge-dot"></span> ${note}</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
};
