/**
 * Gatherly - AI Staffing Copilot View
 * 
 * Features:
 * 1. Event Selection & Real-Time Telemetry Analysis
 * 2. Suggested Volunteer Distribution by Role (Attendance Sizing Heuristics)
 * 3. Staffing Gap & Skill Deficit Detection
 * 4. Identification of Overlapping / Conflicting Assignments
 * 5. Staffing Risk Alerts (Green / Amber / Red)
 * 6. Explanations for Recommendations (Transparent Grounding)
 * 7. Interactive, Editable AI Staffing Plans with Commit Workflow
 */

const CopilotView = {
  selectedEventId: null,
  activeTab: "plan", // "plan" | "gaps" | "risks" | "candidates"
  draftPlan: null,   // { [roleId]: [volunteerId, ...] }
  lastLoadedEventId: null,

  async render() {
    const data = await GatherlyStorage.getAllData();
    const events = data.events || [];
    const volunteers = data.volunteers || [];
    const volunteersMap = {};
    volunteers.forEach(v => volunteersMap[v.id] = v);

    if (events.length === 0) {
      return `
        <div class="card" style="text-align: center; padding: 48px;">
          <h3>No events found to analyze</h3>
          <p style="color: var(--text-muted); margin: 8px 0 16px;">Create your first event in My Events to run Copilot analysis.</p>
          <button class="btn btn-primary" onclick="App.openCreateEventModal()">Create Event</button>
        </div>
      `;
    }

    // Default to selected event or first event
    if (!this.selectedEventId || !events.find(e => e.id === this.selectedEventId)) {
      this.selectedEventId = events[0].id;
    }

    const currentEvent = events.find(e => e.id === this.selectedEventId);

    // Run Copilot Engine Analysis
    const analysis = CopilotEngine.analyzeEvent(currentEvent.id, data);

    // Initialize or sync draft plan if event changed or uninitialized
    if (this.lastLoadedEventId !== currentEvent.id || !this.draftPlan) {
      this.lastLoadedEventId = currentEvent.id;
      // Start draft plan by combining current assigned with Copilot proposed vacancies
      this.draftPlan = {};
      (currentEvent.roles || []).forEach(role => {
        const existing = [...(role.assignedVolunteerIds || [])];
        const proposed = [...(analysis.proposedPlan[role.id] || [])];
        this.draftPlan[role.id] = [...existing, ...proposed];
      });
    }

    // Calculate Projected Stats from Draft Plan
    let draftTotalAssigned = 0;
    const draftAssignedSet = new Set();
    let draftCollisionDetected = false;
    let collisionVolunteerName = "";

    (currentEvent.roles || []).forEach(role => {
      const assigned = this.draftPlan[role.id] || [];
      draftTotalAssigned += assigned.length;
      assigned.forEach(vid => {
        if (draftAssignedSet.has(vid)) {
          draftCollisionDetected = true;
          collisionVolunteerName = volunteersMap[vid]?.name || vid;
        }
        draftAssignedSet.add(vid);
      });
    });

    const projectedCoverage = analysis.totalRequired > 0 
      ? Math.round((draftTotalAssigned / analysis.totalRequired) * 100) 
      : 100;

    return `
      <!-- COPILOT HERO / EVENT CONTROLLER -->
      <div class="copilot-header-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 20px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.75rem; color: var(--blue-400); font-weight: 700; margin-bottom: 8px;">
              <span class="pulse-dot"></span> AI STAFFING COPILOT &bull; ACTIVE EVENT TELEMETRY
            </div>
            <h2 style="font-size: 1.6rem; font-weight: 800; letter-spacing: -0.5px;">
              AI Staffing Copilot: ${currentEvent.title}
            </h2>
            <p style="color: #94A3B8; font-size: 0.875rem; margin-top: 4px;">
              📅 ${currentEvent.date} (${analysis.eventDay}) &bull; ⏰ ${currentEvent.time} &bull; 📍 ${currentEvent.location} &bull; 👥 ${analysis.expectedAttendees} Expected Attendees
            </p>
          </div>

          <!-- EVENT SELECTOR -->
          <div style="display: flex; align-items: center; gap: 10px; background: rgba(15, 23, 42, 0.6); padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.15);">
            <label style="color: #94A3B8; font-size: 0.8rem; font-weight: 600;">Event:</label>
            <select 
              class="filter-select" 
              style="background: var(--navy-800); color: #FFFFFF; border-color: rgba(255, 255, 255, 0.2); font-weight: 600;"
              onchange="CopilotView.selectEvent(this.value)"
            >
              ${events.map(ev => `
                <option value="${ev.id}" ${ev.id === currentEvent.id ? 'selected' : ''}>
                  ${ev.title} (${ev.date})
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- TELEMETRY SNAPSHOT STRIP -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <div>
            <div style="font-size: 0.75rem; color: #94A3B8; text-transform: uppercase; font-weight: 700;">Current Staffing</div>
            <div style="font-size: 1.35rem; font-weight: 800; color: #FFFFFF;">
              ${analysis.totalAssigned} / ${analysis.totalRequired}
              <span style="font-size: 0.85rem; font-weight: 600; color: ${analysis.overallCoveragePct >= 80 ? 'var(--status-green-solid)' : (analysis.overallCoveragePct >= 50 ? 'var(--status-amber-solid)' : 'var(--status-red-solid)')};">
                (${analysis.overallCoveragePct}%)
              </span>
            </div>
          </div>

          <div>
            <div style="font-size: 0.75rem; color: #94A3B8; text-transform: uppercase; font-weight: 700;">Detected Gaps</div>
            <div style="font-size: 1.35rem; font-weight: 800; color: ${analysis.totalOpenSlots > 0 ? 'var(--status-amber-solid)' : 'var(--status-green-solid)'};">
              ${analysis.totalOpenSlots} Open Slot${analysis.totalOpenSlots === 1 ? '' : 's'}
            </div>
          </div>

          <div>
            <div style="font-size: 0.75rem; color: #94A3B8; text-transform: uppercase; font-weight: 700;">Schedule Collisions</div>
            <div style="font-size: 1.35rem; font-weight: 800; color: ${analysis.conflicts.length > 0 ? 'var(--status-red-solid)' : 'var(--status-green-solid)'};">
              ${analysis.conflicts.length} Overlap${analysis.conflicts.length === 1 ? '' : 's'}
            </div>
          </div>

          <div>
            <div style="font-size: 0.75rem; color: #94A3B8; text-transform: uppercase; font-weight: 700;">Copilot Sizing Ratio</div>
            <div style="font-size: 1.35rem; font-weight: 800; color: var(--blue-400);">
              ${analysis.sizingRecommendations.totalRecommended} Recommended
            </div>
          </div>
        </div>
      </div>

      <!-- COLLISION BANNER (IF DETECTED) -->
      ${analysis.conflicts.length > 0 ? `
        <div class="conflict-banner">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="font-size: 0.95rem;">⚠️ Schedule Collisions Detected (${analysis.conflicts.length})</strong>
            <span class="badge badge-red" style="font-size: 0.7rem;">Action Required</span>
          </div>
          ${analysis.conflicts.map(c => `
            <div style="margin-top: 4px;">
              &bull; <strong>${c.volunteerName}:</strong> ${c.description}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- COPILOT NAVIGATION TABS -->
      <div class="copilot-tab-bar">
        <button 
          class="copilot-tab-btn ${this.activeTab === 'plan' ? 'active' : ''}"
          onclick="CopilotView.setTab('plan')"
        >
          <span>📋</span> Editable Staffing Plan
          ${analysis.totalOpenSlots > 0 ? `
            <span class="badge badge-amber" style="font-size: 0.65rem; padding: 1px 6px;">${analysis.totalOpenSlots} Proposed</span>
          ` : ''}
        </button>

        <button 
          class="copilot-tab-btn ${this.activeTab === 'gaps' ? 'active' : ''}"
          onclick="CopilotView.setTab('gaps')"
        >
          <span>📊</span> Staffing Gaps & Sizing
          <span class="badge ${analysis.totalOpenSlots > 0 ? 'badge-amber' : 'badge-green'}" style="font-size: 0.65rem; padding: 1px 6px;">
            ${analysis.totalOpenSlots} Gaps
          </span>
        </button>

        <button 
          class="copilot-tab-btn ${this.activeTab === 'risks' ? 'active' : ''}"
          onclick="CopilotView.setTab('risks')"
        >
          <span>🚨</span> Staffing Risk Alerts
          <span class="badge badge-red" style="font-size: 0.65rem; padding: 1px 6px;">
            ${analysis.risks.filter(r => r.severity === 'urgent').length} Critical
          </span>
        </button>

        <button 
          class="copilot-tab-btn ${this.activeTab === 'candidates' ? 'active' : ''}"
          onclick="CopilotView.setTab('candidates')"
        >
          <span>🎯</span> Volunteer Matchmaker & Reasoning
        </button>
      </div>

      <!-- TAB CONTENT PANES -->
      ${this.renderActiveTab(analysis, volunteersMap, projectedCoverage, draftCollisionDetected, collisionVolunteerName)}
    `;
  },

  renderActiveTab(analysis, volunteersMap, projectedCoverage, draftCollisionDetected, collisionVolunteerName) {
    if (this.activeTab === "plan") {
      return this.renderEditablePlanTab(analysis, volunteersMap, projectedCoverage, draftCollisionDetected, collisionVolunteerName);
    } else if (this.activeTab === "gaps") {
      return this.renderGapsAndSizingTab(analysis);
    } else if (this.activeTab === "risks") {
      return this.renderRisksTab(analysis);
    } else if (this.activeTab === "candidates") {
      return this.renderCandidatesTab(analysis, volunteersMap);
    }
  },

  /* ========================================================================
     TAB 1: EDITABLE AI-GENERATED STAFFING PLAN
     ======================================================================== */
  renderEditablePlanTab(analysis, volunteersMap, projectedCoverage, draftCollisionDetected, collisionVolunteerName) {
    const event = analysis.event;
    const roles = event.roles || [];

    return `
      <!-- PLAN CONTROLS & PROJECTED OUTCOME -->
      <div class="card" style="margin-bottom: 24px; border-left: 4px solid var(--blue-600);">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--navy-900);">
                Interactive AI-Generated Staffing Plan
              </h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
                Review, modify, or swap Copilot's recommendations below. You have complete organizer sovereignty to edit any assignment before applying.
              </p>
            </div>

            <div style="display: flex; gap: 10px; align-items: center;">
              <button class="btn btn-secondary btn-sm" onclick="CopilotView.resetToDefaults()">
                <span>🔄</span> Reset to Initial
              </button>
              <button 
                class="btn btn-primary"
                ${draftCollisionDetected ? 'disabled style="opacity: 0.6; cursor: not-allowed;"' : ''}
                onclick="CopilotView.applyPlan('${event.id}')"
              >
                <span>💾</span> Apply Staffing Plan to Event
              </button>
            </div>
          </div>

          <!-- BEFORE VS AFTER PROJECTION -->
          <div style="margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
            <div style="display: flex; align-items: center; gap: 24px;">
              <div>
                <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">CURRENT COVERAGE:</span>
                <div style="font-size: 1.1rem; font-weight: 700; color: var(--navy-800);">
                  ${analysis.totalAssigned}/${analysis.totalRequired} (${analysis.overallCoveragePct}%)
                </div>
              </div>
              <div style="font-size: 1.25rem; color: var(--text-light);">&rarr;</div>
              <div>
                <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">PROJECTED WITH PLAN:</span>
                <div style="font-size: 1.1rem; font-weight: 800; color: ${projectedCoverage >= 100 ? 'var(--status-green-solid)' : 'var(--blue-600)'};">
                  ${Object.values(this.draftPlan).reduce((s, a) => s + a.length, 0)}/${analysis.totalRequired} (${projectedCoverage}%)
                </div>
              </div>
            </div>

            ${draftCollisionDetected ? `
              <div class="badge badge-red" style="padding: 6px 12px; font-size: 0.8rem;">
                ⚠️ Collision: ${collisionVolunteerName} assigned to multiple roles. Fix before applying.
              </div>
            ` : `
              <div class="badge badge-green" style="padding: 6px 12px; font-size: 0.8rem;">
                ✓ 0 Collisions Detected in Plan
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- ROLE-BY-ROLE EDITABLE PLAN BLOCKS -->
      <div class="role-cards-list">
        ${roles.map(role => {
          const req = parseInt(role.required || 0);
          const currentOriginalIds = role.assignedVolunteerIds || [];
          const plannedIds = this.draftPlan[role.id] || [];
          const candidates = analysis.roleRecommendations[role.id] || [];
          const remainingSlots = Math.max(0, req - plannedIds.length);

          return `
            <div class="plan-role-block">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                <div>
                  <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--navy-900); display: flex; align-items: center; gap: 8px;">
                    <span>💼</span> ${role.name}
                    <span class="badge ${plannedIds.length >= req ? 'badge-green' : 'badge-amber'}">
                      ${plannedIds.length} of ${req} Staffed
                    </span>
                  </h4>
                  <div style="display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Required Skills:</span>
                    ${(role.skillsRequired || []).map(s => `<span class="skill-chip">${s}</span>`).join('')}
                  </div>
                </div>

                <div style="font-size: 0.825rem; color: var(--text-muted);">
                  ${remainingSlots > 0 ? `
                    <span style="color: var(--status-amber-solid); font-weight: 700;">⚠️ ${remainingSlots} Vacanc${remainingSlots > 1 ? 'ies' : 'y'} Remaining</span>
                  ` : `
                    <span style="color: var(--status-green-solid); font-weight: 700;">✓ Fully Staffed</span>
                  `}
                </div>
              </div>

              <!-- ASSIGNMENTS LIST IN DRAFT PLAN -->
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${plannedIds.length === 0 ? `
                  <div style="padding: 12px; background: var(--status-red-bg); border-radius: var(--radius-md); font-size: 0.825rem; color: var(--status-red-text);">
                    ⚠️ No volunteers assigned to this position in the plan.
                  </div>
                ` : plannedIds.map((vid, idx) => {
                  const vol = volunteersMap[vid];
                  const isOriginal = currentOriginalIds.includes(vid);
                  const candMeta = candidates.find(c => c.volunteer.id === vid);

                  return `
                    <div class="plan-item-row ${isOriginal ? 'existing' : 'proposed'}">
                      <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                        <span style="font-size: 0.85rem; font-weight: 700; color: ${isOriginal ? 'var(--status-green-text)' : 'var(--blue-600)'};">
                          ${isOriginal ? '✓ Confirmed Staff:' : '✨ AI Suggested:'}
                        </span>
                        <strong>${vol?.name || vid}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">(${vol?.major})</span>
                        ${candMeta ? `
                          <span class="match-score-pill ${candMeta.matchScore >= 80 ? 'high' : 'medium'}">
                            ${candMeta.matchScore}% Match
                          </span>
                        ` : ''}
                      </div>

                      <!-- SWAP OR REASSIGN DROPDOWN -->
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <select 
                          class="filter-select"
                          style="font-size: 0.775rem; padding: 4px 8px;"
                          title="Swap with another candidate"
                          onchange="CopilotView.handleSwapVolunteer('${role.id}', ${idx}, this.value)"
                        >
                          <option value="${vid}">Selected: ${vol?.name}</option>
                          <optgroup label="Eligible Candidates">
                            ${candidates.filter(c => !c.isBlocked || c.volunteer.id === vid).map(c => `
                              <option value="${c.volunteer.id}" ${c.volunteer.id === vid ? 'selected' : ''}>
                                ${c.volunteer.name} (${c.matchScore}% - ${c.volunteer.major})
                              </option>
                            `).join('')}
                          </optgroup>
                        </select>

                        <!-- REMOVE BUTTON -->
                        <button 
                          class="unassign-btn" 
                          title="Remove from plan"
                          onclick="CopilotView.handleRemoveFromPlan('${role.id}', ${idx})"
                        >
                          &times;
                        </button>
                      </div>

                      <!-- EXPLICIT GROUNDED REASONING CALLOUT (IF PROPOSED) -->
                      ${!isOriginal && candMeta ? `
                        <div class="reasoning-box" style="width: 100%; margin-top: 6px;">
                          <div class="reasoning-bullet">
                            <span>🔍</span>
                            <span><strong>Reasoning:</strong> ${candMeta.reasons.join(" • ")}</span>
                          </div>
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- ADD VOLUNTEER SLOT IF CAPACITY OPEN -->
              <div style="margin-top: 12px; display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
                <select 
                  id="add-candidate-select-${role.id}"
                  class="filter-select"
                  style="font-size: 0.775rem; padding: 5px 8px; max-width: 240px;"
                >
                  <option value="">-- Choose Candidate to Add --</option>
                  ${candidates.filter(c => !plannedIds.includes(c.volunteer.id)).map(c => `
                    <option value="${c.volunteer.id}">
                      ${c.volunteer.name} (${c.matchScore}% match)
                    </option>
                  `).join('')}
                </select>
                <button 
                  class="btn btn-secondary btn-sm"
                  onclick="CopilotView.handleAddCandidateToRole('${role.id}')"
                >
                  + Add Volunteer Slot
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  /* ========================================================================
     TAB 2: STAFFING GAPS & SIZING HEURISTICS
     ======================================================================== */
  renderGapsAndSizingTab(analysis) {
    const sizing = analysis.sizingRecommendations;
    const gaps = analysis.gaps;

    return `
      <!-- SIZING ASSESSMENT BANNER -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <h3><span>📐</span> Suggested Volunteer Distribution by Role (Attendance Sizing)</h3>
          <span class="badge badge-blue">Attendance: ${analysis.expectedAttendees} Students</span>
        </div>
        <div class="card-body">
          <p style="font-size: 0.875rem; color: var(--navy-800); margin-bottom: 16px;">
            ${sizing.assessment}
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px;">
            ${sizing.breakdown.map(b => `
              <div style="padding: 14px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--bg-subtle);">
                <div style="font-weight: 700; color: var(--navy-900); font-size: 0.9rem; margin-bottom: 4px;">
                  ${b.roleType}
                </div>
                <div style="font-size: 1.25rem; font-weight: 800; color: var(--blue-600); margin-bottom: 4px;">
                  ${b.recommendedQuota} Volunteers
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 6px;">
                  Formula: <code>${b.formula}</code>
                </div>
                <p style="font-size: 0.8rem; color: var(--navy-700); line-height: 1.35;">
                  ${b.rationale}
                </p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- STAFFING GAP & SKILL AUDIT TABLE -->
      <div class="card">
        <div class="card-header">
          <h3><span>🔍</span> Role-by-Role Staffing Gap & Skill Deficit Detection</h3>
          <span class="badge ${analysis.totalOpenSlots > 0 ? 'badge-amber' : 'badge-green'}">
            ${analysis.totalOpenSlots} Open Vacancies
          </span>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Required Quota</th>
                  <th>Assigned Count</th>
                  <th>Open Vacancy</th>
                  <th>Skill Gap Status</th>
                  <th>Coverage Risk</th>
                </tr>
              </thead>
              <tbody>
                ${gaps.map(g => `
                  <tr>
                    <td>
                      <strong style="color: var(--navy-900);">${g.roleName}</strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">
                        Skills: ${g.skillsRequired.join(', ')}
                      </div>
                    </td>
                    <td><strong>${g.required}</strong></td>
                    <td>${g.assigned}</td>
                    <td>
                      ${g.openSlots > 0 ? `
                        <span class="badge badge-amber">${g.openSlots} Open</span>
                      ` : `
                        <span class="badge badge-green">0 (Filled)</span>
                      `}
                    </td>
                    <td>
                      ${g.missingSkills.length > 0 ? `
                        <span class="badge badge-red" title="Assigned volunteers do not possess this skill">
                          ⚠️ Missing: ${g.missingSkills.join(', ')}
                        </span>
                      ` : `
                        <span class="badge badge-green">✓ All Skills Covered</span>
                      `}
                    </td>
                    <td>
                      ${g.hasZeroStaffing ? `
                        <span class="badge badge-red"><span class="badge-dot"></span> Zero Staffing (Critical)</span>
                      ` : (g.coveragePct < 50 ? `
                        <span class="badge badge-red"><span class="badge-dot"></span> <50% Severe Deficit</span>
                      ` : (g.coveragePct < 100 ? `
                        <span class="badge badge-amber"><span class="badge-dot"></span> Partial Coverage</span>
                      ` : `
                        <span class="badge badge-green"><span class="badge-dot"></span> 100% Complete</span>
                      `))}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  /* ========================================================================
     TAB 3: STAFFING RISK ALERTS & OVERLAPPING ASSIGNMENTS
     ======================================================================== */
  renderRisksTab(analysis) {
    const risks = analysis.risks;
    const conflicts = analysis.conflicts;

    return `
      <!-- SCHEDULE COLLISIONS & OVERLAPS AUDIT -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <h3><span>⚠️</span> Identification of Overlapping / Conflicting Assignments</h3>
          <span class="badge ${conflicts.length > 0 ? 'badge-red' : 'badge-green'}">
            ${conflicts.length} Identified
          </span>
        </div>
        <div class="card-body">
          ${conflicts.length === 0 ? `
            <div style="text-align: center; padding: 24px; color: var(--status-green-text);">
              <div style="font-size: 2rem; margin-bottom: 6px;">✅</div>
              <strong>Zero Schedule Collisions Detected</strong>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
                No volunteers currently assigned to this event have double-bookings, same-day conflicts, or workload overages.
              </p>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${conflicts.map(c => `
                <div style="padding: 14px; border-radius: var(--radius-md); border-left: 4px solid var(--status-red-solid); background: var(--status-red-bg); border-top: 1px solid var(--status-red-border); border-right: 1px solid var(--status-red-border); border-bottom: 1px solid var(--status-red-border);">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: var(--status-red-text); font-size: 0.95rem;">${c.title}</strong>
                    <span class="badge badge-red">${c.severity.toUpperCase()}</span>
                  </div>
                  <p style="font-size: 0.85rem; color: var(--navy-800); margin: 6px 0;">
                    ${c.description}
                  </p>
                  <div style="font-size: 0.775rem; color: var(--text-muted); font-weight: 600;">
                    Suggested Action: Reassign or unassign one of the conflicting positions to eliminate double-booking.
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>

      <!-- PRIORITIZED STAFFING RISK ALERTS -->
      <div class="card">
        <div class="card-header">
          <h3><span>🚨</span> Proactive Staffing Risk Alerts (Green / Amber / Red)</h3>
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Evaluated from Active Data</span>
        </div>
        <div class="card-body">
          <div class="alerts-list">
            ${risks.map(r => `
              <div class="alert-item ${r.severity}">
                <div class="alert-top">
                  <span class="alert-title">${r.title}</span>
                  <span class="badge ${r.severity === 'urgent' ? 'badge-red' : (r.severity === 'warning' ? 'badge-amber' : 'badge-green')}">
                    ${r.level}
                  </span>
                </div>
                <div class="alert-desc" style="margin-top: 4px;">
                  ${r.message}
                </div>
                <div style="margin-top: 8px; font-size: 0.775rem; color: var(--navy-700); background: rgba(0,0,0,0.03); padding: 6px 10px; border-radius: var(--radius-sm);">
                  <strong>Recommended Action:</strong> ${r.action}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  /* ========================================================================
     TAB 4: VOLUNTEER MATCHMAKER & EXPLANATIONS
     ======================================================================== */
  renderCandidatesTab(analysis, volunteersMap) {
    const gaps = analysis.gaps;

    return `
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--navy-900);">
          Candidate Matching Scores & Transparent Explanations
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Copilot ranks all registered student volunteers for each role using verified skills, schedule compatibility, and workload balance. Every recommendation cites actual profile attributes.
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 24px;">
        ${gaps.map(gap => {
          const candidates = analysis.roleRecommendations[gap.roleId] || [];

          return `
            <div class="card">
              <div class="card-header">
                <div>
                  <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--navy-900);">
                    💼 ${gap.roleName}
                  </h4>
                  <span style="font-size: 0.775rem; color: var(--text-muted);">
                    Requires: ${gap.skillsRequired.join(', ')} &bull; ${gap.openSlots} Open Vacanc${gap.openSlots === 1 ? 'y' : 'ies'}
                  </span>
                </div>
                <span class="badge badge-blue">${candidates.filter(c => !c.isBlocked).length} Available Candidates</span>
              </div>

              <div class="card-body">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px;">
                  ${candidates.slice(0, 6).map(cand => {
                    const v = cand.volunteer;

                    return `
                      <div class="candidate-card" style="${cand.isBlocked ? 'opacity: 0.6; background: var(--bg-subtle);' : ''}">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                          <div>
                            <strong style="font-size: 0.95rem; color: var(--navy-900);">${v.name}</strong>
                            <div style="font-size: 0.775rem; color: var(--text-muted);">${v.major}</div>
                          </div>

                          ${cand.isBlocked ? `
                            <span class="badge badge-amber" style="font-size: 0.7rem;">
                              ${cand.blockReason}
                            </span>
                          ` : `
                            <span class="match-score-pill ${cand.matchScore >= 80 ? 'high' : (cand.matchScore >= 50 ? 'medium' : 'low')}">
                              ${cand.matchScore}% Match
                            </span>
                          `}
                        </div>

                        <!-- VERIFIED SKILLS -->
                        <div style="margin-bottom: 8px;">
                          <div style="font-size: 0.725rem; color: var(--text-muted); font-weight: 600; margin-bottom: 3px;">
                            Verified Skills:
                          </div>
                          <div class="skill-chips" style="margin: 0;">
                            ${(v.skills || []).map(s => {
                              const isMatch = cand.matchedSkills.includes(s);
                              return `
                                <span class="skill-chip" style="${isMatch ? 'background: var(--status-green-bg); border-color: var(--status-green-border); color: var(--status-green-text); font-weight: 700;' : ''}">
                                  ${isMatch ? '✓ ' : ''}${s}
                                </span>
                              `;
                            }).join('')}
                          </div>
                        </div>

                        <!-- EXPLANATION / REASONING -->
                        <div class="reasoning-box">
                          ${cand.reasons.map(r => `
                            <div class="reasoning-bullet">
                              <span>&bull;</span>
                              <span>${r}</span>
                            </div>
                          `).join('')}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  /* ========================================================================
     CONTROLLER ACTIONS & INTERACTIVITY
     ======================================================================== */
  selectEvent(eventId) {
    this.selectedEventId = eventId;
    this.draftPlan = null;
    this.lastLoadedEventId = null;
    AppRouter.refreshCurrentView();
  },

  setTab(tab) {
    this.activeTab = tab;
    AppRouter.refreshCurrentView();
  },

  handleSwapVolunteer(roleId, slotIndex, newVolunteerId) {
    if (!this.draftPlan || !this.draftPlan[roleId]) return;
    this.draftPlan[roleId][slotIndex] = newVolunteerId;
    AppRouter.refreshCurrentView();
  },

  handleRemoveFromPlan(roleId, slotIndex) {
    if (!this.draftPlan || !this.draftPlan[roleId]) return;
    this.draftPlan[roleId].splice(slotIndex, 1);
    AppRouter.refreshCurrentView();
  },

  handleAddCandidateToRole(roleId) {
    const select = document.getElementById(`add-candidate-select-${roleId}`);
    if (!select || !select.value) {
      App.showToast("Please choose a candidate from the dropdown first.", "error");
      return;
    }

    const volunteerId = select.value;
    if (!this.draftPlan) this.draftPlan = {};
    if (!this.draftPlan[roleId]) this.draftPlan[roleId] = [];

    // Avoid duplicate in the same role
    if (this.draftPlan[roleId].includes(volunteerId)) {
      App.showToast("Volunteer is already assigned to this position in the plan.", "error");
      return;
    }

    this.draftPlan[roleId].push(volunteerId);
    App.showToast("Added volunteer to role slot in plan", "info");
    AppRouter.refreshCurrentView();
  },

  resetToDefaults() {
    this.draftPlan = null;
    this.lastLoadedEventId = null;
    App.showToast("Staffing plan reset to initial recommendations", "info");
    AppRouter.refreshCurrentView();
  },

  async applyPlan(eventId) {
    if (!this.draftPlan) return;

    // Check for collisions across roles in the plan
    const assignedAll = [];
    for (const [rId, vIds] of Object.entries(this.draftPlan)) {
      for (const vid of vIds) {
        if (assignedAll.includes(vid)) {
          App.showToast("Collision detected: A volunteer cannot be assigned to multiple positions in the same event.", "error");
          return;
        }
        assignedAll.push(vid);
      }
    }

    const res = await GatherlyStorage.applyStaffingPlan(eventId, this.draftPlan);
    if (res.success) {
      App.showToast("🎉 AI Staffing Plan committed successfully!", "success");
      // Refresh state and navigate or refresh view
      await AppRouter.refreshCurrentView();
    } else {
      App.showToast(res.error || "Failed to commit staffing plan.", "error");
    }
  }
};
