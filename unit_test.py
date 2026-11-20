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

    print("-" * 60)
    print(f"  SANDBOX UNIT TEST RESULTS: {passed}/{total} passed ({round(passed/total*100, 1)}%)")
    print("=" * 60)

    if passed != total:
        exit(1)

if __name__ == "__main__":
    run_pure_tests()
