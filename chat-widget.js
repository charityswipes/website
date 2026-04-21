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
    /* Chat Widget Styles */
    #cs-chat-btn {
      position: fixed;
      bottom: 28px;
      right: 28px;
      width: 62px;
      height: 62px;
      border-radius: 50%;
      background: linear-gradient(135deg, #E91E63 0%, #FF5C8D 100%);
      border: none;
      cursor: pointer;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px rgba(233,30,99,0.4);
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    #cs-chat-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 32px rgba(233,30,99,0.55);
    }
    #cs-chat-btn svg { width: 28px; height: 28px; fill: #fff; transition: all 0.3s ease; }
    #cs-chat-btn.open svg.icon-chat { display: none; }
    #cs-chat-btn:not(.open) svg.icon-close { display: none; }

    #cs-chat-btn .badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 18px;
      height: 18px;
      background: #00E5FF;
      border-radius: 50%;
      border: 2px solid #0A0A1A;
      animation: cs-pulse 2s ease-in-out infinite;
    }
    #cs-chat-btn.open .badge { display: none; }

    @keyframes cs-pulse {
      0%,100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.7; }
    }

    #cs-chat-panel {
      position: fixed;
      bottom: 100px;
      right: 28px;
      width: 380px;
      max-height: 540px;
      background: #0E0E22;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      z-index: 99998;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 12px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(233,30,99,0.1);
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    #cs-chat-panel.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    /* Header */
    .cs-chat-header {
      background: linear-gradient(135deg, #1A0A2E 0%, #12122A 100%);
      padding: 20px 22px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .cs-chat-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #E91E63, #FF5C8D);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .cs-chat-avatar svg { width: 22px; height: 22px; fill: #fff; }
    .cs-chat-header-text h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      font-family: 'Space Grotesk', 'Inter', sans-serif;
    }
    .cs-chat-header-text p {
      margin: 2px 0 0;
      font-size: 12px;
      color: #A0A0C0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .cs-chat-header-text .online-dot {
      width: 7px;
      height: 7px;
      background: #4CAF50;
      border-radius: 50%;
      display: inline-block;
    }

    /* Messages */
    .cs-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 18px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 200px;
      max-height: 320px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.1) transparent;
    }
    .cs-chat-messages::-webkit-scrollbar { width: 5px; }
    .cs-chat-messages::-webkit-scrollbar-track { background: transparent; }
    .cs-chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

    .cs-msg {
      max-width: 82%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 13.5px;
      line-height: 1.55;
      font-family: 'Inter', -apple-system, sans-serif;
      animation: cs-msg-in 0.3s ease;
    }
    @keyframes cs-msg-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .cs-msg.bot {
      background: rgba(255,255,255,0.06);
      color: #E0E0F0;
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
      color: rgba(255,255,255,0.35);
      margin-top: 4px;
      display: block;
    }

    /* Typing indicator */
    .cs-typing {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      align-self: flex-start;
    }
    .cs-typing span {
      width: 7px;
      height: 7px;
      background: rgba(255,255,255,0.25);
      border-radius: 50%;
      animation: cs-bounce 1.4s ease-in-out infinite;
    }
    .cs-typing span:nth-child(2) { animation-delay: 0.2s; }
    .cs-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes cs-bounce {
      0%,60%,100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    /* Input area */
    .cs-chat-input {
      padding: 14px 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02);
    }
    .cs-chat-input form {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .cs-chat-input input,
    .cs-chat-input textarea {
      flex: 1;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 10px 14px;
      color: #fff;
      font-size: 13.5px;
      font-family: 'Inter', sans-serif;
      outline: none;
      transition: border 0.2s ease;
      resize: none;
    }
    .cs-chat-input input:focus,
    .cs-chat-input textarea:focus {
      border-color: rgba(233,30,99,0.4);
    }
    .cs-chat-input input::placeholder,
    .cs-chat-input textarea::placeholder {
      color: rgba(255,255,255,0.3);
    }
    .cs-chat-input button[type="submit"] {
      width: 40px;
      height: 40px;
      border-radius: 12px;
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
      box-shadow: 0 2px 12px rgba(233,30,99,0.4);
    }
    .cs-chat-input button[type="submit"]:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none;
    }
    .cs-chat-input button svg { width: 18px; height: 18px; fill: #fff; }

    /* Intro form */
    .cs-intro-form {
      padding: 20px 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .cs-intro-form label {
      font-size: 12px;
      font-weight: 600;
      color: #A0A0C0;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: -4px;
    }
    .cs-intro-form input {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 10px 14px;
      color: #fff;
      font-size: 13.5px;
      font-family: 'Inter', sans-serif;
      outline: none;
      transition: border 0.2s ease;
    }
    .cs-intro-form input:focus { border-color: rgba(233,30,99,0.4); }
    .cs-intro-form input::placeholder { color: rgba(255,255,255,0.3); }
    .cs-intro-form button {
      margin-top: 6px;
      padding: 11px;
      border-radius: 12px;
      background: linear-gradient(135deg, #E91E63 0%, #FF5C8D 50%, #00E5FF 100%);
      border: none;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'Inter', sans-serif;
    }
    .cs-intro-form button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(233,30,99,0.3);
    }

    .cs-powered {
      text-align: center;
      padding: 8px;
      font-size: 10px;
      color: rgba(255,255,255,0.2);
    }

    /* Mobile */
    @media (max-width: 480px) {
      #cs-chat-panel {
        right: 0;
        bottom: 0;
        left: 0;
        width: 100%;
        max-height: 100vh;
        border-radius: 20px 20px 0 0;
      }
      #cs-chat-btn { bottom: 20px; right: 20px; }
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
  btn.setAttribute('aria-label', 'Open live chat');
  btn.innerHTML = `
    <div class="badge"></div>
    <svg class="icon-chat" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/><path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z"/></svg>
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
    <div class="cs-powered">Charity Swipes &mdash; Processing that gives back</div>
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

  // ─── Render ───
  function renderChat() {
    // Render messages
    messagesEl.innerHTML = '';
    if (!state.introduced) {
      addBotMessage("Hi there! 👋 Welcome to Charity Swipes. I'd love to help you out. What's your name and email so we can get started?", false);
      renderIntroForm();
    } else {
      if (state.messages.length === 0) {
        addBotMessage(`Hey ${state.name}! 👋 How can we help you today?`, false);
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
    // Allow Enter key
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
          <input type="text" id="cs-msg-input" placeholder="Type your message..." autocomplete="off">
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

    // Disable input while sending
    const sendBtn = document.getElementById('cs-send-btn');
    sendBtn.disabled = true;

    // Build the full conversation for context
    const fullMessage = state.messages
      .filter(m => m.role === 'user')
      .map(m => m.text)
      .join('\n---\n');

    // Send to Convex
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
      await delay(1200 + Math.random() * 800);
      hideTyping();

      if (resp.ok) {
        // Auto-reply based on message count
        const userMsgCount = state.messages.filter(m => m.role === 'user').length;
        let reply;
        if (userMsgCount === 1) {
          reply = `Thanks ${state.name}! We've received your message and a team member will be with you shortly. In the meantime, feel free to share more details about what you're looking for.`;
        } else {
          reply = `Got it! We've updated your conversation. A team member will follow up with you at ${state.email} if we can't connect here.`;
        }
        addBotMessage(reply, true);
      } else {
        addBotMessage("Sorry, something went wrong. Please try again or email us directly at support@charityswipes.com.", true);
      }
    } catch (err) {
      hideTyping();
      addBotMessage("Looks like we're having connection issues. Please try again in a moment!", true);
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

  // ─── Auto-open after delay on first visit ───
  if (!state.introduced) {
    setTimeout(() => {
      if (!isOpen) {
        // Subtle nudge — don't auto-open, just show the badge is pulsing
      }
    }, 5000);
  }

  // ─── Remove badge after first open ───
  btn.addEventListener('click', () => {
    const badge = btn.querySelector('.badge');
    if (badge) setTimeout(() => badge.remove(), 300);
  }, { once: true });

})();
