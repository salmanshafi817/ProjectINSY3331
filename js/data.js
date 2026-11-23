/**
 * Gatherly - Initial Seed & Fallback Data Model
 * Provides offline/static resilience and initial state
 */

const GATHERLY_INITIAL_DATA = {
  organization: {
    name: "Association for Information Systems (AIS)",
    campus: "University Campus Chapter",
    term: "Fall 2026",
    copilotStatus: "Active - Engine v1.0",
    officerName: "Alex Rivera",
    officerRole: "VP of Event Operations"
  },
  events: [
    {
      id: "evt-101",
      title: "Spring Tech Symposium 2026",
      category: "Conference",
      date: "2026-11-28",
      time: "09:00 AM - 04:30 PM",
      location: "Nedderman Hall Auditorium & Atrium",
      expectedAttendees: 350,
      description: "Annual student conference featuring keynote speakers, tech career panels, and live student project showcases.",
      status: "Upcoming",
      roles: [
        {
          id: "role-101-1",
          name: "Registration & Welcome Desk",
          required: 4,
          assignedVolunteerIds: ["vol-102", "vol-106", "vol-108", "vol-115"],
          skillsRequired: ["Check-in", "Customer Service", "Greeter"]
        },
        {
          id: "role-101-2",
          name: "A/V & Tech Setup",
          required: 3,
          assignedVolunteerIds: ["vol-101", "vol-107"],
          skillsRequired: ["Audio/Visual", "Tech Setup"]
        },
        {
          id: "role-101-3",
          name: "Speaker Concierge & Logistics",
          required: 2,
          assignedVolunteerIds: ["vol-104"],
          skillsRequired: ["Hospitality", "Communication"]
        },
        {
          id: "role-101-4",
          name: "Stage & Hallway Marshalls",
          required: 4,
          assignedVolunteerIds: ["vol-105"],
          skillsRequired: ["Crowd Management", "Safety"]
        }
      ],
      checkIns: {
        "vol-102": {
          status: "checked_in",
          timestamp: "08:15 AM",
          notes: "Stationed at Welcome & Check-in Desk A"
        },
        "vol-106": {
          status: "checked_in",
          timestamp: "08:24 AM",
          notes: "Distributing symposium badges and schedules"
        },
        "vol-101": {
          status: "checked_in",
          timestamp: "08:30 AM",
          notes: "Testing audio levels on auditorium stage"
        },
        "vol-107": {
          status: "checked_in",
          timestamp: "08:42 AM",
          notes: "Keynote slide switcher configured"
        },
        "vol-104": {
          status: "checked_in",
          timestamp: "08:50 AM",
          notes: "Guest speaker green room stocked"
        },
        "vol-108": {
          status: "pending",
          timestamp: null,
          notes: "Shift starts at 09:00 AM"
        },
        "vol-115": {
          status: "pending",
          timestamp: null,
          notes: "In transit to Nedderman Hall"
        },
        "vol-105": {
          status: "missing",
          timestamp: null,
          notes: "Shift began at 08:30 AM - Not present at stage"
        }
      }
    },
    {
      id: "evt-102",
      title: "Hackathon Kickoff & Mentorship Night",
      category: "Hackathon",
      date: "2026-12-02",
      time: "05:00 PM - 10:30 PM",
      location: "University Center Bluebonnet Ballroom",
      expectedAttendees: 280,
      description: "48-hour student hackathon opening ceremony, team formation mixer, and mentor breakout tables.",
      status: "Upcoming",
      roles: [
        {
          id: "role-102-1",
          name: "Check-in & Swag Distribution",
          required: 4,
          assignedVolunteerIds: ["vol-103", "vol-106", "vol-112", "vol-114"],
          skillsRequired: ["Check-in", "Swag Distribution"]
        },
        {
          id: "role-102-2",
          name: "Food & Catering Logistics",
          required: 3,
          assignedVolunteerIds: ["vol-110", "vol-116", "vol-117"],
          skillsRequired: ["Food Logistics", "Inventory"]
        },
        {
          id: "role-102-3",
          name: "Hardware Lab Monitors",
          required: 3,
          assignedVolunteerIds: ["vol-101", "vol-111", "vol-118"],
          skillsRequired: ["Hardware", "Tech Setup"]
        }
      ]
    },
    {
      id: "evt-103",
      title: "Campus Winter Food & Toy Drive",
      category: "Community Outreach",
      date: "2026-12-05",
      time: "10:00 AM - 03:30 PM",
      location: "Central Library Mall Plaza",
      expectedAttendees: 500,
      description: "Philanthropic community outreach collecting canned goods, winter apparel, and gift donations for local families.",
      status: "Upcoming",
      roles: [
        {
          id: "role-103-1",
          name: "Donation Booth Attendants",
          required: 6,
          assignedVolunteerIds: ["vol-102", "vol-103", "vol-113"],
          skillsRequired: ["Customer Service", "Greeter"]
        },
        {
          id: "role-103-2",
          name: "Sorting & Inventory Packers",
          required: 5,
          assignedVolunteerIds: ["vol-104", "vol-110"],
          skillsRequired: ["Inventory", "Organization"]
        },
        {
          id: "role-103-3",
          name: "Loading & Vehicle Transport Crew",
          required: 4,
          assignedVolunteerIds: [],
          skillsRequired: ["Heavy Lifting", "Logistics"]
        }
      ]
    },
    {
      id: "evt-104",
      title: "Alumni Career Networking Mixer",
      category: "Networking",
      date: "2026-12-10",
      time: "06:00 PM - 09:00 PM",
      location: "College of Business Atrium",
      expectedAttendees: 180,
      description: "Professional networking dinner connecting undergraduate students with corporate alumni and recruiters.",
      status: "Upcoming",
      roles: [
        {
          id: "role-104-1",
          name: "VIP Reception Host",
          required: 2,
          assignedVolunteerIds: ["vol-108", "vol-114"],
          skillsRequired: ["Hospitality", "Greeter"]
        },
        {
          id: "role-104-2",
          name: "Name Badge & Info Desk",
          required: 3,
          assignedVolunteerIds: ["vol-112", "vol-115"],
          skillsRequired: ["Check-in", "Customer Service"]
        },
        {
          id: "role-104-3",
          name: "Catering & Beverage Assistants",
          required: 2,
          assignedVolunteerIds: ["vol-117"],
          skillsRequired: ["Food Logistics"]
        }
      ]
    },
    {
      id: "evt-105",
      title: "End-of-Semester Student Celebration",
      category: "Social",
      date: "2026-12-14",
      time: "07:00 PM - 11:00 PM",
      location: "Student Activity Center Main Hall",
      expectedAttendees: 400,
      description: "Year-end student community celebration featuring games, DJ soundstage, photo booth, and dessert tables.",
      status: "Upcoming",
      roles: [
        {
          id: "role-105-1",
          name: "Photo Booth & Activity Guides",
          required: 3,
          assignedVolunteerIds: ["vol-109"],
          skillsRequired: ["Photography", "Customer Service"]
        },
        {
          id: "role-105-2",
          name: "Entry Wristbands & Access Control",
          required: 4,
          assignedVolunteerIds: ["vol-105", "vol-113"],
          skillsRequired: ["Crowd Management", "Safety"]
        },
        {
          id: "role-105-3",
          name: "Tear Down & Cleanup Squad",
          required: 5,
          assignedVolunteerIds: [],
          skillsRequired: ["Heavy Lifting", "Cleanup"]
        }
      ]
    },
    {
      id: "evt-100",
      title: "Fall Orientation & Member Mixer",
      category: "Social",
      date: "2026-09-12",
      time: "11:00 AM - 03:00 PM",
      location: "Brazos Park & Student Lounge",
      expectedAttendees: 220,
      description: "Semester kickoff welcoming new AIS student members with project demos, networking breakout tables, and lunch.",
      status: "Completed",
      roles: [
        {
          id: "role-100-1",
          name: "Check-in & Welcome Table",
          required: 3,
          assignedVolunteerIds: ["vol-102", "vol-106", "vol-112"],
          skillsRequired: ["Check-in", "Customer Service"]
        },
        {
          id: "role-100-2",
          name: "Lunch & Refreshment Table",
          required: 3,
          assignedVolunteerIds: ["vol-110", "vol-116", "vol-117"],
          skillsRequired: ["Food Logistics"]
        },
        {
          id: "role-100-3",
          name: "Sound & Music Setup",
          required: 2,
          assignedVolunteerIds: ["vol-101", "vol-107"],
          skillsRequired: ["Audio/Visual"]
        }
      ],
      checkIns: {
        "vol-102": { status: "checked_in", timestamp: "10:30 AM", notes: "Completed 4.5 hrs" },
        "vol-106": { status: "checked_in", timestamp: "10:35 AM", notes: "Completed 4.5 hrs" },
        "vol-112": { status: "checked_in", timestamp: "10:45 AM", notes: "Completed 4.2 hrs" },
        "vol-110": { status: "checked_in", timestamp: "10:40 AM", notes: "Completed 4.3 hrs" },
        "vol-116": { status: "checked_in", timestamp: "10:42 AM", notes: "Completed 4.3 hrs" },
        "vol-117": { status: "checked_in", timestamp: "10:50 AM", notes: "Completed 4.1 hrs" },
        "vol-101": { status: "checked_in", timestamp: "10:15 AM", notes: "Completed 5.0 hrs" },
        "vol-107": { status: "checked_in", timestamp: "10:20 AM", notes: "Completed 4.8 hrs" }
      },
      postEventReport: {
        attendance: 235,
        plannedSlots: 8,
        actualStaffed: 8,
        checkedInCount: 8,
        completionRate: 100,
        hoursDelivered: 35.7,
        incidentsResolved: 1,
        satisfactionScore: 9.6,
        aiRetrospective: "Staffing ratio was exceptionally well balanced for Brazos Park foot traffic. Check-in lines were maintained below 2 minutes throughout peak rush. Recommend maintaining 3-person welcome desk for next year's orientation."
      }
    }
  ],
  volunteers: [
    {
      id: "vol-101",
      name: "Marcus Chen",
      email: "marcus.chen@student.uta.edu",
      phone: "(817) 555-0142",
      major: "Information Systems '26",
      skills: ["Audio/Visual", "Tech Setup", "Hardware"],
      availability: "Weekends & Evenings",
      maxHoursPerWeek: 10,
      notes: "Experienced with soundboard mixers and HDMI projector switchers."
    },
    {
      id: "vol-102",
      name: "Priya Patel",
      email: "priya.patel@student.uta.edu",
      phone: "(817) 555-0189",
      major: "Computer Science '25",
      skills: ["Check-in", "Customer Service", "Greeter"],
      availability: "Weekdays & Friday Evenings",
      maxHoursPerWeek: 8,
      notes: "Former campus tour guide; very comfortable in front-desk roles."
    },
    {
      id: "vol-103",
      name: "Jordan Taylor",
      email: "jordan.taylor@student.uta.edu",
      phone: "(817) 555-0231",
      major: "Marketing '27",
      skills: ["Social Media", "Photography", "Check-in", "Swag Distribution"],
      availability: "Flexible",
      maxHoursPerWeek: 12,
      notes: "Handles chapter Instagram stories and event photography."
    },
    {
      id: "vol-104",
      name: "Elena Rodriguez",
      email: "elena.rodriguez@student.uta.edu",
      phone: "(817) 555-0314",
      major: "Finance '25",
      skills: ["Inventory", "Organization", "Hospitality", "First Aid"],
      availability: "Weekends",
      maxHoursPerWeek: 6,
      notes: "CPR and First Aid certified. Highly detail-oriented with item counts."
    },
    {
      id: "vol-105",
      name: "DeShawn Washington",
      email: "deshawn.w@student.uta.edu",
      phone: "(817) 555-0428",
      major: "Mechanical Engineering '26",
      skills: ["Heavy Lifting", "Logistics", "Crowd Management", "Safety"],
      availability: "Evenings & Weekends",
      maxHoursPerWeek: 8,
      notes: "Reliable for stage equipment loading and floor traffic management."
    },
    {
      id: "vol-106",
      name: "Sarah Kim",
      email: "sarah.kim@student.uta.edu",
      phone: "(817) 555-0567",
      major: "Pre-Business '28",
      skills: ["Check-in", "Customer Service", "Greeter", "Swag Distribution"],
      availability: "Mornings & Weekends",
      maxHoursPerWeek: 6,
      notes: "Enthusiastic freshman looking to get involved in student org operations."
    },
    {
      id: "vol-107",
      name: "Tyler Brooks",
      email: "tyler.brooks@student.uta.edu",
      phone: "(817) 555-0612",
      major: "Information Systems '25",
      skills: ["Audio/Visual", "Tech Setup", "Communication"],
      availability: "Fridays & Saturdays",
      maxHoursPerWeek: 8,
      notes: "Audio engineer hobbyist; managed sound for 3 previous university events."
    },
    {
      id: "vol-108",
      name: "Ananya Sharma",
      email: "ananya.sharma@student.uta.edu",
      phone: "(817) 555-0744",
      major: "Data Science '26",
      skills: ["Hospitality", "Greeter", "Check-in", "Communication"],
      availability: "Afternoons & Weekends",
      maxHoursPerWeek: 10,
      notes: "Fluent in English, Hindi, and Spanish. Great with guest speakers."
    },
    {
      id: "vol-109",
      name: "Lucas Vance",
      email: "lucas.vance@student.uta.edu",
      phone: "(817) 555-0821",
      major: "Communications '27",
      skills: ["Photography", "Customer Service", "Social Media"],
      availability: "Weekends Only",
      maxHoursPerWeek: 6,
      notes: "Brings own mirrorless camera and portable LED lighting rig."
    },
    {
      id: "vol-110",
      name: "Chloe Bennett",
      email: "chloe.b@student.uta.edu",
      phone: "(817) 555-0953",
      major: "Nursing '25",
      skills: ["Food Logistics", "Inventory", "First Aid", "Safety"],
      availability: "Flexible",
      maxHoursPerWeek: 10,
      notes: "Food handling certified; certified emergency response team."
    },
    {
      id: "vol-111",
      name: "Ethan Nguyen",
      email: "ethan.nguyen@student.uta.edu",
      phone: "(817) 555-1087",
      major: "Software Engineering '26",
      skills: ["Hardware", "Tech Setup", "Organization"],
      availability: "Evenings & Weekends",
      maxHoursPerWeek: 8,
      notes: "Experienced with Arduino and Raspberry Pi hardware station setup."
    },
    {
      id: "vol-112",
      name: "Olivia Martinez",
      email: "olivia.m@student.uta.edu",
      phone: "(817) 555-1192",
      major: "Visual Communication '27",
      skills: ["Check-in", "Customer Service", "Greeter", "Photography"],
      availability: "Weekdays & Saturday Mornings",
      maxHoursPerWeek: 6,
      notes: "Designs printable name badges and directional signage."
    },
    {
      id: "vol-113",
      name: "Malik Jackson",
      email: "malik.jackson@student.uta.edu",
      phone: "(817) 555-1245",
      major: "Kinesiology '26",
      skills: ["Crowd Management", "Safety", "Heavy Lifting", "Customer Service"],
      availability: "Weekends",
      maxHoursPerWeek: 8,
      notes: "Intramural sports referee; very commanding yet friendly crowd presence."
    },
    {
      id: "vol-114",
      name: "Sophia Zhang",
      email: "sophia.zhang@student.uta.edu",
      phone: "(817) 555-1380",
      major: "Accounting '25",
      skills: ["Check-in", "Hospitality", "Swag Distribution", "Inventory"],
      availability: "Flexible",
      maxHoursPerWeek: 10,
      notes: "Past AIS Treasurer; fast with QR code check-in scanner apps."
    },
    {
      id: "vol-115",
      name: "Noah Garcia",
      email: "noah.garcia@student.uta.edu",
      phone: "(817) 555-1472",
      major: "Cybersecurity '27",
      skills: ["Check-in", "Customer Service", "Tech Setup"],
      availability: "Mornings & Afternoons",
      maxHoursPerWeek: 6,
      notes: "Assists with network Wi-Fi kiosk troubleshooting."
    },
    {
      id: "vol-116",
      name: "Hannah Lee",
      email: "hannah.lee@student.uta.edu",
      phone: "(817) 555-1563",
      major: "Public Health '26",
      skills: ["Food Logistics", "Safety", "First Aid"],
      availability: "Evenings & Weekends",
      maxHoursPerWeek: 8,
      notes: "Experienced with allergen labeling and banquet food service."
    },
    {
      id: "vol-117",
      name: "Cameron Davis",
      email: "cameron.d@student.uta.edu",
      phone: "(817) 555-1654",
      major: "Industrial Engineering '25",
      skills: ["Food Logistics", "Inventory", "Logistics", "Cleanup"],
      availability: "Fridays & Weekends",
      maxHoursPerWeek: 10,
      notes: "Focus on line throughput efficiency and rapid cleanup routines."
    },
    {
      id: "vol-118",
      name: "Jessica Taylor",
      email: "jessica.t@student.uta.edu",
      phone: "(817) 555-1748",
      major: "Computer Engineering '26",
      skills: ["Hardware", "Audio/Visual", "Tech Setup"],
      availability: "Flexible",
      maxHoursPerWeek: 8,
      notes: "Works in campus maker lab; comfortable fixing broken peripherals."
    },
    {
      id: "vol-119",
      name: "Brandon Miller",
      email: "brandon.m@student.uta.edu",
      phone: "(817) 555-1832",
      major: "Management '27",
      skills: ["Greeter", "Communication", "Cleanup"],
      availability: "Available All Week",
      maxHoursPerWeek: 12,
      notes: "High availability, eager to pick up open spots."
    },
    {
      id: "vol-120",
      name: "Kayla Washington",
      email: "kayla.w@student.uta.edu",
      phone: "(817) 555-1926",
      major: "Human Resource Management '25",
      skills: ["Customer Service", "Organization", "Check-in"],
      availability: "Weekdays After 3PM",
      maxHoursPerWeek: 8,
      notes: "Human resources focus; great at welcoming new volunteer trainees."
    }
  ]
};
