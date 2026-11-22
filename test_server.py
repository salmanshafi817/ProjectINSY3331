"""
Gatherly - Iteration 1 Automated Test Suite
Tests REST API endpoints, static asset delivery, calculations, and collision prevention.
"""

import sys
import os
import json
import time
import threading
import urllib.request
import urllib.error

# Ensure we can import server
import server

def run_tests():
    print("=" * 60)
    print("  GATHERLY TEST SUITE - ITERATION 1 FOUNDATION")
    print("=" * 60)

    # 1. Start server in a background thread
    server_address = ("", 8000)
    httpd = server.http.server.HTTPServer(server_address, server.GatherlyRequestHandler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.5)

    base_url = "http://127.0.0.1:8000"
    passed = 0
    total = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  [PASS] {name}")
        else:
            print(f"  [FAIL] {name} - {details}")

    # Test 1: Fetch index.html
    try:
        req = urllib.request.urlopen(f"{base_url}/index.html")
        html = req.read().decode("utf-8")
        assert_test("Static HTML Delivery", req.status == 200 and "Gatherly" in html, f"status: {req.status}")
    except Exception as e:
        assert_test("Static HTML Delivery", False, str(e))

    # Test 2: Fetch CSS
    try:
        req = urllib.request.urlopen(f"{base_url}/css/style.css")
        css = req.read().decode("utf-8")
        assert_test("CSS Delivery", req.status == 200 and "--navy-900" in css, f"status: {req.status}")
    except Exception as e:
        assert_test("CSS Delivery", False, str(e))

    # Test 3: GET /api/stats
    try:
        req = urllib.request.urlopen(f"{base_url}/api/stats")
        stats = json.loads(req.read().decode("utf-8"))
        assert_test("API /api/stats response", "upcomingEvents" in stats and "coveragePercentage" in stats, str(stats))
        assert_test("Accurate volunteer headcount", stats["totalVolunteers"] >= 20, f"count: {stats.get('totalVolunteers')}")
        assert_test("Accurate open positions count", stats["openPositions"] > 0, f"open: {stats.get('openPositions')}")
    except Exception as e:
        assert_test("API /api/stats response", False, str(e))

    # Test 4: GET /api/alerts
    try:
        req = urllib.request.urlopen(f"{base_url}/api/alerts")
        alerts = json.loads(req.read().decode("utf-8"))
        assert_test("API /api/alerts response", isinstance(alerts, list) and len(alerts) > 0, f"count: {len(alerts)}")
        has_urgent = any(a.get("severity") == "urgent" for a in alerts)
        assert_test("Urgent red alerts detected", has_urgent, "no urgent alert found")
    except Exception as e:
        assert_test("API /api/alerts response", False, str(e))

    # Test 5: GET /api/events
    try:
        req = urllib.request.urlopen(f"{base_url}/api/events")
        events = json.loads(req.read().decode("utf-8"))
        assert_test("API /api/events response", isinstance(events, list) and len(events) >= 5, f"events count: {len(events)}")
    except Exception as e:
        assert_test("API /api/events response", False, str(e))

    # Test 6: POST /api/events (Create Event)
    new_event_id = None
    try:
        post_data = json.dumps({
            "title": "Automated Test Leadership Gala",
            "category": "Social",
            "date": "2026-12-20",
            "time": "06:00 PM - 09:00 PM",
            "location": "Alumni Pavilion",
            "expectedAttendees": 200,
            "roles": [
                {"name": "Welcome Host", "required": 2, "skillsRequired": ["Greeter"]},
                {"name": "Beverage Coordinator", "required": 1, "skillsRequired": ["Food Logistics"]}
            ]
        }).encode("utf-8")
        req = urllib.request.Request(f"{base_url}/api/events", data=post_data, headers={"Content-Type": "application/json"}, method="POST")
        resp = urllib.request.urlopen(req)
        resp_json = json.loads(resp.read().decode("utf-8"))
        new_event_id = resp_json.get("event", {}).get("id")
        assert_test("POST /api/events creates event", resp.status == 201 and new_event_id is not None, str(resp_json))
    except Exception as e:
        assert_test("POST /api/events creates event", False, str(e))

    # Test 7: POST /api/volunteers (Add Volunteer)
    new_vol_id = None
    try:
        post_data = json.dumps({
            "name": "Alex Test Volunteer",
            "email": "alex.test@student.uta.edu",
            "major": "Computer Science '26",
            "skills": ["Greeter", "Customer Service"],
            "availability": "Flexible",
            "maxHoursPerWeek": 10
        }).encode("utf-8")
        req = urllib.request.Request(f"{base_url}/api/volunteers", data=post_data, headers={"Content-Type": "application/json"}, method="POST")
        resp = urllib.request.urlopen(req)
        resp_json = json.loads(resp.read().decode("utf-8"))
        new_vol_id = resp_json.get("volunteer", {}).get("id")
        assert_test("POST /api/volunteers registers volunteer", resp.status == 201 and new_vol_id is not None, str(resp_json))
    except Exception as e:
        assert_test("POST /api/volunteers registers volunteer", False, str(e))

    # Test 8: POST /api/staffing/assign (Assign volunteer to role)
    if new_event_id and new_vol_id:
        try:
            req_events = urllib.request.urlopen(f"{base_url}/api/events")
            events_list = json.loads(req_events.read().decode("utf-8"))
            target_ev = next(e for e in events_list if e["id"] == new_event_id)
            role_1 = target_ev["roles"][0]
            role_2 = target_ev["roles"][1]

            assign_data = json.dumps({
                "eventId": new_event_id,
                "roleId": role_1["id"],
                "volunteerId": new_vol_id
            }).encode("utf-8")
            req = urllib.request.Request(f"{base_url}/api/staffing/assign", data=assign_data, headers={"Content-Type": "application/json"}, method="POST")
            resp = urllib.request.urlopen(req)
            assert_test("POST /api/staffing/assign assigns volunteer", resp.status == 200)

            # Test 9: Collision / Overlap Prevention: Attempt assigning same volunteer to role 2 in SAME event
            overlap_data = json.dumps({
                "eventId": new_event_id,
                "roleId": role_2["id"],
                "volunteerId": new_vol_id
            }).encode("utf-8")
            req_conflict = urllib.request.Request(f"{base_url}/api/staffing/assign", data=overlap_data, headers={"Content-Type": "application/json"}, method="POST")
            try:
                urllib.request.urlopen(req_conflict)
                assert_test("Collision Prevention Blocks Overlap", False, "Expected 400 error but succeeded")
            except urllib.error.HTTPError as he:
                assert_test("Collision Prevention Blocks Overlap", he.code == 400, f"Blocked with HTTP {he.code}")

            # Test 10: Unassign volunteer
            unassign_data = json.dumps({
                "eventId": new_event_id,
                "roleId": role_1["id"],
                "volunteerId": new_vol_id
            }).encode("utf-8")
            req_unassign = urllib.request.Request(f"{base_url}/api/staffing/unassign", data=unassign_data, headers={"Content-Type": "application/json"}, method="POST")
            resp_un = urllib.request.urlopen(req_unassign)
            assert_test("POST /api/staffing/unassign removes volunteer", resp_un.status == 200)

            # Test 11: POST /api/copilot/apply-plan (Apply AI Staffing Plan)
            plan_data = json.dumps({
                "eventId": new_event_id,
                "assignments": {
                    role_1["id"]: [new_vol_id],
                    role_2["id"]: ["vol-101"]
                }
            }).encode("utf-8")
            req_plan = urllib.request.Request(f"{base_url}/api/copilot/apply-plan", data=plan_data, headers={"Content-Type": "application/json"}, method="POST")
            resp_plan = urllib.request.urlopen(req_plan)
            plan_resp_json = json.loads(resp_plan.read().decode("utf-8"))
            assert_test("POST /api/copilot/apply-plan commits plan", resp_plan.status == 200 and "event" in plan_resp_json)

            # Test 12: Collision Prevention in AI Staffing Plan (Attempt double-booking volunteer in same plan)
            bad_plan_data = json.dumps({
                "eventId": new_event_id,
                "assignments": {
                    role_1["id"]: [new_vol_id],
                    role_2["id"]: [new_vol_id]  # Duplicate in same event!
                }
            }).encode("utf-8")
            req_bad_plan = urllib.request.Request(f"{base_url}/api/copilot/apply-plan", data=bad_plan_data, headers={"Content-Type": "application/json"}, method="POST")
            try:
                urllib.request.urlopen(req_bad_plan)
                assert_test("Copilot Plan Rejects Duplicate Volunteer", False, "Expected 400 error but succeeded")
            except urllib.error.HTTPError as he:
                assert_test("Copilot Plan Rejects Duplicate Volunteer", he.code == 400, f"Blocked with HTTP {he.code}")

        except Exception as e:
            assert_test("Assignment & Collision Workflow", False, str(e))

    print("-" * 60)
    print(f"  RESULTS: {passed}/{total} tests passed ({round(passed/total*100, 1)}%)")
    print("=" * 60)

    httpd.shutdown()
    sys.exit(0 if passed == total else 1)

if __name__ == "__main__":
    run_tests()
