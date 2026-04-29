// ============================================================
//  chatbot-widget.js — Floating AI Chatbot Widget
//  Add this to ANY website with just one line:
//
//  <script src="chatbot-widget.js"></script>
//
//  Make sure your chatbot server.js is running at localhost:3000
//  or update CHATBOT_SERVER_URL below to your server address.
// ============================================================

(function () {
  // ---- CONFIG — change this to your server URL ----
  const CHATBOT_SERVER_URL = "/api/chat";
  const MODEL = "google/gemini-2.0-flash-001";
  const MAX_TOKENS = 1024;
  const SYSTEM_PROMPT =
    "You are a helpful and friendly AI assistant for InternPath, a career and internship platform. Help students with career advice, internship applications, and skill development. Reply in plain text only.";
  const WIDGET_TITLE = "InternPath AI";
  const ACCENT_COLOR = "#10b981";
  // -------------------------------------------------------

  let history = [];
  let isTyping = false;
  let isOpen = false;

  // ============================================================
  //  INJECT STYLES
  // ============================================================
  const style = document.createElement("style");
  style.textContent = `
    #cw-bubble {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      background: ${ACCENT_COLOR};
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      z-index: 99999;
      transition: transform 0.2s, box-shadow 0.2s;
      border: none;
      outline: none;
    }
    #cw-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(0,0,0,0.3);
    }
    #cw-bubble svg {
      width: 26px;
      height: 26px;
      fill: white;
      transition: opacity 0.2s;
    }
    #cw-unread {
      position: absolute;
      top: -3px;
      right: -3px;
      width: 18px;
      height: 18px;
      background: #ef4444;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 600;
      color: white;
      display: none;
      align-items: center;
      justify-content: center;
      font-family: sans-serif;
    }
    #cw-window {
      position: fixed;
      bottom: 92px;
      right: 24px;
      width: 360px;
      height: 520px;
      background: #0d0d0f;
      border-radius: 20px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.4);
      z-index: 99998;
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: 'DM Sans', system-ui, sans-serif;
      border: 1px solid rgba(255,255,255,0.08);
      animation: cw-slide-up 0.25s ease;
    }
    @keyframes cw-slide-up {
      from { opacity: 0; transform: translateY(16px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    #cw-window.open { display: flex; }

    /* Header */
    #cw-header {
      padding: 14px 16px;
      background: #17171a;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    #cw-header-icon {
      width: 32px;
      height: 32px;
      background: ${ACCENT_COLOR};
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    #cw-header-icon svg { width: 16px; height: 16px; fill: white; }
    #cw-header-title { flex: 1; }
    #cw-header-title h3 {
      font-size: 14px;
      font-weight: 600;
      color: #f0eff4;
      margin: 0;
    }
    #cw-header-title p {
      font-size: 11px;
      color: #888897;
      margin: 0;
    }
    #cw-dot {
      width: 6px; height: 6px;
      background: #4ade80;
      border-radius: 50%;
      display: inline-block;
      margin-right: 4px;
      animation: cw-pulse 2s infinite;
    }
    @keyframes cw-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    #cw-close {
      width: 28px; height: 28px;
      background: rgba(255,255,255,0.06);
      border: none;
      border-radius: 7px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888897;
      font-size: 16px;
      line-height: 1;
      transition: background 0.2s;
      flex-shrink: 0;
    }
    #cw-close:hover { background: rgba(255,255,255,0.12); color: #f0eff4; }

    /* Chat messages */
    #cw-chat {
      flex: 1;
      overflow-y: auto;
      padding: 16px 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
      scroll-behavior: smooth;
    }
    #cw-chat::-webkit-scrollbar { width: 3px; }
    #cw-chat::-webkit-scrollbar-thumb { background: #1e1e22; border-radius: 3px; }

    .cw-row {
      display: flex;
      padding: 0 14px;
      animation: cw-fade 0.2s ease;
    }
    @keyframes cw-fade { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
    .cw-row.user { justify-content: flex-end; }
    .cw-row.ai   { justify-content: flex-start; }

    .cw-bubble {
      max-width: 80%;
      padding: 10px 13px;
      border-radius: 16px;
      font-size: 13.5px;
      line-height: 1.6;
      word-break: break-word;
      white-space: pre-wrap;
    }
    .cw-row.user .cw-bubble {
      background: ${ACCENT_COLOR};
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .cw-row.ai .cw-bubble {
      background: #1e1e22;
      border: 1px solid rgba(255,255,255,0.07);
      color: #f0eff4;
      border-bottom-left-radius: 4px;
    }

    /* Typing dots */
    .cw-typing {
      background: #1e1e22;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px;
      border-bottom-left-radius: 4px;
      padding: 12px 14px;
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .cw-dot {
      width: 6px; height: 6px;
      background: #888897;
      border-radius: 50%;
      animation: cw-bounce 1.2s infinite ease-in-out;
    }
    .cw-dot:nth-child(2) { animation-delay: .2s; }
    .cw-dot:nth-child(3) { animation-delay: .4s; }
    @keyframes cw-bounce {
      0%,80%,100%{transform:translateY(0);opacity:.4}
      40%{transform:translateY(-4px);opacity:1}
    }

    /* Input */
    #cw-input-wrap {
      padding: 12px 14px;
      border-top: 1px solid rgba(255,255,255,0.07);
      background: #17171a;
      flex-shrink: 0;
    }
    #cw-input-inner {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      background: #1e1e22;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      padding: 8px 10px;
      transition: border-color 0.2s;
    }
    #cw-input-inner:focus-within { border-color: ${ACCENT_COLOR}; }
    #cw-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #f0eff4;
      font-family: inherit;
      font-size: 13.5px;
      resize: none;
      max-height: 80px;
      line-height: 1.5;
      padding: 2px 0;
    }
    #cw-input::placeholder { color: #888897; }
    #cw-send {
      width: 32px; height: 32px;
      background: ${ACCENT_COLOR};
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.2s, transform 0.1s;
    }
    #cw-send:hover  { opacity: 0.85; }
    #cw-send:active { transform: scale(0.92); }
    #cw-send:disabled { opacity: 0.3; cursor: not-allowed; }
    #cw-send svg { width: 14px; height: 14px; fill: white; }

    /* Welcome message */
    #cw-welcome {
      padding: 20px 14px 8px;
      text-align: center;
      color: #888897;
      font-size: 12px;
      line-height: 1.6;
    }

    @media (max-width: 420px) {
      #cw-window {
        width: calc(100vw - 16px);
        right: 8px;
        bottom: 80px;
        height: 70vh;
      }
    }
  `;
  document.head.appendChild(style);

  // ============================================================
  //  BUILD HTML
  // ============================================================
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <!-- Floating bubble button -->
    <button id="cw-bubble" title="Chat with AI">
      <svg id="cw-icon-open" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
      <svg id="cw-icon-close" viewBox="0 0 24 24" style="display:none"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      <span id="cw-unread">1</span>
    </button>

    <!-- Chat window -->
    <div id="cw-window">
      <div id="cw-header">
        <div id="cw-header-icon">
          <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </div>
        <div id="cw-header-title">
          <h3>${WIDGET_TITLE}</h3>
          <p><span id="cw-dot"></span>Online · Free AI</p>
        </div>
        <button id="cw-close">✕</button>
      </div>

      <div id="cw-chat">
        <div id="cw-welcome">
          👋 Hi! I am your AI assistant.<br/>Ask me anything!
        </div>
      </div>

      <div id="cw-input-wrap">
        <div id="cw-input-inner">
          <textarea id="cw-input" placeholder="Type a message..." rows="1"></textarea>
          <button id="cw-send">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);

  // ============================================================
  //  ELEMENTS
  // ============================================================
  const bubble = document.getElementById("cw-bubble");
  const chatWin = document.getElementById("cw-window");
  const chatEl = document.getElementById("cw-chat");
  const inputEl = document.getElementById("cw-input");
  const sendBtn = document.getElementById("cw-send");
  const closeBtn = document.getElementById("cw-close");
  const unread = document.getElementById("cw-unread");
  const iconOpen = document.getElementById("cw-icon-open");
  const iconClose = document.getElementById("cw-icon-close");

  // Show unread badge on load after 2 seconds
  setTimeout(() => {
    if (!isOpen) {
      unread.style.display = "flex";
    }
  }, 2000);

  // ============================================================
  //  TOGGLE CHAT WINDOW
  // ============================================================
  function toggleChat() {
    isOpen = !isOpen;
    chatWin.classList.toggle("open", isOpen);
    iconOpen.style.display = isOpen ? "none" : "block";
    iconClose.style.display = isOpen ? "block" : "none";
    unread.style.display = "none";
    if (isOpen) inputEl.focus();
  }

  bubble.addEventListener("click", toggleChat);
  closeBtn.addEventListener("click", toggleChat);

  // ============================================================
  //  SEND MESSAGE
  // ============================================================
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isTyping) return;

    inputEl.value = "";
    inputEl.style.height = "auto";
    isTyping = true;
    sendBtn.disabled = true;

    // Hide welcome text on first message
    const welcome = document.getElementById("cw-welcome");
    if (welcome) welcome.style.display = "none";

    addBubble("user", text);
    history.push({ role: "user", content: text });
    showTyping();

    try {
      const reply = await callServer(text);
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

  sendBtn.addEventListener("click", sendMessage);

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 80) + "px";
  });

  // ============================================================
  //  CALL BACKEND SERVER
  // ============================================================
  async function callServer() {
    const res = await fetch(CHATBOT_SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: history,
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system_prompt: SYSTEM_PROMPT,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "Server error");
    return data.reply;
  }

  // ============================================================
  //  UI HELPERS
  // ============================================================
  function addBubble(role, text) {
    const row = document.createElement("div");
    row.className = "cw-row " + role;
    const bubble = document.createElement("div");
    bubble.className = "cw-bubble";
    bubble.textContent = text;
    row.appendChild(bubble);
    chatEl.appendChild(row);
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  function showTyping() {
    const row = document.createElement("div");
    row.className = "cw-row ai";
    row.id = "cw-typing";
    const bubble = document.createElement("div");
    bubble.className = "cw-typing";
    bubble.innerHTML =
      "<div class='cw-dot'></div><div class='cw-dot'></div><div class='cw-dot'></div>";
    row.appendChild(bubble);
    chatEl.appendChild(row);
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  function removeTyping() {
    const r = document.getElementById("cw-typing");
    if (r) r.remove();
  }
})();
