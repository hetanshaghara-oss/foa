// ============================================
// INTERNPATH - Interviewer Portal Logic (Centralized)
// ============================================

let CANDIDATES = [];
const POST_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Vue.js",
  "Next.js",
  "Node.js",
  "Python",
  "FastAPI",
  "Java",
  "SQL",
  "MongoDB",
  "AWS",
  "Docker",
  "Machine Learning",
  "Figma",
  "UI/UX",
  "REST APIs",
  "Git",
];

let postSelectedSkills = [];
let callActive = false;
let callInterval = null;
let callSeconds = 0;
let micOn = true;
let camOn = true;
let callType = "video";
let localStream = null;

// ---- TAB SWITCHING ----
function switchITab(tab) {
  document
    .querySelectorAll(".tab-content")
    .forEach((el) => el.classList.add("hidden"));
  document
    .querySelectorAll(".sidebar-nav a")
    .forEach((el) => el.classList.remove("active"));
  if (tab === "call") {
    if (!currentInterviewAppId) {
       showToast("⚠️", "Select Candidate", "Please select a candidate to interview from the Pipeline or Candidates tab first.");
       switchITab("dashboard");
       return;
    }
  }

  const el = document.getElementById("itab-" + tab);
  if (el) el.classList.remove("hidden");
  const navEl = document.getElementById("inav-" + tab);
  if (navEl) navEl.classList.add("active");

  if (tab === "candidates") fetchRealCandidates();
  if (tab === "post") renderPostSkillPool();
  if (tab === "pipeline") {
    if (typeof fetchPipelineData === 'function') fetchPipelineData();
  }
  if (tab === "dashboard") {
    fetchDashboardStats();
    fetchPendingReviews();
    renderDashboardCandidates();
  }
}

// ---- CANDIDATE LIST ----
function getMatchCls(m) {
  return m >= 75 ? "high" : m >= 50 ? "mid" : "low";
}

function renderCandidates(filtered = CANDIDATES) {
  const el = document.getElementById("candidate-list");
  if (!el) return;
  if (filtered.length === 0) {
    el.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-secondary);">No approved candidates found yet.</div>`;
    return;
  }
    el.innerHTML = filtered
    .map(
      (c) => `
    <div class="cand-card ${c.isVerified ? 'verified-card' : ''}" onclick="showToast('👤','${c.name}','${c.college} · ${c.year} · ${c.match}% match')">
      <div class="cand-avatar" style="background:${c.color};">${c.initials}</div>
      <div class="cand-info">
        <h4>${c.name} ${c.isVerified ? '<span class="verified-badge">✓ Verified</span>' : ''}</h4>
        <div class="cand-sub">${c.college} · ${c.year}</div>
        <div class="cand-skills">${c.skills.map((s) => `<span class="cand-skill">${s}</span>`).join("")}</div>
      </div>
      <div class="cand-meta">
        <div class="cand-match ${getMatchCls(c.match)}">${c.match}%</div>
        <div class="cand-match-lbl">match</div>
        <div style="display:flex; flex-direction:column; gap:5px; margin-top:8px;">
          <button class="btn btn-primary btn-sm" style="font-size:0.7rem; padding:5px 10px;" onclick="event.stopPropagation(); prepareCall('${c.appId}', '${c.name.replace(/'/g, "\\'")}', '${c.role.replace(/'/g, "\\'")}')">📹 Interview</button>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
}

function renderNextInterview() {
  const namEl = document.getElementById("next-interview-name");
  const roleEl = document.getElementById("next-interview-role");
  const statusEl = document.getElementById("next-interview-status");
  const timeEl = document.getElementById("next-interview-time");
  const cardEl = document.getElementById("next-candidate-card");

  if (CANDIDATES.length === 0) {
    if (namEl) namEl.textContent = "No candidates";
    if (roleEl) roleEl.textContent = "Awaiting approved candidates";
    if (statusEl) statusEl.textContent = "Pending";
    if (timeEl) timeEl.textContent = "—";
    if (cardEl)
      cardEl.innerHTML = `<p style="color: var(--text-secondary);">No approved candidates available</p>`;
    return;
  }

  const topCandidate = CANDIDATES[0];
  if (namEl) namEl.textContent = topCandidate.name;
  if (roleEl)
    roleEl.textContent = `${topCandidate.college} · ${topCandidate.year} · ${topCandidate.match}% match`;
  if (statusEl) statusEl.textContent = "Ready";
  if (timeEl) timeEl.textContent = "Available";

  if (cardEl) {
    cardEl.innerHTML = `
      <div class="cand-avatar" style="background:${topCandidate.color};">${topCandidate.initials}</div>
      <div style="flex: 1">
        <div style="font-weight: 700; margin-bottom: 3px">${topCandidate.name}</div>
        <div style="color: var(--text-secondary); font-size: 0.875rem">${topCandidate.college} · ${topCandidate.year} · ${topCandidate.match}% Match</div>
        <button class="btn btn-primary btn-sm" onclick="prepareCall('${topCandidate.appId}', '${topCandidate.name.replace(/'/g, "\\'")}', '${topCandidate.role.replace(/'/g, "\\'")}')">📹 Join Video Interview</button>
      </div>
    `;
  }
}

function prepareCall(appId, name, role) {
  currentInterviewAppId = appId;
  
  // Update UI dynamically
  const nameToUse = name || "Candidate";
  const roleToUse = role || "Product Engineering Intern";

  const nameEl = document.getElementById("call-candidate-name");
  if (nameEl) nameEl.textContent = nameToUse;
  
  const roleEl = document.getElementById("call-candidate-role");
  if (roleEl) roleEl.textContent = roleToUse;

  const preCallNameEl = document.getElementById("pre-call-candidate-name");
  if (preCallNameEl) preCallNameEl.textContent = nameToUse;

  const preCallCardNameEl = document.getElementById("pre-call-card-name");
  if (preCallCardNameEl) preCallCardNameEl.textContent = nameToUse;

  const candInitials = document.querySelector("#pre-call-screen .cand-avatar");
  if (candInitials) candInitials.textContent = nameToUse[0] ? nameToUse[0].toUpperCase() : "C";

  const videoAvatarName = document.getElementById("video-candidate-name");
  if (videoAvatarName) videoAvatarName.textContent = `${nameToUse} · Candidate`;

  switchITab('call');
}

function renderDashboardCandidates() {
  const el = document.getElementById("dashboard-candidates");
  if (!el) return;
  const top = [...CANDIDATES].sort((a, b) => b.match - a.match).slice(0, 3);
  if (top.length === 0) {
    el.innerHTML = `<p style="color:var(--text-secondary); font-size:0.9rem;">No approved candidates to display.</p>`;
    renderNextInterview();
    return;
  }
  el.innerHTML = top
    .map(
      (c) => `
    <div class="cand-card ${c.isVerified ? 'verified-card' : ''}" style="margin-bottom:10px;" onclick="switchITab('candidates')">
      <div class="cand-avatar" style="background:${c.color};">${c.initials}</div>
      <div class="cand-info">
        <h4 style="font-size:0.9rem;">${c.name} ${c.isVerified ? '<span class="verified-badge" style="font-size:0.5rem; padding:1px 5px;">✓</span>' : ''}</h4>
        <div class="cand-sub">${c.college} · ${c.year}</div>
      </div>
      <div class="cand-meta">
        <div class="cand-match ${getMatchCls(c.match)}">${c.match}%</div>
        <div class="cand-match-lbl">match</div>
      </div>
    </div>
  `,
    )
    .join("");
  renderNextInterview();
}

// ---- LIVE DATA FETCHING ----
async function fetchDashboardStats() {
  try {
    const token = localStorage.getItem("internpath_token");
    if (!token) return;

    const res = await fetch("/api/interviewer/stats", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    if (res.ok) {
      // Set 1 (General Overview)
      const elTotal1 = document.getElementById("dash-total-apps");
      const elToday1 = document.getElementById("dash-interviews-today");
      const elApproved1 = document.getElementById("dash-approved-students");

      // Set 2 (Main Grid)
      const elTotal2 = document.getElementById("dash-total-apps-main");
      const elToday2 = document.getElementById("dash-interviews-today-main");
      const elApproved2 = document.getElementById(
        "dash-approved-students-main",
      );

      if (elTotal1) elTotal1.textContent = data.totalApplications || 0;
      if (elToday1) elToday1.textContent = data.interviewsToday || 0;
      if (elApproved1) elApproved1.textContent = data.approvedStudents || 0;

      if (elTotal2) elTotal2.textContent = data.totalApplications || 0;
      if (elToday2) elToday2.textContent = data.interviewsToday || 0;
      if (elApproved2) elApproved2.textContent = data.approvedStudents || 0;
    }
  } catch (err) {
    console.error("fetchDashboardStats error:", err);
  }
}

async function fetchRealCandidates() {
  const candidateListEl = document.getElementById("candidate-list");
  if (candidateListEl) candidateListEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary);">Loading approved candidates.</div>';
  try {
    const token = localStorage.getItem("internpath_token");
    if (!token) return;
    const res = await fetch("/api/interviewer/pipeline", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    if (res.ok && data.applications) {
      const colors = [
        "linear-gradient(135deg,#6366f1,#06b6d4)",
        "linear-gradient(135deg,#10b981,#6366f1)",
        "linear-gradient(135deg,#f59e0b,#ef4444)",
        "linear-gradient(135deg,#ec4899,#6366f1)",
        "linear-gradient(135deg,#8b5cf6,#06b6d4)",
      ];
      const activeApps = data.applications.filter(a => ["approved", "interviewed", "offered"].includes(a.status));
      CANDIDATES = activeApps.map((a, idx) => {
        const u = a.student || {};
        const isVerified = (u.skills || []).some(s => s.verified);
        const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "Candidate";
        
        let baseMatch = 80 + (idx % 15);
        if (isVerified) baseMatch = Math.min(100, baseMatch + 15);

        return {
          id: u._id,
          appId: a._id,
          name: fullName,
          college: u.profile?.college || "Approved Intern",
          year: u.profile?.techBackground || "Student",
          match: baseMatch,
          isVerified: isVerified,
          skills: (u.skills || []).map((s) => s.name),
          initials: (u.firstName?.[0] || u.username?.[0] || "C").toUpperCase(),
          color: colors[idx % colors.length],
          role: a.internship ? a.internship.title : a.roleTitle,
          reviewedAt: a.reviewedAt
        };
      }).sort((a, b) => {
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        return b.match - a.match;
      });

      const subTitle = document.getElementById("dash-approved-count-sub");
      if (subTitle)
        subTitle.textContent = `${CANDIDATES.length} approved applicants matched to your listings.`;

      renderCandidates();
      renderDashboardCandidates();
    }
  } catch (err) {
    console.error("fetchRealCandidates error:", err);
  }
}

// ---- PENDING REVIEW / VERIFICATION ----
async function fetchPendingReviews() {
  const container = document.getElementById("studentsContainer");
  if (!container) return;

  try {
    const token = localStorage.getItem("internpath_token");
    const res = await fetch("/api/applications/pending-review", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();

    if (res.ok && data.applications) {
      if (data.applications.length === 0) {
        container.innerHTML = `<p style="color:var(--text-secondary); opacity:0.8;">No pending applications requiring verification.</p>`;
        return;
      }

      container.innerHTML = data.applications
        .map(
          (app) => `
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; color:var(--text-primary); margin-bottom:3px;">${app.studentName}</div>
            <div style="color:var(--text-secondary); font-size:0.85rem;">Applying for: <span style="color:var(--primary)">${app.roleTitle}</span></div>
          </div>
          <div style="display:flex; gap:10px;">
            <button onclick="handleApplicationReview('${app.id}', 'approved')" style="padding:8px 16px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#10b981; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.85rem;">Approve</button>
            <button onclick="handleApplicationReview('${app.id}', 'rejected')" style="padding:8px 16px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#ef4444; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.85rem;">Reject</button>
          </div>
        </div>
      `,
        )
        .join("");
    }
  } catch (err) {
    container.innerHTML = `<p style="color:#ef4444;">Error loading pending reviews.</p>`;
  }
}

async function handleApplicationReview(appId, status) {
  try {
    const token = localStorage.getItem("internpath_token");
    const res = await fetch(`/api/applications/${appId}/review`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        status,
        note: "Reviewed via verification panel.",
      }),
    });

    if (res.ok) {
      showToast(
        status === "approved" ? "✅" : "❌",
        `Application ${status}!`,
        "Profile moved to candidate database.",
      );
      fetchDashboardStats();
      fetchPendingReviews();
      fetchRealCandidates();
    } else {
      const err = await res.json();
      showToast("⚠️", "Error", err.message || "Could not process review.");
    }
  } catch (err) {
    showToast("⚠️", "Network Error", "Check your connection.");
  }
}

// Expose review handler to globally (needed for inline onclick)
window.handleApplicationReview = handleApplicationReview;

// ---- INIT ----
document.addEventListener("DOMContentLoaded", () => {
  loadInterviewerProfile();
  fetchDashboardStats();
  fetchRealCandidates();
  fetchPendingReviews();
});

async function loadInterviewerProfile() {
  try {
    const userJson = localStorage.getItem("internpath_user");
    if (!userJson) return;
    const user = JSON.parse(userJson);

    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const displayName = firstName ? `${firstName} ${lastName}` : user.username || "Interviewer";
    const initials = (firstName?.[0] || user.username?.[0] || "I").toUpperCase();
    const role = user.profile?.techBackground || "Hiring Manager";
    const company = user.profile?.college || "Global Corp"; // Assuming company might be stored here or similar

    // Update Header
    const navNameEl = document.getElementById("navUserName");
    if (navNameEl) navNameEl.textContent = displayName;

    // Update Sidebar
    const sideNameEl = document.getElementById("sidebarUserName");
    if (sideNameEl) sideNameEl.textContent = displayName;

    const sideRoleEl = document.getElementById("sidebarUserRole");
    if (sideRoleEl) sideRoleEl.textContent = `${role} · ${company}`;

    const sideAvatarEl = document.getElementById("sidebarAvatar");
    if (sideAvatarEl) sideAvatarEl.textContent = initials;

    // Update Dashboard Greeting
    const dashGreetEl = document.getElementById("dashGreetingName");
    if (dashGreetEl) dashGreetEl.textContent = firstName || user.username || "Interviewer";
  } catch (err) {
    console.error("loadInterviewerProfile error:", err);
  }
}

// Video components (Real WebRTC implementation)
const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};
let peerConnection = null;
let socket = null;
let lastPeerId = null;
let currentInterviewAppId = null;

async function startCall(type) {
  callType = type;
  camOn = type === "video";
  micOn = true;
  callActive = true;
  callSeconds = 0;

  document.getElementById("pre-call-screen").style.display = "none";
  document.getElementById("active-call-screen").style.display = "block";

  // Start timer
  callInterval = setInterval(() => {
    callSeconds++;
    const m = String(Math.floor(callSeconds / 60)).padStart(2, "0");
    const s = String(callSeconds % 60).padStart(2, "0");
    const el = document.getElementById("call-timer-display");
    if (el) el.textContent = m + ":" + s;
  }, 1000);

  // Access camera and mic
  try {
    const constraints = {
      video: type === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
      audio: true,
    };
    
    try {
      localStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (firstErr) {
      console.warn("Primary media capture failed, trying fallback...", firstErr.name);
      if (type === "video") {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      } else {
        localStream = null;
      }
    }

    if (localStream && type === "video" && localStream.getVideoTracks().length > 0) {
      const selfVideo = document.getElementById("self-video");
      const selfFallback = document.getElementById("self-avatar-fallback");
      if (selfVideo) {
        selfVideo.srcObject = localStream;
        selfVideo.style.display = "block";
        if (selfFallback) selfFallback.style.display = "none";
        try {
          await selfVideo.play();
        } catch (playErr) {
          selfVideo.addEventListener("loadedmetadata", () => selfVideo.play().catch(() => {}), { once: true });
        }
      }
    } else {
      const banner = document.getElementById("cam-denied-banner");
      if (banner) banner.style.display = "block";
      camOn = false;
    }

    showToast("📹", localStream ? "Starting Call..." : "Joining (No Media)", localStream ? "Media connected!" : "Proceeding without camera/mic.");
    
    // Join Signaling Room
    initSignaling();
  } catch (err) {
    console.error("Call error:", err);
    initSignaling();
  }
}

function initSignaling() {
  // Force re-join if already connected
  if (socket) {
    const roomId = currentInterviewAppId || "mock-room-interviewer";
    socket.emit("join-room", roomId);
    console.log("Interviewer joined room:", roomId);
    return;
  }
  
  socket = io();
  
  socket.on("connect", () => {
    console.log("Interviewer connected to signaling server");
    const roomId = currentInterviewAppId || "mock-room-interviewer";
    socket.emit("join-room", roomId);
  });
  
  socket.on("user-joined", (userId) => {
    console.log("Student joined:", userId);
    lastPeerId = userId;
    createPeerConnection(userId, true);
  });
  
  socket.on("signal", async (data) => {
    lastPeerId = data.from;
    if (!peerConnection) createPeerConnection(data.from, false);
    
    if (data.signal.type === "offer") {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("signal", { to: data.from, signal: answer });
    } else if (data.signal.type === "answer") {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
    } else if (data.signal.candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.signal));
    }
  });

  socket.on("screen-share-status", (data) => {
    const videoTile = document.getElementById("candidate-tile");
    const bottomArea = document.getElementById("screen-share-bottom-area");
    
    if (data.isSharing) {
      showToast("🖥️", "Screen Sharing", "Student is sharing their screen");
      if (videoTile) videoTile.style.borderColor = "var(--success)";
      if (bottomArea) bottomArea.style.display = "block";
    } else {
      if (videoTile) videoTile.style.borderColor = "transparent";
      if (bottomArea) bottomArea.style.display = "none";
      const screenVideo = document.getElementById("candidate-screen-video");
      if (screenVideo) screenVideo.srcObject = null;
    }
  });
}

function createPeerConnection(peerId, isInitiator) {
  peerConnection = new RTCPeerConnection(rtcConfig);
  
  if (localStream) {
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
  }
  
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signal", { to: peerId, signal: event.candidate });
    }
  };
  
  peerConnection.ontrack = (event) => {
    console.log("Interviewer received track:", event.track.kind);

    const candidateVideo = document.getElementById("candidate-video");
    const candidateScreenVideo = document.getElementById("candidate-screen-video");
    const fallback = document.getElementById("candidate-avatar-fallback");

    if (event.track.kind === 'video') {
      // If we don't have a camera stream yet, this is likely it
      if (!candidateVideo.srcObject || candidateVideo.srcObject.getTracks().length === 0) {
        candidateVideo.srcObject = event.streams[0];
        if (fallback) fallback.style.display = "none";
      } else {
        // Second video track is likely the screen share
        if (candidateScreenVideo) {
          candidateScreenVideo.srcObject = event.streams[0];
        }
      }
    } else if (event.track.kind === 'audio') {
       // Audio can usually just be attached to either, or a hidden element
       // candidateVideo is already capturing audio if it's in the same stream
    }
  };
  
  if (isInitiator) {
    peerConnection.onnegotiationneeded = async () => {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("signal", { to: peerId, signal: offer });
      } catch (e) {
        console.error("Negotiation error:", e);
      }
    };
  }
}

function endCall() {
  if (!callActive) return;
  clearInterval(callInterval);
  callActive = false;

  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const selfVideo = document.getElementById("self-video");
  const selfFallback = document.getElementById("self-avatar-fallback");
  if (selfVideo) { selfVideo.srcObject = null; selfVideo.style.display = "none"; }
  if (selfFallback) selfFallback.style.display = "flex";

  document.getElementById("pre-call-screen").style.display = "block";
  document.getElementById("active-call-screen").style.display = "none";
  document.getElementById("call-timer-display").textContent = "00:00";

  showToast("📵", "Call Ended", "Saving session notes...");
}

function toggleMic() {
  if (!localStream) return;
  micOn = !micOn;
  localStream.getAudioTracks().forEach(t => t.enabled = micOn);
  const btn = document.getElementById("mic-btn");
  const muteIcon = document.getElementById("you-muted");
  if (btn) btn.textContent = micOn ? "🎙️" : "🔇";
  if (muteIcon) muteIcon.style.display = micOn ? "none" : "flex";
}

function toggleCam() {
  if (!localStream) return;
  camOn = !camOn;
  localStream.getVideoTracks().forEach(t => t.enabled = camOn);
  const btn = document.getElementById("cam-btn");
  const selfVideo = document.getElementById("self-video");
  const selfFallback = document.getElementById("self-avatar-fallback");
  
  if (btn) btn.textContent = camOn ? "📷" : "🚫";
  if (selfVideo) selfVideo.style.display = camOn ? "block" : "none";
  if (selfFallback) selfFallback.style.display = camOn ? "none" : "flex";
}

let interviewerScreenStream = null;
let interviewerScreenSender = null;

async function toggleScreenShareInterviewer() {
  if (!callActive) return;
  const btn = document.getElementById("screen-share-btn");

  if (interviewerScreenStream) {
    interviewerScreenStream.getTracks().forEach(t => t.stop());
    interviewerScreenStream = null;
    if (btn) btn.classList.remove("active");
    
    if (peerConnection && interviewerScreenSender) {
      peerConnection.removeTrack(interviewerScreenSender);
      interviewerScreenSender = null;
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("signal", { to: lastPeerId, signal: offer });
      } catch (e) { console.log("Renegotiation handled by onnegotiationneeded"); }
    }
    socket.emit("screen-share", { roomId: currentInterviewAppId || "mock-room-interviewer", isSharing: false });
  } else {
    try {
      interviewerScreenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      if (btn) btn.classList.add("active");
      
      const track = interviewerScreenStream.getVideoTracks()[0];
      if (peerConnection) {
        interviewerScreenSender = peerConnection.addTrack(track, interviewerScreenStream);
        
        try {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket.emit("signal", { to: lastPeerId, signal: offer });
        } catch (e) { console.log("Renegotiation handled by onnegotiationneeded"); }
      }
      
      track.onended = () => {
        if (interviewerScreenStream) toggleScreenShareInterviewer();
      };
      
      socket.emit("screen-share", { roomId: currentInterviewAppId || "mock-room-interviewer", isSharing: true });
      showToast("🖥️", "Screen Share", "You are now sharing your screen.");
    } catch (e) {
      console.error("Interviewer screen share error:", e);
    }
  }
}

function toggleFullscreen(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (el.requestFullscreen) el.requestFullscreen();
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  else if (el.msRequestFullscreen) el.msRequestFullscreen();
}

window.toggleScreenShareInterviewer = toggleScreenShareInterviewer;
window.toggleFullscreen = toggleFullscreen;

// ---- OFFER & REJECT ----
async function sendOffer() {
  if (!currentInterviewAppId) {
    showToast("⚠️", "No active application", "Cannot send offer without an active candidate context.");
    return;
  }
  const notesEl = document.getElementById("interview-notes");
  const notes = notesEl ? notesEl.value : "";
  
  try {
    const token = localStorage.getItem("internpath_token");
    const res = await fetch(`/api/applications/${currentInterviewAppId}/decision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ status: "offered", notes }),
    });

    if (res.ok) {
      showToast("✅", "Offer Sent!", "The candidate will receive an email to accept or reject.");
    } else {
      const err = await res.json();
      showToast("❌", "Error", err.message || "Failed to send offer.");
    }
  } catch (err) {
    console.error(err);
    showToast("⚠️", "Network Error", "Could not send offer.");
  }
}

async function rejectCandidate() {
  if (!currentInterviewAppId) {
    showToast("⚠️", "No active application", "Cannot reject without an active candidate context.");
    return;
  }
  const notesEl = document.getElementById("interview-notes");
  const notes = notesEl ? notesEl.value : "";
  
  if (!confirm("Are you sure you want to reject this candidate?")) return;

  try {
    const token = localStorage.getItem("internpath_token");
    const res = await fetch(`/api/applications/${currentInterviewAppId}/decision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ status: "rejected", notes }),
    });

    if (res.ok) {
      showToast("✅", "Candidate Rejected", "The candidate has been notified.");
    } else {
      const err = await res.json();
      showToast("❌", "Error", err.message || "Failed to reject candidate.");
    }
  } catch (err) {
    console.error(err);
    showToast("⚠️", "Network Error", "Could not reject candidate.");
  }
}

window.sendOffer = sendOffer;
window.rejectCandidate = rejectCandidate;
