/**
 * Charity Swipes Live Chat Widget
 * Self-contained: CSS + HTML + JS in one file
 * Sends messages to Convex /contact-form endpoint
 * Persists conversation in localStorage
 */
(function () {
  'use strict';

  const CONVEX_URL = 'https://moonlit-caterpillar-429.convex.site/contact-form';
  const STORAGE_KEY = 'cs_chat';
  const BRAND = 'Charity Swipes';

  // ─── Inject CSS ───
  const style = document.createElement('style');
  style.textContent = `
    /* Chat Widget — Subtle & Non-Intrusive */
    #cs-chat-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(233, 30, 99, 0.75);
      border: none;
      cursor: pointer;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.25);
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
      opacity: 0.7;
    }
    #cs-chat-btn:hover {
      opacity: 1;
      transform: scale(1.05);
      background: rgba(233, 30, 99, 0.95);
      box-shadow: 0 4px 20px rgba(233,30,99,0.3);
    }
    #cs-chat-btn svg { width: 22px; height: 22px; fill: #fff; transition: all 0.3s ease; }
    #cs-chat-btn.open svg.icon-chat { display: none; }
    #cs-chat-btn:not(.open) svg.icon-close { display: none; }

    #cs-chat-panel {
      position: fixed;
      bottom: 84px;
      right: 24px;
      width: 360px;
      max-height: 480px;
      background: #0E0E22;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      z-index: 99998;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      opacity: 0;
      transform: translateY(12px) scale(0.97);
      pointer-events: none;
      transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
    }
    #cs-chat-panel.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    /* Header */
    .cs-chat-header {
      background: linear-gradient(135deg, #1A0A2E 0%, #12122A 100%);
      padding: 16px 18px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cs-chat-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #E91E63, #FF5C8D);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .cs-chat-avatar svg { width: 18px; height: 18px; fill: #fff; }
    .cs-chat-header-text h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      font-family: 'Space Grotesk', 'Inter', sans-serif;
    }
    .cs-chat-header-text p {
      margin: 2px 0 0;
      font-size: 11px;
      color: #A0A0C0;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .cs-chat-header-text .online-dot {
      width: 6px;
      height: 6px;
      background: #4CAF50;
      border-radius: 50%;
      display: inline-block;
    }

    /* Messages */
    .cs-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 180px;
      max-height: 280px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.08) transparent;
    }
    .cs-chat-messages::-webkit-scrollbar { width: 4px; }
    .cs-chat-messages::-webkit-scrollbar-track { background: transparent; }
    .cs-chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

    .cs-msg {
      max-width: 82%;
      padding: 9px 13px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.5;
      font-family: 'Inter', -apple-system, sans-serif;
      animation: cs-msg-in 0.25s ease;
    }
    @keyframes cs-msg-in {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .cs-msg.bot {
      background: rgba(255,255,255,0.06);
      color: #D0D0E8;
      border-bottom-left-radius: 4px;
      align-self: flex-start;
    }
    .cs-msg.user {
      background: linear-gradient(135deg, #E91E63, #AD1457);
      color: #fff;
      border-bottom-right-radius: 4px;
      align-self: flex-end;
    }
    .cs-msg .ts {
      font-size: 10px;
      color: rgba(255,255,255,0.25);
      margin-top: 3px;
      display: block;
    }

    /* Typing indicator */
    .cs-typing {
      display: flex;
      gap: 4px;
      padding: 10px 14px;
      align-self: flex-start;
    }
    .cs-typing span {
      width: 6px;
      height: 6px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      animation: cs-bounce 1.4s ease-in-out infinite;
    }
    .cs-typing span:nth-child(2) { animation-delay: 0.2s; }
    .cs-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes cs-bounce {
      0%,60%,100% { transform: translateY(0); }
      30% { transform: translateY(-5px); }
    }

    /* Input area */
    .cs-chat-input {
      padding: 12px 14px;
      border-top: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02);
    }
    .cs-chat-input form {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .cs-chat-input input {
      flex: 1;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 9px 12px;
      color: #fff;
      font-size: 13px;
      font-family: 'Inter', sans-serif;
      outline: none;
      transition: border 0.2s ease;
    }
    .cs-chat-input input:focus {
      border-color: rgba(233,30,99,0.3);
    }
    .cs-chat-input input::placeholder {
      color: rgba(255,255,255,0.25);
    }
    .cs-chat-input button[type="submit"] {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #E91E63, #FF5C8D);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .cs-chat-input button[type="submit"]:hover {
      transform: scale(1.05);
    }
    .cs-chat-input button[type="submit"]:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      transform: none;
    }
    .cs-chat-input button svg { width: 16px; height: 16px; fill: #fff; }

    /* Intro form */
    .cs-intro-form {
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .cs-intro-form label {
      font-size: 11px;
      font-weight: 600;
      color: #A0A0C0;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: -2px;
    }
    .cs-intro-form input {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      padding: 9px 12px;
      color: #fff;
      font-size: 13px;
      font-family: 'Inter', sans-serif;
      outline: none;
      transition: border 0.2s ease;
    }
    .cs-intro-form input:focus { border-color: rgba(233,30,99,0.3); }
    .cs-intro-form input::placeholder { color: rgba(255,255,255,0.25); }
    .cs-intro-form button {
      margin-top: 4px;
      padding: 10px;
      border-radius: 10px;
      background: linear-gradient(135deg, #E91E63, #FF5C8D);
      border: none;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'Inter', sans-serif;
    }
    .cs-intro-form button:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 12px rgba(233,30,99,0.25);
    }

    .cs-powered {
      text-align: center;
      padding: 6px;
      font-size: 10px;
      color: rgba(255,255,255,0.15);
    }

    /* Mobile */
    @media (max-width: 480px) {
      #cs-chat-panel {
        right: 10px;
        left: 10px;
        bottom: 84px;
        width: auto;
        max-height: 70vh;
        border-radius: 16px;
      }
      #cs-chat-btn { bottom: 18px; right: 18px; width: 46px; height: 46px; }
    }
  `;
  document.head.appendChild(style);

  // ─── State ───
  let state = loadState();

  function loadState() {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        name: s.name || '',
        email: s.email || '',
        introduced: !!s.introduced,
        messages: Array.isArray(s.messages) ? s.messages : [],
      };
    } catch {
      return { name: '', email: '', introduced: false, messages: [] };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* quota exceeded */ }
  }

  // ─── Build DOM ───
  const btn = document.createElement('button');
  btn.id = 'cs-chat-btn';
  btn.setAttribute('aria-label', 'Open chat');
  btn.innerHTML = `
    <svg class="icon-chat" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>
    <svg class="icon-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
  `;
  document.body.appendChild(btn);

  const panel = document.createElement('div');
  panel.id = 'cs-chat-panel';
  panel.innerHTML = `
    <div class="cs-chat-header">
      <div class="cs-chat-avatar">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
      </div>
      <div class="cs-chat-header-text">
        <h4>${BRAND}</h4>
        <p><span class="online-dot"></span> We typically reply within minutes</p>
      </div>
    </div>
    <div class="cs-chat-messages" id="cs-messages"></div>
    <div id="cs-input-area"></div>
    <div class="cs-powered">${BRAND}</div>
  `;
  document.body.appendChild(panel);

  const messagesEl = document.getElementById('cs-messages');
  const inputArea = document.getElementById('cs-input-area');

  // ─── Toggle ───
  let isOpen = false;
  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    btn.classList.toggle('open', isOpen);
    panel.classList.toggle('open', isOpen);
    if (isOpen) {
      renderChat();
      scrollToBottom();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (isOpen && !panel.contains(e.target) && !btn.contains(e.target)) {
      isOpen = false;
      btn.classList.remove('open');
      panel.classList.remove('open');
    }
  });

  // ─── Render ───
  function renderChat() {
    messagesEl.innerHTML = '';
    if (!state.introduced) {
      addBotMessage("Hi there! 👋 How can we help you today? Drop your name and email to get started.", false);
      renderIntroForm();
    } else {
      if (state.messages.length === 0) {
        addBotMessage(`Hey ${state.name}! How can we help you today?`, false);
      } else {
        state.messages.forEach(m => {
          addMessageBubble(m.role, m.text, m.time);
        });
      }
      renderMessageInput();
    }
  }

  function addBotMessage(text, save) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    addMessageBubble('bot', text, time);
    if (save) {
      state.messages.push({ role: 'bot', text, time });
      saveState();
    }
  }

  function addUserMessage(text) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    addMessageBubble('user', text, time);
    state.messages.push({ role: 'user', text, time });
    saveState();
  }

  function addMessageBubble(role, text, time) {
    const div = document.createElement('div');
    div.className = `cs-msg ${role}`;
    div.innerHTML = `${escapeHTML(text)}<span class="ts">${time || ''}</span>`;
    messagesEl.appendChild(div);
  }

  function showTyping() {
    const t = document.createElement('div');
    t.className = 'cs-typing';
    t.id = 'cs-typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(t);
    scrollToBottom();
  }

  function hideTyping() {
    const t = document.getElementById('cs-typing');
    if (t) t.remove();
  }

  function scrollToBottom() {
    setTimeout(() => { messagesEl.scrollTop = messagesEl.scrollHeight; }, 50);
  }

  // ─── Intro Form ───
  function renderIntroForm() {
    inputArea.innerHTML = `
      <div class="cs-intro-form">
        <label>Your Name</label>
        <input type="text" id="cs-name" placeholder="John Doe" required>
        <label>Email Address</label>
        <input type="email" id="cs-email" placeholder="john@business.com" required>
        <button id="cs-intro-btn">Start Chat →</button>
      </div>
    `;
    document.getElementById('cs-intro-btn').addEventListener('click', handleIntro);
    inputArea.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleIntro(); });
    });
  }

  function handleIntro() {
    const name = document.getElementById('cs-name').value.trim();
    const email = document.getElementById('cs-email').value.trim();
    if (!name || !email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('cs-email').style.borderColor = '#E91E63';
      return;
    }
    state.name = name;
    state.email = email;
    state.introduced = true;
    state.messages = [];
    saveState();
    renderChat();
    scrollToBottom();
  }

  // ─── Message Input ───
  function renderMessageInput() {
    inputArea.innerHTML = `
      <div class="cs-chat-input">
        <form id="cs-msg-form">
          <input type="text" id="cs-msg-input" placeholder="Type a message..." autocomplete="off">
          <button type="submit" id="cs-send-btn" aria-label="Send">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </form>
      </div>
    `;
    const form = document.getElementById('cs-msg-form');
    const input = document.getElementById('cs-msg-input');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSend(input);
    });
    input.focus();
  }

  async function handleSend(input) {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    addUserMessage(text);
    scrollToBottom();

    const sendBtn = document.getElementById('cs-send-btn');
    sendBtn.disabled = true;

    const fullMessage = state.messages
      .filter(m => m.role === 'user')
      .map(m => m.text)
      .join('\n---\n');

    try {
      const resp = await fetch(CONVEX_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.name,
          email: state.email,
          service: 'Live Chat',
          message: '[Live Chat] ' + fullMessage,
        }),
      });

      showTyping();
      await delay(800 + Math.random() * 600);
      hideTyping();

      if (resp.ok) {
        const userMsgCount = state.messages.filter(m => m.role === 'user').length;
        let reply;
        if (userMsgCount === 1) {
          reply = `Thanks ${state.name}! A team member will be with you shortly. Feel free to share more details in the meantime.`;
        } else {
          reply = `Got it — we've noted that. We'll follow up with you at ${state.email} if we can't connect here.`;
        }
        addBotMessage(reply, true);
      } else {
        addBotMessage("Sorry, something went wrong. Please try again or call us at (800) 652-3434.", true);
      }
    } catch (err) {
      hideTyping();
      addBotMessage("Connection issue — please try again in a moment.", true);
    }

    sendBtn.disabled = false;
    document.getElementById('cs-msg-input')?.focus();
    scrollToBottom();
  }

  // ─── Utilities ───
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

})();
