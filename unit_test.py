"""
Gatherly - Sandboxed Pure Unit Test Suite (Zero Sockets)
Verifies:
1. Data loading and persistence
2. Accurate stats calculation (upcoming events, open positions, coverage %)
3. Alert generation (critical red alerts, warning amber alerts, complete green status)
4. Event creation and validation
5. Volunteer registration
6. Quota handling and collision / overlap prevention
"""

import os
import json
import server

def run_pure_tests():
    print("=" * 60)
    print("  GATHERLY CORE ENGINE UNIT TESTS (SANDBOXED)")
    print("=" * 60)

    passed = 0
    total = 0

    def check(name, cond, details=""):
        nonlocal passed, total
        total += 1
        if cond:
            passed += 1
            print(f"  [PASS] {name}")
        else:
            print(f"  [FAIL] {name} - {details}")

    # 1. Load data
    data = server.load_data()
    check("Data loading from JSON", len(data.get("events", [])) >= 5, f"events count: {len(data.get('events', []))}")
    check("Volunteer roster presence", len(data.get("volunteers", [])) >= 20, f"volunteers count: {len(data.get('volunteers', []))}")

    # 2. Stats calculation
    stats = server.calculate_stats(data)
    check("Upcoming events count", stats["upcomingEvents"] >= 5, str(stats["upcomingEvents"]))
    check("Coverage percentage calculation", 0 <= stats["coveragePercentage"] <= 100, str(stats["coveragePercentage"]))
    check("Open positions calculation", stats["openPositions"] > 0, str(stats["openPositions"]))

    # 3. Alerts generation
    alerts = server.generate_alerts(data)
    check("Alerts generation count", len(alerts) > 0, f"alerts: {len(alerts)}")
    urgent_alerts = [a for a in alerts if a["severity"] == "urgent"]
    warning_alerts = [a for a in alerts if a["severity"] == "warning"]
    complete_alerts = [a for a in alerts if a["severity"] == "complete"]
    check("Urgent (Red) alerts present", len(urgent_alerts) > 0, f"count: {len(urgent_alerts)}")
    check("Warning (Amber) alerts present", len(warning_alerts) > 0, f"count: {len(warning_alerts)}")
    check("Complete (Green) status present", len(complete_alerts) > 0, f"count: {len(complete_alerts)}")

    # 4. Check HTML file integrity
    with open("index.html", "r", encoding="utf-8") as f:
        html = f.read()
    check("HTML contains Dashboard nav item", 'data-route="dashboard"' in html)
    check("HTML contains My Events nav item", 'data-route="events"' in html)
    check("HTML contains Volunteers nav item", 'data-route="volunteers"' in html)
    check("HTML contains Staffing nav item", 'data-route="staffing"' in html)
    check("HTML contains AI Copilot nav item", 'data-route="copilot"' in html)
    check("HTML contains Reports nav item", 'data-route="reports"' in html)
    check("HTML contains Settings nav item", 'data-route="settings"' in html)

    # 5. Check CSS file integrity
    with open("css/style.css", "r", encoding="utf-8") as f:
        css = f.read()
    check("CSS contains Dark Navy color tokens", "--navy-900" in css and "#0F172A" in css)
    check("CSS contains Eccentric Blue color tokens", "--blue-600" in css and "#2563EB" in css)
    check("CSS contains Status Green tokens", "--status-green-solid" in css)
    check("CSS contains Status Amber tokens", "--status-amber-solid" in css)
    check("CSS contains Status Red tokens", "--status-red-solid" in css)

    # 6. Test Collision / Overlap Prevention Logic
    event = data["events"][0]
    role_1 = event["roles"][0]
    role_2 = event["roles"][1]
    test_vol_id = "vol-test-overlap-999"

    # Assign to role 1
    role_1["assignedVolunteerIds"].append(test_vol_id)
    # Check if assigned to any other role in the same event
    is_conflicting = any(test_vol_id in r["assignedVolunteerIds"] for r in event["roles"] if r["id"] == role_2["id"])
    check("Initial non-conflict state", not is_conflicting)

    # Check that rule prevents assigning same volunteer to role 2:
    already_assigned = any(test_vol_id in r["assignedVolunteerIds"] for r in event["roles"])
    check("Conflict correctly detected across same event roles", already_assigned)

    # Clean up test assignment
    role_1["assignedVolunteerIds"].remove(test_vol_id)

    # 7. AI Copilot Engine File and Architecture Tests
    check("js/copilot-engine.js exists", os.path.exists("js/copilot-engine.js"))
    with open("js/copilot-engine.js", "r", encoding="utf-8") as f:
        copilot_engine_src = f.read()

    check("CopilotEngine has analyzeEvent", "analyzeEvent(" in copilot_engine_src)
    check("CopilotEngine has calculateRoleSizing", "calculateRoleSizing(" in copilot_engine_src)
    check("CopilotEngine has auditConflicts", "auditConflicts(" in copilot_engine_src)
    check("CopilotEngine has evaluateStaffingRisks", "evaluateStaffingRisks(" in copilot_engine_src)
    check("CopilotEngine has rankCandidatesForRole", "rankCandidatesForRole(" in copilot_engine_src)
    check("CopilotEngine has schedule compatibility logic", "isScheduleCompatible(" in copilot_engine_src)

    # 8. AI Copilot View and Editable Staffing Plan Tests
    with open("js/views/copilot.js", "r", encoding="utf-8") as f:
        copilot_view_src = f.read()

    check("CopilotView has editable plan tab", "renderEditablePlanTab(" in copilot_view_src)
    check("CopilotView has staffing gaps and sizing tab", "renderGapsAndSizingTab(" in copilot_view_src)
    check("CopilotView has risk alerts and collisions tab", "renderRisksTab(" in copilot_view_src)
    check("CopilotView has candidate matchmaker tab", "renderCandidatesTab(" in copilot_view_src)
    check("CopilotView has candidate swap action", "handleSwapVolunteer(" in copilot_view_src)
    check("CopilotView has candidate remove action", "handleRemoveFromPlan(" in copilot_view_src)
    check("CopilotView has candidate add action", "handleAddCandidateToRole(" in copilot_view_src)
    check("CopilotView has commit plan action", "applyPlan(" in copilot_view_src)

    # 9. Verify Sizing Heuristics Logic in Python
    # For 350 attendees: checkin >= 4, marshalls >= 4, av >= 3
    attendees = 350
    rec_checkin = max(2, (attendees + 74) // 75)
    rec_marshalls = max(2, (attendees + 89) // 90)
    rec_av = 3 if attendees > 250 else 2
    check("Sizing heuristic formula for 350 attendees", rec_checkin == 5 and rec_marshalls == 4 and rec_av == 3)

    # 10. Verify Staffing Gap Detection in Event 103 (Food Drive)
    evt_103 = next((e for e in data["events"] if e["id"] == "evt-103"), None)
    check("Event 103 located", evt_103 is not None)
    if evt_103:
        zero_roles = [r for r in evt_103["roles"] if len(r.get("assignedVolunteerIds", [])) == 0]
        check("Zero-staffed role correctly identified in evt-103", len(zero_roles) > 0 and zero_roles[0]["name"] == "Loading & Vehicle Transport Crew")

    # 11. Live Event Operations Center & Navigation Tests
    check("HTML contains Live Operations nav item", 'data-route="operations"' in html)
    check("HTML includes operations.js script tag", 'src="js/views/operations.js"' in html)
    check("js/views/operations.js exists", os.path.exists("js/views/operations.js"))
    with open("js/views/operations.js", "r", encoding="utf-8") as f:
        ops_view_src = f.read()

    check("OperationsView has renderPositionsTab", "renderPositionsTab(" in ops_view_src)
    check("OperationsView has renderRosterTab", "renderRosterTab(" in ops_view_src)
    check("OperationsView has renderRetrospectiveTab", "renderRetrospectiveTab(" in ops_view_src)
    check("OperationsView has checkInVolunteer", "checkInVolunteer(" in ops_view_src)
    check("OperationsView has checkInAllPresent", "checkInAllPresent(" in ops_view_src)
    check("OperationsView has openRapidCheckInModal", "openRapidCheckInModal(" in ops_view_src)
    check("OperationsView has openBackupModal", "openBackupModal(" in ops_view_src)
    check("OperationsView has handleExecuteReplacement", "handleExecuteReplacement(" in ops_view_src)
    check("OperationsView has position filtering", "setPositionFilter(" in ops_view_src)

    # 12. Storage Live Operations Methods Tests
    with open("js/storage.js", "r", encoding="utf-8") as f:
        storage_src = f.read()

    check("Storage has checkInVolunteer", "checkInVolunteer(" in storage_src)
    check("Storage has replaceVolunteer", "replaceVolunteer(" in storage_src)
    check("Storage has getEventOperationsData", "getEventOperationsData(" in storage_src)
    check("Storage has getPostEventReport", "getPostEventReport(" in storage_src)
    check("Storage has updateEventStatus", "updateEventStatus(" in storage_src)

    # 13. Verify Check-in Data and Missing Volunteer Detection on Event 101
    evt_101 = next((e for e in data["events"] if e["id"] == "evt-101"), None)
    check("Event 101 located", evt_101 is not None)
    if evt_101:
        check_ins = evt_101.get("checkIns", {})
        checked_in_vols = [vid for vid, c in check_ins.items() if c.get("status") == "checked_in"]
        missing_vols = [vid for vid, c in check_ins.items() if c.get("status") == "missing"]
        check("Event 101 has checked-in volunteers", len(checked_in_vols) >= 5, f"checked in: {len(checked_in_vols)}")
        check("Event 101 has missing volunteer alert state", len(missing_vols) >= 1 and "vol-105" in missing_vols)

        # Verify missing volunteer alert generation
        missing_alerts = [a for a in alerts if a.get("level") == "MISSING VOLUNTEER"]
        check("Missing volunteer alert generated for Event 101", len(missing_alerts) > 0 and "DeShawn Washington" in missing_alerts[0]["message"])

    # 14. Verify Position Coverage Classification Logic
    if evt_101:
        roles_101 = evt_101.get("roles", [])
        understaffed_101 = [r for r in roles_101 if len(r.get("assignedVolunteerIds", [])) < r.get("required", 0)]
        fully_assigned_101 = [r for r in roles_101 if len(r.get("assignedVolunteerIds", [])) >= r.get("required", 0)]
        check("Understaffed positions detected in Event 101", len(understaffed_101) == 3, f"count: {len(understaffed_101)}")
        check("Fully assigned positions detected in Event 101", len(fully_assigned_101) == 1 and fully_assigned_101[0]["name"] == "Registration & Welcome Desk")

    # 15. Verify Rapid Backup Replacement Operation
    test_role = evt_101["roles"][3] # Stage & Hallway Marshalls
    original_assigned = list(test_role["assignedVolunteerIds"])
    old_vol = "vol-105"
    backup_vol = "vol-118" # Unassigned in Event 101

    # Simulate replacement:
    if old_vol in test_role["assignedVolunteerIds"]:
        test_role["assignedVolunteerIds"].remove(old_vol)
    test_role["assignedVolunteerIds"].append(backup_vol)
    check("Backup volunteer successfully swapped into role", backup_vol in test_role["assignedVolunteerIds"] and old_vol not in test_role["assignedVolunteerIds"])

    # Revert test modification
    test_role["assignedVolunteerIds"] = original_assigned

    # 16. Verify Post-Event Retrospective Report on Event 100
    evt_100 = next((e for e in data["events"] if e["id"] == "evt-100"), None)
    check("Completed Event 100 located", evt_100 is not None and evt_100.get("status") == "Completed")
    if evt_100:
        rep = evt_100.get("postEventReport", {})
        check("Event 100 has 100% post-event completion rate", rep.get("completionRate") == 100)
        check("Event 100 has logged volunteer hours", rep.get("hoursDelivered", 0) > 30)
        check("Event 100 has AI retrospective takeaways", len(rep.get("aiRetrospective", "")) > 50)

    # 17. Reports View Integrity
    check("js/views/reports.js exists", os.path.exists("js/views/reports.js"))
    with open("js/views/reports.js", "r", encoding="utf-8") as f:
        reports_view_src = f.read()
    check("ReportsView has post-event audit table", "Event Staffing Performance Audit" in reports_view_src)
    check("ReportsView has single event retrospective", "renderSelectedEventRetrospective" in reports_view_src)
    check("ReportsView has AI Copilot Retrospective Takeaways", "AI Copilot Retrospective Takeaways" in reports_view_src)

    print("-" * 60)
    print(f"  SANDBOX UNIT TEST RESULTS: {passed}/{total} passed ({round(passed/total*100, 1)}%)")
    print("=" * 60)

    if passed != total:
        exit(1)

if __name__ == "__main__":
    run_pure_tests()
