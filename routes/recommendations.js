// routes/recommendations.js
// ─────────────────────────────────────────────────────────────────────────
// GET /api/recommendations
//
// ML Pipeline (chained):
//   1. TF-IDF Cosine Similarity  → content-based skill matching
//   2. Collaborative Filtering   → "popular with similar students"
//   3. Random Forest             → success probability per internship
//   4. JS Fallback               → keyword overlap when ML service is offline
// ─────────────────────────────────────────────────────────────────────────

const express = require("express");
const axios = require("axios");
const router = express.Router();
const mongoose = require("mongoose");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";

// ─────────────────────────────────────────────────────────────────────────
// SKILL SYNONYM MAP
// Normalize short/alias skill names before sending to ML service.
// e.g. "JS" → "JavaScript", "ML" → "Machine Learning"
// ─────────────────────────────────────────────────────────────────────────
const SKILL_SYNONYMS = {
  "js": "JavaScript",
  "ts": "TypeScript",
  "ml": "Machine Learning",
  "ai": "Machine Learning",
  "dl": "Deep Learning",
  "nlp": "NLP",
  "cv": "Computer Vision",
  "rn": "React Native",
  "node": "Node.js",
  "nodejs": "Node.js",
  "reactjs": "React",
  "vue": "Vue.js",
  "vuejs": "Vue.js",
  "angular": "Angular",
  "html": "HTML/CSS",
  "css": "HTML/CSS",
  "html/css": "HTML/CSS",
  "postgres": "PostgreSQL",
  "mongo": "MongoDB",
  "tf": "TensorFlow",
  "pytorch": "PyTorch",
  "k8s": "Kubernetes",
  "aws": "AWS",
  "gcp": "GCP",
  "azure": "Azure",
  "ci/cd": "CI/CD",
  "cicd": "CI/CD",
  "dsa": "Data Structures",
  "ds": "Data Structures",
  "restapi": "REST APIs",
  "rest": "REST APIs",
  "graphql": "GraphQL",
  "flask": "Flask",
  "fastapi": "FastAPI",
  "django": "Django",
  "spring": "Spring Boot",
  "springboot": "Spring Boot",
  "langchain": "LangChain",
  "llm": "LangChain",
  "figma": "Figma",
  "tailwind": "Tailwind",
  "tailwindcss": "Tailwind",
  "nextjs": "Next.js",
  "next": "Next.js",
  "express": "Express",
  "expressjs": "Express",
  "docker": "Docker",
  "git": "Git",
  "linux": "Linux",
  "sql": "SQL",
  "redis": "Redis",
  "java": "Java",
  "kotlin": "Kotlin",
  "swift": "Swift",
  "flutter": "Flutter",
  "c++": "C++",
  "cpp": "C++",
  "c#": "C#",
  "csharp": "C#",
  ".net": ".NET",
  "dotnet": ".NET",
};

function normalizeSkills(skills) {
  return [...new Set(
    skills.map(s => {
      const lower = (typeof s === "string" ? s : s.name || "").toLowerCase().trim();
      return SKILL_SYNONYMS[lower] || (typeof s === "string" ? s : s.name);
    }).filter(Boolean)
  )];
}

// ─────────────────────────────────────────────────────────────────────────
// JAVASCRIPT FALLBACK MATCHER
// Used when the Python ML service is offline.
// Pure keyword overlap — fast, no external dependency.
// ─────────────────────────────────────────────────────────────────────────
function jsFallbackMatch(studentSkills, internships) {
  const studentSet = new Set(studentSkills.map(s => s.toLowerCase()));

  return internships.map(job => {
    const jobSkills = (job.skills || []).map(s => s.toLowerCase());
    const jobText = `${job.title} ${job.desc} ${jobSkills.join(" ")} ${job.domain}`.toLowerCase();

    // Exact skill overlap
    const matched = jobSkills.filter(s => studentSet.has(s));
    const exactScore = jobSkills.length > 0 ? matched.length / jobSkills.length : 0;

    // Partial keyword overlap in description
    let keywordBonus = 0;
    studentSkills.forEach(skill => {
      if (jobText.includes(skill.toLowerCase())) keywordBonus += 0.05;
    });

    const finalScore = Math.min(1.0, exactScore + keywordBonus);
    const pct = Math.round(finalScore * 100);

    const have = (job.skills || []).filter(s => studentSet.has(s.toLowerCase()));
    const need = (job.skills || []).filter(s => !studentSet.has(s.toLowerCase()));

    return {
      _id: job._id.toString(),
      id: job._id.toString(),
      title: job.title || "",
      company: job.company || "",
      domain: job.domain || "",
      type: job.type || "",
      stipend: job.stipend || "",
      duration: job.duration || "",
      skills: job.skills || [],
      desc: job.desc || "",
      emoji: job.emoji || "🚀",
      matchScore: parseFloat(finalScore.toFixed(4)),
      matchPercentage: pct,
      successProbability: 0,
      recoType: "Skill Match (Offline Mode)",
      skillGap: { have, need },
      isOfflineFallback: true,
    };
  }).sort((a, b) => b.matchPercentage - a.matchPercentage);
}

// ─────────────────────────────────────────────────────────────────────────
// CHECK IF ML SERVICE IS ALIVE
// ─────────────────────────────────────────────────────────────────────────
async function isMLAlive() {
  try {
    // Increased timeout to 5s to allow for model loading/cold starts
    const r = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    return r.status === 200;
  } catch (err) {
    console.error("[Recommendations] Health check failed:", err.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// COMPUTE PROFILE COMPLETENESS (0–8 score)
// ─────────────────────────────────────────────────────────────────────────
function profileCompleteness(student) {
  const p = student.profile || {};
  let score = 0;
  if (p.college) score++;
  if (p.techBackground) score++;
  if (p.linkedin) score++;
  if (p.github) score++;
  if (p.phone) score++;
  if ((student.skills || []).length > 0) score++;
  if (student.firstName) score++;
  if (student.lastName) score++;
  return score; // max 8
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN ROUTE
// ─────────────────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const User = mongoose.model("User");
    const Internship = mongoose.model("Internship");

    // ── Step 1: Load student ───────────────────────────────────────────
    const student = await User.findOne({ email: req.auth.email });
    if (!student) return res.status(404).json({ error: "Student not found" });

    // ── Step 2: Normalize and extract skill names ──────────────────────
    const rawSkills = student.skills || [];
    const skillNames = normalizeSkills(rawSkills);

    if (skillNames.length === 0) {
      return res.json({
        studentName: student.firstName || student.username,
        skills: [],
        recommendations: [],
        message: "Add skills to your profile to get personalised recommendations!",
      });
    }

    // ── Step 3: Load all internships ──────────────────────────────────
    const internships = await Internship.find({}).lean();
    if (internships.length === 0) {
      return res.json({
        studentName: student.firstName || student.username,
        skills: skillNames,
        recommendations: [],
      });
    }

    // Build lookup map
    const internshipMap = {};
    internships.forEach(job => { internshipMap[job._id.toString()] = job; });

    const profScore = profileCompleteness(student);

    // ── Step 4: Check if ML service is online ─────────────────────────
    const mlOnline = await isMLAlive();

    // ── Step 5: Offline fallback ───────────────────────────────────────
    if (!mlOnline) {
      console.warn("[Recommendations] ML service offline — using JS fallback");
      const fallback = jsFallbackMatch(skillNames, internships).slice(0, 10);
      return res.json({
        studentName: student.firstName || student.username,
        skills: skillNames,
        recommendations: fallback,
        mlOffline: true,
      });
    }

    // ── Step 6: Build ML payload ───────────────────────────────────────
    const mlPayload = {
      student_skills: skillNames,
      internships: internships.map(job => ({
        id: job._id.toString(),
        title: job.title || "",
        description: job.desc || "",
        required_skills: (job.skills || []),
        domain: job.domain || "",
        company: job.company || "",
      })),
    };

    // ── Step 7a: TF-IDF match ─────────────────────────────────────────
    let topMatches = [];
    try {
      const mlResp = await axios.post(`${ML_SERVICE_URL}/match`, mlPayload, { timeout: 12000 });
      topMatches = mlResp.data || [];
    } catch (err) {
      console.error("[Recommendations] TF-IDF error:", err.message);
      // Degrade to fallback silently
      const fallback = jsFallbackMatch(skillNames, internships).slice(0, 10);
      return res.json({
        studentName: student.firstName || student.username,
        skills: skillNames,
        recommendations: fallback,
        mlOffline: true,
      });
    }

    // ── Step 7b: Collaborative Filtering ─────────────────────────────
    let cfMatches = [];
    try {
      const cfResp = await axios.post(
        `${ML_SERVICE_URL}/recommend/collaborative`,
        { student_id: student._id.toString(), top_n: 20 },
        { timeout: 10000 }
      );
      cfMatches = cfResp.data.recommendations || [];
    } catch (err) {
      console.warn("[Recommendations] CF not available:", err.message);
    }

    // ── Step 8: Merge TF-IDF + CF results ─────────────────────────────
    const combinedMap = new Map();

    // Insert TF-IDF matches first (higher trust)
    topMatches.forEach(m => {
      combinedMap.set(m.id, {
        id: m.id,
        matchScore: m.score,
        matchPercentage: m.percentage,
        recoType: "Skill Match",
        cfBoost: false,
      });
    });

    // Overlay CF matches
    cfMatches.forEach(m => {
      if (combinedMap.has(m.id)) {
        // Already from TF-IDF — mark as double-confirmed and give small boost
        const existing = combinedMap.get(m.id);
        existing.recoType = "Skill Match + Popular";
        existing.matchPercentage = Math.min(100, existing.matchPercentage + 5);
        existing.cfBoost = true;
      } else {
        // CF-only: derive percentage from actual CF score (not a fake 70%)
        const cfPct = Math.min(75, Math.round((m.score || 0) * 15 + 45)); // range ~45–75
        combinedMap.set(m.id, {
          id: m.id,
          matchScore: m.score / 10,
          matchPercentage: cfPct,
          recoType: "Popular with Similar Students",
          cfBoost: true,
        });
      }
    });

    const combinedList = Array.from(combinedMap.values());

    // ── Step 9: Batch success probability prediction ───────────────────
    const studentSet = new Set(skillNames.map(s => s.toLowerCase()));

    const batchItems = combinedList.map(item => {
      const job = internshipMap[item.id] || {};
      const jobSkills = (job.skills || []).map(s => s.toLowerCase());
      const exactMatched = jobSkills.filter(s => studentSet.has(s)).length;
      const domainMatch = (
        student.profile?.techBackground &&
        job.domain &&
        student.profile.techBackground.toLowerCase().includes(job.domain.toLowerCase())
      ) ? 1 : 0;

      return {
        match_score: item.matchScore,
        student_skills_count: skillNames.length,
        skills_matched_count: exactMatched,        // NEW: exact overlap count
        profile_completeness: profScore,
        message_length: 50,                         // reasonable default
        domain_match: domainMatch,
      };
    });

    let probabilities = new Array(combinedList.length).fill(0);
    try {
      const probResp = await axios.post(
        `${ML_SERVICE_URL}/predict/success-batch`,
        { items: batchItems },
        { timeout: 10000 }
      );
      probabilities = probResp.data.probabilities || probabilities;
    } catch (err) {
      console.warn("[Recommendations] Success prediction skipped:", err.message);
    }

    // ── Step 10: Enrich results with full job data + skill gap ─────────
    const enriched = combinedList.map((match, idx) => {
      const job = internshipMap[match.id] || {};
      const jobSkills = job.skills || [];
      const have = jobSkills.filter(s => studentSet.has(s.toLowerCase()));
      const need = jobSkills.filter(s => !studentSet.has(s.toLowerCase()));

      return {
        _id: match.id,
        id: match.id,
        title: job.title || match.title || "",
        company: job.company || "",
        domain: job.domain || "",
        type: job.type || "",
        stipend: job.stipend || "",
        duration: job.duration || "",
        skills: jobSkills,
        desc: job.desc || "",
        emoji: job.emoji || "🚀",
        matchScore: match.matchScore,
        matchPercentage: match.matchPercentage,
        successProbability: Math.round((probabilities[idx] || 0) * 100),
        recoType: match.recoType,
        skillGap: { have, need },       // NEW: skill gap breakdown
        cfBoost: match.cfBoost,
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);

    // ── Step 11: Persist recommendations to DB ─────────────────────────
    try {
      student.recommendations = enriched.map(r => ({
        internshipId: r.id,
        matchPercentage: r.matchPercentage,
        successProbability: r.successProbability,
        recoType: r.recoType,
        updatedAt: new Date(),
      }));
      await student.save();
    } catch (saveErr) {
      console.error("[Recommendations] DB save error:", saveErr.message);
    }

    // ── Step 12: Return ────────────────────────────────────────────────
    return res.json({
      studentName: student.firstName || student.username,
      skills: skillNames,
      recommendations: enriched,
    });

  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
      return res.status(503).json({
        error: "ML service is offline. Start it with: uvicorn main:app --reload --port 8000",
      });
    }
    console.error("[Recommendations] Fatal error:", err.message);
    return res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

module.exports = router;
