/**
 * Gatherly - Dashboard View
 * Old high-signal setup layout rendered with the new modern, professional
 * dark navy & deep blue enterprise analytics color scheme and look.
 *
 * Structure:
 * 1. Header with organization details, status badge, and "New Event" action.
 * 2. 4 Key Stat Cards (Upcoming Events, Registered Volunteers, Open Positions, Coverage).
 * 3. Main 2-Column Grid:
 *    - Left: Upcoming Events table with coverage progress & "Manage →" action.
 *    - Right: Priority Staffing Alerts with urgency badges & "Fill →" action.
 * 4. Quick Navigation Row (Staffing Matrix, AI Copilot, Volunteer Directory).
 */

const DashboardView = {
  async render() {
    const data = await GatherlyStorage.getAllData();
    const stats = data.stats || {};
    const alerts = data.alerts || [];
    const events = data.events || [];

    // Coverage status & progress bar gradient
    let progressGrad = "linear-gradient(90deg, #EC4899, #F43F5E)";
    let coverageBadgeStyle = "background: rgba(236,72,153,0.18); color: #F472B6; border: 1px solid rgba(236,72,153,0.4);";
    if (stats.coveragePercentage >= 85) {
      progressGrad = "linear-gradient(90deg, #00E5FF, #2DD4BF, #10B981)";
      coverageBadgeStyle = "background: rgba(0,229,255,0.18); color: #00E5FF; border: 1px solid rgba(0,229,255,0.4);";
    } else if (stats.coveragePercentage >= 50) {
      progressGrad = "linear-gradient(90deg, #00E5FF, #3B82F6, #A855F7)";
      coverageBadgeStyle = "background: rgba(168,85,247,0.18); color: #C084FC; border: 1px solid rgba(168,85,247,0.4);";
    }

    const upcomingEvents = events.filter(e => e.status === "Upcoming").slice(0, 4);

    // Filter to top priority alerts (prioritize urgent, limit to 3 for clean scannability)
    const urgentAlerts = alerts.filter(a => a.severity === "urgent" || a.level === "URGENT" || a.level === "CRITICAL");
    const displayAlerts = (urgentAlerts.length > 0 ? urgentAlerts : alerts).slice(0, 3);

    return `
      <div class="enterprise-dashboard">
        
        <!-- ==================================================================== -->
        <!-- VIEW HEADER                                                          -->
        <!-- ==================================================================== -->
        <div class="ent-header">
          <div class="ent-title-group">
            <h2>
              <span style="color: #00E5FF;">⚡</span>
              Dashboard
            </h2>
            <p>
              ${data.organization?.name || 'Association for Information Systems (AIS)'} &bull; ${data.organization?.term || 'Fall 2026'} Operations Center
            </p>
          </div>
          <div class="ent-header-actions">
            <div class="ent-pill-badge">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #00E5FF; box-shadow: 0 0 8px #00E5FF;"></span>
              Fall 2026 &bull; Real-time Synced
            </div>
            <button class="btn btn-primary" onclick="App.openCreateEventModal()">
              <span>➕</span> New Event
            </button>
          </div>
        </div>

        <!-- ==================================================================== -->
        <!-- 4 KEY STAT CARDS (OLD SETUP WITH NEW DEEP BLUE COLOR SCHEME)         -->
        <!-- ==================================================================== -->
        <div class="ent-stats-grid">
          
          <!-- Card 1: Upcoming Events -->
          <div class="ent-stat-card ent-panel-1">
            <div class="ent-stat-header">
              <span class="ent-stat-title">Upcoming Events</span>
              <div class="ent-stat-icon cyan">📅</div>
            </div>
            <div class="ent-stat-num">${stats.upcomingEvents}</div>
            <div class="ent-stat-subtext">
              <span style="color: #00E5FF;">●</span> Active on schedule
            </div>
          </div>

          <!-- Card 2: Registered Volunteers -->
          <div class="ent-stat-card ent-panel-2">
            <div class="ent-stat-header">
              <span class="ent-stat-title">Registered Volunteers</span>
              <div class="ent-stat-icon purple">👥</div>
            </div>
            <div class="ent-stat-num">${stats.totalVolunteers}</div>
            <div class="ent-stat-subtext">
              <span style="color: #C084FC;">●</span> Active club roster
            </div>
          </div>

          <!-- Card 3: Open Positions -->
          <div class="ent-stat-card ent-panel-3">
            <div class="ent-stat-header">
              <span class="ent-stat-title">Open Positions</span>
              <div class="ent-stat-icon ${stats.openPositions > 0 ? 'pink' : 'turquoise'}">
                ${stats.openPositions > 0 ? '⚠️' : '✓'}
              </div>
            </div>
            <div class="ent-stat-num" style="color: ${stats.openPositions > 0 ? '#F472B6' : '#2DD4BF'};">
              ${stats.openPositions}
            </div>
            <div class="ent-stat-subtext" style="color: #FFFFFF !important;">
              <span style="color: ${stats.openPositions > 0 ? '#F472B6' : '#2DD4BF'};">●</span>
              <span style="color: #FFFFFF !important; font-weight: 600;">${stats.openPositions > 0 ? `${stats.openPositions} volunteers needed` : 'All positions filled'}</span>
            </div>
          </div>

          <!-- Card 4: Staffing Coverage -->
          <div class="ent-stat-card ent-panel-5">
            <div class="ent-stat-header">
              <span class="ent-stat-title">Staffing Coverage</span>
              <div class="ent-stat-icon turquoise">📊</div>
            </div>
            <div style="display: flex; align-items: baseline; gap: 8px;">
              <div class="ent-stat-num" style="color: #00E5FF;">${stats.coveragePercentage}%</div>
              <span class="ent-badge-pill" style="${coverageBadgeStyle}">
                ${stats.totalAssignedPositions}/${stats.totalRequiredPositions}
              </span>
            </div>
            <div style="margin-top: 10px;">
              <div style="height: 7px; width: 100%; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; width: ${stats.coveragePercentage}%; background: ${progressGrad}; border-radius: 4px;"></div>
              </div>
            </div>
          </div>

        </div>

        <!-- ==================================================================== -->
        <!-- MAIN DASHBOARD GRID: UPCOMING EVENTS & PRIORITY ALERTS              -->
        <!-- ==================================================================== -->
        <div class="ent-dashboard-grid">
          
          <!-- LEFT: UPCOMING EVENTS TABLE -->
          <div class="ent-card ent-panel-4">
            <div class="ent-card-header">
              <h3>
                <span style="color: #60A5FA;">📌</span>
                Upcoming Events
              </h3>
              <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.35); color: #93C5FD;" onclick="AppRouter.navigate('events')">
                View All &rarr;
              </button>
            </div>
            <div class="card-body" style="padding: 0;">
              <div class="table-responsive">
                <table class="ent-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date &amp; Location</th>
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
                      
                      let barGrad = "linear-gradient(90deg, #00E5FF, #2DD4BF)";
                      let statusDot = "🟢";
                      let dotColor = "#00E5FF";
                      
                      if (pct < 50) {
                        barGrad = "linear-gradient(90deg, #EC4899, #F43F5E)";
                        statusDot = "🔴";
                        dotColor = "#EC4899";
                      } else if (pct < 100) {
                        barGrad = "linear-gradient(90deg, #3B82F6, #A855F7)";
                        statusDot = "🟡";
                        dotColor = "#F59E0B";
                      }

                      return `
                        <tr>
                          <td>
                            <div style="font-weight: 700; color: #FFFFFF; font-size: 0.9rem;">${ev.title}</div>
                            <span class="ent-badge-pill ent-badge-cyan" style="font-size: 0.65rem; padding: 1px 6px; margin-top: 3px;">
                              ${ev.category}
                            </span>
                          </td>
                          <td>
                            <div style="font-size: 0.825rem; font-weight: 600; color: #E2E8F0;">${ev.date}</div>
                            <div style="font-size: 0.75rem; color: #94A3B8;">${ev.location}</div>
                          </td>
                          <td style="min-width: 140px;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 700; margin-bottom: 4px;">
                              <span style="color: ${dotColor};">${statusDot} ${ass}/${req}</span>
                              <span style="color: #94A3B8;">${pct}%</span>
                            </div>
                            <div style="height: 6px; width: 100%; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                              <div style="height: 100%; width: ${pct}%; background: ${barGrad}; border-radius: 3px;"></div>
                            </div>
                          </td>
                          <td style="text-align: right;">
                            <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.15); color: #E2E8F0;" onclick="App.goToEventStaffing('${ev.id}')">
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

          <!-- RIGHT: PRIORITY STAFFING ALERTS -->
          <div class="ent-card ent-panel-6">
            <div class="ent-card-header">
              <h3>
                <span style="color: #EC4899;">⚡</span>
                Priority Alerts
                ${urgentAlerts.length > 0 ? `
                  <span class="ent-badge-pill ent-badge-pink" style="font-size: 0.65rem; padding: 2px 6px; margin-left: 6px;">
                    ${urgentAlerts.length} Urgent
                  </span>
                ` : ''}
              </h3>
              <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; background: rgba(168, 85, 247, 0.15); border-color: rgba(168, 85, 247, 0.35); color: #D8B4FE;" onclick="AppRouter.navigate('staffing')">
                Board &rarr;
              </button>
            </div>
            <div class="ent-card-body">
              <div class="alerts-list">
                ${displayAlerts.length === 0 ? `
                  <div style="text-align: center; padding: 28px 12px; color: #2DD4BF;">
                    <div style="font-size: 2rem; margin-bottom: 6px;">✅</div>
                    <strong style="font-size: 0.9rem; color: #FFFFFF;">Roster is in great shape</strong>
                    <p style="font-size: 0.775rem; color: #94A3B8; margin-top: 2px;">No urgent shortages detected.</p>
                  </div>
                ` : displayAlerts.map(alt => {
                  const isUrgent = alt.severity === "urgent" || alt.level === "CRITICAL" || alt.level === "URGENT";
                  return `
                    <div class="ent-alert-item ${isUrgent ? 'urgent' : 'warning'}">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="font-size: 0.825rem; color: #FFFFFF;">${alt.title}</strong>
                        <span class="ent-badge-pill ${isUrgent ? 'ent-badge-pink' : 'ent-badge-purple'}" style="font-size: 0.625rem; padding: 1px 6px;">
                          ${alt.level}
                        </span>
                      </div>
                      <div style="font-size: 0.75rem; color: #94A3B8; margin-top: 2px;">
                        📌 ${alt.event} &bull; ${alt.date}
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                        <span style="font-size: 0.75rem; color: #FFFFFF !important; font-weight: 700; text-shadow: 0 0 8px rgba(0,229,255,0.4);">
                          ${alt.remaining ? `${alt.remaining} volunteers needed` : 'Action required'}
                        </span>
                        <button 
                          class="btn btn-sm btn-secondary" 
                          style="padding: 2px 8px; font-size: 0.725rem; background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15); color: #E2E8F0;"
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

        <!-- ==================================================================== -->
        <!-- QUICK NAVIGATION ROW (3 CARDS IN DEEP BLUE ENTERPRISE STYLING)       -->
        <!-- ==================================================================== -->
        <div class="ent-nav-grid">
          
          <div 
            class="ent-nav-card ent-panel-1"
            onclick="AppRouter.navigate('staffing')"
          >
            <div class="ent-stat-icon cyan" style="font-size: 1.25rem;">📋</div>
            <div>
              <strong style="color: #FFFFFF; font-size: 0.9rem; display: block;">Staffing Matrix</strong>
              <span style="font-size: 0.75rem; color: #94A3B8;">Assign volunteers &amp; track open quotas</span>
            </div>
          </div>

          <div 
            class="ent-nav-card ent-panel-2"
            onclick="AppRouter.navigate('copilot')"
          >
            <div class="ent-stat-icon purple" style="font-size: 1.25rem;">🤖</div>
            <div>
              <strong style="color: #FFFFFF; font-size: 0.9rem; display: block;">AI Staffing Copilot</strong>
              <span style="font-size: 0.75rem; color: #94A3B8;">Smart recommendations &amp; gap analysis</span>
            </div>
          </div>

          <div 
            class="ent-nav-card ent-panel-5"
            onclick="AppRouter.navigate('volunteers')"
          >
            <div class="ent-stat-icon turquoise" style="font-size: 1.25rem;">👥</div>
            <div>
              <strong style="color: #FFFFFF; font-size: 0.9rem; display: block;">Volunteer Directory</strong>
              <span style="font-size: 0.75rem; color: #94A3B8;">Browse skills &amp; availability schedules</span>
            </div>
          </div>

        </div>

      </div>
    `;
  }
};
