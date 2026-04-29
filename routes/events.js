const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const router = express.Router();

// POST /api/events
// Log a user behavioral action (view, click, ignore, etc.)
router.post("/", async (req, res) => {
    // Manual auth check for POST /api/events
    const h = req.headers.authorization;
    const token = h && h.startsWith("Bearer ") ? h.slice(7).trim() : null;
    if (!token) return res.status(401).json({ error: "Login required" });
    
    let auth;
    try {
      auth = jwt.verify(token, process.env.JWT_SECRET || "supersecret");
    } catch (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    try {
      const UserEvent = mongoose.model("UserEvent");
    const User = mongoose.model("User");
    
    // Auth token contains email
    const user = await User.findOne({ email: auth.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { action, internshipId, metadata } = req.body;

    if (!action) {
      return res.status(400).json({ error: "Action is required" });
    }

    const eventData = {
      user: user._id,
      action
    };

    if (internshipId) {
      eventData.internship = internshipId;
    }

    if (metadata) {
      eventData.metadata = metadata;
    }

    await UserEvent.create(eventData);
    
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("[Events API] Error logging event:", err.message);
    res.status(500).json({ error: "Failed to log event" });
  }
});

// GET /api/events/summary
// For the Python ML service to fetch outcome data (for logistic regression training)
router.get("/summary", async (req, res) => {
  try {
    const Application = mongoose.model("Application");
    
    // We only care about outcomes that are final (approved or rejected)
    const outcomes = await Application.find({ 
      status: { $in: ["approved", "rejected"] } 
    }).populate("internship student");

    res.json({
      outcomes: outcomes.map(app => {
        // Safe check for populated docs
        const intern = app.internship || {};
        const stu = app.student || {};
        const profile = stu.profile || {};
        const skillsCount = stu.skills ? stu.skills.length : 0;
        
        let profileCompleteness = 0;
        if (profile.college) profileCompleteness++;
        if (profile.techBackground) profileCompleteness++;
        if (profile.linkedin) profileCompleteness++;
        if (profile.github) profileCompleteness++;
        
        const jobSkills = intern.skills || [];
        const studentSkills = stu.skills || [];
        const matchedSkills = jobSkills.filter(s => 
          studentSkills.some(ss => ss.toLowerCase() === s.toLowerCase())
        ).length;
        
        return {
          applicationId: app._id.toString(),
          internshipId: intern._id ? intern._id.toString() : null,
          studentId: stu._id ? stu._id.toString() : null,
          status: app.status === "approved" ? 1 : 0,
          student_skills_count: skillsCount,
          skills_matched_count: matchedSkills,
          profile_completeness: profileCompleteness,
          message_length: app.message ? app.message.length : 0,
          domain_match: (stu.profile && stu.profile.techBackground && intern.domain && stu.profile.techBackground.toLowerCase().includes(intern.domain.toLowerCase())) ? 1 : 0
        };
      })
    });
  } catch (err) {
    console.error("[Events API] Error fetching summary:", err.message);
    res.status(500).json({ error: "Failed to fetch event summary" });
  }
});

// GET /api/apps/summary
// For Collaborative Filtering: list of which students applied to which internships
router.get("/apps/summary", async (req, res) => {
  try {
    const Application = mongoose.model("Application");
    const apps = await Application.find({}).select("student internship");
    
    res.json({
      applications: apps
        .filter(a => a.student && a.internship)
        .map(a => ({
          studentId: a.student.toString(),
          internshipId: a.internship.toString()
        }))
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch apps summary" });
  }
});


module.exports = router;
