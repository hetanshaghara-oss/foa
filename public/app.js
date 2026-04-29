// ============================================================
//  app.js — Chatbot Frontend Logic
//  POST /api/chat — server calls OpenRouter (key never in browser)
// ============================================================

const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const welcomeEl = document.getElementById("welcome");

let history = [];
let isTyping = false;

function init() {
  if (!chatEl || !inputEl || !sendBtn) return;

  const short = CHATBOT_CONFIG.MODEL.split("/").pop().replace(":free", " (free)");
  const badge = document.getElementById("model-label");
  if (badge) badge.textContent = short;

  sendBtn.disabled = false;

  document.querySelectorAll(".suggestion-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      inputEl.value = btn.textContent.trim();
      sendMessage();
    });
  });

  sendBtn.addEventListener("click", sendMessage);

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isTyping) sendMessage();
    }
  });

  inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + "px";
  });
}

async function sendMessage() {
  if (!inputEl || !sendBtn || !chatEl) return;

  const text = inputEl.value.trim();
  if (!text || isTyping) return;

  inputEl.value = "";
  inputEl.style.height = "auto";
  isTyping = true;
  sendBtn.disabled = true;

  if (welcomeEl) welcomeEl.style.display = "none";

  addBubble("user", text);
  history.push({ role: "user", content: text });
  showTyping();

  try {
    const reply = await callServer();
    removeTyping();
    addBubble("ai", reply);
    history.push({ role: "assistant", content: reply });
  } catch (err) {
    removeTyping();
    addBubble("ai", "❌ " + err.message);
  }

  isTyping = false;
  sendBtn.disabled = false;
  inputEl.focus();
}

async function callServer() {
  const res = await fetch(CHATBOT_CONFIG.API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: history,
      model: CHATBOT_CONFIG.MODEL,
      max_tokens: CHATBOT_CONFIG.MAX_TOKENS,
      system_prompt: CHATBOT_CONFIG.SYSTEM_PROMPT,
    }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Server error " + res.status);
  }

  if (!res.ok || data.error) {
    throw new Error(data.error || "Server error " + res.status);
  }

  return data.reply;
}

function addBubble(role, text) {
  const row = document.createElement("div");
  row.className = "message-row " + role;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  row.appendChild(bubble);
  chatEl.appendChild(row);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function showTyping() {
  const row = document.createElement("div");
  row.className = "message-row ai";
  row.id = "typing-row";
  const bubble = document.createElement("div");
  bubble.className = "typing-bubble";
  bubble.innerHTML =
    "<div class='dot'></div><div class='dot'></div><div class='dot'></div>";
  row.appendChild(bubble);
  chatEl.appendChild(row);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function removeTyping() {
  const r = document.getElementById("typing-row");
  if (r) r.remove();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
