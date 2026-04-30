const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const path = require("path");
const cron = require("node-cron");
const multer = require("multer");
const FormData = require("form-data");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const PDFDocument = require("pdfkit");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const careerRoutes = require('./routes/career');
app.use('/api', careerRoutes);

app.get('/careerpath*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'careerpath', 'index.html'));
});

// MongoDB Connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Atlas connected!");
    await seedInternshipsIfEmpty();
  })
  .catch((err) => console.error("❌ MongoDB error:", err));

const profileSchema = new mongoose.Schema(
  {
    college: { type: String, default: "" },
    techBackground: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  { _id: false },
);

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ["student", "interviewer"],
    default: "student",
  },
  firstName: { type: String, default: "" },
  lastName: { type: String, default: "" },
  profile: { type: profileSchema, default: () => ({}) },
  skills: {
    type: [
      {
        name: { type: String, required: true },
        level: { type: Number, default: 3 },
        verified: { type: Boolean, default: false },
        verifiedAt: { type: Date, default: null }
      },
    ],
    default: [],
  },
  recommendations: [{
    internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
    matchPercentage: Number,
    successProbability: Number,
    recoType: String,
    updatedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

const internshipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, default: "Company" },
  domain: { type: String, default: "Software" },
  type: { type: String, default: "Remote" },
  stipend: { type: String, default: "Negotiable" },
  duration: { type: String, default: "3 months" },
  location: { type: String, default: "Remote" },
  skills: { type: [String], default: [] },
  desc: { type: String, default: "" },
  emoji: { type: String, default: "🚀" },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  creatorEmail: { type: String, default: null },
  isSeeded: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const Internship = mongoose.model("Internship", internshipSchema);

const applicationSchema = new mongoose.Schema({
  internship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Internship",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  roleTitle: { type: String, required: true },
  message: { type: String, default: "" },
  status: {
    type: String,
    enum: ["pending", "approved", "interviewed", "offered", "rejected", "accepted", "declined"],
    default: "pending",
  },
  reviewerNote: { type: String, default: "" },
  interviewNotes: { type: String, default: "" },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  reviewedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});
applicationSchema.index({ internship: 1, student: 1 }, { unique: true });
const Application = mongoose.model("Application", applicationSchema);

const userEventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true }, // view_internship, apply, skip, search_click, search_ignore, session_duration
  internship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Internship",
    default: null,
  },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
});
const UserEvent = mongoose.model("UserEvent", userEventSchema);

const chatMessageSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

const SEED_INTERNSHIPS = [
  {
    emoji: "🔵",
    title: "Software Engineer Intern",
    company: "Google",
    domain: "Software",
    type: "Remote",
    stipend: "₹50K/mo",
    duration: "3 months",
    skills: ["React", "Node.js", "Python", "Data Structures"],
    desc: "Join Google's core search team building features used by billions of users. You will work on highly scalable systems.",
  },
  {
    emoji: "🟠",
    title: "Frontend Developer Intern",
    company: "Flipkart",
    domain: "Software",
    type: "On-site",
    stipend: "₹28K/mo",
    duration: "6 months",
    skills: ["React", "TypeScript", "HTML/CSS", "Next.js"],
    desc: "Build intuitive shopping experiences for 300M+ users on India's largest e-commerce platform.",
  },
  {
    emoji: "🟢",
    title: "Data Science Intern",
    company: "Microsoft",
    domain: "Data",
    type: "Remote",
    stipend: "₹40K/mo",
    duration: "3 months",
    skills: ["Python", "Machine Learning", "SQL", "TensorFlow"],
    desc: "Work with Azure AI team to build next-gen language models and data pipelines for enterprise products.",
  },
  {
    emoji: "🟣",
    title: "ML Engineering Intern",
    company: "Razorpay",
    domain: "Software",
    type: "On-site",
    stipend: "₹35K/mo",
    duration: "3 months",
    skills: ["Python", "TensorFlow", "FastAPI", "Docker"],
    desc: "Build fraud detection models processing 10M+ daily transactions.",
  },
  {
    emoji: "🔴",
    title: "Backend Developer Intern",
    company: "Swiggy",
    domain: "Software",
    type: "Remote",
    stipend: "₹25K/mo",
    duration: "6 months",
    skills: ["Node.js", "SQL", "Redis", "Docker", "REST APIs"],
    desc: "Scale Swiggy's delivery infrastructure to handle 50M+ orders.",
  },
  {
    emoji: "🟡",
    title: "UI/UX Design Intern",
    company: "Zomato",
    domain: "Design",
    type: "Remote",
    stipend: "₹18K/mo",
    duration: "2 months",
    skills: ["Figma", "UI/UX", "HTML/CSS"],
    desc: "Design the next generation of food ordering experiences.",
  },
  {
    emoji: "⚫",
    title: "Cloud Infra Intern",
    company: "Amazon",
    domain: "Software",
    type: "On-site",
    stipend: "₹45K/mo",
    duration: "6 months",
    skills: ["AWS", "Docker", "Kubernetes", "Linux", "CI/CD"],
    desc: "Work on core AWS infrastructure used by millions of customers globally.",
  },
  {
    emoji: "🔵",
    title: "Full Stack Dev Intern",
    company: "CRED",
    domain: "Software",
    type: "Remote",
    stipend: "₹30K/mo",
    duration: "3 months",
    skills: ["React", "Node.js", "MongoDB", "TypeScript"],
    desc: "Build premium fintech features for India's most design-forward application.",
  },
  {
    emoji: "🟢",
    title: "NLP Research Intern",
    company: "Sarvam AI",
    domain: "Data",
    type: "Remote",
    stipend: "₹22K/mo",
    duration: "4 months",
    skills: ["Python", "NLP", "LangChain", "Machine Learning"],
    desc: "Build language models for Indian languages.",
  },
  {
    emoji: "🔴",
    title: "Mobile Dev Intern",
    company: "PhonePe",
    domain: "Software",
    type: "On-site",
    stipend: "₹32K/mo",
    duration: "3 months",
    skills: ["React Native", "Flutter", "REST APIs"],
    desc: "Build the next generation of digital payments for 400M+ PhonePe users.",
  },
];

async function seedInternshipsIfEmpty() {
  try {
    const n = await Internship.countDocuments();
    if (n > 0) return;
    await Internship.insertMany(
      SEED_INTERNSHIPS.map((row) => ({
        ...row,
        isSeeded: true,
        postedBy: null,
      })),
    );
    console.log("📋 Seeded default internships in MongoDB");
  } catch (e) {
    console.error("Seed internships:", e.message);
  }
}

function internshipToClient(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const id = o._id?.toString();
  return {
    id,
    _id: id,
    title: o.title,
    company: o.company,
    domain: o.domain,
    type: o.type,
    location: o.location || "Remote",
    stipend: o.stipend,
    duration: o.duration,
    skills: o.skills || [],
    desc: o.desc || "",
    emoji: o.emoji || "🚀",
    match: 0,
  };
}

function applicationToClient(appDoc) {
  const a = appDoc.toObject ? appDoc.toObject() : appDoc;
  let intern = null;
  if (a.internship && typeof a.internship === "object" && a.internship._id) {
    intern = internshipToClient(a.internship);
  }
  return {
    id: a._id?.toString(),
    status: a.status,
    message: a.message || "",
    reviewerNote: a.reviewerNote || "",
    reviewedAt: a.reviewedAt,
    createdAt: a.createdAt,
    roleTitle: a.roleTitle,
    internship: intern,
  };
}

function applicationForReviewer(appDoc) {
  const base = applicationToClient(appDoc);
  const s = appDoc.student;
  if (s && typeof s === "object" && s._id) {
    const fullName = [s.firstName, s.lastName].filter(Boolean).join(" ") || s.username || "Student";
    base.studentName = fullName;
    base.student = {
      id: s._id.toString(),
      email: s.email,
      username: s.username,
      firstName: s.firstName || "",
      lastName: s.lastName || "",
      profile: s.profile || {},
      skills: s.skills || [],
    };
  }
  return base;
}

function userToClient(userDoc) {
  const u = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  return {
    id: u._id?.toString(),
    email: u.email,
    username: u.username,
    role: u.role,
    firstName: u.firstName || "",
    lastName: u.lastName || "",
    profile: {
      college: u.profile?.college || "",
      techBackground: u.profile?.techBackground || "",
      linkedin: u.profile?.linkedin || "",
      github: u.profile?.github || "",
      phone: u.profile?.phone || "",
    },
    skills: (u.skills || []).map((s) => ({
      name: s.name,
      level: s.level != null ? s.level : 3,
      verified: s.verified || false,
    })),
  };
}

// In-memory store for active skill quizzes
const activeQuizzes = {}; // { userId: { expiresAt: Date, answers: Object, targetSkills: Array } }

function authenticateToken(req, res, next) {
  const h = req.headers.authorization;
  const token = h && h.startsWith("Bearer ") ? h.slice(7).trim() : null;
  if (!token)
    return res.status(401).json({ message: "Login required. Please sign in." });
  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET || "supersecret");
    next();
  } catch {
    return res.status(403).json({ message: "Invalid or expired session." });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ message: "Login required." });
    if (req.auth.role !== role) {
      return res
        .status(403)
        .json({ message: "This action is not allowed for your account type." });
    }
    next();
  };
}

// OTP Store (in-memory)
const otpStore = {};

// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(toEmail, username, otp) {
  await transporter.sendMail({
    from: `"AuthPortal" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "🔐 Tumharo Verification Code - AuthPortal",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: auto; background: #0f1520; color: #e8f0fe; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #00d4ff, #7c3aed); padding: 30px; text-align: center;">
          <h1 style="margin:0; font-size: 28px; color: white;">⚡ AuthPortal</h1>
        </div>
        <div style="padding: 36px;">
          <h2 style="color: #e8f0fe; margin-top: 0;">Hello ${username}! 👋</h2>
          <p style="color: #5a7090; line-height: 1.6;">
            Tumharo email verification code niche che.<br/>
            Aa code <strong style="color:#00d4ff">10 minute</strong> ma expire thase.
          </p>
          <div style="background: #151d2e; border: 1px solid #1e2d45; border-radius: 12px; padding: 28px; text-align: center; margin: 28px 0;">
            <p style="color: #5a7090; font-size: 13px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
            <div style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #00d4ff; font-family: monospace;">${otp}</div>
          </div>
          <p style="color: #5a7090; font-size: 13px;">
            Je tumhe aa request nathi kari, to aa email ignore karjo.
          </p>
        </div>
        <div style="padding: 20px; text-align: center; border-top: 1px solid #1e2d45;">
          <p style="color: #5a7090; font-size: 12px; margin: 0;">© 2025 AuthPortal. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

async function sendApplicationDecisionEmail(
  toEmail,
  displayName,
  roleTitle,
  company,
  status,
  reviewerNote,
) {

  // ============================================
  const approved = status === "approved";
  const subject = approved
    ? `✅ Approved: ${roleTitle} at ${company}`
    : `Application update: ${roleTitle} at ${company}`;
  const noteBlock = reviewerNote
    ? `<p style="color:#5a7090; margin-top:16px; padding:12px; background:#151d2e; border-radius:8px;"><strong>Note from reviewer:</strong><br/>${reviewerNote.replace(/</g, "&lt;")}</p>`
    : "";
  await transporter.sendMail({
    from: `"InternPath" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html: `
      <div style="font-family:'Segoe UI',sans-serif; max-width:520px; margin:auto; background:#0f1520; color:#e8f0fe; border-radius:16px; overflow:hidden;">
        <div style="background:linear-gradient(135deg,#00d4ff,#7c3aed); padding:24px; text-align:center;">
          <h1 style="margin:0; font-size:22px; color:white;">InternPath</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 12px;">Hello ${displayName || "there"},</p>
          <p style="color:#5a7090; line-height:1.6;">
            ${approved
        ? `Congratulations! Your application for <strong style="color:#34d399">${roleTitle}</strong> at <strong>${company}</strong> has been <strong style="color:#34d399">approved</strong>.`
        : `Your application for <strong>${roleTitle}</strong> at <strong>${company}</strong> was <strong style="color:#f87171">not selected</strong> at this time.`
      }
          </p>
          ${noteBlock}
          <p style="color:#5a7090; font-size:13px; margin-top:24px;">Log in to the student portal to see details in your mailbox.</p>
        </div>
      </div>
    `,
  });
}

async function sendOfferEmailToStudent(application, student, interviewer, internship) {
  const acceptUrl = `http://localhost:3000/api/applications/${application._id}/student-response?action=accept`;
  const rejectUrl = `http://localhost:3000/api/applications/${application._id}/student-response?action=reject`;
  const interviewerName = [interviewer.firstName, interviewer.lastName].filter(Boolean).join(" ") || interviewer.username;

  await transporter.sendMail({
    from: `"${interviewerName} (via InternPath)" <${process.env.EMAIL_USER}>`,
    replyTo: interviewer.email,
    to: student.email,
    subject: `🎉 Internship Offer: ${internship.title} at ${internship.company}`,
    html: `
      <div style="font-family:'Segoe UI',sans-serif; max-width:540px; margin:auto; background:#0f1520; color:#e8f0fe; border-radius:16px; overflow:hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.4);">
        <div style="background:linear-gradient(135deg,#10b981,#06b6d4); padding:30px; text-align:center;">
          <h1 style="margin:0; font-size:26px; color:white; letter-spacing:-0.5px;">🎉 You Got an Offer!</h1>
          <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px;">${internship.company}</p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px; font-size:16px;">Hello <strong>${student.firstName || student.username}</strong>,</p>
          <p style="color:#94a3b8; line-height:1.7; margin:0 0 20px;">
            <strong style="color:#10b981;">${interviewerName}</strong> from <strong style="color:#e8f0fe;">${internship.company}</strong> is pleased to offer you the position of <strong style="color:#06b6d4;">${internship.title}</strong>.
          </p>
          ${application.interviewNotes ? `<div style="background:#1e293b; border-left: 3px solid #10b981; padding:14px 16px; border-radius:8px; margin-bottom:24px;"><p style="margin:0; font-size:13px; color:#94a3b8;"><strong style="color:#e8f0fe;">Message from ${interviewerName}:</strong></p><p style="margin:8px 0 0; color:#94a3b8; font-size:14px; line-height:1.6;">${application.interviewNotes.replace(/</g, "&lt;")}</p></div>` : ''}
          <p style="color:#475569; font-size:12px; margin-top:28px; text-align:center;">This email was sent from <strong>${interviewerName}</strong> &lt;${interviewer.email}&gt; via InternPath.<br/>Reply directly to this email to contact the interviewer.</p>
        </div>
      </div>
    `,
  });
}

async function sendRejectionEmailToStudent(application, student, interviewer, internship) {
  const interviewerName = [interviewer.firstName, interviewer.lastName].filter(Boolean).join(" ") || interviewer.username;

  await transporter.sendMail({
    from: `"${interviewerName} (via InternPath)" <${process.env.EMAIL_USER}>`,
    replyTo: interviewer.email,
    to: student.email,
    subject: `Application Update: ${internship.title} at ${internship.company}`,
    html: `
      <div style="font-family:'Segoe UI',sans-serif; max-width:540px; margin:auto; background:#0f1520; color:#e8f0fe; border-radius:16px; overflow:hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.4);">
        <div style="background:linear-gradient(135deg,#1e293b,#334155); padding:30px; text-align:center;">
          <h1 style="margin:0; font-size:22px; color:#e8f0fe;">Application Update</h1>
          <p style="margin:8px 0 0; color:#94a3b8; font-size:14px;">${internship.company} &mdash; ${internship.title}</p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px; font-size:16px;">Hello <strong>${student.firstName || student.username}</strong>,</p>
          <p style="color:#94a3b8; line-height:1.7; margin:0 0 20px;">
            Thank you for interviewing with <strong style="color:#e8f0fe;">${internship.company}</strong>. After careful consideration, <strong style="color:#e8f0fe;">${interviewerName}</strong> has decided not to move forward with your application for <strong style="color:#94a3b8;">${internship.title}</strong> at this time.
          </p>
          ${application.interviewNotes ? `<div style="background:#1e293b; border-left: 3px solid #64748b; padding:14px 16px; border-radius:8px; margin-bottom:24px;"><p style="margin:0; font-size:13px; color:#94a3b8;"><strong style="color:#e8f0fe;">Feedback from ${interviewerName}:</strong></p><p style="margin:8px 0 0; color:#94a3b8; font-size:14px; line-height:1.6;">${application.interviewNotes.replace(/</g, "&lt;")}</p></div>` : ''}
          <p style="color:#475569; font-size:13px; margin-top:24px;">We encourage you to keep applying and wish you the best in your journey.</p>
          <p style="color:#475569; font-size:12px; margin-top:20px;">This email was sent from <strong>${interviewerName}</strong> &lt;${interviewer.email}&gt; via InternPath.</p>
        </div>
      </div>
    `,
  });
}

async function sendStudentResponseEmailToInterviewer(application, student, interviewer, internship, action) {
  const isAccepted = action === "accept";
  const statusColor = isAccepted ? "#10b981" : "#ef4444";
  const statusText = isAccepted ? "ACCEPTED" : "DECLINED";

  await transporter.sendMail({
    from: `"InternPath" <${process.env.EMAIL_USER}>`,
    replyTo: student.email,
    to: interviewer.email,
    subject: `Candidate ${statusText} Offer: ${student.firstName || student.username} for ${internship.title}`,
    html: `
      <div style="font-family:'Segoe UI',sans-serif; max-width:520px; margin:auto; background:#0f1520; color:#e8f0fe; border-radius:16px; overflow:hidden;">
        <div style="background:linear-gradient(135deg,${statusColor},#3b82f6); padding:24px; text-align:center;">
          <h1 style="margin:0; font-size:22px; color:white;">Offer ${statusText}</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 12px;">Hello ${interviewer.firstName || interviewer.username},</p>
          <p style="color:#5a7090; line-height:1.6;">
            The candidate <strong>${student.firstName || student.username}</strong> has <strong style="color:${statusColor}">${statusText.toLowerCase()}</strong> your offer for the <strong style="color:#e8f0fe">${internship.title}</strong> position.
          </p>
          <p style="color:#5a7090; font-size:13px; margin-top:24px;">Check your interviewer dashboard for more details.</p>
        </div>
      </div>
    `,
  });
}

// 1. Send OTP
app.post("/api/send-otp", async (req, res) => {
  try {
    const { username, email: rawEmail, password, role } = req.body;
    const email = String(rawEmail || "").toLowerCase().trim();
    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields are required!" });
    const signupRole =
      role === "interviewer" || role === "student" ? role : "student";

    const existing = await User.findOne({ email });
    if (existing)
      return res
        .status(400)
        .json({ message: "Aa email thi account pahela thi che!" });

    const otp = generateOTP();
    const expiry = Date.now() + 10 * 60 * 1000;
    otpStore[email] = {
      otp,
      expiry,
      userData: { username, email, password, role: signupRole },
    };

    await sendOTPEmail(email, username, otp);
    res.json({ message: "OTP moki didhun!" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res
      .status(500)
      .json({ message: "Email moklata error avyo: " + err.message });
  }
});

// 2. Verify OTP — Save to MongoDB
app.post("/api/verify-otp", async (req, res) => {
  try {
    const { email: rawEmail, otp } = req.body;
    const email = String(rawEmail || "").toLowerCase().trim();
    const record = otpStore[email];

    if (!record)
      return res
        .status(400)
        .json({ message: "OTP request nathi mli. Fari try karo." });
    if (Date.now() > record.expiry)
      return res
        .status(400)
        .json({ message: "OTP expire thi gayu! Fari mokao." });
    if (record.otp !== otp)
      return res.status(400).json({ message: "OTP galat che!" });

    const { username, password, role: storedRole } = record.userData;
    const passwordHash = await bcrypt.hash(password, 12);
    const role =
      storedRole === "interviewer" || storedRole === "student"
        ? storedRole
        : "student";

    const newUser = new User({ username, email, passwordHash, role });
    await newUser.save();

    delete otpStore[email];
    res.json({ message: "Account safaltapurvak bani gayu! 🎉" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// 3. Login
app.post("/api/login", async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;
    const email = String(rawEmail || "").toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ message: "Email nathi milu. Pehla signup karo!" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ message: "Password galat che!" });

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful!",
      token,
      username: user.username,
      user: userToClient(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Current user (profile + skills) — tied to JWT / login email
app.get("/api/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.auth.email });
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user: userToClient(user) });
  } catch (err) {
    console.error("GET /api/me:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/me/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.auth.email });
    if (!user) return res.status(404).json({ message: "User not found." });

    const {
      firstName,
      lastName,
      college,
      techBackground,
      linkedin,
      github,
      phone,
    } = req.body;

    if (firstName !== undefined) user.firstName = String(firstName).trim();
    if (lastName !== undefined) user.lastName = String(lastName).trim();
    if (!user.profile) user.profile = {};
    if (college !== undefined) user.profile.college = String(college).trim();
    if (techBackground !== undefined)
      user.profile.techBackground = String(techBackground).trim();
    if (linkedin !== undefined) user.profile.linkedin = String(linkedin).trim();
    if (github !== undefined) user.profile.github = String(github).trim();
    if (phone !== undefined) user.profile.phone = String(phone).trim();

    await user.save();
    res.json({
      message: "Profile saved.",
      user: userToClient(user),
    });
  } catch (err) {
    console.error("PUT /api/me/profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/me/skills", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.auth.email });
    if (!user) return res.status(404).json({ message: "User not found." });

    const { skills } = req.body;
    if (!Array.isArray(skills))
      return res.status(400).json({ message: "skills must be an array" });

    user.skills = skills
      .map((s) =>
        typeof s === "string"
          ? { name: s.trim(), level: 3 }
          : {
            name: String(s.name || "").trim(),
            level: Number.isFinite(Number(s.level)) ? Number(s.level) : 3,
          },
      )
      .filter((s) => s.name.length > 0);

    await user.save();
    res.json({
      message: "Skills saved.",
      user: userToClient(user),
    });
  } catch (err) {
    console.error("PUT /api/me/skills:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// AI Skill Verification Quiz Endpoints                                          
// ─────────────────────────────────────────────────────────────────────────

app.post("/api/me/skills/quiz/generate", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.auth.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const { skills } = req.body;
    if (!skills || !skills.length) return res.status(400).json({ message: "No skills provided" });

    // Limit to 5 skills to avoid huge prompts and user fatigue, 3 questions per skill
    const targetSkills = skills.slice(0, 5);
    const numQuestions = targetSkills.length * 3;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return res.status(503).json({ message: "AI service not configured" });

    const prompt = `Generate a multiple-choice technical quiz to verify a software engineering student's skills in the following areas: ${targetSkills.join(", ")}.
Requirements:
1. Generate exactly 3 questions per skill. Total questions: ${numQuestions}.
2. Questions should be of medium difficulty to verify practical, real-world knowledge (not just basic definitions).
3. You MUST return ONLY a valid JSON object in this exact format, with no markdown formatting or extra text:
{
  "questions": [
    {
      "id": "q1",
      "skill": "React",
      "question": "What is the primary purpose of the useEffect hook?",
      "options": {"A": "State management", "B": "Routing", "C": "Side effects", "D": "Context"},
      "correctAnswer": "C"
    }
  ]
}`;

    const axios = require("axios");
    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
    });

    let rawOutput = response.data.choices[0].message.content;
    // Clean potential markdown wrap
    rawOutput = rawOutput.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    const quizData = JSON.parse(rawOutput);

    // Save correct answers in memory securely
    const answerKey = {};
    const clientQuestions = quizData.questions.map(q => {
      answerKey[q.id] = { answer: q.correctAnswer, skill: q.skill };
      return { id: q.id, skill: q.skill, question: q.question, options: q.options };
    });

    activeQuizzes[user._id.toString()] = {
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins to complete
      answers: answerKey,
      targetSkills: targetSkills
    };

    res.json({ questions: clientQuestions });
  } catch (err) {
    console.error("Quiz Gen Error:", err.message);
    res.status(500).json({ message: "Failed to generate AI quiz" });
  }
});

app.post("/api/me/skills/quiz/submit", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.auth.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const userId = user._id.toString();
    const session = activeQuizzes[userId];
    if (!session || Date.now() > session.expiresAt) {
      return res.status(400).json({ message: "Quiz session expired or not found. Please try again." });
    }

    const { userAnswers } = req.body; // e.g. { q1: "A", q2: "C" }
    if (!userAnswers) return res.status(400).json({ message: "No answers provided" });

    const answerKey = session.answers;
    const skillStats = {};

    // Initialize stats
    session.targetSkills.forEach(s => skillStats[s] = { total: 0, correct: 0 });

    // Evaluate answers
    Object.keys(answerKey).forEach(qId => {
      const expected = answerKey[qId].answer;
      const skill = answerKey[qId].skill;

      // Fuzzy matching to link the AI's "skill" key back to the requested target skill
      const matchedSkill = session.targetSkills.find(s => s.toLowerCase() === skill.toLowerCase()) || skill;

      if (!skillStats[matchedSkill]) skillStats[matchedSkill] = { total: 0, correct: 0 };

      skillStats[matchedSkill].total++;
      if (userAnswers[qId] && userAnswers[qId].toUpperCase() === expected.toUpperCase()) {
        skillStats[matchedSkill].correct++;
      }
    });

    const passedSkills = [];
    Object.keys(skillStats).forEach(skill => {
      const stat = skillStats[skill];
      // Pass if they got at least 66% right (e.g. 2 out of 3)
      if (stat.total > 0 && (stat.correct / stat.total) >= 0.6) {
        passedSkills.push(skill);
      }
    });

    // Update user document in DB
    if (passedSkills.length > 0) {
      user.skills.forEach(s => {
        const matched = passedSkills.find(ps => ps.toLowerCase() === s.name.toLowerCase());
        if (matched) {
          s.verified = true;
          s.verifiedAt = new Date();
        }
      });
      await user.save();
    }

    delete activeQuizzes[userId];

    res.json({
      message: "Quiz evaluated successfully",
      results: skillStats,
      passedSkills,
      user: userToClient(user)
    });
  } catch (err) {
    console.error("Quiz Submit Error:", err);
    res.status(500).json({ message: "Failed to evaluate quiz" });
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
}); // 5MB max

app.post(
  "/api/me/resume-parse",
  authenticateToken,
  upload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No resume file provided." });

      // 1. Send file to Python service to extract text
      const formData = new FormData();
      formData.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const ML_SERVICE_URL =
        process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
      const axios = require("axios");
      const pythonRes = await axios.post(
        `${ML_SERVICE_URL}/extract-pdf-text`,
        formData,
        {
          headers: formData.getHeaders(),
        },
      );

      if (pythonRes.data.status === "error") {
        return res.status(500).json({
          message: "Python extraction error: " + pythonRes.data.error,
        });
      }

      const text = pythonRes.data.text;
      if (!text || text.trim() === "") {
        return res.status(400).json({
          message: "Could not extract text. The PDF might be an image.",
        });
      }

      // 2. Send text to OpenRouter to parse
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey)
        return res.status(500).json({ message: "OpenRouter API Key missing." });

      const systemPrompt = `You are an AI resume parser. Extract the following information from the provided resume text:
- 'skills': An array of technical and soft skill strings.
- 'college': The name of the most recent university/college attended (string). 
- 'techBackground': A short 2-5 word summary of their background (e.g., 'Computer Science Student', 'Full Stack Developer', 'Data Science Enthusiast') (string).

IMPORTANT: You MUST return ONLY valid JSON in the exact following structure with no markdown formatting or extra text:
{
  "skills": ["skill1", "skill2"],
  "college": "University Name",
  "techBackground": "Student"
}`;

      const orRes = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + apiKey,
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001", // Powerful model for structural extraction
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: "Resume text:\n\n" + text.substring(0, 15000),
              },
            ],
            temperature: 0.1,
          }),
        },
      );

      const data = await orRes.json();
      if (!orRes.ok)
        throw new Error("OpenRouter API error: " + JSON.stringify(data));

      let reply = data.choices?.[0]?.message?.content || "";
      reply = reply
        .replace(/\`\`\`json/g, "")
        .replace(/\`\`\`/g, "")
        .trim();

      let parsedData;
      try {
        parsedData = JSON.parse(reply);
      } catch (e) {
        throw new Error("Failed to parse JSON from AI response: " + reply);
      }

      res.json({
        parsedProfile: parsedData,
        message: "Resume parsed successfully.",
      });
    } catch (err) {
      console.error("Resume parse error:", err.message);
      res
        .status(500)
        .json({ message: err.message || "Server error during resume parsing" });
    }
  },
);

// --- Internships & applications (MongoDB) ---
app.get("/api/internships", async (req, res) => {
  try {
    const list = await Internship.find().sort({ createdAt: -1 }).limit(300);
    res.json({ internships: list.map(internshipToClient) });
  } catch (err) {
    console.error("GET /api/internships:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post(
  "/api/internships",
  authenticateToken,
  requireRole("interviewer"),
  async (req, res) => {
    try {
      const interviewer = await User.findOne({ email: req.auth.email });
      if (!interviewer)
        return res.status(404).json({ message: "User not found." });
      const {
        title,
        company,
        desc,
        skills,
        type,
        stipend,
        duration,
        domain,
        emoji,
        location,
      } = req.body;
      if (!title || !String(title).trim())
        return res.status(400).json({ message: "title is required" });
      const doc = await Internship.create({
        title: String(title).trim(),
        company: String(company || "Company").trim(),
        location: String(location || "Remote").trim(),
        desc: String(desc || "").trim(),
        skills: Array.isArray(skills) ? skills.map((s) => String(s)) : [],
        type: String(type || "Remote").trim(),
        stipend: String(stipend || "Negotiable").trim(),
        duration: String(duration || "3 months").trim(),
        domain: String(domain || "Software").trim(),
        emoji: String(emoji || "🚀"),
        postedBy: interviewer._id,
        creatorEmail: interviewer.email,
        isSeeded: false,
      });
      res.status(201).json({ internship: internshipToClient(doc) });
    } catch (err) {
      console.error("POST /api/internships:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

app.post(
  "/api/applications",
  authenticateToken,
  requireRole("student"),
  async (req, res) => {
    try {
      const { internshipId, message } = req.body;
      if (!internshipId)
        return res.status(400).json({ message: "internshipId is required" });
      const intern = await Internship.findById(internshipId);
      if (!intern)
        return res.status(404).json({ message: "Internship not found." });
      const student = await User.findOne({ email: req.auth.email });
      if (!student) return res.status(404).json({ message: "User not found." });
      const existing = await Application.findOne({
        internship: intern._id,
        student: student._id,
      });
      if (existing) {
        return res
          .status(400)
          .json({ message: "You have already applied for this role." });
      }
      const appDoc = await Application.create({
        internship: intern._id,
        student: student._id,
        roleTitle: intern.title,
        message: String(message || "").slice(0, 4000),
      });
      const populated = await Application.findById(appDoc._id).populate(
        "internship",
      );
      res.status(201).json({ application: applicationToClient(populated) });

      // ── Step 7: Automatic ML Retraining Trigger (Collaborative Filtering) ─
      setImmediate(async () => {
        try {
          const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
          console.log("[ML-AutoTrain] Triggering CF retraining after application...");
          await axios.post(`${ML_URL}/train/collaborative`).catch(e => console.log("CF train skip:", e.message));
        } catch (err) {
          console.error("[ML-AutoTrain] CF Trigger failed:", err.message);
        }
      });
    } catch (err) {
      if (err.code === 11000) {
        return res
          .status(400)
          .json({ message: "You have already applied for this role." });
      }
      console.error("POST /api/applications:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

app.get(
  "/api/applications/my",
  authenticateToken,
  requireRole("student"),
  async (req, res) => {
    try {
      const student = await User.findOne({ email: req.auth.email });
      if (!student) return res.status(404).json({ message: "User not found." });
      const apps = await Application.find({ student: student._id })
        .populate("internship")
        .sort({ createdAt: -1 });
      res.json({ applications: apps.map(applicationToClient) });
    } catch (err) {
      console.error("GET /api/applications/my:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

app.get(
  "/api/applications/pending-review",
  authenticateToken,
  requireRole("interviewer"),
  async (req, res) => {
    try {
      const interviewer = await User.findOne({ email: req.auth.email });
      if (!interviewer)
        return res.status(404).json({ message: "User not found." });
      const ownedInterships = await Internship.find({
        $or: [
          { creatorEmail: req.auth.email },
          { postedBy: interviewer._id }
        ]
      }).select("_id");
      const ids = ownedInterships.map((x) => x._id);

      // Build filter: only pending applications for internships created by this interviewer
      const filter = { internship: { $in: ids }, status: "pending" };

      const apps = await Application.find(filter)
        .populate("internship")
        .populate("student", "email username firstName lastName profile skills")
        .sort({ createdAt: -1 });
      res.json({ applications: apps.map(applicationForReviewer) });
    } catch (err) {
      console.error("GET /api/applications/pending-review:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// --- CHAT ROUTES ---
app.get("/api/chat/:applicationId", authenticateToken, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ application: req.params.applicationId })
      .sort({ timestamp: 1 })
      .populate("sender", "username firstName lastName role");
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: "Error fetching messages" });
  }
});

app.post("/api/chat/:applicationId", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.auth.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const message = new ChatMessage({
      application: req.params.applicationId,
      sender: user._id,
      text: req.body.text
    });
    await message.save();

    const populated = await message.populate("sender", "username firstName lastName role");

    // Broadcast to the chat room
    io.to(`chat_${req.params.applicationId}`).emit("chat:receive", {
      applicationId: req.params.applicationId,
      message: populated
    });

    res.json({ message: populated });
  } catch (err) {
    console.error("POST /api/chat error:", err);
    res.status(500).json({ message: "Error sending message" });
  }
});


app.patch(
  "/api/applications/:applicationId/review",
  authenticateToken,
  requireRole("interviewer"),
  async (req, res) => {
    try {
      const { status, note } = req.body;
      if (!["approved", "rejected"].includes(status)) {
        return res
          .status(400)
          .json({ message: "status must be approved or rejected" });
      }
      const interviewer = await User.findOne({ email: req.auth.email });
      if (!interviewer)
        return res.status(404).json({ message: "User not found." });

      const appDoc = await Application.findById(req.params.applicationId)
        .populate("internship")
        .populate("student", "email username firstName lastName");

      if (!appDoc)
        return res.status(404).json({ message: "Application not found." });
      if (appDoc.status !== "pending") {
        return res
          .status(400)
          .json({ message: "This application was already reviewed." });
      }

      const intern = appDoc.internship;
      if (!intern) return res.status(404).json({ message: "Internship not found for this application." });

      const isOwner =
        intern.creatorEmail === req.auth.email ||
        (intern.postedBy && intern.postedBy.toString() === interviewer._id.toString());

      if (!isOwner) {
        return res.status(403).json({
          message:
            "You can only review applications for your own listings.",
        });
      }

      appDoc.status = status;
      appDoc.reviewerNote = String(note || "").slice(0, 2000);
      appDoc.reviewedBy = interviewer._id;
      appDoc.reviewedAt = new Date();
      await appDoc.save();

      const stu = appDoc.student;
      const name =
        [stu.firstName, stu.lastName].filter(Boolean).join(" ") ||
        stu.username ||
        "Student";
      try {
        await sendApplicationDecisionEmail(
          stu.email,
          name,
          appDoc.roleTitle,
          intern.company,
          status,
          appDoc.reviewerNote,
        );
      } catch (mailErr) {
        console.error("Application decision email:", mailErr.message);
      }

      const out = await Application.findById(appDoc._id)
        .populate("internship")
        .populate("student", "email username firstName lastName");
      res.json({ application: applicationForReviewer(out) });
    } catch (err) {
      console.error("PATCH review:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────
// INTERVIEWER SPECIFIC DASHBOARD & CANDIDATES
// ─────────────────────────────────────────────────────────────────────────

app.get(
  "/api/interviewer/stats",
  authenticateToken,
  requireRole("interviewer"),
  async (req, res) => {
    try {
      // Get interviewer's internships (owned or open/demo)
      const interviewer = await User.findOne({ email: req.auth.email });
      if (!interviewer)
        return res.status(404).json({ message: "User not found." });

      const ownedInterships = await Internship.find({
        creatorEmail: req.auth.email,
      }).select("_id");
      const internshipIds = ownedInterships.map((x) => x._id);

      // Build filter for applications: only for internships created by this interviewer
      const applicationFilter = { internship: { $in: internshipIds } };

      // Count of PENDING applications (to match the application list view)
      const totalApps = await Application.countDocuments(applicationFilter);

      // Count of unique students who have been approved for interviewer's internships
      const approvedStudentIds = await Application.distinct("student", {
        ...applicationFilter,
        status: "approved",
      });
      const approvedStudentsCount = approvedStudentIds.length;

      // Interviews today (Approvals within the last 24 hours for interviewer's internships)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const interviewsToday = await Application.countDocuments({
        ...applicationFilter,
        status: "approved",
        reviewedAt: { $gte: startOfDay },
      });

      res.json({
        totalApplications: totalApps,
        approvedStudents: approvedStudentsCount,
        interviewsToday: interviewsToday,
      });
    } catch (err) {
      console.error("GET /api/interviewer/stats error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

app.get(
  "/api/interviewer/candidates",
  authenticateToken,
  requireRole("interviewer"),
  async (req, res) => {
    try {
      // Get interviewer's internships (owned or open/demo)
      const interviewer = await User.findOne({ email: req.auth.email });
      if (!interviewer)
        return res.status(404).json({ message: "User not found." });

      const ownedInterships = await Internship.find({
        creatorEmail: req.auth.email,
      }).select("_id");
      const internshipIds = ownedInterships.map((x) => x._id);

      // Find filter for approved applications for internships created by this interviewer
      const applicationFilter = {
        internship: { $in: internshipIds },
        status: "approved",
      };

      // Find students who have at least one 'approved' application for these internships
      const approvedStudentIds = await Application.distinct(
        "student",
        applicationFilter,
      );
      const students = await User.find({
        _id: { $in: approvedStudentIds },
        role: "student",
      });

      // To sort students by their most recent application approval, 
      // we should fetch the applications and then map back to students.
      const sortedApps = await Application.find({
        student: { $in: approvedStudentIds },
        status: "approved"
      }).sort({ reviewedAt: -1 });

      const sortedStudentIds = [...new Set(sortedApps.map(a => a.student.toString()))];
      const baseStudents = sortedStudentIds.map(id => students.find(s => s._id.toString() === id)).filter(Boolean);

      // Sort: Verified students first, then maintain original order (recency)
      const finalStudents = baseStudents.sort((a, b) => {
        const aVerified = (a.skills || []).some(s => s.verified);
        const bVerified = (b.skills || []).some(s => s.verified);
        if (aVerified && !bVerified) return -1;
        if (!aVerified && bVerified) return 1;
        return 0;
      });

      res.json({ candidates: finalStudents.map(userToClient) });
    } catch (err) {
      console.error("GET /api/interviewer/candidates error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

app.get(
  "/api/interviewer/pipeline",
  authenticateToken,
  requireRole("interviewer"),
  async (req, res) => {
    try {
      const interviewer = await User.findOne({ email: req.auth.email });
      if (!interviewer)
        return res.status(404).json({ message: "User not found." });

      const ownedInterships = await Internship.find({
        creatorEmail: req.auth.email,
      }).select("_id");
      const internshipIds = ownedInterships.map((x) => x._id);

      const applications = await Application.find({
        internship: { $in: internshipIds },
      })
        .populate("student")
        .populate("internship")
        .sort({ reviewedAt: -1, createdAt: -1 });

      res.json({ applications });
    } catch (err) {
      console.error("GET /api/interviewer/pipeline error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

app.get(
  "/api/interviewer/listings",
  authenticateToken,
  requireRole("interviewer"),
  async (req, res) => {
    try {
      const interviewer = await User.findOne({ email: req.auth.email });
      if (!interviewer)
        return res.status(404).json({ message: "User not found." });

      const listings = await Internship.find({ creatorEmail: req.auth.email }).sort({
        createdAt: -1,
      });

      const listingsWithStats = await Promise.all(
        listings.map(async (listing) => {
          const totalApplicants = await Application.countDocuments({
            internship: listing._id,
          });
          const shortlisted = await Application.countDocuments({
            internship: listing._id,
            status: { $in: ["approved", "interviewed", "offered"] },
          });
          return {
            ...internshipToClient(listing),
            totalApplicants,
            shortlisted,
          };
        })
      );

      res.json({ listings: listingsWithStats });
    } catch (err) {
      console.error("GET /api/interviewer/listings error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

app.patch(
  "/api/applications/:id/pipeline",
  authenticateToken,
  requireRole("interviewer"),
  async (req, res) => {
    try {
      const { status, interviewNotes } = req.body;
      const application = await Application.findById(req.params.id);
      if (!application)
        return res.status(404).json({ message: "Application not found" });

      const interviewer = await User.findOne({ email: req.auth.email });
      const internship = await Internship.findById(application.internship);

      if (
        internship.creatorEmail !== req.auth.email &&
        (!internship.postedBy ||
          internship.postedBy.toString() !== interviewer._id.toString())
      ) {
        return res
          .status(403)
          .json({ message: "Unauthorized. You do not own this listing." });
      }

      if (status) application.status = status;
      if (interviewNotes !== undefined)
        application.interviewNotes = String(interviewNotes).trim();

      application.reviewedBy = interviewer._id;
      application.reviewedAt = new Date();

      await application.save();

      res.json({ application, message: "Pipeline status optimized" });
    } catch (err) {
      console.error("PATCH /api/applications/:id/pipeline error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

app.post(
  "/api/applications/:id/decision",
  authenticateToken,
  requireRole("interviewer"),
  async (req, res) => {
    try {
      const { status, notes } = req.body;
      const application = await Application.findById(req.params.id)
        .populate("student")
        .populate("internship");
      if (!application) return res.status(404).json({ message: "Application not found" });

      const interviewer = await User.findOne({ email: req.auth.email });
      if (!interviewer) return res.status(404).json({ message: "Interviewer not found" });

      const student = application.student;
      const internship = application.internship;

      if (!student) return res.status(404).json({ message: "Student not found for this application" });
      if (!internship) return res.status(404).json({ message: "Internship not found for this application" });

      if (
        internship.creatorEmail !== req.auth.email &&
        (!internship.postedBy ||
          internship.postedBy.toString() !== interviewer._id.toString())
      ) {
        return res.status(403).json({ message: "Unauthorized. You do not own this listing." });
      }

      application.status = status;
      if (notes) application.interviewNotes = notes;
      application.reviewedBy = interviewer._id;
      application.reviewedAt = new Date();
      await application.save();

      try {
        if (status === "offered") {
          await sendOfferEmailToStudent(application, student, interviewer, internship);
          console.log("Offer email sent to:", student.email);
        } else if (status === "rejected") {
          await sendRejectionEmailToStudent(application, student, interviewer, internship);
          console.log("Rejection email sent to:", student.email);
        }
      } catch (emailErr) {
        console.error("Email send failed (status still updated):", emailErr.message);
      }

      res.json({ message: `Application updated to ${status}` });

      // ── Step 7: Automatic ML Retraining Trigger ──────────────────────────
      // We trigger this in the background after the response is sent
      setImmediate(async () => {
        try {
          const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
          console.log("[ML-AutoTrain] Triggering background retraining...");

          // Trigger Success Predictor retraining
          await axios.post(`${ML_URL}/train/success`).catch(e => console.log("Success train skip:", e.message));

          // Trigger Collaborative Filtering retraining
          await axios.post(`${ML_URL}/train/collaborative`).catch(e => console.log("CF train skip:", e.message));

          console.log("[ML-AutoTrain] Retraining signals sent successfully.");
        } catch (err) {
          console.error("[ML-AutoTrain] Trigger failed:", err.message);
        }
      });
    } catch (err) {
      console.error("POST /api/applications/:id/decision error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

app.get(
  "/api/applications/:id/offer-letter",
  authenticateToken,
  async (req, res) => {
    try {
      const application = await Application.findById(req.params.id)
        .populate("student")
        .populate("internship")
        .populate("reviewedBy");

      if (!application) return res.status(404).json({ message: "Application not found" });

      // Verify the requester is the student of this application
      const user = await User.findOne({ email: req.auth.email });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (application.student._id.toString() !== user._id.toString()) {
        return res.status(403).json({ message: "Unauthorized to view this offer letter" });
      }

      // Check status
      if (application.status !== "offered" && application.status !== "accepted") {
        return res.status(400).json({ message: "Offer letter not available for this status" });
      }

      if (!application.student || !application.internship) {
        return res.status(404).json({ message: "Student or Internship data missing for this application" });
      }

      const student = application.student;
      const internship = application.internship;
      // If reviewedBy is not populated properly, fallback to postedBy or creatorEmail
      let interviewer = application.reviewedBy;
      if (!interviewer && internship.postedBy) interviewer = await User.findById(internship.postedBy);
      if (!interviewer) interviewer = { firstName: "Hiring Manager", lastName: "", email: internship.creatorEmail };

      const doc = new PDFDocument({ margin: 50 });

      // Setup response headers for PDF download
      const coName = (internship.company || "Company").replace(/\s+/g, '_');
      const studName = (student.firstName || student.username || "Student").replace(/\s+/g, '_');
      const filename = `Offer_Letter_${coName}_${studName}.pdf`;
      res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-type', 'application/pdf');

      doc.pipe(res);

      // --- STYLING & DESIGN ---
      const primaryColor = '#3b82f6';
      const secondaryColor = '#1e293b';
      const mutedColor = '#64748b';
      const bgColor = '#f8fafc';

      // Left Sidebar Accent
      doc.rect(0, 0, 15, doc.page.height).fill(primaryColor);

      // Logo Circle (Stylized Company Logo)
      const centerX = 80;
      const centerY = 80;
      doc.circle(centerX, centerY, 30).fill(primaryColor);
      doc.fontSize(25).font('Helvetica-Bold').fillColor('#ffffff').text((internship.company || "C")[0].toUpperCase(), centerX - 9, centerY - 10);

      // Company Name & Header
      doc.fontSize(28).font('Helvetica-Bold').fillColor(secondaryColor).text(internship.company || "Company", 130, 60);
      doc.fontSize(10).font('Helvetica').fillColor(mutedColor).text('OFFICIAL INTERNSHIP OFFER LETTER', 130, 95, { characterSpacing: 1 });

      // Horizontal Line
      doc.moveTo(130, 115).lineTo(550, 115).strokeColor('#e2e8f0').lineWidth(1).stroke();

      // Date
      const dateStr = (application.reviewedAt || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.fontSize(11).font('Helvetica').fillColor(secondaryColor).text(`Date: ${dateStr}`, 450, 135);

      // To: Section
      doc.fontSize(11).font('Helvetica-Bold').fillColor(secondaryColor).text('OFFERED TO:', 50, 170);
      doc.fontSize(16).font('Helvetica-Bold').fillColor(primaryColor).text(`${student.firstName || ""} ${student.lastName || student.username || ""}`.trim(), 50, 188);
      doc.fontSize(10).font('Helvetica').fillColor(mutedColor).text(student.email, 50, 210);

      // Content Start
      doc.x = 50;
      doc.y = 250;
      doc.fontSize(12).font('Helvetica').fillColor(secondaryColor).text(`Dear ${student.firstName || student.username},`, { lineGap: 5 });
      doc.moveDown(1);

      doc.text(`We are pleased to offer you the internship position of `, { continued: true });
      doc.font('Helvetica-Bold').text(`${internship.title}`, { continued: true });
      doc.font('Helvetica').text(` at `);
      doc.font('Helvetica-Bold').text(`${internship.company}`, { continued: true });
      doc.font('Helvetica').text(`. We were very impressed with your background and the skills you demonstrated during our evaluation process.`);
      doc.moveDown(2);

      // Details Box
      const boxTop = doc.y;
      doc.rect(50, boxTop, 500, 140).fill(bgColor);
      doc.rect(50, boxTop, 500, 140).strokeColor('#e2e8f0').lineWidth(1).stroke();

      doc.fillColor(secondaryColor);
      let currentY = boxTop + 15;
      const labelX = 70;
      const valueX = 180;
      const rowGap = 22;

      const details = [
        { label: 'Position:', value: internship.title },
        { label: 'Domain:', value: internship.domain },
        { label: 'Type:', value: internship.type },
        { label: 'Duration:', value: internship.duration },
        { label: 'Stipend:', value: internship.stipend }
      ];

      details.forEach(item => {
        doc.fontSize(11).font('Helvetica-Bold').text(item.label, labelX, currentY);
        doc.font('Helvetica').text(item.value, valueX, currentY);
        currentY += rowGap;
      });

      doc.y = boxTop + 160;
      doc.x = 50;

      // Closing
      doc.fontSize(12).font('Helvetica').text(`This offer is subject to the terms and conditions of the company. Please confirm your acceptance by replying to this offer through the InternPath portal.`);
      doc.moveDown(2);
      doc.text('We look forward to having you join our team and contribute to our shared success.');

      // Signature
      doc.moveDown(3);
      doc.fontSize(13).font('Helvetica-Bold').text(`${interviewer.firstName || interviewer.username} ${interviewer.lastName || ''}`.trim());
      doc.fontSize(10).font('Helvetica').fillColor(mutedColor).text('Hiring Manager');
      doc.text(internship.company);

      // Footer
      doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill(secondaryColor);
      doc.fontSize(10).fillColor('#ffffff').text('InternPath - Connecting Talent with Opportunity', 0, doc.page.height - 25, { align: 'center' });

      doc.end();

    } catch (err) {
      console.error("GET /api/applications/:id/offer-letter error:", err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Server error generating PDF" });
      }
    }
  }
);

app.get("/api/applications/:id/student-response", async (req, res) => {
  try {
    const { action } = req.query;
    if (action !== "accept" && action !== "reject") {
      return res.status(400).send("Invalid action");
    }

    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).send("Application not found");

    if (application.status === "accepted" || application.status === "declined") {
      return res.send(`
        <div style="font-family:sans-serif; text-align:center; padding:50px;">
          <h2>Action Already Taken</h2>
          <p>This offer was already ${application.status}. You cannot change this decision.</p>
        </div>
      `);
    }

    application.status = action === "accept" ? "accepted" : "declined";
    await application.save();

    const student = await User.findById(application.student);
    const interviewer = await User.findById(application.reviewedBy);
    const internship = await Internship.findById(application.internship);

    if (interviewer) {
      await sendStudentResponseEmailToInterviewer(application, student, interviewer, internship, action);
    }

    const color = action === "accept" ? "#10b981" : "#ef4444";
    const text = action === "accept" ? "Accepted!" : "Declined";
    res.send(`
      <div style="font-family:'Segoe UI',sans-serif; max-width:500px; margin:50px auto; text-align:center; padding:30px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.1); border-top: 6px solid ${color};">
        <h1 style="color:${color}; margin-top:0;">Offer ${text}</h1>
        <p style="color:#4b5563; font-size:16px;">We have notified ${internship.company} of your decision.</p>
        <p style="margin-top:20px; font-size:14px; color:#9ca3af;">You may close this window.</p>
      </div>
    `);
  } catch (err) {
    console.error("GET /api/applications/:id/student-response error:", err);
    res.status(500).send("Server error");
  }
});

// OpenRouter chat (used by chatbot.html, student / interviewer widgets)
app.post("/api/chat", async (req, res) => {
  const { messages, model, max_tokens, system_prompt } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === "PASTE_YOUR_KEY_HERE") {
    return res.status(503).json({
      error: "AI service not configured on server (.env missing key)."
    });
  }

  try {
    const fullMessages = [
      {
        role: "system",
        content:
          system_prompt ||
          "You are a helpful and friendly AI assistant. Reply in plain text only.",
      },
      ...messages,
    ];

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: model || "google/gemini-2.0-flash-001",
        max_tokens: max_tokens || 1024,
        temperature: 0.7,
        messages: fullMessages,
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "InternPath AI Assistant"
        },
        timeout: 30000
      }
    );

    const reply = response.data.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(500).json({ error: "Empty response from AI service." });
    }

    res.json({ reply: reply.trim() });
  } catch (err) {
    console.error("Chat API error:", err.response?.data || err.message);
    const msg = err.response?.data?.error?.message || err.message;
    res.status(500).json({ error: "AI Error: " + msg });
  }
});

// ML Admin Actions
app.post(
  "/api/admin/retrain",
  authenticateToken,
  requireRole("interviewer"),
  async (req, res) => {
    try {
      const ML_SERVICE_URL =
        process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
      const axios = require("axios");

      // Trigger Success model training
      const successRes = await axios.post(`${ML_SERVICE_URL}/train/success`);

      // Trigger Collaborative training
      const cfRes = await axios.post(`${ML_SERVICE_URL}/train/collaborative`);

      res.json({
        success: true,
        results: {
          success_model: successRes.data,
          collaborative_model: cfRes.data,
        },
      });
    } catch (err) {
      console.error("[Admin ML] Training error:", err.message);
      res
        .status(500)
        .json({ error: "Failed to retrain models: " + err.message });
    }
  },
);

app.get(
  "/api/admin/ml-status",
  authenticateToken,
  requireRole("interviewer"),
  async (req, res) => {
    try {
      const ML_SERVICE_URL =
        process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
      const axios = require("axios");
      const statusRes = await axios.get(`${ML_SERVICE_URL}/model/status`);
      res.json(statusRes.data);
    } catch (err) {
      res.status(500).json({ error: "ML service offline" });
    }
  },
);

const recommendationsRouter = require("./routes/recommendations");
const eventsRouter = require("./routes/events");

app.use("/api/events", eventsRouter);
app.use("/api/recommendations", authenticateToken, recommendationsRouter);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---- PHASE 4: AUTO-RETRAINING CRON JOB ----
// Runs every Sunday at Midnight (00:00)
cron.schedule("0 0 * * 0", async () => {
  console.log("⏰ [Cron] Triggering weekly ML model retraining...");
  try {
    const ML_SERVICE_URL =
      process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
    const axios = require("axios");

    // Trigger Success model training
    const successRes = await axios.post(`${ML_SERVICE_URL}/train/success`);

    // Trigger Collaborative training
    const cfRes = await axios.post(`${ML_SERVICE_URL}/train/collaborative`);

    console.log("✅ [Cron] ML Models Retrained Successfully:");
    console.log("Success Model:", successRes.data);
    console.log("CF Model:", cfRes.data);
  } catch (err) {
    console.error("❌ [Cron] ML Retraining Failed:", err.message);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// HTTP Server + Socket.IO for WebRTC Signaling
// ─────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// Track which socket is in which room
const roomUsers = {}; // { roomId: Set<socketId> }



// --- Socket.IO Real-time Logic ---
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // User joins a notification channel (existing feature)
  socket.on("user_join", (userId) => {
    socket.join("user_" + userId);
    console.log("👤 User joined notification channel:", userId);
  });

  // Chat: Join an application-specific chat room
  socket.on("chat_join", (appId) => {
    socket.join(`chat_${appId}`);
    console.log(`💬 Socket ${socket.id} joined chat room: chat_${appId}`);
  });

  // WebRTC: Join a signaling room (both interviewer & student join the same roomId)
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    if (!roomUsers[roomId]) roomUsers[roomId] = new Set();
    roomUsers[roomId].add(socket.id);
    // Notify other participants in the room
    socket.to(roomId).emit("user-joined", socket.id);
    console.log(`📹 Socket ${socket.id} joined room ${roomId} (${roomUsers[roomId].size} users)`);
    socket._roomId = roomId; // store for cleanup on disconnect
  });

  // WebRTC: Relay signaling data (offer, answer, ICE candidates)
  socket.on("signal", (data) => {
    // data = { to: socketId, signal: RTCSessionDescription | RTCIceCandidate }
    io.to(data.to).emit("signal", { from: socket.id, signal: data.signal });
  });

  // WebRTC: Screen share status broadcast
  socket.on("screen-share", (data) => {
    // data = { roomId, isSharing }
    socket.to(data.roomId).emit("screen-share-status", {
      from: socket.id,
      isSharing: data.isSharing,
    });
  });

  // PHASE 2: COLLABORATIVE CODING SYNC
  socket.on("code-sync", (data) => {
    // data = { roomId, code }
    socket.to(data.roomId).emit("code-sync", { from: socket.id, code: data.code });
  });

  socket.on("sandbox-toggle", (data) => {
    // data = { roomId, active }
    socket.to(data.roomId).emit("sandbox-toggle", { from: socket.id, active: data.active });
  });

  socket.on("terminal-sync", (data) => {
    // data = { roomId, output }
    socket.to(data.roomId).emit("terminal-sync", { from: socket.id, output: data.output });
  });

  // Cleanup on disconnect
  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
    const roomId = socket._roomId;
    if (roomId && roomUsers[roomId]) {
      roomUsers[roomId].delete(socket.id);
      if (roomUsers[roomId].size === 0) delete roomUsers[roomId];
      socket.to(roomId).emit("user-left", socket.id);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n✅ Server is running: http://localhost:${PORT}`);
  console.log(`📧 Email: ${process.env.EMAIL_USER || "⚠️  Please set EMAIL_USER in .env"}`);
  console.log(`🍃 MongoDB: Connecting...`);
  console.log(`🔌 Socket.IO: WebRTC signaling ready\n`);
});
