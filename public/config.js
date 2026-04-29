// ============================================================
//  config.js — Frontend Settings
//  No API key here — key stays in server .env (OPENROUTER_API_KEY)
// ============================================================

// Use CHATBOT_CONFIG (not CONFIG) so it never clashes with InternPath CONFIG on student/interviewer pages.
const CHATBOT_CONFIG = {
  API_URL: "/api/chat",

  MODEL: "nvidia/nemotron-3-super-120b-a12b:free",

  SYSTEM_PROMPT:
    "You are a helpful and friendly AI assistant. Reply in plain text only.",

  MAX_TOKENS: 1024,
};


