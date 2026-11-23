/**
 * Gatherly - Client Side Router
 * Controls navigation between the 7 primary application views:
 * 1. Dashboard
 * 2. My Events
 * 3. Volunteers
 * 4. Staffing
 * 5. AI Copilot
 * 6. Reports
 * 7. Settings
 */

const AppRouter = {
  currentRoute: "dashboard",

  routes: {
    dashboard: DashboardView,
    events: EventsView,
    volunteers: VolunteersView,
    staffing: StaffingView,
    operations: OperationsView,
    liveops: OperationsView,
    copilot: CopilotView,
    reports: ReportsView,
    settings: SettingsView
  },

  titles: {
    dashboard: { title: "Dashboard", subtitle: "Event staffing overview" },
    events: { title: "My Events", subtitle: "Event schedule & positions" },
    volunteers: { title: "Volunteers", subtitle: "Student profiles & skills" },
    staffing: { title: "Staffing Matrix", subtitle: "Role assignments & quotas" },
    operations: { title: "Live Operations", subtitle: "Event-day check-in & incidents" },
    liveops: { title: "Live Operations", subtitle: "Event-day check-in & incidents" },
    copilot: { title: "AI Copilot", subtitle: "Smart staffing recommendations" },
    reports: { title: "Reports", subtitle: "Post-event analytics" },
    settings: { title: "Settings", subtitle: "Organization preferences" }
  },

  init() {
    // Check URL hash if present
    const hash = window.location.hash.replace("#/", "");
    if (this.routes[hash]) {
      this.currentRoute = hash;
    }
    this.render();

    // Listen for hash changes
    window.addEventListener("hashchange", () => {
      const newHash = window.location.hash.replace("#/", "");
      if (this.routes[newHash] && newHash !== this.currentRoute) {
        this.navigate(newHash);
      }
    });
  },

  async navigate(routeName) {
    if (!this.routes[routeName]) {
      routeName = "dashboard";
    }
    this.currentRoute = routeName;
    window.location.hash = `#/${routeName}`;

    // Update active nav styling
    document.querySelectorAll(".nav-item").forEach(el => {
      if (el.dataset.route === routeName) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });

    // Update topbar title
    const meta = this.titles[routeName] || { title: "Gatherly", subtitle: "" };
    const pageTitleEl = document.getElementById("topbar-page-title");
    const pageSubtitleEl = document.getElementById("topbar-page-subtitle");
    if (pageTitleEl) pageTitleEl.textContent = meta.title;
    if (pageSubtitleEl) pageSubtitleEl.textContent = meta.subtitle;

    // Close mobile sidebar if open
    App.closeMobileSidebar();

    // Render view
    await this.render();
  },

  async render() {
    const container = document.getElementById("main-view-container");
    if (!container) return;

    // Loading indicator
    container.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 350px;">
        <div style="text-align: center; color: var(--navy-600);">
          <div style="font-size: 2rem; margin-bottom: 8px;">⏳</div>
          <div style="font-size: 0.9rem; font-weight: 600;">Updating Gatherly workspace...</div>
        </div>
      </div>
    `;

    const view = this.routes[this.currentRoute] || DashboardView;
    try {
      const html = await view.render();
      container.innerHTML = html;
      window.scrollTo(0, 0);
      App.updateQuickPills();
    } catch (err) {
      console.error("Rendering error:", err);
      container.innerHTML = `
        <div class="card" style="padding: 32px; border-color: var(--status-red-border);">
          <h3 style="color: var(--status-red-solid);">Unable to render view</h3>
          <p style="color: var(--navy-800); margin: 8px 0 16px;">${err.message}</p>
          <button class="btn btn-primary" onclick="AppRouter.navigate('dashboard')">Return to Dashboard</button>
        </div>
      `;
    }
  },

  async refreshCurrentView() {
    await this.render();
  }
};
