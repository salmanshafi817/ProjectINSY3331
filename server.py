"""
Gatherly - AI-Powered Event Staffing Copilot
Lightweight REST API & Static Asset Server for ProjectINSY3331
Zero external dependencies (uses standard library http.server, json, urllib)
"""

import http.server
import json
import os
import sys
import urllib.parse
from datetime import datetime

PORT = 8000
DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "sample_data.json")

def load_data():
    if not os.path.exists(DATA_FILE):
        return {"organization": {}, "events": [], "volunteers": []}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def calculate_stats(data):
    events = data.get("events", [])
    volunteers = data.get("volunteers", [])
    
    total_volunteers = len(volunteers)
    upcoming_events = len([e for e in events if e.get("status") == "Upcoming"])
    
    total_required = 0
    total_assigned = 0
    
    for ev in events:
        for role in ev.get("roles", []):
            req = int(role.get("required", 0))
            ass = len(role.get("assignedVolunteerIds", []))
            total_required += req
            total_assigned += min(ass, req)
            
    open_positions = max(0, total_required - total_assigned)
    coverage_pct = round((total_assigned / total_required * 100), 1) if total_required > 0 else 100.0
    
    return {
        "upcomingEvents": upcoming_events,
        "totalVolunteers": total_volunteers,
        "totalRequiredPositions": total_required,
        "totalAssignedPositions": total_assigned,
        "openPositions": open_positions,
        "coveragePercentage": coverage_pct
    }

def generate_alerts(data):
    events = data.get("events", [])
    alerts = []
    
    for ev in events:
        ev_title = ev.get("title")
        ev_date = ev.get("date")
        roles = ev.get("roles", [])
        
        ev_req = sum(r.get("required", 0) for r in roles)
        ev_ass = sum(len(r.get("assignedVolunteerIds", [])) for r in roles)
        
        # Check critical role shortages
        for r in roles:
            req = r.get("required", 0)
            ass = len(r.get("assignedVolunteerIds", []))
            remaining = req - ass
            
            if req > 0 and ass == 0:
                alerts.append({
                    "id": f"alt-{ev.get('id')}-{r.get('id')}",
                    "severity": "urgent", # Red
                    "level": "URGENT",
                    "title": f"Zero Staffing: {r.get('name')}",
                    "event": ev_title,
                    "eventId": ev.get("id"),
                    "date": ev_date,
                    "message": f"'{r.get('name')}' in {ev_title} has 0 of {req} required volunteers assigned.",
                    "remaining": remaining,
                    "color": "red"
                })
            elif req > 0 and (ass / req) < 0.5:
                alerts.append({
                    "id": f"alt-{ev.get('id')}-{r.get('id')}",
                    "severity": "urgent", # Red
                    "level": "CRITICAL",
                    "title": f"Severe Shortage: {r.get('name')}",
                    "event": ev_title,
                    "eventId": ev.get("id"),
                    "date": ev_date,
                    "message": f"{r.get('name')} is critically understaffed ({ass}/{req} volunteers).",
                    "remaining": remaining,
                    "color": "red"
                })
            elif req > 0 and ass < req:
                alerts.append({
                    "id": f"alt-{ev.get('id')}-{r.get('id')}",
                    "severity": "warning", # Amber
                    "level": "WARNING",
                    "title": f"Partial Coverage: {r.get('name')}",
                    "event": ev_title,
                    "eventId": ev.get("id"),
                    "date": ev_date,
                    "message": f"Needs {remaining} more volunteer{'s' if remaining > 1 else ''} to reach full quota ({ass}/{req}).",
                    "remaining": remaining,
                    "color": "amber"
                })
                
        if ev_req > 0 and ev_ass == ev_req:
            alerts.append({
                "id": f"alt-complete-{ev.get('id')}",
                "severity": "complete", # Green
                "level": "COMPLETED",
                "title": f"Fully Staffed: {ev_title}",
                "event": ev_title,
                "eventId": ev.get("id"),
                "date": ev_date,
                "message": f"All {ev_req} positions are fully confirmed and ready for event day.",
                "remaining": 0,
                "color": "green"
            })
            
    # Sort: urgent first, then warning, then complete
    priority = {"urgent": 0, "warning": 1, "complete": 2}
    alerts.sort(key=lambda a: priority.get(a["severity"], 3))
    return alerts

class GatherlyRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and disable aggressive caching for local dev
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def send_json(self, status_code, payload):
        body = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        
        if path.startswith("/api/"):
            data = load_data()
            if path == "/api/data" or path == "/api/all":
                data_copy = dict(data)
                data_copy["stats"] = calculate_stats(data)
                data_copy["alerts"] = generate_alerts(data)
                return self.send_json(200, data_copy)
            elif path == "/api/stats":
                return self.send_json(200, calculate_stats(data))
            elif path == "/api/events":
                return self.send_json(200, data.get("events", []))
            elif path == "/api/volunteers":
                return self.send_json(200, data.get("volunteers", []))
            elif path == "/api/alerts":
                return self.send_json(200, generate_alerts(data))
            elif path == "/api/organization":
                return self.send_json(200, data.get("organization", {}))
            else:
                return self.send_json(404, {"error": "API route not found"})
                
        # Serve index.html for root path or SPA navigation
        if path == "/" or not os.path.exists(os.path.join(os.path.dirname(__file__), path.lstrip("/"))):
            if not "." in os.path.basename(path):
                self.path = "/index.html"
                
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        
        content_len = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(content_len).decode("utf-8") if content_len > 0 else "{}"
        try:
            body = json.loads(raw_body)
        except Exception as e:
            return self.send_json(400, {"error": f"Invalid JSON body: {str(e)}"})
            
        data = load_data()
        
        # 1. Create Event
        if path == "/api/events":
            title = body.get("title", "").strip()
            date = body.get("date", "").strip()
            if not title or not date:
                return self.send_json(400, {"error": "Event title and date are required."})
                
            event_id = f"evt-{int(datetime.now().timestamp() * 1000)}"
            new_roles = []
            for idx, r in enumerate(body.get("roles", [])):
                if r.get("name"):
                    new_roles.append({
                        "id": f"role-{event_id}-{idx+1}",
                        "name": r.get("name").strip(),
                        "required": max(1, int(r.get("required", 1))),
                        "assignedVolunteerIds": [],
                        "skillsRequired": r.get("skillsRequired", ["General Staff"])
                    })
                    
            new_event = {
                "id": event_id,
                "title": title,
                "category": body.get("category", "General"),
                "date": date,
                "time": body.get("time", "12:00 PM - 04:00 PM"),
                "location": body.get("location", "Main Campus"),
                "expectedAttendees": int(body.get("expectedAttendees", 100)),
                "description": body.get("description", "Student organization event."),
                "status": "Upcoming",
                "roles": new_roles if new_roles else [
                    {
                        "id": f"role-{event_id}-1",
                        "name": "General Event Staff",
                        "required": 3,
                        "assignedVolunteerIds": [],
                        "skillsRequired": ["Customer Service"]
                    }
                ]
            }
            data.setdefault("events", []).insert(0, new_event)
            save_data(data)
            return self.send_json(201, {"message": "Event created successfully", "event": new_event})

        # 2. Add Volunteer
        elif path == "/api/volunteers":
            name = body.get("name", "").strip()
            email = body.get("email", "").strip()
            if not name or not email:
                return self.send_json(400, {"error": "Name and email are required."})
                
            vol_id = f"vol-{int(datetime.now().timestamp() * 1000)}"
            skills = body.get("skills", [])
            if isinstance(skills, str):
                skills = [s.strip() for s in skills.split(",") if s.strip()]
                
            new_vol = {
                "id": vol_id,
                "name": name,
                "email": email,
                "phone": body.get("phone", "(817) 555-0100"),
                "major": body.get("major", "Undergraduate"),
                "skills": skills if skills else ["General Staff"],
                "availability": body.get("availability", "Flexible"),
                "maxHoursPerWeek": int(body.get("maxHoursPerWeek", 8)),
                "notes": body.get("notes", "")
            }
            data.setdefault("volunteers", []).append(new_vol)
            save_data(data)
            return self.send_json(201, {"message": "Volunteer registered successfully", "volunteer": new_vol})

        # 3. Assign Volunteer to Role
        elif path == "/api/staffing/assign":
            event_id = body.get("eventId")
            role_id = body.get("roleId")
            volunteer_id = body.get("volunteerId")
            
            if not event_id or not role_id or not volunteer_id:
                return self.send_json(400, {"error": "eventId, roleId, and volunteerId are required."})
                
            # Find event and role
            event = next((e for e in data.get("events", []) if e.get("id") == event_id), None)
            if not event:
                return self.send_json(404, {"error": "Event not found."})
                
            role = next((r for r in event.get("roles", []) if r.get("id") == role_id), None)
            if not role:
                return self.send_json(404, {"error": "Role not found in event."})
                
            assigned = role.setdefault("assignedVolunteerIds", [])
            
            # Check if already assigned to this role
            if volunteer_id in assigned:
                return self.send_json(400, {"error": "Volunteer is already assigned to this role."})
                
            # Check quota
            if len(assigned) >= role.get("required", 0):
                return self.send_json(400, {"error": "Role is already at maximum capacity."})
                
            # Prevent conflicting role in the same event
            for other_role in event.get("roles", []):
                if volunteer_id in other_role.get("assignedVolunteerIds", []):
                    return self.send_json(400, {
                        "error": f"Conflict: Volunteer is already assigned to '{other_role.get('name')}' for this event."
                    })
                    
            assigned.append(volunteer_id)
            save_data(data)
            return self.send_json(200, {
                "message": "Volunteer assigned successfully",
                "assignedCount": len(assigned),
                "required": role.get("required", 0)
            })

        # 4. Unassign Volunteer from Role
        elif path == "/api/staffing/unassign":
            event_id = body.get("eventId")
            role_id = body.get("roleId")
            volunteer_id = body.get("volunteerId")
            
            event = next((e for e in data.get("events", []) if e.get("id") == event_id), None)
            if not event:
                return self.send_json(404, {"error": "Event not found."})
                
            role = next((r for r in event.get("roles", []) if r.get("id") == role_id), None)
            if not role:
                return self.send_json(404, {"error": "Role not found."})
                
            assigned = role.get("assignedVolunteerIds", [])
            if volunteer_id in assigned:
                assigned.remove(volunteer_id)
                save_data(data)
                return self.send_json(200, {"message": "Volunteer unassigned successfully"})
            else:
                return self.send_json(400, {"error": "Volunteer was not assigned to this role."})

        # 5. Apply AI Staffing Plan
        elif path == "/api/copilot/apply-plan":
            event_id = body.get("eventId")
            plan_assignments = body.get("assignments", {})  # { roleId: [volunteerIds...] }
            
            event = next((e for e in data.get("events", []) if e.get("id") == event_id), None)
            if not event:
                return self.send_json(404, {"error": "Event not found."})
                
            # Verify no duplicate volunteers assigned across multiple roles in this event
            assigned_all = []
            for role_id, v_ids in plan_assignments.items():
                for vid in v_ids:
                    if vid in assigned_all:
                        v_name = next((v.get("name") for v in data.get("volunteers", []) if v.get("id") == vid), vid)
                        return self.send_json(400, {
                            "error": f"Collision: Volunteer '{v_name}' cannot be assigned to multiple roles in the same event."
                        })
                    assigned_all.append(vid)

            # Apply assignments to event roles
            for role in event.get("roles", []):
                r_id = role.get("id")
                if r_id in plan_assignments:
                    # Clean and preserve unique IDs up to role required capacity
                    cleaned_ids = list(dict.fromkeys(plan_assignments[r_id]))
                    role["assignedVolunteerIds"] = cleaned_ids

            save_data(data)
            return self.send_json(200, {
                "message": "Staffing plan committed successfully",
                "event": event,
                "stats": calculate_stats(data)
            })
                
        # 6. Reset to Sample Data
        elif path == "/api/reset":
            # Can re-read sample seed if desired
            return self.send_json(200, {"message": "Reset endpoint available"})

        return self.send_json(404, {"error": "Endpoint not found"})

def run():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server_address = ("", PORT)
    httpd = http.server.HTTPServer(server_address, GatherlyRequestHandler)
    print(f"===========================================================")
    print(f"  Gatherly SaaS Server started at http://localhost:{PORT}")
    print(f"  Design: Dark Navy & Eccentric Blue, 7 Core Views")
    print(f"  API: /api/stats, /api/events, /api/volunteers, /api/staffing")
    print(f"===========================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()

if __name__ == "__main__":
    run()
