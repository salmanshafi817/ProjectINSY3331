/**
 * Gatherly - Settings View
 * Configuration for Student Organization profile, notification thresholds,
 * and testing/reset controls.
 */

const SettingsView = {
  async render() {
    const data = await GatherlyStorage.getAllData();
    const org = data.organization || {};

    return `
      <!-- HEADER -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--navy-900); letter-spacing: -0.5px;">Settings & Organization</h2>
        <p style="font-size: 0.875rem; color: var(--text-muted);">
          Manage chapter preferences, notification alert thresholds, and system sample data.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- ORG PROFILE CARD -->
        <div class="card">
          <div class="card-header">
            <h3><span>🏛️</span> Organization Profile</h3>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Student Organization Name</label>
              <input type="text" id="setting-org-name" class="form-control" value="${org.name || 'Association for Information Systems (AIS)'}" />
            </div>

            <div class="form-group">
              <label class="form-label">Campus Chapter / Institution</label>
              <input type="text" id="setting-org-campus" class="form-control" value="${org.campus || 'University Campus'}" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Officer In Charge</label>
                <input type="text" id="setting-org-officer" class="form-control" value="${org.officerName || 'Alex Rivera'}" />
              </div>
              <div class="form-group">
                <label class="form-label">Executive Role</label>
                <input type="text" id="setting-org-role" class="form-control" value="${org.officerRole || 'VP of Event Operations'}" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Active Academic Term</label>
              <input type="text" id="setting-org-term" class="form-control" value="${org.term || 'Fall 2026'}" />
            </div>

            <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
              <button class="btn btn-primary" onclick="SettingsView.saveProfile()">
                <span>💾</span> Save Organization Profile
              </button>
            </div>
          </div>
        </div>

        <!-- THRESHOLDS & PREFERENCES -->
        <div class="card">
          <div class="card-header">
            <h3><span>⚙️</span> Staffing Thresholds</h3>
          </div>
          <div class="card-body">
            <div style="margin-bottom: 16px;">
              <label class="form-label">🟢 Completed Staffing Threshold</label>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px;">
                Triggers when 100% of required volunteers are assigned and confirmed.
              </p>
              <input type="text" class="form-control" value="100% Coverage" readonly />
            </div>

            <div style="margin-bottom: 16px;">
              <label class="form-label">🟡 Warning / Partial Coverage</label>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px;">
                Surfaces warning cards when coverage is between 50% and 99%.
              </p>
              <input type="text" class="form-control" value="50% - 99% Coverage" readonly />
            </div>

            <div style="margin-bottom: 16px;">
              <label class="form-label">🔴 Urgent Shortage Alert</label>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px;">
                Fires urgent red alerts for critical roles with 0 volunteers or under 50% staffing.
              </p>
              <input type="text" class="form-control" value="< 50% Coverage or 0 Staffed" readonly />
            </div>
          </div>
        </div>
      </div>

      <!-- RESET / DATA RECOVERY -->
      <div class="card" style="margin-top: 24px; border-color: var(--status-amber-border);">
        <div class="card-header" style="background-color: var(--status-amber-bg);">
          <h3 style="color: var(--status-amber-text);"><span>🔄</span> Demo & Sample Data Management</h3>
        </div>
        <div class="card-body">
          <p style="font-size: 0.875rem; color: var(--navy-800); margin-bottom: 14px;">
            Need to reset your testing state? This reloads the realistic sample dataset with 5 student events, 20 volunteers, and initial role quotas.
          </p>
          <button class="btn btn-secondary" onclick="SettingsView.handleReset()">
            <span>⚠️</span> Reset All Data to Default Sample State
          </button>
        </div>
      </div>
    `;
  },

  async saveProfile() {
    const name = document.getElementById("setting-org-name")?.value.trim() || "Association for Information Systems (AIS)";
    const campus = document.getElementById("setting-org-campus")?.value.trim() || "University Campus";
    const officerName = document.getElementById("setting-org-officer")?.value.trim() || "Alex Rivera";
    const officerRole = document.getElementById("setting-org-role")?.value.trim() || "VP of Event Operations";
    const term = document.getElementById("setting-org-term")?.value.trim() || "Fall 2026";

    const payload = {
      name,
      campus,
      officerName,
      officerRole,
      term
    };

    const res = await GatherlyStorage.updateOrganization(payload);
    if (res.success) {
      App.showToast("Organization profile updated successfully!", "success");
      // Update topbar header if displayed
      const orgNameEl = document.querySelector(".topbar-org");
      if (orgNameEl) orgNameEl.textContent = name;
    } else {
      App.showToast(res.error || "Failed to update profile", "error");
    }
  },

  async handleReset() {
    if (confirm("Reset all events, volunteers, and staffing assignments back to the initial sample data?")) {
      await GatherlyStorage.resetData();
      App.showToast("Application reset to sample dataset", "success");
      AppRouter.navigate("dashboard");
    }
  }
};
