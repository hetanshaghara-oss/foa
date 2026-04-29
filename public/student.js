// ============================================
// INTERNPATH - Student Portal Logic
// ============================================

const ALL_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Vue.js",
  "Angular",
  "Next.js",
  "Node.js",
  "Express",
  "Python",
  "Django",
  "Flask",
  "FastAPI",
  "Java",
  "Spring Boot",
  "C++",
  "C#",
  ".NET",
  "SQL",
  "MongoDB",
  "PostgreSQL",
  "Redis",
  "GraphQL",
  "AWS",
  "Azure",
  "GCP",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "Machine Learning",
  "TensorFlow",
  "PyTorch",
  "NLP",
  "LangChain",
  "React Native",
  "Flutter",
  "Swift",
  "Kotlin",
  "Figma",
  "UI/UX",
  "HTML/CSS",
  "Tailwind",
  "Git",
  "Linux",
  "REST APIs",
  "Data Structures",
];

let INTERNSHIPS_DB = [];

// Initialize DB from LocalStorage or fetch from API
async function initInternshipsDB() {
  try {
    const token = localStorage.getItem("internpath_token");
    const res = await fetch("/api/internships", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (res.ok) {
      const data = await res.json();
      INTERNSHIPS_DB = data.internships || [];
      console.log("✅ Internships loaded from DB:", INTERNSHIPS_DB.length);
      
      // Update UI if on relevant tabs
      renderOverviewMatches();
      if (typeof renderRecommendations === "function") renderRecommendations();
      if (typeof renderSearchResults === "function") renderSearchResults();
    }
  } catch (err) {
    console.error("❌ Failed to fetch internships:", err);
  }
}
initInternshipsDB();

const ROADMAP_DATA = {
  all: [
    {
      week: "Weeks 1–2",
      title: "HTML, CSS & JavaScript Fundamentals",
      desc: "Master the web trinity. Build 3 mini-projects: portfolio, landing page, to-do app.",
      status: "completed",
      icon: "✅",
      track: "frontend",
    },
    {
      week: "Weeks 3–4",
      title: "React & Component Architecture",
      desc: "Learn JSX, state, props, hooks (useState, useEffect, useContext). Build a weather app.",
      status: "completed",
      icon: "✅",
      track: "frontend",
    },
    {
      week: "Weeks 5–6",
      title: "TypeScript & Advanced React",
      desc: "Type safety in React. React Router, React Query, and custom hooks. Code splitting & lazy loading.",
      status: "completed",
      icon: "✅",
      track: "frontend",
    },
    {
      week: "Weeks 7–8",
      title: "Node.js & Express APIs",
      desc: "Build RESTful APIs from scratch. Middleware, authentication, error handling, and testing with Jest.",
      status: "active",
      icon: "🔥",
      track: "backend",
    },
    {
      week: "Weeks 9–10",
      title: "Databases: SQL & MongoDB",
      desc: "Relational vs NoSQL. Design schemas, write complex queries, use Mongoose ORM.",
      status: "pending",
      icon: "🔒",
      track: "backend",
    },
    {
      week: "Weeks 11–12",
      title: "Python & Machine Learning Basics",
      desc: "NumPy, Pandas, Scikit-learn. Train your first classification and regression models.",
      status: "pending",
      icon: "🔒",
      track: "ai",
    },
    {
      week: "Weeks 13–14",
      title: "Docker & Cloud Deployment",
      desc: "Containerize apps with Docker. Deploy to AWS EC2 & S3. Set up CI/CD with GitHub Actions.",
      status: "pending",
      icon: "🔒",
      track: "devops",
    },
    {
      week: "Weeks 15–16",
      title: "Capstone: Full-Stack Project",
      desc: "Build and deploy a production-ready full-stack app. Add it to your portfolio and GitHub.",
      status: "pending",
      icon: "🔒",
      track: "frontend",
    },
  ],
};

let selectedSkills = ["React", "Node.js", "Python", "TypeScript", "SQL"];
const savedSkills = localStorage.getItem("internpath_student_skills");
if (savedSkills) {
  selectedSkills = JSON.parse(savedSkills);
}
let currentFilter = "all";

// ---- TAB SWITCHING ----
function switchTab(tab) {
  document
    .querySelectorAll(".tab-content")
    .forEach((el) => el.classList.add("hidden"));
  document
    .querySelectorAll(".sidebar-nav a")
    .forEach((el) => el.classList.remove("active"));
  const el = document.getElementById("tab-" + tab);
  if (el) el.classList.remove("hidden");
  const navEl = document.getElementById("nav-" + tab);
  if (navEl) navEl.classList.add("active");

  if (tab === "recommendations") renderRecommendations();
  if (tab === "skills") renderSkillsTab();
  if (tab === "roadmap") renderRoadmap("all");
  if (tab === "search") renderSearchResults();
}

// ---- MATCH SCORE ----
function calcMatch(internship) {
  if (!selectedSkills.length) return Math.floor(Math.random() * 30) + 20;
  const matches = internship.skills.filter((s) =>
    selectedSkills.includes(s),
  ).length;
  return Math.min(Math.round((matches / internship.skills.length) * 100), 100);
}

function getMatchColor(pct) {
  if (pct >= 75) return { cls: "high", color: "#34d399", ringColor: "#10b981" };
  if (pct >= 50) return { cls: "mid", color: "#fbbf24", ringColor: "#f59e0b" };
  return { cls: "low", color: "#f87171", ringColor: "#ef4444" };
}

// ---- RECOMMENDATIONS ----
function renderRecommendations() {
  const list = document.getElementById("reco-list");
  if (!list) return;
  const enriched = INTERNSHIPS_DB.map((i) => ({
    ...i,
    match: calcMatch(i),
  })).sort((a, b) => b.match - a.match);
  list.innerHTML = enriched
    .map((i) => {
      const { cls } = getMatchColor(i.match);
      return `
      <div class="intern-card-slim" onclick="showDetail(${i.id})" id="icard-${i.id}">
        <div class="ci-logo">${i.emoji}</div>
        <div class="ci-body">
          <h4>${i.title}</h4>
          <div class="ci-company">${i.company}</div>
          <div class="ci-pills">
            <span class="ci-pill remote">${i.type}</span>
            <span class="ci-pill stipend">${i.stipend}</span>
            <span class="ci-pill duration">${i.duration}</span>
          </div>
        </div>
        <div class="ci-match">
          <div class="match-val ${cls}">${i.match}%</div>
          <div class="match-label">match</div>
        </div>
      </div>`;
    })
    .join("");
}

function showDetail(id) {
  const intern = INTERNSHIPS_DB.find((i) => i.id === id);
  if (!intern) return;
  intern.match = calcMatch(intern);
  const { color, ringColor, cls } = getMatchColor(intern.match);
  const pct = intern.match;
  const have = intern.skills.filter((s) => selectedSkills.includes(s));
  const need = intern.skills.filter((s) => !selectedSkills.includes(s));

  const panel = document.getElementById("detail-panel");
  const placeholder = document.getElementById("detail-placeholder");
  if (placeholder) placeholder.classList.add("hidden");
  panel.classList.remove("hidden");
  panel.innerHTML = `
    <div class="detail-header">
      <div class="detail-logo">${intern.emoji}</div>
      <div class="detail-info">
        <h2>${intern.title}</h2>
        <div class="di-company">${intern.company}</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <span class="badge badge-${cls === "high" ? "success" : cls === "mid" ? "warning" : "info"}">${pct}% Match</span>
          <span class="badge badge-primary">${intern.domain}</span>
        </div>
      </div>
    </div>
    <div class="detail-meta">
      <span class="dm">💰 ${intern.stipend}</span>
      <span class="dm">🌍 ${intern.type}</span>
      <span class="dm">⏱️ ${intern.duration}</span>
    </div>
    <div class="match-ring-wrap" style="margin-bottom:16px;">
      <div class="ring-container" style="--ring-pct:${pct}%; --ring-color:${ringColor};">
        <div class="ring-val" style="color:${color};">${pct}%</div>
      </div>
    </div>
    <div class="detail-section">
      <h4>About the Role</h4>
      <p>${intern.desc}</p>
    </div>
    <div class="detail-section">
      <h4>Skill Analysis</h4>
      <div class="skill-gap">
        ${have.map((s) => `<span class="gap-tag have">✓ ${s}</span>`).join("")}
        ${need.map((s) => `<span class="gap-tag need">✗ ${s}</span>`).join("")}
      </div>
      ${need.length > 0 ? `<div style="font-size:0.8rem; color:var(--text-secondary);"><strong>Missing skills:</strong> Add ${need.join(", ")} to your profile to improve this match.</div>` : '<div style="font-size:0.8rem; color:#34d399;">🎉 You have all required skills for this role!</div>'}
    </div>
    <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="applyNow('${intern.company}', '${intern.title}')">Apply Now →</button>
      <button class="btn btn-outline btn-sm" onclick="showToast('💾','Saved!','${intern.title} at ${intern.company} saved to wishlist.')">Save</button>
    </div>
  `;
}

function applyNow(company, title) {
  const cands = JSON.parse(
    localStorage.getItem("internpath_candidates") || "[]",
  );
  const newCand = {
    name: "You (Student)",
    college: "Your University",
    year: "Present",
    match: Math.floor(Math.random() * 20) + 80, // High simulated match
    skills: selectedSkills.slice(0, 4),
    initials: "Y",
    color: "linear-gradient(135deg, #10b981, #06b6d4)",
  };
  cands.push(newCand);
  localStorage.setItem("internpath_candidates", JSON.stringify(cands));
  showToast(
    "🎉",
    "Application Sent!",
    `Your application for ${title} at ${company} has been submitted! You also appeared on the Interviewer dashboard.`,
  );
}

// ---- SEARCH ----
function renderSearchResults(
  query = "",
  domain = "",
  type = "",
  duration = "",
) {
  const el = document.getElementById("search-results");
  if (!el) return;
  let filtered = INTERNSHIPS_DB.map((i) => ({ ...i, match: calcMatch(i) }));
  if (query)
    filtered = filtered.filter(
      (i) =>
        i.title.toLowerCase().includes(query.toLowerCase()) ||
        i.company.toLowerCase().includes(query.toLowerCase()) ||
        i.skills.some((s) => s.toLowerCase().includes(query.toLowerCase())),
    );
  if (domain) filtered = filtered.filter((i) => i.domain === domain);
  if (type) filtered = filtered.filter((i) => i.type === type);
  filtered.sort((a, b) => b.match - a.match);

  el.innerHTML =
    filtered.length === 0
      ? '<div style="padding:40px; text-align:center; color:var(--text-secondary);">No internships found. Try adjusting your filters.</div>'
      : filtered
          .map((i) => {
            const { cls } = getMatchColor(i.match);
            return `
        <div class="intern-card-slim" onclick="switchTab('recommendations'); setTimeout(() => showDetail(${i.id}), 100);">
          <div class="ci-logo">${i.emoji}</div>
          <div class="ci-body">
            <h4>${i.title}</h4>
            <div class="ci-company">${i.company}</div>
            <div class="ci-pills">
              <span class="ci-pill remote">${i.type}</span>
              <span class="ci-pill stipend">${i.stipend}</span>
              <span class="ci-pill duration">${i.duration}</span>
              ${i.skills
                .slice(0, 2)
                .map((s) => `<span class="ci-pill duration">${s}</span>`)
                .join("")}
            </div>
          </div>
          <div class="ci-match">
            <div class="match-val ${cls}">${i.match}%</div>
            <div class="match-label">match</div>
          </div>
        </div>`;
          })
          .join("");
}

function filterInternships() {
  const q = document.getElementById("search-input")?.value || "";
  const d = document.getElementById("filter-domain")?.value || "";
  const t = document.getElementById("filter-type")?.value || "";
  const dur = document.getElementById("filter-duration")?.value || "";
  renderSearchResults(q, d, t, dur);
}

// ---- SKILLS TAB ----
function renderSkillsTab() {
  const pool = document.getElementById("skill-pool");
  const selected = document.getElementById("selected-skills");
  const levels = document.getElementById("skill-levels");
  if (!pool) return;

  pool.innerHTML = ALL_SKILLS.map(
    (s) => `
    <span class="skill-tag ${selectedSkills.includes(s) ? "selected" : ""}" onclick="toggleSkill('${s}', this)">${s}</span>
  `,
  ).join("");

  renderSelectedSkills();
  renderSkillLevels();
}

function toggleSkill(skill, el) {
  if (selectedSkills.includes(skill)) {
    selectedSkills = selectedSkills.filter((s) => s !== skill);
    el.classList.remove("selected");
  } else {
    selectedSkills.push(skill);
    el.classList.add("selected");
  }
  renderSelectedSkills();
  renderSkillLevels();
}

function renderSelectedSkills() {
  const el = document.getElementById("selected-skills");
  if (!el) return;
  el.innerHTML =
    selectedSkills.length === 0
      ? '<span style="color:var(--text-muted); font-size:0.875rem;">No skills selected yet. Click skills above.</span>'
      : selectedSkills
          .map(
            (s) =>
              `<span class="skill-tag selected">${s}<span class="remove" onclick="removeSkill('${s}')">×</span></span>`,
          )
          .join("");
}

function removeSkill(skill) {
  selectedSkills = selectedSkills.filter((s) => s !== skill);
  renderSkillsTab();
}

function renderSkillLevels() {
  const el = document.getElementById("skill-levels");
  if (!el) return;
  const LEVELS = {
    React: 90,
    "Node.js": 75,
    Python: 80,
    TypeScript: 70,
    SQL: 65,
    JavaScript: 92,
    "HTML/CSS": 95,
    Docker: 50,
    "Machine Learning": 40,
    AWS: 35,
  };
  const skills = selectedSkills.slice(0, 6);
  if (!skills.length) {
    el.innerHTML =
      '<div style="color:var(--text-muted); font-size:0.875rem;">Select skills to see proficiency.</div>';
    return;
  }
  el.innerHTML = skills
    .map((s) => {
      const lvl = LEVELS[s] || Math.floor(Math.random() * 40) + 40;
      return `
      <div class="skill-level-wrap">
        <div class="skill-level-label"><span>${s}</span><span>${lvl}%</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${lvl}%;"></div></div>
      </div>`;
    })
    .join("");
}

function saveSkills() {
  localStorage.setItem(
    "internpath_student_skills",
    JSON.stringify(selectedSkills),
  );
  showToast(
    "🚀",
    "Skills Saved!",
    `${selectedSkills.length} skills saved. Re-matching internships now...`,
  );
  setTimeout(() => {
    switchTab("recommendations");
  }, 1200);
}

// ---- ROADMAP ----
function renderRoadmap(filter) {
  const el = document.getElementById("roadmap-steps");
  if (!el) return;
  const steps = ROADMAP_DATA.all.filter(
    (s) => filter === "all" || s.track === filter,
  );
  el.innerHTML = steps
    .map(
      (s, i) => `
    <div class="rm-week">${s.week}</div>
    <div class="roadmap-step ${s.status}">
      <div class="roadmap-icon">${s.icon}</div>
      <div class="roadmap-content">
        <h4>${s.title}</h4>
        <p>${s.desc}</p>
        <div class="roadmap-duration">${s.week} · ${s.track.charAt(0).toUpperCase() + s.track.slice(1)} Track</div>
        ${s.status === "active" ? "<button class=\"btn btn-primary btn-sm mt-8\" onclick=\"showToast('🔥','Resources Opened!','Watch list for this week unlocked!')\">Start This Week ▶</button>" : ""}
        ${s.status === "completed" ? '<span class="badge badge-success" style="margin-top:8px; display:inline-flex;">Completed ✓</span>' : ""}
      </div>
    </div>
  `,
    )
    .join("");
}

function setRoadmapFilter(filter, el) {
  document
    .querySelectorAll(".rf-btn")
    .forEach((b) => b.classList.remove("active"));
  el.classList.add("active");
  renderRoadmap(filter);
}

// ---- OVERVIEW MATCHES ----
function renderOverviewMatches() {
  const el = document.getElementById("overview-matches");
  if (!el) return;
  const top3 = INTERNSHIPS_DB.map((i) => ({ ...i, match: calcMatch(i) }))
    .sort((a, b) => b.match - a.match)
    .slice(0, 3);
  el.innerHTML = top3
    .map((i) => {
      const { cls } = getMatchColor(i.match);
      return `
      <div class="intern-card-slim" onclick="switchTab('recommendations'); setTimeout(() => showDetail(${i.id}), 100);" style="margin-bottom:10px;">
        <div class="ci-logo">${i.emoji}</div>
        <div class="ci-body">
          <h4 style="font-size:0.9rem;">${i.title}</h4>
          <div class="ci-company">${i.company} · ${i.type}</div>
        </div>
        <div class="ci-match">
          <div class="match-val ${cls}">${i.match}%</div>
          <div class="match-label">match</div>
        </div>
      </div>`;
    })
    .join("");
}

// ---- INIT ----
document.addEventListener("DOMContentLoaded", () => {
  renderOverviewMatches();
  renderSearchResults();
});

// ---- AI RESUME PARSER ----
let lastParsedProfile = null;

async function uploadResume(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  
  // Reset UI
  document.getElementById("ai-parse-modal").style.opacity = "1";
  document.getElementById("ai-parse-modal").style.pointerEvents = "auto";
  document.getElementById("ai-parse-loading").style.display = "block";
  document.getElementById("ai-parse-review").style.display = "none";
  input.value = ""; // clear input
  
  const token = typeof getAuthToken === "function" ? getAuthToken() : localStorage.getItem("internpath_token");
  if (!token) {
     closeParseModal();
     showToast("⚠️", "Not Logged In", "Please log in from the main page to use AI resume parsing.");
     return;
  }

  const formData = new FormData();
  formData.append("resume", file);

  try {
    const res = await fetch("/api/me/resume-parse", {
      method: "POST",
      headers: { "Authorization": "Bearer " + token },
      body: formData
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(()=>({}));
      throw new Error(errData.message || "Server error");
    }

    const data = await res.json();
    lastParsedProfile = data.parsedProfile;
    
    // Show review modal
    document.getElementById("ai-parse-loading").style.display = "none";
    document.getElementById("ai-parse-review").style.display = "block";
    
    document.getElementById("parse-college").textContent = lastParsedProfile.college || "Not found";
    document.getElementById("parse-bg").textContent = lastParsedProfile.techBackground || "Not found";
    
    const skillsHtml = (lastParsedProfile.skills || []).map(s => 
       `<span class="gap-tag have">${s}</span>`
    ).join("");
    document.getElementById("parse-skills").innerHTML = skillsHtml || "None found";
    
  } catch(err) {
    document.getElementById("ai-parse-loading").style.display = "none";
    document.getElementById("ai-parse-review").style.display = "block";
    document.getElementById("ai-parse-review").innerHTML = `
      <h3 style="margin-bottom: 15px; font-weight: bold; color: #f87171;">Parsing Failed</h3>
      <p style="color: var(--text-secondary); margin-bottom: 20px;">We couldn't analyze your resume. Error: ${err.message}</p>
      <div style="display: flex; justify-content: flex-end;">
        <button class="btn btn-outline" type="button" onclick="closeParseModal()">Close</button>
      </div>
    `;
    showToast("❌", "Parsing Failed", err.message);
  }
}

function closeParseModal() {
  document.getElementById("ai-parse-modal").style.opacity = "0";
  document.getElementById("ai-parse-modal").style.pointerEvents = "none";
}

async function applyParsedData() {
  if (!lastParsedProfile) return;
  
  const token = typeof getAuthToken === "function" ? getAuthToken() : localStorage.getItem("internpath_token");
  if (!token) return;

  showToast("⏳", "Saving...", "Updating your skills and profile.");
  
  try {
     // 1. Update Profile (College & TechBackground)
     await fetch("/api/me/profile", {
       method: "PUT",
       headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
       body: JSON.stringify({
         college: lastParsedProfile.college || "",
         techBackground: lastParsedProfile.techBackground || ""
       })
     });

     // 2. Update Skills
     if (lastParsedProfile.skills && lastParsedProfile.skills.length > 0) {
        // Keep old skills, add new ones unique
        const newSet = new Set(lastParsedProfile.skills);
        selectedSkills.forEach(s => newSet.add(s));
        selectedSkills = Array.from(newSet);
        
        await fetch("/api/me/skills", {
           method: "PUT",
           headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
           body: JSON.stringify({ skills: selectedSkills })
        });
     }
     
     closeParseModal();
     showToast("✅", "Profile Updated", "Your resume data was successfully saved!");
     
     // Refresh UI (global functions from student.html usually)
     if (typeof window.loadUserProfile === "function") window.loadUserProfile();
     if (document.getElementById("skill-pool")) renderSkillsTab();
     
  } catch(err) {
     showToast("❌", "Save Failed", "Could not save your new profile data.");
  }
}
