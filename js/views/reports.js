/**
 * Gatherly - Post-Event Staffing Performance Reports View
 * Comprehensive post-event outcomes, retrospective metrics, check-in audit,
 * and AI copilot post-event takeaways.
 */

const ReportsView = {
  selectedEventId: null,

  async render() {
    const data = await GatherlyStorage.getAllData();
    const stats = data.stats || {};
    const events = data.events || [];
    const volunteers = data.volunteers || [];
    const volMap = {};
    volunteers.forEach(v => volMap[v.id] = v);

    // Calculate aggregated retrospective metrics
    let totalPlannedSlots = 0;
    let totalAssignedSlots = 0;
    let totalCheckedInSlots = 0;
    let totalMissingDropouts = 0;

    events.forEach(ev => {
      (ev.roles || []).forEach(r => {
        totalPlannedSlots += parseInt(r.required || 0);
        totalAssignedSlots += (r.assignedVolunteerIds || []).length;
      });

      const cIns = ev.checkIns || {};
      Object.values(cIns).forEach(c => {
        if (c.status === "checked_in") totalCheckedInSlots++;
        if (c.status === "missing") totalMissingDropouts++;
      });
    });

    const overallFulfillmentRate = totalPlannedSlots > 0 ? Math.round((totalAssignedSlots / totalPlannedSlots) * 100) : 100;
    const overallCheckInRate = totalAssignedSlots > 0 ? Math.round((totalCheckedInSlots / totalAssignedSlots) * 100) : 0;
    const totalHoursEst = Math.round(totalCheckedInSlots * 4.2 * 10) / 10;

    // Default selected event for detailed retrospective (prefer completed event if present)
    if (!this.selectedEventId || !events.find(e => e.id === this.selectedEventId)) {
      const completedEvt = events.find(e => e.status === "Completed");
      this.selectedEventId = completedEvt ? completedEvt.id : (events[0] ? events[0].id : null);
    }

    const selectedReport = this.selectedEventId ? await GatherlyStorage.getPostEventReport(this.selectedEventId) : null;

    return `
      <!-- HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--navy-900); letter-spacing: -0.5px;">Staffing Reports & Retrospective Analytics</h2>
          <p style="font-size: 0.875rem; color: var(--text-muted);">
            Evaluate chapter volunteer engagement, position fulfillment rates, event-day check-in attendance, and retrospective staffing insights.
          </p>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn btn-secondary" onclick="ReportsView.exportCSV()">
            <span>📥</span> Export CSV Summary
          </button>
          <button class="btn btn-primary" onclick="App.goToLiveOps('${this.selectedEventId || ''}')">
            <span>🚨</span> Open Live Operations
          </button>
        </div>
      </div>

      <!-- RETROSPECTIVE OVERVIEW STATS -->
      <div class="stats-grid" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Average Staffing Quota</span>
            <div class="stat-icon green">📈</div>
          </div>
          <div class="stat-value">${overallFulfillmentRate}%</div>
          <div class="stat-subtext">${totalAssignedSlots} of ${totalPlannedSlots} slots assigned across events</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Check-in Attendance Rate</span>
            <div class="stat-icon blue">✅</div>
          </div>
          <div class="stat-value" style="color: var(--blue-600);">${overallCheckInRate}%</div>
          <div class="stat-subtext">${totalCheckedInSlots} confirmed on-duty arrivals</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Dropout / Incident Rate</span>
            <div class="stat-icon ${totalMissingDropouts > 0 ? 'red' : 'green'}">⚠️</div>
          </div>
          <div class="stat-value" style="color: ${totalMissingDropouts > 0 ? 'var(--status-red-solid)' : 'var(--status-green-solid)'};">
            ${totalMissingDropouts}
          </div>
          <div class="stat-subtext">${totalMissingDropouts > 0 ? 'Handled with backup replacements' : 'Zero unexcused no-shows'}</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Total Hours Delivered</span>
            <div class="stat-icon blue">⏱️</div>
          </div>
          <div class="stat-value">${totalHoursEst} hrs</div>
          <div class="stat-subtext">Verified student volunteer contributions</div>
        </div>
      </div>

      <!-- EVENT BY EVENT FULFILLMENT AUDIT TABLE -->
      <div class="card" style="margin-bottom: 28px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3><span>📊</span> Event Staffing Performance Audit</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
              Cross-event comparison of planned slots, actual staffing, and event-day check-ins.
            </p>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Expected Attendance</th>
                  <th>Slots Required</th>
                  <th>Slots Filled</th>
                  <th>Checked In</th>
                  <th>Fill Rate</th>
                  <th>Staffing Outcome</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${events.map(ev => {
                  const roles = ev.roles || [];
                  const req = roles.reduce((sum, r) => sum + parseInt(r.required || 0), 0);
                  const ass = roles.reduce((sum, r) => sum + (r.assignedVolunteerIds || []).length, 0);
                  const pct = req > 0 ? Math.round((ass / req) * 100) : 100;
                  
                  const cIns = ev.checkIns || {};
                  const checkedInCount = Object.values(cIns).filter(c => c.status === "checked_in").length;

                  let badge = "badge-green";
                  let note = "Optimal Staffing";
                  if (pct < 50) {
                    badge = "badge-red";
                    note = "Critical Shortfall";
                  } else if (pct < 100) {
                    badge = "badge-amber";
                    note = "Partial Staffing";
                  }

                  const isSelected = ev.id === this.selectedEventId;

                  return `
                    <tr style="${isSelected ? 'background: #EFF6FF; border-left: 4px solid var(--blue-600);' : ''}">
                      <td>
                        <strong>${ev.title}</strong>
                        ${isSelected ? '<span class="badge badge-blue" style="font-size: 0.65rem; margin-left: 6px;">Inspecting</span>' : ''}
                      </td>
                      <td>${ev.date}</td>
                      <td>
                        <span class="badge ${ev.status === 'Completed' ? 'badge-green' : (ev.status === 'In-Progress' ? 'badge-red' : 'badge-blue')}">
                          ${ev.status}
                        </span>
                      </td>
                      <td>${ev.expectedAttendees}</td>
                      <td>${req} slots</td>
                      <td>${ass} assigned</td>
                      <td>
                        <strong style="color: var(--status-green-solid);">${checkedInCount}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">/ ${ass}</span>
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <strong>${pct}%</strong>
                          <div class="progress-container" style="width: 70px; height: 6px;">
                            <div class="progress-bar ${pct >= 100 ? 'green' : (pct >= 50 ? 'amber' : 'red')}" style="width: ${pct}%;"></div>
                          </div>
                        </div>
                      </td>
                      <td><span class="badge ${badge}"><span class="badge-dot"></span> ${note}</span></td>
                      <td style="text-align: right;">
                        <button 
                          class="btn btn-secondary btn-sm"
                          onclick="ReportsView.selectEvent('${ev.id}')"
                        >
                          View Retrospective
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

      <!-- DETAILED SINGLE EVENT RETROSPECTIVE PERFORMANCE REPORT -->
      ${selectedReport ? this.renderSelectedEventRetrospective(selectedReport) : ''}
    `;
  },

  renderSelectedEventRetrospective(report) {
    const ev = report.event;
    const s = report.summary;

    return `
      <div class="card" style="margin-bottom: 24px; border: 1px solid var(--blue-200); box-shadow: var(--shadow-hover);">
        <div class="card-header" style="background: var(--navy-900); color: #FFFFFF; border-radius: var(--radius-lg) var(--radius-lg) 0 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; padding: 20px 24px;">
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--blue-400); font-weight: 700; margin-bottom: 2px;">
              Post-Event Staffing Performance Retrospective
            </div>
            <h3 style="color: #FFFFFF; font-size: 1.35rem; margin: 0;">${ev.title}</h3>
            <p style="font-size: 0.825rem; color: #94A3B8; margin: 4px 0 0;">
              📅 ${ev.date} &bull; ⏰ ${ev.time} &bull; 📍 ${ev.location} &bull; Status: <strong>${ev.status}</strong>
            </p>
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" style="background: var(--navy-800); color: #FFFFFF; border-color: rgba(255, 255, 255, 0.2);" onclick="App.goToLiveOps('${ev.id}')">
              <span>🚨</span> Open in Ops Center
            </button>
            <button class="btn btn-primary btn-sm" onclick="App.showToast('Exporting PDF Retrospective for ${ev.title}...', 'success')">
              <span>🖨️</span> Print / PDF Report
            </button>
          </div>
        </div>

        <div class="card-body">
          <!-- METRICS HIGHLIGHTS -->
          <div class="stats-grid" style="margin-bottom: 20px;">
            <div class="stat-card" style="background: var(--bg-subtle);">
              <div class="stat-header">
                <span class="stat-title">Fulfillment Ratio</span>
                <div class="stat-icon green">🎯</div>
              </div>
              <div class="stat-value">${s.completionRate}%</div>
              <div class="stat-subtext">${s.checkedInCount} of ${s.plannedSlots} slots fulfilled</div>
            </div>

            <div class="stat-card" style="background: var(--bg-subtle);">
              <div class="stat-header">
                <span class="stat-title">Attendee-to-Staff Ratio</span>
                <div class="stat-icon blue">👥</div>
              </div>
              <div class="stat-value">
                1 : ${s.checkedInCount > 0 ? Math.round(s.actualAttendance / s.checkedInCount) : s.actualAttendance}
              </div>
              <div class="stat-subtext">${s.actualAttendance} attendees / ${s.checkedInCount} volunteers</div>
            </div>

            <div class="stat-card" style="background: var(--bg-subtle);">
              <div class="stat-header">
                <span class="stat-title">Staffing Stability Index</span>
                <div class="stat-icon ${s.noShowRate === 0 ? 'green' : 'amber'}">⭐</div>
              </div>
              <div class="stat-value" style="color: ${s.noShowRate === 0 ? 'var(--status-green-solid)' : 'var(--status-amber-solid)'};">
                ${100 - s.noShowRate}%
              </div>
              <div class="stat-subtext">${s.missingCount} volunteer dropout(s) recorded</div>
            </div>

            <div class="stat-card" style="background: var(--bg-subtle);">
              <div class="stat-header">
                <span class="stat-title">Volunteer Hours</span>
                <div class="stat-icon blue">⏱️</div>
              </div>
              <div class="stat-value">${s.hoursDelivered} hrs</div>
              <div class="stat-subtext">Estimated student service hours</div>
            </div>
          </div>

          <!-- ROLE FULFILLMENT AUDIT -->
          <h4 style="font-size: 1rem; color: var(--navy-900); font-weight: 700; margin-bottom: 12px;">
            Position-by-Position Staffing Audit
          </h4>

          <div class="table-responsive" style="margin-bottom: 20px;">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Slots Quota</th>
                  <th>Assigned</th>
                  <th>Checked In</th>
                  <th>Fulfillment Rate</th>
                  <th>Status</th>
                  <th>Roster Attendance</th>
                </tr>
              </thead>
              <tbody>
                ${report.roleFulfillment.map(r => `
                  <tr>
                    <td><strong>${r.roleName}</strong></td>
                    <td>${r.required} slots</td>
                    <td>${r.assigned}</td>
                    <td><strong style="color: var(--status-green-solid);">${r.checkedIn}</strong></td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <strong>${r.fillRate}%</strong>
                        <div class="progress-container" style="width: 70px; height: 6px;">
                          <div class="progress-bar ${r.fillRate >= 100 ? 'green' : (r.fillRate >= 70 ? 'amber' : 'red')}" style="width: ${r.fillRate}%;"></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge ${r.status === 'Optimal' ? 'badge-green' : (r.status === 'Adequate' ? 'badge-amber' : 'badge-red')}">
                        <span class="badge-dot"></span> ${r.status}
                      </span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        ${r.volunteers.map(vRec => {
                          const isCheck = vRec.checkIn?.status === "checked_in";
                          const isMissing = vRec.checkIn?.status === "missing";
                          return `
                            <span class="badge ${isCheck ? 'badge-green' : (isMissing ? 'badge-red' : 'badge-amber')}" style="font-size: 0.7rem;">
                              ${isCheck ? '✓ ' : (isMissing ? '🚨 ' : '')}${vRec.volunteer.name}
                            </span>
                          `;
                        }).join('')}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- GROUNDED AI COPILOT RETROSPECTIVE LEARNINGS -->
          <div style="background: var(--blue-50); border: 1px solid var(--blue-100); border-radius: var(--radius-md); padding: 18px 20px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 1.25rem;">🤖</span>
              <strong style="color: var(--blue-600); font-size: 0.95rem;">AI Copilot Retrospective Takeaways</strong>
            </div>
            <p style="color: var(--navy-900); font-size: 0.875rem; line-height: 1.6; margin-bottom: 0;">
              ${report.aiRetrospective}
            </p>
          </div>
        </div>
      </div>
    `;
  },

  async selectEvent(eventId) {
    this.selectedEventId = eventId;
    await AppRouter.refreshCurrentView();
  },

  async exportCSV() {
    try {
      const data = await GatherlyStorage.getAllData();
      const events = data.events || [];
      const volunteers = data.volunteers || [];
      const volMap = {};
      volunteers.forEach(v => volMap[v.id] = v);

      const rows = [
        ["Event Title", "Date", "Location", "Position", "Required Slots", "Assigned Slots", "Fulfillment Rate", "Assigned Volunteers", "Checked In Volunteers"]
      ];

      events.forEach(ev => {
        const cIns = ev.checkIns || {};
        (ev.roles || []).forEach(r => {
          const req = parseInt(r.required || 0);
          const assIds = r.assignedVolunteerIds || [];
          const ass = assIds.length;
          const fill = req > 0 ? Math.round((ass / req) * 100) : 100;
          const volNames = assIds.map(id => volMap[id]?.name || id).join("; ");
          const checkedInNames = assIds.filter(id => cIns[id]?.status === "checked_in").map(id => volMap[id]?.name || id).join("; ");

          rows.push([
            `"${ev.title.replace(/"/g, '""')}"`,
            `"${ev.date}"`,
            `"${ev.location.replace(/"/g, '""')}"`,
            `"${r.name.replace(/"/g, '""')}"`,
            req,
            ass,
            `"${fill}%"`,
            `"${volNames.replace(/"/g, '""')}"`,
            `"${checkedInNames.replace(/"/g, '""')}"`
          ]);
        });
      });

      const csvContent = rows.map(r => r.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `gatherly_staffing_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      App.showToast("Summary report exported to CSV successfully!", "success");
    } catch (err) {
      console.error("Export CSV error:", err);
      App.showToast("Failed to generate CSV export", "error");
    }
  }
};
