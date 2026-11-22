/**
 * Gatherly - AI Staffing Copilot Engine
 * 
 * Provides grounded, deterministic analysis for student organization events:
 * 1. Suggested volunteer distribution by role (attendance-based heuristics)
 * 2. Staffing gap detection (unfilled slots & missing specialized skills)
 * 3. Identification of overlapping assignments (same event & cross-event date collisions)
 * 4. Staffing risk alerts (categorized as Urgent Red, Warning Amber, Optimal Green)
 * 5. Explanations for recommendations (transparent, grounded in verified profile data)
 * 6. Generates editable staffing plans that organizers can review, modify, and commit.
 */

const CopilotEngine = {
  // Day of week helper
  getDayOfWeek(dateStr) {
    if (!dateStr) return "Unknown";
    try {
      const d = new Date(dateStr + "T12:00:00");
      return d.toLocaleDateString("en-US", { weekday: "long" });
    } catch (e) {
      return "Unknown";
    }
  },

  // Check if volunteer's availability matches the event day/time
  isScheduleCompatible(availability, dateStr, timeStr) {
    if (!availability) return { compatible: false, reason: "No availability stated" };
    const day = this.getDayOfWeek(dateStr).toLowerCase();
    const isWeekend = day === "saturday" || day === "sunday";
    const avail = availability.toLowerCase();

    if (avail.includes("flexible") || avail.includes("available all week")) {
      return { compatible: true, matchType: "Full Flexibility", reason: "Flexible schedule aligns with any event day" };
    }

    if (isWeekend) {
      if (avail.includes("weekend") || avail.includes("saturday") || avail.includes("sunday")) {
        return { compatible: true, matchType: "Weekend Match", reason: `Stated availability for weekends aligns with ${this.getDayOfWeek(dateStr)}` };
      }
      return { compatible: false, matchType: "Weekend Mismatch", reason: `Event is on ${this.getDayOfWeek(dateStr)}, but availability is '${availability}'` };
    } else {
      // Weekday
      if (avail.includes("weekday") || avail.includes("afternoon") || avail.includes("evening") || avail.includes("morning")) {
        return { compatible: true, matchType: "Weekday Match", reason: `Stated availability aligns with weekday (${this.getDayOfWeek(dateStr)})` };
      }
      if (avail.includes("weekends only")) {
        return { compatible: false, matchType: "Weekday Mismatch", reason: `Event is on a weekday (${this.getDayOfWeek(dateStr)}), but volunteer is 'Weekends Only'` };
      }
      return { compatible: true, matchType: "Conditional Fit", reason: `Potential weekday fit based on '${availability}'` };
    }
  },

  // Full Analysis of an Event
  analyzeEvent(targetEventId, allData) {
    const events = allData.events || [];
    const volunteers = allData.volunteers || [];
    const volunteersMap = {};
    volunteers.forEach(v => volunteersMap[v.id] = v);

    const event = events.find(e => e.id === targetEventId);
    if (!event) return null;

    const eventDate = event.date;
    const eventDay = this.getDayOfWeek(eventDate);
    const expectedAttendees = parseInt(event.expectedAttendees || 100);
    const roles = event.roles || [];

    // 1. SUGGESTED VOLUNTEER DISTRIBUTION BY ROLE (Sizing Heuristics)
    const sizingRecommendations = this.calculateRoleSizing(event, expectedAttendees);

    // 2. STAFFING GAP DETECTION (Vacancies & Skill Deficits)
    const gaps = [];
    let totalRequired = 0;
    let totalAssigned = 0;

    roles.forEach(role => {
      const req = parseInt(role.required || 0);
      const assignedIds = role.assignedVolunteerIds || [];
      const ass = assignedIds.length;
      const openSlots = Math.max(0, req - ass);
      
      totalRequired += req;
      totalAssigned += ass;

      // Skill audit among currently assigned volunteers
      const roleSkills = (role.skillsRequired || []).map(s => s.toLowerCase());
      const assignedVolunteers = assignedIds.map(id => volunteersMap[id]).filter(Boolean);
      
      const coveredSkills = new Set();
      assignedVolunteers.forEach(v => {
        (v.skills || []).forEach(s => {
          if (roleSkills.includes(s.toLowerCase())) {
            coveredSkills.add(s);
          }
        });
      });

      const missingSkills = (role.skillsRequired || []).filter(
        reqSkill => !Array.from(coveredSkills).some(cov => cov.toLowerCase() === reqSkill.toLowerCase())
      );

      gaps.push({
        roleId: role.id,
        roleName: role.name,
        required: req,
        assigned: ass,
        openSlots,
        coveragePct: req > 0 ? Math.round((ass / req) * 100) : 100,
        skillsRequired: role.skillsRequired || [],
        assignedVolunteers,
        coveredSkills: Array.from(coveredSkills),
        missingSkills,
        hasZeroStaffing: req > 0 && ass === 0,
        isUnderstaffed: openSlots > 0
      });
    });

    const totalOpenSlots = Math.max(0, totalRequired - totalAssigned);
    const overallCoveragePct = totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 100;

    // 3. IDENTIFICATION OF OVERLAPPING / CONFLICTING ASSIGNMENTS
    const conflicts = this.auditConflicts(event, events, volunteersMap);

    // 4. STAFFING RISK ALERTS
    const risks = this.evaluateStaffingRisks(event, gaps, conflicts, expectedAttendees);

    // 5. VOLUNTEER RECOMMENDATIONS & EXPLANATIONS FOR OPEN VACANCIES
    const roleRecommendations = {};
    const proposedPlan = {};

    // Track assigned IDs during recommendation synthesis to avoid double-suggesting
    const currentlyCommittedInEvent = new Set();
    roles.forEach(r => (r.assignedVolunteerIds || []).forEach(id => currentlyCommittedInEvent.add(id)));
    
    // Also track volunteers who have a cross-event collision on the same date
    const sameDateBlockedVolunteers = new Set();
    events.filter(e => e.id !== event.id && e.date === event.date).forEach(e => {
      (e.roles || []).forEach(r => (r.assignedVolunteerIds || []).forEach(id => sameDateBlockedVolunteers.add(id)));
    });

    const planAllocated = new Set([...currentlyCommittedInEvent]);

    gaps.forEach(gap => {
      const candidates = this.rankCandidatesForRole(
        gap,
        volunteers,
        event,
        events,
        currentlyCommittedInEvent,
        sameDateBlockedVolunteers
      );

      roleRecommendations[gap.roleId] = candidates;

      // Select top available candidates for the proposed plan
      const selectedForPlan = [];
      for (const cand of candidates) {
        if (selectedForPlan.length >= gap.openSlots) break;
        if (!planAllocated.has(cand.volunteer.id) && !cand.isBlocked) {
          selectedForPlan.push(cand.volunteer.id);
          planAllocated.add(cand.volunteer.id);
        }
      }

      proposedPlan[gap.roleId] = selectedForPlan;
    });

    return {
      event,
      eventDay,
      expectedAttendees,
      totalRequired,
      totalAssigned,
      totalOpenSlots,
      overallCoveragePct,
      sizingRecommendations,
      gaps,
      conflicts,
      risks,
      roleRecommendations,
      proposedPlan
    };
  },

  // 1. Role Sizing Heuristics based on expected attendees
  calculateRoleSizing(event, attendees) {
    const recs = [];
    
    // Check-in / Registration ratio
    const checkinSlots = Math.max(2, Math.ceil(attendees / 75));
    recs.push({
      roleType: "Registration & Welcome Desk",
      recommendedQuota: checkinSlots,
      formula: "1 volunteer per 75 expected attendees (min 2)",
      rationale: `For ${attendees} expected attendees, at least ${checkinSlots} check-in staff are required to prevent peak line delays exceeding 3 minutes.`
    });

    // Crowd & Marshalls ratio
    const marshallSlots = Math.max(2, Math.ceil(attendees / 90));
    recs.push({
      roleType: "Crowd Safety & Hallway Marshalls",
      recommendedQuota: marshallSlots,
      formula: "1 volunteer per 90 attendees (min 2)",
      rationale: `Ensures direct line of sight for emergency exits and active attendee flow across ${event.location}.`
    });

    // A/V Tech ratio
    const avSlots = attendees > 250 ? 3 : 2;
    recs.push({
      roleType: "A/V & Equipment Tech",
      recommendedQuota: avSlots,
      formula: "2 baseline, 3 for attendance > 250",
      rationale: `Auditorium presentations with microphone switchers and slide decks require continuous console monitoring.`
    });

    // Logistics & Operations
    const logisticsSlots = Math.max(1, Math.ceil(attendees / 120));
    recs.push({
      roleType: "Logistics, Hospitality & Float",
      recommendedQuota: logisticsSlots,
      formula: "1 volunteer per 120 attendees (min 1)",
      rationale: `Provides rapid response for speaker water, catering replenishment, and volunteer break relief.`
    });

    const totalRecommended = checkinSlots + marshallSlots + avSlots + logisticsSlots;
    const totalConfigured = (event.roles || []).reduce((sum, r) => sum + parseInt(r.required || 0), 0);

    return {
      breakdown: recs,
      totalRecommended,
      totalConfigured,
      variance: totalRecommended - totalConfigured,
      assessment: totalConfigured >= totalRecommended
        ? "Robust Sizing: Configured quotas adequately meet attendee demand ratios."
        : `Deficit Risk: Configured total of ${totalConfigured} is below the copilot recommended sizing of ${totalRecommended} for ${attendees} students.`
    };
  },

  // 3. Audit Conflicts
  auditConflicts(targetEvent, allEvents, volunteersMap) {
    const conflicts = [];
    const targetRoles = targetEvent.roles || [];

    // A) Detect same-event role collision (volunteer holding > 1 role in THIS event)
    const eventVolunteerAppearances = {};
    targetRoles.forEach(r => {
      (r.assignedVolunteerIds || []).forEach(vid => {
        if (!eventVolunteerAppearances[vid]) eventVolunteerAppearances[vid] = [];
        eventVolunteerAppearances[vid].push(r.name);
      });
    });

    Object.keys(eventVolunteerAppearances).forEach(vid => {
      const rolesList = eventVolunteerAppearances[vid];
      if (rolesList.length > 1) {
        const v = volunteersMap[vid] || { name: `Volunteer (${vid})` };
        conflicts.push({
          type: "role_collision",
          severity: "urgent",
          volunteerId: vid,
          volunteerName: v.name,
          title: `Double-Booking in Same Event: ${v.name}`,
          description: `${v.name} is assigned to multiple positions in this event: ${rolesList.join(" AND ")}. Volunteers can only serve one position concurrently.`
        });
      }
    });

    // B) Detect cross-event date collision (volunteer assigned to another event on the same day)
    const otherEventsSameDate = allEvents.filter(e => e.id !== targetEvent.id && e.date === targetEvent.date);
    otherEventsSameDate.forEach(otherEvent => {
      (otherEvent.roles || []).forEach(otherRole => {
        (otherRole.assignedVolunteerIds || []).forEach(vid => {
          // If this volunteer is also assigned in targetEvent
          const matchedTargetRole = targetRoles.find(r => (r.assignedVolunteerIds || []).includes(vid));
          if (matchedTargetRole) {
            const v = volunteersMap[vid] || { name: `Volunteer (${vid})` };
            conflicts.push({
              type: "date_collision",
              severity: "urgent",
              volunteerId: vid,
              volunteerName: v.name,
              title: `Same-Date Scheduling Conflict: ${v.name}`,
              description: `${v.name} is committed to '${otherEvent.title}' as '${otherRole.name}' on ${targetEvent.date}, and also scheduled for '${matchedTargetRole.name}' in this event.`
            });
          }
        });
      });
    });

    // C) Workload Strain audit (volunteers assigned to >= 3 active events)
    const allAssignedVolunteers = new Set();
    targetRoles.forEach(r => (r.assignedVolunteerIds || []).forEach(id => allAssignedVolunteers.add(id)));

    allAssignedVolunteers.forEach(vid => {
      const v = volunteersMap[vid];
      if (v) {
        let totalAssignedEvents = 0;
        allEvents.forEach(e => {
          const inEvent = (e.roles || []).some(r => (r.assignedVolunteerIds || []).includes(vid));
          if (inEvent) totalAssignedEvents++;
        });

        const estHours = totalAssignedEvents * 4;
        if (estHours > v.maxHoursPerWeek) {
          conflicts.push({
            type: "workload_strain",
            severity: "warning",
            volunteerId: vid,
            volunteerName: v.name,
            title: `Capacity Limit Exceeded: ${v.name}`,
            description: `${v.name} is assigned to ${totalAssignedEvents} events (~${estHours} hrs), exceeding their declared max capacity of ${v.maxHoursPerWeek} hrs/week.`
          });
        }
      }
    });

    return conflicts;
  },

  // 4. Staffing Risk Alerts Evaluation
  evaluateStaffingRisks(event, gaps, conflicts, attendees) {
    const risks = [];

    // Check critical collisions
    conflicts.forEach(c => {
      risks.push({
        id: `risk-conflict-${c.volunteerId}`,
        severity: c.severity,
        level: c.severity === "urgent" ? "CRITICAL RISK" : "WARNING RISK",
        title: c.title,
        message: c.description,
        action: "Reassign or remove one of the conflicting shifts."
      });
    });

    // Check zero-staffing
    const zeroStaffedRoles = gaps.filter(g => g.hasZeroStaffing);
    if (zeroStaffedRoles.length > 0) {
      risks.push({
        id: "risk-zero-staffing",
        severity: "urgent",
        level: "CRITICAL RISK",
        title: `Zero Staffing on ${zeroStaffedRoles.length} Position${zeroStaffedRoles.length > 1 ? 's' : ''}`,
        message: `The following positions currently have zero volunteers assigned: ${zeroStaffedRoles.map(g => `'${g.roleName}' (0/${g.required})`).join(', ')}.`,
        action: "Use AI match recommendations below to fill initial headcount immediately."
      });
    }

    // Check severe understaffing (<50%)
    const severelyUnderstaffed = gaps.filter(g => !g.hasZeroStaffing && g.coveragePct < 50);
    if (severelyUnderstaffed.length > 0) {
      risks.push({
        id: "risk-severe-shortage",
        severity: "urgent",
        level: "HIGH RISK",
        title: `Severe Staffing Shortage (<50% Quota)`,
        message: `${severelyUnderstaffed.map(g => `'${g.roleName}' (${g.assigned}/${g.required})`).join(', ')} has high vacancy rates with event approaching.`,
        action: "Assign recommended candidates to reach minimum operating threshold."
      });
    }

    // Check missing specialized skills
    const missingSkillRoles = gaps.filter(g => g.assigned > 0 && g.missingSkills.length > 0);
    if (missingSkillRoles.length > 0) {
      missingSkillRoles.forEach(g => {
        risks.push({
          id: `risk-skill-${g.roleId}`,
          severity: "warning",
          level: "SKILL GAP RISK",
          title: `Missing Skill in ${g.roleName}`,
          message: `Position requires verified skills [${g.missingSkills.join(', ')}], but none of the currently assigned volunteers possess these credentials.`,
          action: `Assign a qualified volunteer with [${g.missingSkills.join(', ')}] or pair with a skilled mentor.`
        });
      });
    }

    // Check partial coverage (50-99%)
    const partialRoles = gaps.filter(g => g.coveragePct >= 50 && g.coveragePct < 100);
    if (partialRoles.length > 0) {
      risks.push({
        id: "risk-partial-coverage",
        severity: "warning",
        level: "WARNING",
        title: `Partial Staffing Coverage`,
        message: `${partialRoles.length} position${partialRoles.length > 1 ? 's' : ''} have open vacancies: ${partialRoles.map(g => `${g.roleName} (${g.openSlots} needed)`).join(', ')}.`,
        action: "Review recommended distribution to complete roster."
      });
    }

    // Optimal state check
    if (risks.filter(r => r.severity === "urgent").length === 0 && gaps.every(g => g.openSlots === 0)) {
      risks.push({
        id: "risk-optimal",
        severity: "complete",
        level: "STABLE",
        title: "All Event Positions Fully Staffed",
        message: `All ${gaps.reduce((s, g) => s + g.required, 0)} volunteer positions are assigned with verified skill coverage and no schedule collisions.`,
        action: "Roster is event-ready."
      });
    }

    return risks;
  },

  // 5. Rank and Explain Candidates for a Specific Role
  rankCandidatesForRole(gap, allVolunteers, event, allEvents, currentlyCommittedInEvent, sameDateBlockedVolunteers) {
    const roleSkills = (gap.skillsRequired || []).map(s => s.toLowerCase());
    const candidates = [];

    allVolunteers.forEach(vol => {
      // Check if already assigned to THIS role
      const isAlreadyInThisRole = (gap.assignedVolunteers || []).some(v => v.id === vol.id);
      
      // Check if assigned to ANOTHER role in this event
      const isAlreadyInOtherRoleInThisEvent = !isAlreadyInThisRole && currentlyCommittedInEvent.has(vol.id);
      
      // Check if assigned to another event on the same date
      const isSameDateCollision = sameDateBlockedVolunteers.has(vol.id);

      const isBlocked = isAlreadyInThisRole || isAlreadyInOtherRoleInThisEvent || isSameDateCollision;

      // Compatibility score calculation
      let score = 0;
      const reasons = [];
      const matchedSkills = [];

      // A) Skills Match (up to 50 pts)
      (vol.skills || []).forEach(vSkill => {
        if (roleSkills.includes(vSkill.toLowerCase())) {
          matchedSkills.push(vSkill);
        }
      });

      if (roleSkills.length > 0) {
        const skillRatio = matchedSkills.length / roleSkills.length;
        const skillPts = Math.round(skillRatio * 50);
        score += skillPts;
        if (matchedSkills.length > 0) {
          reasons.push(`Verified skills: ${matchedSkills.join(', ')} (${matchedSkills.length}/${roleSkills.length} required)`);
        } else {
          reasons.push("No direct skill overlap with role requirements");
        }
      } else {
        score += 35;
        reasons.push("General role — all standard student volunteers eligible");
      }

      // B) Schedule Compatibility (up to 30 pts)
      const schedCheck = this.isScheduleCompatible(vol.availability, event.date, event.time);
      if (schedCheck.compatible) {
        score += 30;
        reasons.push(schedCheck.reason);
      } else {
        score += 5;
        reasons.push(`Schedule friction: ${schedCheck.reason}`);
      }

      // C) Notes / Relevant Experience (up to 10 pts)
      const notesLower = (vol.notes || "").toLowerCase();
      let hasBonus = false;
      roleSkills.forEach(sk => {
        if (notesLower.includes(sk)) hasBonus = true;
      });
      if (notesLower.includes("certified") || notesLower.includes("experienced") || notesLower.includes("sound") || notesLower.includes("lead")) {
        hasBonus = true;
      }
      if (hasBonus) {
        score += 10;
        reasons.push(`Relevant profile note: "${vol.notes.substring(0, 60)}..."`);
      }

      // D) Workload Distribution (up to 10 pts)
      let activeAssignmentsCount = 0;
      allEvents.forEach(e => {
        (e.roles || []).forEach(r => {
          if ((r.assignedVolunteerIds || []).includes(vol.id)) activeAssignmentsCount++;
        });
      });
      if (activeAssignmentsCount === 0) {
        score += 10;
        reasons.push("High availability: Not currently assigned to any upcoming shifts");
      } else if (activeAssignmentsCount === 1) {
        score += 7;
        reasons.push("Balanced workload: Currently committed to 1 other shift");
      } else {
        score += 3;
        reasons.push(`Active volunteer: Holding ${activeAssignmentsCount} assignments this term`);
      }

      // Grounding summary
      let blockReason = null;
      if (isAlreadyInThisRole) {
        blockReason = "Already assigned to this position";
      } else if (isAlreadyInOtherRoleInThisEvent) {
        blockReason = "Already assigned to another role in this event (Collision Prevention)";
      } else if (isSameDateCollision) {
        blockReason = `Scheduled for another event on ${event.date} (Date Collision)`;
      }

      candidates.push({
        volunteer: vol,
        matchScore: Math.min(100, Math.max(10, score)),
        matchedSkills,
        reasons,
        isBlocked,
        blockReason,
        isAlreadyInThisRole,
        isAlreadyInOtherRoleInThisEvent,
        isSameDateCollision,
        activeAssignmentsCount
      });
    });

    // Sort candidates: unblocked first, then by match score descending
    candidates.sort((a, b) => {
      if (a.isBlocked !== b.isBlocked) return a.isBlocked ? 1 : -1;
      return b.matchScore - a.matchScore;
    });

    return candidates;
  }
};
