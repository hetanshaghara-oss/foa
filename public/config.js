// ============================================================
//  config.js — Frontend Settings
//  No API key here — key stays in server .env (OPENROUTER_API_KEY)
// ============================================================

// Use CHATBOT_CONFIG (not CONFIG) so it never clashes with InternPath CONFIG on student/interviewer pages.
const CHATBOT_CONFIG = {
  API_URL: "/api/chat",

  MODEL: "google/gemini-2.0-flash-001",
  SYSTEM_PROMPT:
    "You are a helpful and friendly AI assistant for InternPath. Help students with career guidance and technical questions. Reply in plain text only.",

  MAX_TOKENS: 1024,
};


