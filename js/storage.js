/**
 * Gatherly - Storage & API Service Layer
 * Seamlessly interfaces with backend REST API or fallback LocalStorage
 */

const GatherlyStorage = {
  storageKey: "gatherly_local_db_v1",

  // Check if backend API is reachable
  async isServerAvailable() {
    if (!window.location.protocol.startsWith("http")) {
      return false;
    }
    try {
      const res = await fetch("/api/stats", { method: "GET" });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  // Fallback Local Storage initialization
  getLocalData() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("LocalStorage access failed, using in-memory seed", e);
    }
    // Deep clone initial data
    const clone = JSON.parse(JSON.stringify(GATHERLY_INITIAL_DATA));
    this.saveLocalData(clone);
    return clone;
  },

  saveLocalData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn("LocalStorage save failed", e);
    }
  },

  // Compute stats in client fallback
  computeStats(data) {
    const events = data.events || [];
    const volunteers = data.volunteers || [];
    
    let totalReq = 0;
    let totalAss = 0;
    
    events.forEach(ev => {
      if (ev.status === "Canceled") return;
      (ev.roles || []).forEach(r => {
        const req = parseInt(r.required || 0);
        const ass = (r.assignedVolunteerIds || []).length;
        totalReq += req;
        totalAss += Math.min(ass, req);
      });
    });

    const openPos = Math.max(0, totalReq - totalAss);
    const coverage = totalReq > 0 ? Math.round((totalAss / totalReq) * 1000) / 10 : 100;

    return {
      upcomingEvents: events.filter(e => e.status === "Upcoming").length,
      totalVolunteers: volunteers.length,
      totalRequiredPositions: totalReq,
      totalAssignedPositions: totalAss,
      openPositions: openPos,
      coveragePercentage: coverage
    };
  },

  // Generate alerts in client fallback
  computeAlerts(data) {
    const events = data.events || [];
    const alerts = [];

    events.forEach(ev => {
      if (ev.status === "Canceled") return;
      const roles = ev.roles || [];
      const evReq = roles.reduce((sum, r) => sum + parseInt(r.required || 0), 0);
      const evAss = roles.reduce((sum, r) => sum + (r.assignedVolunteerIds || []).length, 0);

      roles.forEach(r => {
        const req = parseInt(r.required || 0);
        const ass = (r.assignedVolunteerIds || []).length;
        const remaining = Math.max(0, req - ass);

        if (req > 0 && ass === 0) {
          alerts.push({
            id: `alt-${ev.id}-${r.id}`,
            severity: "urgent",
            level: "URGENT",
            title: `Zero Staffing: ${r.name}`,
            event: ev.title,
            eventId: ev.id,
            date: ev.date,
            message: `'${r.name}' in ${ev.title} has 0 of ${req} required volunteers assigned.`,
            remaining: remaining,
            color: "red"
          });
        } else if (req > 0 && (ass / req) < 0.5) {
          alerts.push({
            id: `alt-${ev.id}-${r.id}`,
            severity: "urgent",
            level: "CRITICAL",
            title: `Severe Shortage: ${r.name}`,
            event: ev.title,
            eventId: ev.id,
            date: ev.date,
            message: `${r.name} is critically understaffed (${ass}/${req} volunteers).`,
            remaining: remaining,
            color: "red"
          });
        } else if (req > 0 && ass < req) {
          alerts.push({
            id: `alt-${ev.id}-${r.id}`,
            severity: "warning",
            level: "WARNING",
            title: `Partial Coverage: ${r.name}`,
            event: ev.title,
            eventId: ev.id,
            date: ev.date,
            message: `Needs ${remaining} more volunteer${remaining > 1 ? 's' : ''} to reach full quota (${ass}/${req}).`,
            remaining: remaining,
            color: "amber"
          });
        }
      });

      // Check missing volunteer check-ins
      const checkIns = ev.checkIns || {};
      Object.entries(checkIns).forEach(([vid, cdata]) => {
        if (cdata.status === "missing") {
          const vol = (data.volunteers || []).find(v => v.id === vid);
          const vName = vol ? vol.name : vid;
          alerts.push({
            id: `alt-missing-${ev.id}-${vid}`,
            severity: "urgent",
            level: "MISSING VOLUNTEER",
            title: `No-Show Alert: ${vName}`,
            event: ev.title,
            eventId: ev.id,
            date: ev.date,
            message: `${vName} has not checked in for their scheduled shift in '${ev.title}'. Immediate backup recommended.`,
            remaining: 1,
            color: "red"
          });
        }
      });

      if (evReq > 0 && evAss === evReq) {
        alerts.push({
          id: `alt-complete-${ev.id}`,
          severity: "complete",
          level: "COMPLETED",
          title: `Fully Staffed: ${ev.title}`,
          event: ev.title,
          eventId: ev.id,
          date: ev.date,
          message: `All ${evReq} positions are fully confirmed and ready for event day.`,
          remaining: 0,
          color: "green"
        });
      }
    });

    const priority = { urgent: 0, warning: 1, complete: 2 };
    alerts.sort((a, b) => priority[a.severity] - priority[b.severity]);
    return alerts;
  },

  // Main API Methods
  async getAllData() {
    if (await this.isServerAvailable()) {
      try {
        const res = await fetch("/api/data");
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    const local = this.getLocalData();
    return {
      ...local,
      stats: this.computeStats(local),
      alerts: this.computeAlerts(local)
    };
  },

  async getEvents() {
    const data = await this.getAllData();
    return data.events || [];
  },

  async getVolunteers() {
    const data = await this.getAllData();
    return data.volunteers || [];
  },

  async getStats() {
    const data = await this.getAllData();
    return data.stats;
  },

  async getAlerts() {
    const data = await this.getAllData();
    return data.alerts;
  },

  async createEvent(eventPayload) {
    if (await this.isServerAvailable()) {
      try {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload)
        });
        if (res.ok) {
          const result = await res.json();
          return { success: true, event: result.event };
        }
      } catch (e) {}
    }

    // LocalStorage fallback
    const local = this.getLocalData();
    const eventId = `evt-${Date.now()}`;
    const roles = (eventPayload.roles || []).map((r, idx) => ({
      id: `role-${eventId}-${idx + 1}`,
      name: r.name,
      required: parseInt(r.required) || 1,
      assignedVolunteerIds: [],
      skillsRequired: r.skillsRequired || ["General Staff"]
    }));

    const newEvent = {
      id: eventId,
      title: eventPayload.title,
      category: eventPayload.category || "General",
      date: eventPayload.date,
      time: eventPayload.time || "12:00 PM - 04:00 PM",
      location: eventPayload.location || "Campus Center",
      expectedAttendees: parseInt(eventPayload.expectedAttendees) || 100,
      description: eventPayload.description || "",
      status: "Upcoming",
      roles: roles.length > 0 ? roles : [
        {
          id: `role-${eventId}-1`,
          name: "General Staff",
          required: 3,
          assignedVolunteerIds: [],
          skillsRequired: ["Customer Service"]
        }
      ]
    };

    local.events.unshift(newEvent);
    this.saveLocalData(local);
    return { success: true, event: newEvent };
  },

  async cancelEvent(eventId, reason = "Canceled by organizer") {
    if (await this.isServerAvailable()) {
      try {
        const res = await fetch("/api/events/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, reason })
        });
        if (res.ok) {
          const result = await res.json();
          return { success: true, event: result.event, message: result.message };
        }
      } catch (e) {}
    }

    // Local fallback
    const local = this.getLocalData();
    const event = (local.events || []).find(e => e.id === eventId);
    if (!event) return { success: false, error: "Event not found" };

    event.previousStatus = event.status || "Upcoming";
    event.status = "Canceled";
    event.cancellationReason = reason;
    event.canceledAt = new Date().toISOString();

    this.saveLocalData(local);
    return { success: true, event };
  },

  async restoreEvent(eventId) {
    if (await this.isServerAvailable()) {
      try {
        const res = await fetch("/api/events/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId })
        });
        if (res.ok) {
          const result = await res.json();
          return { success: true, event: result.event, message: result.message };
        }
      } catch (e) {}
    }

    // Local fallback
    const local = this.getLocalData();
    const event = (local.events || []).find(e => e.id === eventId);
    if (!event) return { success: false, error: "Event not found" };

    const restoredStatus = event.previousStatus || "Upcoming";
    event.status = restoredStatus === "Canceled" ? "Upcoming" : restoredStatus;
    delete event.cancellationReason;
    delete event.canceledAt;

    this.saveLocalData(local);
    return { success: true, event };
  },

  async rescheduleEvent(eventId, newDate, newTime, newLocation, reason = "Rescheduled by organizer") {
    if (await this.isServerAvailable()) {
      try {
        const res = await fetch("/api/events/reschedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            date: newDate,
            time: newTime,
            location: newLocation,
            reason
          })
        });
        if (res.ok) {
          const result = await res.json();
          return { success: true, event: result.event, message: result.message };
        }
      } catch (e) {}
    }

    // Local fallback
    const local = this.getLocalData();
    const event = (local.events || []).find(e => e.id === eventId);
    if (!event) return { success: false, error: "Event not found" };

    if (!event.rescheduledHistory) event.rescheduledHistory = [];
    event.rescheduledHistory.push({
      previousDate: event.date,
      previousTime: event.time,
      previousLocation: event.location,
      reason,
      rescheduledAt: new Date().toISOString()
    });

    event.date = newDate;
    if (newTime) event.time = newTime;
    if (newLocation) event.location = newLocation;

    if (event.status === "Canceled") {
      event.status = "Upcoming";
      delete event.cancellationReason;
      delete event.canceledAt;
    }

    this.saveLocalData(local);
    return { success: true, event };
  },

  async addVolunteer(volunteerPayload) {
    if (await this.isServerAvailable()) {
      try {
        const res = await fetch("/api/volunteers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(volunteerPayload)
        });
        if (res.ok) {
          const result = await res.json();
          return { success: true, volunteer: result.volunteer };
        }
      } catch (e) {}
    }

    // Local fallback
    const local = this.getLocalData();
    const volId = `vol-${Date.now()}`;
    let skills = volunteerPayload.skills || [];
    if (typeof skills === "string") {
      skills = skills.split(",").map(s => s.trim()).filter(Boolean);
    }

    const newVol = {
      id: volId,
      name: volunteerPayload.name,
      email: volunteerPayload.email,
      phone: volunteerPayload.phone || "(817) 555-0100",
      major: volunteerPayload.major || "Undergraduate",
      skills: skills.length > 0 ? skills : ["General Staff"],
      availability: volunteerPayload.availability || "Flexible",
      maxHoursPerWeek: parseInt(volunteerPayload.maxHoursPerWeek) || 8,
      notes: volunteerPayload.notes || ""
    };

    local.volunteers.push(newVol);
    this.saveLocalData(local);
    return { success: true, volunteer: newVol };
  },

  async deleteVolunteer(volunteerId) {
    let deletedVolunteer = null;
    const assignments = [];

    // Local DB manipulation
    const local = this.getLocalData();
    deletedVolunteer = (local.volunteers || []).find(v => v.id === volunteerId);
    if (!deletedVolunteer) {
      return { success: false, error: "Volunteer not found" };
    }

    // Unassign from any roles across all events
    (local.events || []).forEach(ev => {
      (ev.roles || []).forEach(r => {
        if ((r.assignedVolunteerIds || []).includes(volunteerId)) {
          r.assignedVolunteerIds = r.assignedVolunteerIds.filter(id => id !== volunteerId);
          assignments.push({ eventId: ev.id, roleId: r.id });
        }
      });
    });

    local.volunteers = (local.volunteers || []).filter(v => v.id !== volunteerId);
    this.saveLocalData(local);

    if (await this.isServerAvailable()) {
      try {
        await fetch("/api/volunteers/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ volunteerId })
        });
      } catch (e) {}
    }

    return {
      success: true,
      deletedBundle: {
        volunteer: deletedVolunteer,
        assignments: assignments
      }
    };
  },

  async restoreVolunteer(deletedBundle) {
    if (!deletedBundle || !deletedBundle.volunteer) return { success: false, error: "Invalid restore bundle" };

    const vol = deletedBundle.volunteer;
    const assignments = deletedBundle.assignments || [];

    const local = this.getLocalData();
    if (!local.volunteers.some(v => v.id === vol.id)) {
      local.volunteers.push(vol);
    }

    // Re-assign back to the roles they were on
    assignments.forEach(a => {
      const ev = (local.events || []).find(e => e.id === a.eventId);
      if (ev) {
        const role = (ev.roles || []).find(r => r.id === a.roleId);
        if (role) {
          role.assignedVolunteerIds = role.assignedVolunteerIds || [];
          if (!role.assignedVolunteerIds.includes(vol.id)) {
            role.assignedVolunteerIds.push(vol.id);
          }
        }
      }
    });

    this.saveLocalData(local);

    if (await this.isServerAvailable()) {
      try {
        await fetch("/api/volunteers/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deletedBundle)
        });
      } catch (e) {}
    }

    return { success: true, volunteer: vol };
  },

  async updateOrganization(orgPayload) {
    const local = this.getLocalData();
    local.organization = {
      ...(local.organization || {}),
      ...orgPayload
    };
    this.saveLocalData(local);
    return { success: true, organization: local.organization };
  },

  async assignVolunteer(eventId, roleId, volunteerId) {
    if (await this.isServerAvailable()) {
      try {
        const res = await fetch("/api/staffing/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, roleId, volunteerId })
        });
        const json = await res.json();
        if (res.ok) return { success: true, message: json.message };
        return { success: false, error: json.error || "Assignment failed" };
      } catch (e) {}
    }

    // Local fallback
    const local = this.getLocalData();
    const ev = local.events.find(e => e.id === eventId);
    if (!ev) return { success: false, error: "Event not found" };

    const role = (ev.roles || []).find(r => r.id === roleId);
    if (!role) return { success: false, error: "Role not found" };

    role.assignedVolunteerIds = role.assignedVolunteerIds || [];

    if (role.assignedVolunteerIds.includes(volunteerId)) {
      return { success: false, error: "Volunteer is already assigned to this role." };
    }

    // Quota check
    if (role.assignedVolunteerIds.length >= role.required) {
      return { success: false, error: "Role is already at capacity." };
    }

    // Collision check in same event
    for (const otherRole of ev.roles) {
      if ((otherRole.assignedVolunteerIds || []).includes(volunteerId)) {
        return { success: false, error: `Conflict: Volunteer already assigned to '${otherRole.name}' for this event.` };
      }
    }

    role.assignedVolunteerIds.push(volunteerId);
    this.saveLocalData(local);
    return { success: true };
  },

  async unassignVolunteer(eventId, roleId, volunteerId) {
    if (await this.isServerAvailable()) {
      try {
        const res = await fetch("/api/staffing/unassign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, roleId, volunteerId })
        });
        const json = await res.json();
        if (res.ok) return { success: true };
        return { success: false, error: json.error };
      } catch (e) {}
    }

    // Local fallback
    const local = this.getLocalData();
    const ev = local.events.find(e => e.id === eventId);
    if (!ev) return { success: false, error: "Event not found" };

    const role = (ev.roles || []).find(r => r.id === roleId);
    if (!role) return { success: false, error: "Role not found" };

    role.assignedVolunteerIds = (role.assignedVolunteerIds || []).filter(id => id !== volunteerId);
    this.saveLocalData(local);
    return { success: true };
  },

  async applyStaffingPlan(eventId, assignments) {
    if (await this.isServerAvailable()) {
      try {
        const res = await fetch("/api/copilot/apply-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, assignments })
        });
        const json = await res.json();
        if (res.ok) return { success: true, message: json.message };
        return { success: false, error: json.error || "Failed to commit staffing plan." };
      } catch (e) {}
    }

    // LocalStorage fallback
    const local = this.getLocalData();
    const ev = local.events.find(e => e.id === eventId);
    if (!ev) return { success: false, error: "Event not found" };

    // Check for collisions across roles
    const assignedAll = [];
    for (const [rId, vIds] of Object.entries(assignments)) {
      for (const vid of vIds) {
        if (assignedAll.includes(vid)) {
          const vol = (local.volunteers || []).find(v => v.id === vid);
          return { success: false, error: `Collision: '${vol ? vol.name : vid}' cannot be assigned to multiple roles in the same event.` };
        }
        assignedAll.push(vid);
      }
    }

    // Apply to roles
    (ev.roles || []).forEach(role => {
      if (assignments[role.id]) {
        role.assignedVolunteerIds = Array.from(new Set(assignments[role.id]));
      }
    });

    this.saveLocalData(local);
    return { success: true, message: "Staffing plan applied to event roster successfully." };
  },

  // 7. Check-in or update volunteer event status
  async checkInVolunteer(eventId, volunteerId, status = "checked_in", notes = "") {
    if (await this.isServerAvailable()) {
      try {
        const res = await fetch("/api/operations/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, volunteerId, status, notes })
        });
        const json = await res.json();
        if (res.ok) return { success: true, message: json.message };
        return { success: false, error: json.error };
      } catch (e) {}
    }

    // Local fallback
    const local = this.getLocalData();
    const ev = (local.events || []).find(e => e.id === eventId);
    if (!ev) return { success: false, error: "Event not found" };

    const assignedVols = [];
    (ev.roles || []).forEach(r => (r.assignedVolunteerIds || []).forEach(id => assignedVols.push(id)));
    if (!assignedVols.includes(volunteerId)) {
      return { success: false, error: "Volunteer is not assigned to this event." };
    }

    ev.checkIns = ev.checkIns || {};
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    ev.checkIns[volunteerId] = {
      status,
      timestamp: status === "checked_in" ? timeStr : (ev.checkIns[volunteerId]?.timestamp || null),
      notes: notes || ev.checkIns[volunteerId]?.notes || "",
      updatedAt: now.toISOString()
    };

    this.saveLocalData(local);
    return { success: true, message: `Volunteer status set to ${status}` };
  },

  // 8. Rapid replacement for absent/drop-out volunteer
  async replaceVolunteer(eventId, roleId, oldVolunteerId, newVolunteerId, reason = "Drop-out / No-show replacement") {
    if (await this.isServerAvailable()) {
      try {
        const res = await fetch("/api/operations/replace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, roleId, oldVolunteerId, newVolunteerId, reason })
        });
        const json = await res.json();
        if (res.ok) return { success: true, message: json.message };
        return { success: false, error: json.error };
      } catch (e) {}
    }

    // Local fallback
    const local = this.getLocalData();
    const ev = (local.events || []).find(e => e.id === eventId);
    if (!ev) return { success: false, error: "Event not found" };

    const role = (ev.roles || []).find(r => r.id === roleId);
    if (!role) return { success: false, error: "Role not found in event" };

    role.assignedVolunteerIds = role.assignedVolunteerIds || [];
    const oldIdx = role.assignedVolunteerIds.indexOf(oldVolunteerId);
    if (oldIdx !== -1) {
      role.assignedVolunteerIds.splice(oldIdx, 1);
    }

    // Check collision for new volunteer in other roles
    for (const otherRole of ev.roles || []) {
      if ((otherRole.assignedVolunteerIds || []).includes(newVolunteerId)) {
        return { success: false, error: "Replacement volunteer is already assigned to another role in this event." };
      }
    }

    if (!role.assignedVolunteerIds.includes(newVolunteerId)) {
      role.assignedVolunteerIds.push(newVolunteerId);
    }

    ev.checkIns = ev.checkIns || {};
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    ev.checkIns[oldVolunteerId] = {
      status: "replaced",
      timestamp: null,
      notes: `Replaced by backup: ${reason}`,
      updatedAt: now.toISOString()
    };

    ev.checkIns[newVolunteerId] = {
      status: "checked_in",
      timestamp: timeStr,
      notes: `Emergency backup replacement for ${oldVolunteerId}`,
      updatedAt: now.toISOString()
    };

    this.saveLocalData(local);
    return { success: true, message: "Backup volunteer assigned and checked in successfully." };
  },

  // 9. Update event status (e.g. Upcoming, In-Progress, Completed)
  async updateEventStatus(eventId, newStatus) {
    if (await this.isServerAvailable()) {
      try {
        const res = await fetch("/api/operations/event-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, status: newStatus })
        });
        const json = await res.json();
        if (res.ok) return { success: true };
      } catch (e) {}
    }

    const local = this.getLocalData();
    const ev = (local.events || []).find(e => e.id === eventId);
    if (ev) {
      ev.status = newStatus;
      this.saveLocalData(local);
      return { success: true };
    }
    return { success: false, error: "Event not found" };
  },

  // 10. Operations Center Aggregated Data View Model
  async getEventOperationsData(eventId) {
    const allData = await this.getAllData();
    const events = allData.events || [];
    const volunteers = allData.volunteers || [];
    const volMap = {};
    volunteers.forEach(v => volMap[v.id] = v);

    const event = events.find(e => e.id === eventId) || events[0];
    if (!event) return null;

    const roles = event.roles || [];
    const checkIns = event.checkIns || {};

    let totalRequired = 0;
    let totalAssigned = 0;
    let totalCheckedIn = 0;
    let totalPending = 0;
    let totalMissing = 0;

    const enrichedRoles = [];
    const volunteersList = [];
    const missingAlerts = [];
    const understaffedAlerts = [];
    const coveredPositions = [];
    const positionsNeedingAttention = [];

    roles.forEach(role => {
      const req = parseInt(role.required || 0);
      const assignedIds = role.assignedVolunteerIds || [];
      const ass = assignedIds.length;
      totalRequired += req;
      totalAssigned += ass;

      let roleCheckedIn = 0;
      let rolePending = 0;
      let roleMissing = 0;

      const roleVolunteers = assignedIds.map(vid => {
        const v = volMap[vid] || { id: vid, name: "Unlisted Volunteer", email: "N/A", phone: "N/A", major: "Student", skills: [] };
        const checkRecord = checkIns[vid] || { status: "pending", timestamp: null, notes: "" };
        const status = checkRecord.status || "pending";

        if (status === "checked_in") {
          roleCheckedIn++;
          totalCheckedIn++;
        } else if (status === "missing") {
          roleMissing++;
          totalMissing++;
          missingAlerts.push({
            volunteer: v,
            role,
            event,
            checkRecord
          });
        } else {
          rolePending++;
          totalPending++;
        }

        const volItem = {
          ...v,
          roleId: role.id,
          roleName: role.name,
          checkInStatus: status,
          timestamp: checkRecord.timestamp,
          notes: checkRecord.notes
        };
        volunteersList.push(volItem);
        return volItem;
      });

      const openSlots = Math.max(0, req - ass);
      const isUnderstaffed = openSlots > 0;
      const hasMissing = roleMissing > 0;
      const isFullyCovered = ass >= req && roleCheckedIn === ass && !isUnderstaffed;

      let roleStatus = "covered"; // "covered", "attention", "urgent"
      if (ass === 0 && req > 0) {
        roleStatus = "urgent";
      } else if (isUnderstaffed || hasMissing) {
        roleStatus = (openSlots >= 2 || roleMissing >= 2) ? "urgent" : "attention";
      } else if (rolePending > 0) {
        roleStatus = "attention";
      }

      if (isUnderstaffed) {
        understaffedAlerts.push({
          role,
          event,
          openSlots,
          required: req,
          assigned: ass
        });
      }

      const roleObj = {
        ...role,
        required: req,
        assignedCount: ass,
        checkedInCount: roleCheckedIn,
        pendingCount: rolePending,
        missingCount: roleMissing,
        openSlots,
        volunteers: roleVolunteers,
        roleStatus,
        isFullyCovered
      };

      enrichedRoles.push(roleObj);

      if (isFullyCovered) {
        coveredPositions.push(roleObj);
      } else {
        positionsNeedingAttention.push(roleObj);
      }
    });

    const checkInRate = totalAssigned > 0 ? Math.round((totalCheckedIn / totalAssigned) * 100) : 0;
    const coveragePct = totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 100;

    let healthStatus = "green"; // "green", "amber", "red"
    if (totalMissing > 0 || (totalRequired - totalAssigned) >= 3) {
      healthStatus = "red";
    } else if (coveragePct < 100 || totalPending > 0) {
      healthStatus = "amber";
    }

    return {
      event,
      allEvents: events,
      allVolunteers: volunteers,
      roles: enrichedRoles,
      volunteersList,
      summary: {
        totalRequired,
        totalAssigned,
        checkedInCount: totalCheckedIn,
        pendingCount: totalPending,
        missingCount: totalMissing,
        openSlots: Math.max(0, totalRequired - totalAssigned),
        checkInRate,
        coveragePct,
        healthStatus
      },
      missingAlerts,
      understaffedAlerts,
      coveredPositions,
      positionsNeedingAttention
    };
  },

  // 11. Post-Event Staffing Performance Retrospective
  async getPostEventReport(eventId) {
    const allData = await this.getAllData();
    const events = allData.events || [];
    const volunteers = allData.volunteers || [];
    const volMap = {};
    volunteers.forEach(v => volMap[v.id] = v);

    const event = events.find(e => e.id === eventId) || events[0];
    if (!event) return null;

    const roles = event.roles || [];
    const checkIns = event.checkIns || {};

    let plannedSlots = 0;
    let actualStaffed = 0;
    let checkedInCount = 0;
    let missingCount = 0;

    const roleFulfillment = roles.map(r => {
      const req = parseInt(r.required || 0);
      const assigned = r.assignedVolunteerIds || [];
      const ass = assigned.length;
      plannedSlots += req;
      actualStaffed += ass;

      let rCheckedIn = 0;
      let rMissing = 0;

      const volRecords = assigned.map(vid => {
        const v = volMap[vid] || { name: vid };
        const c = checkIns[vid] || { status: "pending", timestamp: null };
        if (c.status === "checked_in") {
          rCheckedIn++;
          checkedInCount++;
        } else if (c.status === "missing") {
          rMissing++;
          missingCount++;
        }
        return { volunteer: v, checkIn: c };
      });

      const fillRate = req > 0 ? Math.round((ass / req) * 100) : 100;
      const checkRate = ass > 0 ? Math.round((rCheckedIn / ass) * 100) : 0;

      return {
        roleId: r.id,
        roleName: r.name,
        required: req,
        assigned: ass,
        checkedIn: rCheckedIn,
        missing: rMissing,
        fillRate,
        checkRate,
        status: fillRate >= 100 && checkRate >= 100 ? "Optimal" : (fillRate >= 75 ? "Adequate" : "Shortage"),
        volunteers: volRecords
      };
    });

    const completionRate = plannedSlots > 0 ? Math.round((checkedInCount / plannedSlots) * 100) : 100;
    const noShowRate = actualStaffed > 0 ? Math.round((missingCount / actualStaffed) * 100) : 0;
    
    // Estimate volunteer hours based on duration of event (approx 4 hours per shift)
    const hoursDelivered = Math.round(checkedInCount * 4.2 * 10) / 10;

    // Custom or heuristic AI retrospective
    let aiRetrospective = event.postEventReport?.aiRetrospective;
    if (!aiRetrospective) {
      if (completionRate >= 90) {
        aiRetrospective = `Staffing was effectively deployed for ${event.title}. Volunteer attendance reached ${completionRate}%. For future iterations of this event, volunteer quotas can be maintained at current baseline levels.`;
      } else if (completionRate >= 65) {
        aiRetrospective = `Staffing experienced moderate friction with ${plannedSlots - actualStaffed} open vacancies and ${missingCount} no-shows. Recommend scheduling 1 backup reserve volunteer for high-traffic positions like Check-in and Stage Marshalls.`;
      } else {
        aiRetrospective = `Critical staffing deficit detected during event operations (${completionRate}% fulfillment). Immediate post-event review recommended: expand advance recruitment window and verify shift schedule confirmations 48 hours prior.`;
      }
    }

    return {
      event,
      summary: {
        plannedSlots,
        actualStaffed,
        checkedInCount,
        missingCount,
        completionRate,
        noShowRate,
        hoursDelivered,
        expectedAttendees: event.expectedAttendees || 100,
        actualAttendance: event.postEventReport?.attendance || Math.round((event.expectedAttendees || 100) * 1.05)
      },
      roleFulfillment,
      aiRetrospective
    };
  },

  async resetData() {
    const clone = JSON.parse(JSON.stringify(GATHERLY_INITIAL_DATA));
    this.saveLocalData(clone);
    return { success: true };
  }
};
