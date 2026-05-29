/* ================================================================
   EXAM BANK PORTAL X — FEATURES MODULE
   - Login gate with "Continue as Guest" + session timeout
   - Quiz launches over dashboard (no exit needed)
   - Coins system (100%=50, 90%=45, 80%=40 coins)
   - Market / shop
   - Teams with team leaderboard
   - Player profile pages (friend requests, team invites)
   - Top-5 banner badge
================================================================ */

(function() {
  "use strict";

  /* ── CONFIG ─────────────────────────────────────────────────── */
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min idle
  const FB_CONFIG = {
    apiKey: "AIzaSyCO_lCaHej5QUNyDpzV84Y2DfIG87zOl-s",
    authDomain: "exam-bank-grade-8.firebaseapp.com",
    projectId: "exam-bank-grade-8",
    storageBucket: "exam-bank-grade-8.appspot.com",
    messagingSenderId: "429310662726",
    appId: "1:429310662726:web:33932a1b13bda4e5efd247",
    databaseURL: "https://exam-bank-grade-8-default-rtdb.firebaseio.com/"
  };

  /* ── WAIT FOR FIREBASE ──────────────────────────────────────── */
  function waitForFirebase(cb) {
    if (window.firebase && window.auth && window.database && window.firestore) {
      cb();
    } else {
      setTimeout(() => waitForFirebase(cb), 80);
    }
  }

  /* ── INJECT CSS ─────────────────────────────────────────────── */
  function injectCSS() {
    const style = document.createElement("style");
    style.textContent = `
      /* ── LOGIN GATE ── */
      #loginGate {
        position: fixed; inset: 0; z-index: 9999;
        background: radial-gradient(circle at 20% 20%, rgba(96,165,250,0.18), transparent 40%),
                    radial-gradient(circle at 80% 80%, rgba(124,240,194,0.15), transparent 40%),
                    linear-gradient(135deg, #08111f, #11182b 50%, #1c2b4a);
        display: flex; align-items: center; justify-content: center;
        flex-direction: column; gap: 0; padding: 1rem;
        font-family: "Manrope", sans-serif;
      }
      #loginGate.hidden { display: none !important; }
      .lg-card {
        background: rgba(255,255,255,0.07);
        backdrop-filter: blur(24px);
        border: 1px solid rgba(255,255,255,0.13);
        border-radius: 28px;
        padding: clamp(1.5rem, 5vw, 3rem);
        width: 100%; max-width: 420px;
        box-shadow: 0 24px 80px rgba(0,0,0,0.4);
        animation: lgFadeIn 0.5s ease;
      }
      @keyframes lgFadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      .lg-logo { font-size: 2.8rem; font-weight: 900; font-family: "Space Grotesk", sans-serif;
        background: linear-gradient(90deg, #60a5fa, #7cf0c2, #ffb1cb);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        margin-bottom: 0.25rem; }
      .lg-sub { color: rgba(226,232,240,0.7); font-size: 0.95rem; margin-bottom: 2rem; }
      .lg-google-btn {
        width: 100%; padding: 0.9rem 1.5rem; border-radius: 16px; border: none; cursor: pointer;
        background: white; color: #111; font-weight: 700; font-size: 1rem;
        display: flex; align-items: center; justify-content: center; gap: 10px;
        transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        margin-bottom: 1rem;
      }
      .lg-google-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
      .lg-divider { display: flex; align-items: center; gap: 1rem; margin: 1.2rem 0; color: rgba(255,255,255,0.3); font-size: 0.85rem; }
      .lg-divider::before, .lg-divider::after { content:''; flex:1; height:1px; background:rgba(255,255,255,0.1); }
      .lg-field { width:100%; padding:0.8rem 1rem; border-radius:12px; border:1px solid rgba(255,255,255,0.15);
        background:rgba(0,0,0,0.3); color:white; font-size:0.95rem; margin-bottom:0.75rem; outline:none; }
      .lg-field:focus { border-color:#60a5fa; }
      .lg-row { display:flex; gap:0.6rem; margin-bottom:0.75rem; }
      .lg-btn { flex:1; padding:0.8rem; border-radius:12px; border:none; font-weight:700; font-size:0.9rem;
        cursor:pointer; transition:all 0.2s; }
      .lg-btn-primary { background:#60a5fa; color:#000; }
      .lg-btn-secondary { background:#10b981; color:#000; }
      .lg-btn:hover { opacity:0.88; transform:translateY(-1px); }
      .lg-guest-btn { width:100%; padding:0.7rem; border-radius:12px; border:1px solid rgba(255,255,255,0.15);
        background:transparent; color:rgba(255,255,255,0.6); font-size:0.9rem; cursor:pointer; transition:all 0.2s; }
      .lg-guest-btn:hover { background:rgba(255,255,255,0.06); color:white; }
      .lg-err { color:#f87171; font-size:0.85rem; margin-bottom:0.5rem; min-height:1.2rem; }

      /* ── TOP-5 BANNER ── */
      .top5-banner {
        background: linear-gradient(90deg, #f59e0b, #ef4444, #a855f7, #3b82f6);
        background-size: 300% 100%; animation: top5Shimmer 3s linear infinite;
        border-radius: 12px; padding: 0.4rem 1rem; font-weight: 900; font-size: 0.82rem;
        color: white; display: inline-flex; align-items: center; gap: 6px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3); letter-spacing: 0.04em;
        box-shadow: 0 0 20px rgba(245,158,11,0.5);
      }
      @keyframes top5Shimmer { 0%{background-position:0%} 100%{background-position:300%} }

      /* ── COINS ── */
      .coins-display {
        display: inline-flex; align-items: center; gap: 6px;
        background: rgba(255,213,42,0.15); border: 1px solid rgba(255,213,42,0.3);
        border-radius: 999px; padding: 4px 12px; font-weight: 800; color: #ffd12a;
        font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
      }
      .coins-display:hover { background:rgba(255,213,42,0.25); }

      /* ── MARKET MODAL ── */
      #marketModal {
        position:fixed; inset:0; z-index:8000; background:rgba(0,0,0,0.75);
        display:none; align-items:center; justify-content:center; padding:1rem;
      }
      #marketModal.open { display:flex; }
      .market-shell {
        background: radial-gradient(circle at 10% 10%, rgba(255,213,42,0.12), transparent 50%),
                    linear-gradient(135deg, #0d1a2e, #131f35);
        border: 1px solid rgba(255,213,42,0.2); border-radius: 28px;
        width:100%; max-width:680px; max-height:88vh; overflow-y:auto;
        padding: clamp(1.2rem, 4vw, 2.5rem); box-shadow: 0 30px 80px rgba(0,0,0,0.5);
        animation: lgFadeIn 0.3s ease;
      }
      .market-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:1rem; margin-top:1.5rem; }
      .market-item {
        background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
        border-radius:18px; padding:1.2rem; text-align:center; cursor:pointer;
        transition:all 0.25s;
      }
      .market-item:hover { transform:translateY(-4px); background:rgba(255,255,255,0.1); border-color:rgba(255,213,42,0.4); }
      .market-item.owned { border-color:rgba(124,240,194,0.5); background:rgba(124,240,194,0.07); }
      .market-item.equipped { border-color:#7cf0c2; box-shadow:0 0 14px rgba(124,240,194,0.3); }
      .market-emoji { font-size:2.5rem; display:block; margin-bottom:0.5rem; }
      .market-name { font-weight:800; font-size:0.9rem; margin-bottom:0.3rem; }
      .market-price { color:#ffd12a; font-weight:700; font-size:0.85rem; }
      .market-owned-label { color:#7cf0c2; font-size:0.8rem; font-weight:700; }

      /* ── TEAMS MODAL ── */
      #teamsModal {
        position:fixed; inset:0; z-index:8000; background:rgba(0,0,0,0.75);
        display:none; align-items:flex-start; justify-content:center; padding:1rem; overflow-y:auto;
      }
      #teamsModal.open { display:flex; }
      .teams-shell {
        background: radial-gradient(circle at 90% 10%, rgba(96,165,250,0.15), transparent 50%),
                    linear-gradient(135deg, #0d1a2e, #131f35);
        border:1px solid rgba(96,165,250,0.2); border-radius:28px;
        width:100%; max-width:700px; margin:auto;
        padding:clamp(1.2rem,4vw,2.5rem); box-shadow:0 30px 80px rgba(0,0,0,0.5);
        animation:lgFadeIn 0.3s ease;
      }
      .team-card {
        background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
        border-radius:18px; padding:1.25rem; margin-bottom:0.75rem; transition:all 0.2s;
      }
      .team-card:hover { background:rgba(255,255,255,0.09); }
      .team-card.my-team { border-color:rgba(96,165,250,0.5); }
      .team-leaderboard-row {
        display:flex; align-items:center; gap:0.75rem; padding:0.75rem;
        border-radius:14px; background:rgba(255,255,255,0.04); margin-bottom:0.5rem;
        transition:background 0.2s;
      }
      .team-leaderboard-row:hover { background:rgba(255,255,255,0.08); }

      /* ── PROFILE PAGE ── */
      #profilePageModal {
        position:fixed; inset:0; z-index:8100; background:rgba(0,0,0,0.8);
        display:none; align-items:flex-start; justify-content:center;
        padding:1rem; overflow-y:auto;
      }
      #profilePageModal.open { display:flex; }
      .profile-page-shell {
        background: radial-gradient(circle at 20% 0%, rgba(124,240,194,0.12), transparent 40%),
                    linear-gradient(160deg, #0a1628, #111c34);
        border:1px solid rgba(255,255,255,0.12); border-radius:28px;
        width:100%; max-width:600px; margin:auto;
        padding:clamp(1.2rem,4vw,2.5rem); box-shadow:0 30px 80px rgba(0,0,0,0.5);
        animation:lgFadeIn 0.3s ease;
      }
      .profile-avatar-lg {
        width:100px; height:100px; border-radius:50%; object-fit:cover;
        border:3px solid rgba(255,255,255,0.2); display:block;
      }
      .profile-action-btn {
        padding:0.6rem 1.2rem; border-radius:12px; border:none; font-weight:700;
        font-size:0.88rem; cursor:pointer; transition:all 0.2s;
      }
      .profile-action-btn:hover { opacity:0.85; transform:translateY(-1px); }

      /* ── QUIZ OVER DASHBOARD ── */
      #quizOverlay { z-index: 10000 !important; }
      #quizShell { z-index: 10001 !important; }

      /* ── TEAM/FRIENDS NOTIFICATION BADGE ── */
      .notif-badge {
        position:absolute; top:-4px; right:-4px;
        background:#ef4444; color:white; border-radius:999px;
        font-size:0.68rem; font-weight:900; min-width:16px; height:16px;
        display:flex; align-items:center; justify-content:center; padding:0 3px;
        border:2px solid #0d1a2e;
      }

      /* ── DASHBOARD TEAM TAB ── */
      #teamTab { display:none; }

      /* ── COIN EARNED ANIMATION ── */
      .coin-pop {
        position:fixed; font-size:1.4rem; font-weight:900; color:#ffd12a;
        pointer-events:none; z-index:99999; animation:coinFloat 1.6s ease forwards;
      }
      @keyframes coinFloat {
        0%   { opacity:1; transform:translateY(0) scale(1); }
        60%  { opacity:1; transform:translateY(-60px) scale(1.2); }
        100% { opacity:0; transform:translateY(-100px) scale(0.8); }
      }
    `;
    document.head.appendChild(style);
  }

  /* ── SESSION TIMEOUT ────────────────────────────────────────── */
  let sessionTimer = null;
  function resetSessionTimer() {
    clearTimeout(sessionTimer);
    sessionTimer = setTimeout(() => {
      // Only trigger for signed-in users (guests don't time out)
      if (window.auth && window.auth.currentUser) {
        window.auth.signOut().then(() => {
          showLoginGate();
          showFeatToast("Session expired. Please sign in again.");
        });
      }
    }, SESSION_TIMEOUT_MS);
  }
  function startSessionTracking() {
    ["mousemove","keydown","click","touchstart","scroll"].forEach(ev => {
      document.addEventListener(ev, resetSessionTimer, { passive: true });
    });
    // Also restart on tab visibility change
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) resetSessionTimer();
    });
    resetSessionTimer();
  }

  /* ── LOGIN GATE ─────────────────────────────────────────────── */
  function buildLoginGate() {
    if (document.getElementById("loginGate")) return;
    const el = document.createElement("div");
    el.id = "loginGate";
    el.innerHTML = `
      <div class="lg-card">
        <div class="lg-logo">📚 ExamBank</div>
        <p class="lg-sub">Sign in to save your progress across all devices</p>

        <button class="lg-google-btn" id="lgGoogleBtn">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div class="lg-divider">or sign in with email</div>
        <div class="lg-err" id="lgErr"></div>

        <input class="lg-field" type="email" id="lgEmail" placeholder="Email address">
        <input class="lg-field" type="password" id="lgPassword" placeholder="Password">
        <div class="lg-row">
          <button class="lg-btn lg-btn-primary" id="lgSignIn">Sign In</button>
          <button class="lg-btn lg-btn-secondary" id="lgSignUp">Sign Up</button>
        </div>

        <button class="lg-guest-btn" id="lgGuest">Continue as Guest (progress won't be saved)</button>
      </div>
    `;
    document.body.appendChild(el);

    // Google
    document.getElementById("lgGoogleBtn").addEventListener("click", async () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      try {
        await window.auth.signInWithPopup(provider);
        hideLoginGate();
        startSessionTracking();
      } catch(e) {
        document.getElementById("lgErr").textContent = e.message || "Google sign-in failed";
      }
    });

    // Email sign in
    document.getElementById("lgSignIn").addEventListener("click", async () => {
      const email = document.getElementById("lgEmail").value.trim();
      const pw = document.getElementById("lgPassword").value;
      document.getElementById("lgErr").textContent = "";
      try {
        await window.auth.signInWithEmailAndPassword(email, pw);
        hideLoginGate();
        startSessionTracking();
      } catch(e) {
        document.getElementById("lgErr").textContent = e.message || "Sign in failed";
      }
    });

    // Email sign up
    document.getElementById("lgSignUp").addEventListener("click", async () => {
      const email = document.getElementById("lgEmail").value.trim();
      const pw = document.getElementById("lgPassword").value;
      document.getElementById("lgErr").textContent = "";
      if (!email || pw.length < 6) {
        document.getElementById("lgErr").textContent = "Enter a valid email and password (6+ chars)";
        return;
      }
      try {
        await window.auth.createUserWithEmailAndPassword(email, pw);
        hideLoginGate();
        startSessionTracking();
      } catch(e) {
        document.getElementById("lgErr").textContent = e.message || "Sign up failed";
      }
    });

    // Guest
    document.getElementById("lgGuest").addEventListener("click", () => {
      hideLoginGate();
      // Guests don't get session tracking
    });
  }

  function showLoginGate() {
    let gate = document.getElementById("loginGate");
    if (!gate) { buildLoginGate(); gate = document.getElementById("loginGate"); }
    gate.classList.remove("hidden");
  }
  function hideLoginGate() {
    const gate = document.getElementById("loginGate");
    if (gate) gate.classList.add("hidden");
  }

  /* ── COINS STATE ────────────────────────────────────────────── */
  let coins = 0;
  let ownedItems = {};
  let equippedItems = {};

  function loadCoins() {
    const user = window.auth?.currentUser;
    if (!user) return;
    window.database.ref(`accounts/${user.uid}/coins`).once("value", s => {
      coins = Number(s.val() || 0);
      updateCoinsDisplay();
    });
    window.database.ref(`accounts/${user.uid}/ownedItems`).once("value", s => {
      ownedItems = s.val() || {};
    });
    window.database.ref(`accounts/${user.uid}/equippedItems`).once("value", s => {
      equippedItems = s.val() || {};
    });
  }

  function saveCoins() {
    const user = window.auth?.currentUser;
    if (!user) return;
    window.database.ref(`accounts/${user.uid}`).update({
      coins, ownedItems, equippedItems, updatedAt: Date.now()
    });
  }

  function updateCoinsDisplay() {
    document.querySelectorAll(".coins-val").forEach(el => el.textContent = coins);
  }

  function awardCoins(accuracy) {
    let earned = 0;
    if (accuracy === 100) earned = 50;
    else if (accuracy >= 90) earned = 45;
    else if (accuracy >= 80) earned = 40;
    else if (accuracy >= 70) earned = 25;
    else if (accuracy >= 60) earned = 15;
    else if (accuracy >= 50) earned = 8;
    if (earned > 0) {
      coins += earned;
      updateCoinsDisplay();
      saveCoins();
      showCoinPop(earned);
      showFeatToast(`+${earned} 🪙 coins earned!`);
    }
    return earned;
  }

  function showCoinPop(amount) {
    const pop = document.createElement("div");
    pop.className = "coin-pop";
    pop.textContent = `+${amount} 🪙`;
    pop.style.cssText = `top:${window.innerHeight/2 - 80}px;left:${window.innerWidth/2 - 40}px;`;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 1700);
  }

  /* ── SHOP ITEMS ─────────────────────────────────────────────── */
  const SHOP_ITEMS = [
    { id:"badge_star",      name:"⭐ Star Badge",        emoji:"⭐", price:100, type:"badge",  desc:"Show off on your profile!" },
    { id:"badge_fire",      name:"🔥 Fire Badge",        emoji:"🔥", price:80,  type:"badge",  desc:"You're on fire!" },
    { id:"badge_rocket",    name:"🚀 Rocket Badge",      emoji:"🚀", price:120, type:"badge",  desc:"Blast off to the top!" },
    { id:"badge_diamond",   name:"💎 Diamond Badge",     emoji:"💎", price:200, type:"badge",  desc:"Rare and precious." },
    { id:"badge_crown",     name:"👑 Crown Badge",       emoji:"👑", price:300, type:"badge",  desc:"For true royalty." },
    { id:"frame_gold",      name:"Gold Frame",           emoji:"🟡", price:150, type:"frame",  desc:"Golden profile border." },
    { id:"frame_neon",      name:"Neon Frame",           emoji:"🟢", price:180, type:"frame",  desc:"Glowing neon border." },
    { id:"frame_galaxy",    name:"Galaxy Frame",         emoji:"🌌", price:250, type:"frame",  desc:"Out of this world." },
    { id:"theme_sunset",    name:"Sunset Theme",         emoji:"🌅", price:200, type:"theme",  desc:"Warm sunset colors." },
    { id:"theme_ocean",     name:"Ocean Theme",          emoji:"🌊", price:200, type:"theme",  desc:"Deep ocean vibes." },
    { id:"xp_boost_1",      name:"2× XP Boost (1 quiz)",emoji:"⚡",  price:60,  type:"boost",  desc:"Double XP for 1 quiz!" },
    { id:"coin_boost_1",    name:"2× Coin Boost (1 quiz)",emoji:"🪙", price:60,  type:"boost",  desc:"Double coins for 1 quiz!" },
  ];

  /* ── MARKET MODAL ───────────────────────────────────────────── */
  function buildMarketModal() {
    if (document.getElementById("marketModal")) return;
    const el = document.createElement("div");
    el.id = "marketModal";
    el.innerHTML = `
      <div class="market-shell">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
          <div>
            <h2 style="margin:0;font-size:1.7rem;font-weight:900;">🛒 Market</h2>
            <p style="color:#9ca3af;margin:0.3rem 0 0;font-size:0.9rem;">Spend your coins on cool stuff</p>
          </div>
          <div style="display:flex;align-items:center;gap:1rem;">
            <span class="coins-display"><span class="coins-val">${coins}</span> 🪙</span>
            <button id="closeMarketModal" style="background:rgba(255,255,255,0.1);border:none;color:white;width:38px;height:38px;border-radius:50%;font-size:1.3rem;cursor:pointer;">×</button>
          </div>
        </div>
        <div class="market-grid" id="marketGrid"></div>
      </div>
    `;
    document.body.appendChild(el);

    document.getElementById("closeMarketModal").addEventListener("click", () => {
      el.classList.remove("open");
    });
    el.addEventListener("click", e => { if (e.target === el) el.classList.remove("open"); });
  }

  function renderMarket() {
    const grid = document.getElementById("marketGrid");
    if (!grid) return;
    grid.innerHTML = SHOP_ITEMS.map(item => {
      const owned = ownedItems[item.id];
      const equipped = equippedItems[item.type] === item.id;
      return `
        <div class="market-item${owned ? " owned" : ""}${equipped ? " equipped" : ""}"
             onclick="window._featBuyItem('${item.id}')">
          <span class="market-emoji">${item.emoji}</span>
          <div class="market-name">${item.name}</div>
          <div style="font-size:0.78rem;color:#9ca3af;margin-bottom:0.4rem;">${item.desc}</div>
          ${owned
            ? `<div class="market-owned-label">${equipped ? "✓ Equipped" : "Owned — Click to equip"}</div>`
            : `<div class="market-price">${item.price} 🪙</div>`
          }
        </div>
      `;
    }).join("");
  }

  window._featBuyItem = function(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    if (ownedItems[itemId]) {
      // Toggle equip
      if (equippedItems[item.type] === itemId) {
        delete equippedItems[item.type];
        showFeatToast(`${item.emoji} ${item.name} unequipped`);
      } else {
        equippedItems[item.type] = itemId;
        showFeatToast(`${item.emoji} ${item.name} equipped!`);
      }
      saveCoins();
      renderMarket();
      return;
    }
    if (coins < item.price) {
      showFeatToast(`Not enough coins! Need ${item.price - coins} more 🪙`);
      return;
    }
    if (!confirm(`Buy ${item.name} for ${item.price} 🪙?`)) return;
    coins -= item.price;
    ownedItems[itemId] = true;
    if (item.type !== "boost") equippedItems[item.type] = itemId;
    updateCoinsDisplay();
    saveCoins();
    renderMarket();
    showFeatToast(`${item.emoji} ${item.name} purchased!`);
  };

  function openMarket() {
    buildMarketModal();
    renderMarket();
    document.getElementById("marketModal").classList.add("open");
  }

  /* ── TEAMS ──────────────────────────────────────────────────── */
  let myTeamId = null;

  function buildTeamsModal() {
    if (document.getElementById("teamsModal")) return;
    const el = document.createElement("div");
    el.id = "teamsModal";
    el.innerHTML = `
      <div class="teams-shell" style="margin-top:2rem;margin-bottom:2rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;">
          <div>
            <h2 style="margin:0;font-size:1.7rem;font-weight:900;">⚔️ Teams</h2>
            <p style="color:#9ca3af;margin:0.25rem 0 0;font-size:0.88rem;">Compete together, rise together</p>
          </div>
          <button id="closeTeamsModal" style="background:rgba(255,255,255,0.1);border:none;color:white;width:38px;height:38px;border-radius:50%;font-size:1.3rem;cursor:pointer;">×</button>
        </div>

        <!-- Team leaderboard -->
        <div style="margin-bottom:2rem;">
          <h3 style="margin:0 0 1rem;font-size:1.1rem;font-weight:800;color:#60a5fa;">🏆 Team Leaderboard</h3>
          <div id="teamLeaderboardList"><div style="text-align:center;padding:1.5rem;color:#666;">Loading...</div></div>
        </div>

        <!-- My team section -->
        <div id="myTeamSection">
          <h3 style="margin:0 0 1rem;font-size:1.1rem;font-weight:800;color:#7cf0c2;">👥 My Team</h3>
          <div id="myTeamDisplay"><div style="text-align:center;padding:1.5rem;color:#666;">You're not in a team yet.</div></div>
        </div>

        <!-- Create / join -->
        <div style="margin-top:1.5rem;display:flex;flex-wrap:wrap;gap:0.75rem;">
          <button onclick="window._featShowCreateTeam()" style="background:#3b82f6;border:none;color:white;padding:0.7rem 1.4rem;border-radius:12px;font-weight:700;cursor:pointer;">+ Create Team</button>
          <button onclick="window._featShowJoinTeam()" style="background:rgba(255,255,255,0.1);border:none;color:white;padding:0.7rem 1.4rem;border-radius:12px;font-weight:700;cursor:pointer;">Join by Code</button>
        </div>

        <div id="teamActionArea" style="margin-top:1rem;"></div>
      </div>
    `;
    document.body.appendChild(el);
    document.getElementById("closeTeamsModal").addEventListener("click", () => el.classList.remove("open"));
    el.addEventListener("click", e => { if (e.target === el) el.classList.remove("open"); });
  }

  function openTeams() {
    buildTeamsModal();
    document.getElementById("teamsModal").classList.add("open");
    loadTeamLeaderboard();
    loadMyTeam();
  }

  function loadTeamLeaderboard() {
    const list = document.getElementById("teamLeaderboardList");
    if (!list) return;
    window.database.ref("teams").orderByChild("totalXp").limitToLast(10).on("value", snap => {
      const teams = [];
      snap.forEach(child => teams.push({ id: child.key, ...child.val() }));
      teams.sort((a,b) => (b.totalXp||0) - (a.totalXp||0));
      if (!teams.length) { list.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#666;">No teams yet. Create one!</div>'; return; }
      const medals = ["🥇","🥈","🥉"];
      list.innerHTML = teams.map((t,i) => `
        <div class="team-leaderboard-row">
          <span style="font-size:1.3rem;width:32px;text-align:center;">${medals[i] || "#"+(i+1)}</span>
          <span style="font-size:1.5rem;">${t.emoji || "⚔️"}</span>
          <div style="flex:1;">
            <div style="font-weight:800;">${t.name || "Unnamed"}</div>
            <div style="font-size:0.78rem;color:#9ca3af;">${t.memberCount||0} members</div>
          </div>
          <strong style="color:#ffd12a;">${t.totalXp||0} XP</strong>
        </div>
      `).join("");
    });
  }

  function loadMyTeam() {
    const user = window.auth?.currentUser;
    const display = document.getElementById("myTeamDisplay");
    if (!user || !display) return;
    window.database.ref(`accounts/${user.uid}/teamId`).once("value", snap => {
      myTeamId = snap.val();
      if (!myTeamId) {
        display.innerHTML = '<p style="color:#9ca3af;">You\'re not in a team yet.</p>';
        return;
      }
      window.database.ref(`teams/${myTeamId}`).once("value", tSnap => {
        const team = tSnap.val();
        if (!team) { display.innerHTML = '<p style="color:#9ca3af;">Team not found.</p>'; return; }
        const memberKeys = Object.keys(team.members || {});
        display.innerHTML = `
          <div class="team-card my-team">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
              <span style="font-size:2.5rem;">${team.emoji||"⚔️"}</span>
              <div>
                <div style="font-weight:900;font-size:1.2rem;">${team.name}</div>
                <div style="font-size:0.82rem;color:#9ca3af;">Code: <strong style="color:#60a5fa;">${myTeamId}</strong> · ${memberKeys.length} members</div>
              </div>
            </div>
            <div style="font-size:0.88rem;color:#9ca3af;margin-bottom:0.75rem;">Members:</div>
            <div id="teamMembersList">${memberKeys.map(uid => `
              <div style="display:flex;align-items:center;gap:0.6rem;padding:0.5rem;background:rgba(255,255,255,0.04);border-radius:10px;margin-bottom:0.4rem;">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(team.members[uid]?.name||"?")}&background=111827&color=fff" style="width:28px;height:28px;border-radius:50%;">
                <span style="font-weight:600;">${team.members[uid]?.name||"Unknown"}</span>
                <span style="color:#ffd12a;margin-left:auto;">${team.members[uid]?.xp||0} XP</span>
              </div>`).join("")}
            </div>
            <button onclick="window._featLeaveTeam()" style="background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);color:#f87171;padding:0.5rem 1rem;border-radius:10px;font-weight:700;cursor:pointer;margin-top:0.5rem;">Leave Team</button>
          </div>
        `;
      });
    });
  }

  window._featShowCreateTeam = function() {
    const user = window.auth?.currentUser;
    if (!user) { showFeatToast("Sign in to create a team!"); return; }
    const area = document.getElementById("teamActionArea");
    area.innerHTML = `
      <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:1.2rem;">
        <h4 style="margin:0 0 1rem;font-weight:800;">Create a Team</h4>
        <input id="newTeamName" placeholder="Team name" style="width:100%;padding:0.7rem;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.3);color:white;margin-bottom:0.6rem;">
        <input id="newTeamEmoji" placeholder="Team emoji (e.g. 🦁)" style="width:100%;padding:0.7rem;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.3);color:white;margin-bottom:0.75rem;">
        <button onclick="window._featCreateTeam()" style="background:#3b82f6;border:none;color:white;padding:0.7rem 1.4rem;border-radius:10px;font-weight:700;cursor:pointer;">Create!</button>
      </div>
    `;
  };

  window._featCreateTeam = async function() {
    const user = window.auth?.currentUser;
    if (!user) return;
    if (myTeamId) { showFeatToast("Leave your current team first!"); return; }
    const name = document.getElementById("newTeamName").value.trim();
    const emoji = document.getElementById("newTeamEmoji").value.trim() || "⚔️";
    if (!name) { showFeatToast("Enter a team name!"); return; }
    const teamId = "team_" + Date.now().toString(36);
    const teamData = {
      name, emoji,
      leaderId: user.uid,
      totalXp: window.xp || 0,
      memberCount: 1,
      members: { [user.uid]: { name: window.currentPlayer || user.displayName || "Player", xp: window.xp||0, joinedAt: Date.now() } },
      createdAt: Date.now()
    };
    await window.database.ref(`teams/${teamId}`).set(teamData);
    await window.database.ref(`accounts/${user.uid}/teamId`).set(teamId);
    myTeamId = teamId;
    document.getElementById("teamActionArea").innerHTML = "";
    loadMyTeam();
    loadTeamLeaderboard();
    showFeatToast(`Team "${name}" created! Code: ${teamId}`);
  };

  window._featShowJoinTeam = function() {
    const area = document.getElementById("teamActionArea");
    area.innerHTML = `
      <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:1.2rem;">
        <h4 style="margin:0 0 0.75rem;font-weight:800;">Join a Team</h4>
        <input id="joinTeamCode" placeholder="Enter team code" style="width:100%;padding:0.7rem;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.3);color:white;margin-bottom:0.6rem;">
        <button onclick="window._featJoinTeam()" style="background:#10b981;border:none;color:white;padding:0.7rem 1.4rem;border-radius:10px;font-weight:700;cursor:pointer;">Join!</button>
      </div>
    `;
  };

  window._featJoinTeam = async function() {
    const user = window.auth?.currentUser;
    if (!user) { showFeatToast("Sign in to join a team!"); return; }
    if (myTeamId) { showFeatToast("Leave your current team first!"); return; }
    const code = document.getElementById("joinTeamCode").value.trim();
    if (!code) return;
    const snap = await window.database.ref(`teams/${code}`).once("value");
    if (!snap.exists()) { showFeatToast("Team not found. Check the code."); return; }
    await window.database.ref(`teams/${code}/members/${user.uid}`).set({
      name: window.currentPlayer || user.displayName || "Player",
      xp: window.xp || 0, joinedAt: Date.now()
    });
    await window.database.ref(`teams/${code}/memberCount`).transaction(n => (n||0)+1);
    await window.database.ref(`accounts/${user.uid}/teamId`).set(code);
    myTeamId = code;
    document.getElementById("teamActionArea").innerHTML = "";
    loadMyTeam();
    loadTeamLeaderboard();
    showFeatToast("Joined team!");
  };

  window._featLeaveTeam = async function() {
    const user = window.auth?.currentUser;
    if (!user || !myTeamId) return;
    if (!confirm("Leave your team?")) return;
    await window.database.ref(`teams/${myTeamId}/members/${user.uid}`).remove();
    await window.database.ref(`teams/${myTeamId}/memberCount`).transaction(n => Math.max(0,(n||1)-1));
    await window.database.ref(`accounts/${user.uid}/teamId`).remove();
    myTeamId = null;
    loadMyTeam();
    showFeatToast("Left team.");
  };

  /* ── PLAYER PROFILE PAGE ────────────────────────────────────── */
  function buildProfilePageModal() {
    if (document.getElementById("profilePageModal")) return;
    const el = document.createElement("div");
    el.id = "profilePageModal";
    el.innerHTML = `
      <div class="profile-page-shell" style="margin-top:2rem;margin-bottom:2rem;">
        <div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">
          <button id="closeProfilePageModal" style="background:rgba(255,255,255,0.1);border:none;color:white;width:38px;height:38px;border-radius:50%;font-size:1.3rem;cursor:pointer;">×</button>
        </div>
        <div id="profilePageBody">Loading...</div>
      </div>
    `;
    document.body.appendChild(el);
    document.getElementById("closeProfilePageModal").addEventListener("click", () => el.classList.remove("open"));
    el.addEventListener("click", e => { if (e.target === el) el.classList.remove("open"); });
  }

  window._openPlayerProfile = async function(uid) {
    buildProfilePageModal();
    const modal = document.getElementById("profilePageModal");
    const body = document.getElementById("profilePageBody");
    modal.classList.add("open");
    body.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;">Loading profile...</div>';

    try {
      const [accSnap, lbSnap] = await Promise.all([
        window.database.ref(`accounts/${uid}`).once("value"),
        window.database.ref(`leaderboard/${uid}`).once("value")
      ]);
      const acc = accSnap.val() || {};
      const lb = lbSnap.val() || {};
      const name = acc.username || acc.displayName || lb.name || "Player";
      const avatar = acc.photoURL || lb.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111827&color=fff`;
      const xp = Number(acc.xp || lb.points || 0);
      const quizzes = Number(lb.quizzes || 0);
      const league = lb.league || "Bronze";
      const badges = Object.keys(acc.equippedItems || {}).map(type => {
        const id = acc.equippedItems[type];
        const item = SHOP_ITEMS.find(i => i.id === id);
        return item ? item.emoji : "";
      }).filter(Boolean).join(" ");
      const myUid = window.auth?.currentUser?.uid;
      const isMe = myUid === uid;
      const isTop5 = await checkIsTop5(uid);

      // Check friend status
      let friendStatus = "none";
      if (!isMe && myUid) {
        const fs = await window.database.ref(`accounts/${myUid}/friends/${uid}`).once("value");
        friendStatus = fs.val() || "none";
      }

      body.innerHTML = `
        ${isTop5 ? `<div style="margin-bottom:1.5rem;"><span class="top5-banner">🏆 TOP 5 PLAYER · Season ${new Date().getFullYear()}</span></div>` : ""}
        <div style="display:flex;align-items:center;gap:1.25rem;margin-bottom:2rem;flex-wrap:wrap;">
          <div style="position:relative;">
            <img src="${avatar}" class="profile-avatar-lg" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111827&color=fff'">
            ${isTop5 ? '<div style="position:absolute;bottom:-6px;right:-6px;background:linear-gradient(90deg,#f59e0b,#ef4444);border-radius:999px;padding:2px 7px;font-size:0.65rem;font-weight:900;">TOP 5</div>' : ""}
          </div>
          <div>
            <h2 style="margin:0 0 0.25rem;font-size:1.6rem;font-weight:900;">${name}</h2>
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.6rem;margin-bottom:0.5rem;">
              <span style="background:rgba(255,255,255,0.08);border-radius:8px;padding:3px 10px;font-size:0.82rem;">${league}</span>
              <span style="color:#ffd12a;font-weight:800;">${xp} XP</span>
              <span style="color:#9ca3af;font-size:0.85rem;">${quizzes} quizzes</span>
            </div>
            ${badges ? `<div style="font-size:1.3rem;margin-bottom:0.5rem;">${badges}</div>` : ""}
          </div>
        </div>

        ${!isMe ? `
          <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:2rem;">
            ${friendStatus === "friends"
              ? `<button class="profile-action-btn" style="background:rgba(239,68,68,0.2);color:#f87171;border:1px solid rgba(239,68,68,0.3);" onclick="window._featRemoveFriend('${uid}','${name}')">💔 Remove Friend</button>`
              : friendStatus === "pending"
              ? `<button class="profile-action-btn" style="background:rgba(255,255,255,0.08);color:#9ca3af;border:1px solid rgba(255,255,255,0.1);" disabled>✉️ Request Sent</button>`
              : `<button class="profile-action-btn" style="background:#3b82f6;color:white;" onclick="window._featSendFriendReq('${uid}','${name}')">👋 Add Friend</button>`
            }
            ${myTeamId
              ? `<button class="profile-action-btn" style="background:#7c3aed;color:white;" onclick="window._featInviteToTeam('${uid}','${name}')">⚔️ Invite to Team</button>`
              : ""
            }
          </div>
        ` : `<div style="color:#9ca3af;font-size:0.88rem;margin-bottom:1.5rem;">This is your profile</div>`}

        <div style="background:rgba(255,255,255,0.04);border-radius:16px;padding:1.25rem;">
          <h4 style="margin:0 0 0.75rem;font-weight:800;">Stats</h4>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.75rem;">
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:0.9rem;text-align:center;">
              <div style="font-size:1.8rem;font-weight:900;">${xp}</div>
              <div style="font-size:0.78rem;color:#9ca3af;">Total XP</div>
            </div>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:0.9rem;text-align:center;">
              <div style="font-size:1.8rem;font-weight:900;">${quizzes}</div>
              <div style="font-size:0.78rem;color:#9ca3af;">Quizzes Done</div>
            </div>
          </div>
        </div>
      `;
    } catch(e) {
      body.innerHTML = `<p style="color:#f87171;">Could not load profile: ${e.message}</p>`;
    }
  };

  async function checkIsTop5(uid) {
    const snap = await window.database.ref("leaderboard").orderByChild("points").limitToLast(5).once("value");
    let top5 = [];
    snap.forEach(c => top5.push(c.key));
    return top5.includes(uid);
  }

  window._featSendFriendReq = async function(targetUid, targetName) {
    const user = window.auth?.currentUser;
    if (!user) { showFeatToast("Sign in first!"); return; }
    await window.database.ref(`accounts/${user.uid}/friends/${targetUid}`).set("pending");
    await window.database.ref(`accounts/${targetUid}/friendRequests/${user.uid}`).set({
      from: user.uid, name: window.currentPlayer || user.displayName || "Player", ts: Date.now()
    });
    showFeatToast(`Friend request sent to ${targetName}!`);
    window._openPlayerProfile(targetUid);
  };

  window._featRemoveFriend = async function(targetUid, targetName) {
    const user = window.auth?.currentUser;
    if (!user) return;
    await window.database.ref(`accounts/${user.uid}/friends/${targetUid}`).remove();
    await window.database.ref(`accounts/${targetUid}/friends/${user.uid}`).remove();
    showFeatToast(`Removed ${targetName}`);
    window._openPlayerProfile(targetUid);
  };

  window._featInviteToTeam = async function(targetUid, targetName) {
    const user = window.auth?.currentUser;
    if (!user || !myTeamId) { showFeatToast("You need to be in a team first!"); return; }
    await window.database.ref(`accounts/${targetUid}/teamInvites/${myTeamId}`).set({
      from: user.uid, fromName: window.currentPlayer || "Player",
      teamId: myTeamId, ts: Date.now()
    });
    showFeatToast(`Team invite sent to ${targetName}!`);
  };

  /* ── INJECT COINS DISPLAY INTO HEADER ───────────────────────── */
  function injectCoinsIntoHeader() {
    // Add coins display next to the profile button in header
    const profileBtn = document.getElementById("openDashboardBtn") || document.getElementById("hamburgerBtn");
    if (!profileBtn) return;
    if (document.getElementById("coinsHeaderBtn")) return;

    const coinsBtn = document.createElement("button");
    coinsBtn.id = "coinsHeaderBtn";
    coinsBtn.className = "coins-display";
    coinsBtn.innerHTML = `<span class="coins-val">${coins}</span> 🪙`;
    coinsBtn.addEventListener("click", openMarket);
    profileBtn.parentElement.insertBefore(coinsBtn, profileBtn);
  }

  /* ── DASHBOARD TEAM TAB INJECTION ───────────────────────────── */
  function injectDashboardTeamTab() {
    const tabs = document.querySelector("#dashboardModal .tabs");
    if (!tabs || document.querySelector('[data-tab="teams"]')) return;

    const teamTab = document.createElement("div");
    teamTab.className = "tab";
    teamTab.dataset.tab = "teams";
    teamTab.textContent = "Teams";
    tabs.appendChild(teamTab);

    const dashContent = document.getElementById("dashboardContent");
    if (!dashContent) return;
    const teamTabContent = document.createElement("div");
    teamTabContent.className = "tab-content";
    teamTabContent.id = "teamsTab";
    teamTabContent.style.display = "none";
    teamTabContent.innerHTML = `
      <div style="padding:1rem 0;">
        <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:1.5rem;">
          <button onclick="openTeamsModal()" style="background:#3b82f6;border:none;color:white;padding:0.7rem 1.4rem;border-radius:12px;font-weight:700;cursor:pointer;">⚔️ Open Teams</button>
        </div>
        <div id="dashTeamPreview" style="color:#9ca3af;">Click "Open Teams" to manage your team.</div>
      </div>
    `;
    dashContent.appendChild(teamTabContent);

    // Wire tab click
    teamTab.addEventListener("click", () => {
      document.querySelectorAll("#dashboardModal .tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll("#dashboardModal .tab-content").forEach(c => c.style.display = "none");
      teamTab.classList.add("active");
      teamTabContent.style.display = "block";
    });
  }

  window.openTeamsModal = function() {
    openTeams();
    // Close dashboard
    const dash = document.getElementById("dashboardModal");
    if (dash) dash.classList.remove("open");
  };

  /* ── QUIZ OVER DASHBOARD FIX ────────────────────────────────── */
  function fixQuizOverDashboard() {
    const quizOverlay = document.getElementById("quizOverlay");
    const quizShell = document.getElementById("quizShell");
    if (quizOverlay) quizOverlay.style.zIndex = "10000";
    if (quizShell) quizShell.style.zIndex = "10001";

    // Also patch startCustomQuiz to NOT close dashboard first
    const origStartCustomQuiz = window.startCustomQuiz;
    if (origStartCustomQuiz && !origStartCustomQuiz._patched) {
      window.startCustomQuiz = function(idx) {
        // Don't close dashboard — quiz is z:10000, dashboard is z:1000
        return origStartCustomQuiz.call(this, idx);
      };
      window.startCustomQuiz._patched = true;
    }

    // Patch unit card clicks in dashboard to not close it
    const dashContent = document.getElementById("dashboardContent");
    if (dashContent) {
      dashContent.addEventListener("click", function(e) {
        const playBtn = e.target.closest('[data-action="launch-custom-quiz"], .play-btn[data-quiz-id]');
        if (playBtn) {
          e.stopPropagation();
          const qid = playBtn.dataset.quizId || playBtn.dataset.quizIndex;
          const allQ = [...(window.customQuizzes||[]), ...(window.userQuizzes||[]), ...(window.publicQuizzes||[])];
          let quiz = allQ.find(q => String(q.id) === String(qid) || String(q.firestoreId) === String(qid));
          if (!quiz && !isNaN(+qid)) quiz = allQ[+qid];
          if (quiz) {
            let idx = (window.customQuizzes||[]).findIndex(q => q.id === quiz.id);
            if (idx < 0) { (window.customQuizzes = window.customQuizzes||[]).push(quiz); idx = window.customQuizzes.length-1; }
            if (window.startCustomQuiz) window.startCustomQuiz(idx);
          }
        }
      }, true);
    }
  }

  /* ── PATCH submitQuiz for coins + leaderboard ───────────────── */
  function patchSubmitQuiz() {
    const orig = window.submitQuiz;
    if (!orig || orig._coinPatched) return;
    window.submitQuiz = async function() {
      const result = await orig.apply(this, arguments);
      // Award coins based on last quiz accuracy
      setTimeout(() => {
        const accuracyEl = document.querySelector("#quizResults .accuracy-value, #resultAccuracy, [data-result='accuracy']");
        let accuracy = 0;
        if (accuracyEl) {
          accuracy = parseInt(accuracyEl.textContent) || 0;
        } else {
          // Fallback: compute from result display text
          const txt = document.querySelector("#quizShell")?.innerText || "";
          const m = txt.match(/(\d+)%/);
          if (m) accuracy = parseInt(m[1]);
        }
        awardCoins(accuracy);

        // Update team XP
        const user = window.auth?.currentUser;
        if (user && myTeamId) {
          window.database.ref(`teams/${myTeamId}/members/${user.uid}/xp`).set(window.xp||0);
          // Recompute team total
          window.database.ref(`teams/${myTeamId}/members`).once("value", s => {
            let total = 0;
            s.forEach(c => total += Number(c.val()?.xp||0));
            window.database.ref(`teams/${myTeamId}/totalXp`).set(total);
          });
        }

        // Write to leaderboard RTDB
        if (user) {
          const name = window.currentPlayer || user.displayName || "Player";
          const avatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111827&color=fff`;
          window.database.ref(`leaderboard/${user.uid}`).set({
            uid: user.uid, name, points: window.xp||0, weeklyXp: window.xp||0,
            quizzes: (window.history||[]).length,
            league: (typeof window.getLeague === "function" ? window.getLeague(window.xp||0).name : "Bronze"),
            avatar, updatedAt: Date.now()
          });
        }
      }, 600);
      return result;
    };
    window.submitQuiz._coinPatched = true;
  }

  /* ── TOP-5 BANNER ON HOME ───────────────────────────────────── */
  function checkAndShowTop5Banner() {
    const user = window.auth?.currentUser;
    if (!user) return;
    checkIsTop5(user.uid).then(isTop5 => {
      if (!isTop5) return;
      // Show banner on home hero section
      const hero = document.getElementById("section-hero") || document.querySelector("header, nav, .hero");
      if (!hero) return;
      if (document.getElementById("top5HomeBanner")) return;
      const banner = document.createElement("div");
      banner.id = "top5HomeBanner";
      banner.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:500;padding:0.5rem;text-align:center;background:linear-gradient(90deg,#f59e0b,#ef4444,#a855f7,#3b82f6);background-size:300%;animation:top5Shimmer 3s linear infinite;font-weight:900;color:white;font-size:0.9rem;letter-spacing:0.05em;";
      banner.innerHTML = "🏆 YOU ARE IN THE TOP 5! 🏆";
      document.body.prepend(banner);
    });
  }

  /* ── LEADERBOARD: live sync fix ─────────────────────────────── */
  function patchLeaderboard() {
    window.showLeaderboard = function() {
      const modal = document.getElementById("leaderboardModal");
      const lc = document.getElementById("leaderboardContent");
      const ur = document.getElementById("userRank");
      if (!modal) return;
      modal.classList.remove("hidden"); modal.classList.add("flex");
      if (lc) lc.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;">Loading live data...</div>';

      window.database.ref("leaderboard").off("value");
      window.database.ref("leaderboard").on("value", snap => {
        const rows = snap.val() || {};
        const entries = Object.keys(rows).map(uid => {
          const d = rows[uid];
          const name = d.name || d.username || "Player";
          const pts = Number(d.points || d.weeklyXp || d.xp || 0);
          return { uid, name, points: pts, quizzes: Number(d.quizzes||0),
            avatar: d.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111827&color=fff`,
            league: d.league || "Bronze" };
        }).sort((a,b) => b.points - a.points);

        const top20 = entries.slice(0, 20);
        const myUid = window.auth?.currentUser?.uid;
        const myIdx = entries.findIndex(e => myUid ? e.uid === myUid : e.name === window.currentPlayer);
        const myEntry = myIdx >= 0 ? entries[myIdx] : null;

        if (ur) ur.innerHTML = `
          <div style="width:44px;height:44px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;margin-right:0.9rem;">
            <span style="font-weight:900;">#${myIdx >= 0 ? myIdx+1 : "-"}</span>
          </div>
          <div style="flex:1;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:700;">${myEntry?.name || window.currentPlayer}</span>
            <span style="font-weight:700;color:#ffd12a;">${myEntry?.points ?? (window.xp||0)} XP</span>
          </div>`;

        if (!lc) return;
        if (!top20.length) { lc.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;">No players yet!</div>'; return; }
        const medals = ["🥇","🥈","🥉"];
        const highest = Math.max(1, top20[0].points);
        lc.innerHTML = '<div style="display:flex;flex-direction:column;gap:0.5rem;">' + top20.map((e,i) => {
          const isMe = myUid ? e.uid === myUid : e.name === window.currentPlayer;
          const fill = Math.min(100, Math.round(e.points/highest*100));
          return `<div style="display:flex;align-items:center;gap:0.7rem;padding:0.8rem;border-radius:14px;
            border:${isMe?"2px solid rgba(88,204,2,0.6)":"1px solid rgba(255,255,255,0.08)"};
            background:${isMe?"rgba(88,204,2,0.08)":"rgba(255,255,255,0.04)"};
            cursor:pointer;" onclick="window._openPlayerProfile('${e.uid}')">
            <div style="width:36px;text-align:center;font-weight:900;font-size:${i<3?"1.3":"0.9"}rem;">${medals[i]||"#"+(i+1)}</div>
            <img src="${e.avatar}" style="width:34px;height:34px;border-radius:10px;object-fit:cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(e.name)}&background=111827&color=fff'">
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${e.name}${isMe?" ⭐":""}</div>
              <div style="height:5px;border-radius:99px;background:rgba(0,0,0,0.3);margin-top:3px;"><div style="height:100%;width:${fill}%;border-radius:99px;background:linear-gradient(90deg,#58cc02,#1cb0f6);"></div></div>
            </div>
            <strong style="white-space:nowrap;color:${i===0?"#ffd12a":i===1?"#e2e8f0":i===2?"#cd7f32":"white"}">${e.points} XP</strong>
          </div>`;
        }).join("") + "</div>";
      });
    };

    const closeBtn = document.getElementById("closeLeaderboardModal");
    if (closeBtn) {
      const newClose = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newClose, closeBtn);
      newClose.addEventListener("click", () => {
        window.database.ref("leaderboard").off("value");
        const m = document.getElementById("leaderboardModal");
        if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
      });
    }
  }

  /* ── PUBLIC QUIZZES GLOBAL SYNC ─────────────────────────────── */
  function patchPublicQuizzes() {
    // Listen for any quiz saved to RTDB publicQuizzes and render in Public tab
    window.database.ref("publicQuizzes").on("value", snap => {
      const data = snap.val() || {};
      const quizzes = Object.values(data).filter(q => q && q.questions && q.questions.length);
      quizzes.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));

      // Merge into window.publicQuizzes (app's array)
      const existingIds = new Set((window.publicQuizzes||[]).map(q => q.id));
      quizzes.forEach(q => { if (!existingIds.has(q.id)) (window.publicQuizzes||[]).push(q); });

      // Render public tab
      const list = document.getElementById("publicQuizzesList");
      if (!list) return;
      if (!quizzes.length) {
        list.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;">No public quizzes yet. Create one!</div>';
        return;
      }
      const myUid = window.auth?.currentUser?.uid;
      list.innerHTML = quizzes.map(quiz => {
        const id = String(quiz.id||"").replace(/['"<>]/g,"");
        const isMine = myUid && quiz.authorId === myUid;
        const qCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
        return `
          <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:1.25rem;margin-bottom:0.75rem;transition:all 0.2s;">
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.6rem;">
              <span style="font-size:0.78rem;color:#9ca3af;">🌐 Public ${isMine?"· <span style='color:#93c5fd;'>Yours</span>":""}</span>
            </div>
            <h3 style="margin:0 0 0.4rem;font-weight:800;">${quiz.title||"Untitled"}</h3>
            ${quiz.description?`<p style="color:#9ca3af;font-size:0.88rem;margin:0 0 0.5rem;">${quiz.description}</p>`:""}
            <div style="font-size:0.78rem;color:#6b7280;margin-bottom:0.75rem;">By ${quiz.author||"Unknown"} · ${qCount} questions</div>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
              <button onclick="window._playPublicQuiz('${id}')" style="background:#3b82f6;border:none;color:white;padding:0.45rem 1.1rem;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.88rem;">▶ Play</button>
              ${isMine?`<button onclick="window._deletePublicQuiz('${id}')" style="background:#ef4444;border:none;color:white;padding:0.45rem 0.9rem;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.88rem;">🗑 Delete</button>`:""}
            </div>
          </div>`;
      }).join("");
    });

    window._playPublicQuiz = function(quizId) {
      window.database.ref(`publicQuizzes/${quizId}`).once("value", snap => {
        const quiz = snap.val();
        if (!quiz || !quiz.questions) { showFeatToast("Quiz not found."); return; }
        window.customQuizzes = window.customQuizzes || [];
        window.customQuizzes.push(quiz);
        const idx = window.customQuizzes.length - 1;
        if (window.startCustomQuiz) window.startCustomQuiz(idx);
      });
    };

    window._deletePublicQuiz = async function(quizId) {
      if (!confirm("Delete this public quiz?")) return;
      await window.database.ref(`publicQuizzes/${quizId}`).remove();
      await window.firestore.collection("publicQuizzes").doc(quizId).delete().catch(()=>{});
      showFeatToast("Quiz deleted.");
    };

    // Re-wire Save Quiz button
    const saveBtn = document.getElementById("saveQuizBtn");
    if (saveBtn && !saveBtn._featWired) {
      saveBtn._featWired = true;
      const newBtn = saveBtn.cloneNode(true);
      saveBtn.parentNode.replaceChild(newBtn, saveBtn);
      newBtn.addEventListener("click", async () => {
        const user = window.auth?.currentUser;
        if (!user) { showFeatToast("Sign in to save a quiz."); return; }
        const title = (document.getElementById("quizTitleInput")?.value||"").trim();
        const desc = (document.getElementById("quizDescriptionInput")?.value||"").trim();
        if (!title) { showFeatToast("Enter a quiz title first."); return; }
        const visEl = document.querySelector('input[name="quizVisibility"]:checked');
        const isPublic = visEl ? visEl.value === "public" : true;
        const questions = [];
        let valid = true;
        document.querySelectorAll("#questionsContainer .question-block").forEach(block => {
          const qText = (block.querySelector(".question-text")?.value||"").trim();
          const opts = Array.from(block.querySelectorAll(".option-input")).map(i=>(i.value||"").trim());
          const cidx = block.querySelector(".correct-answer-select")?.value;
          if (!qText || opts.some(o=>!o) || cidx==="") valid = false;
          questions.push({ question:qText, options:opts, choices:opts, answer:opts[Number(cidx)], correctIndex:Number(cidx) });
        });
        if (!valid || !questions.length) { showFeatToast("Fill in all question fields."); return; }
        const quizId = "quiz-"+Date.now()+"-"+Math.random().toString(36).slice(2);
        const quiz = {
          id:quizId, title, description:desc, questions,
          author: window.currentPlayer || user.displayName || "User",
          authorId: user.uid,
          authorPhoto: user.photoURL || null,
          visibility: isPublic?"public":"private",
          public: isPublic, createdAt: Date.now()
        };
        try {
          await window.database.ref(`userQuizzes/${user.uid}/${quizId}`).set(quiz);
          await window.firestore.collection("users").doc(user.uid).collection("quizzes").doc(quizId).set(quiz);
          if (isPublic) {
            await window.database.ref(`publicQuizzes/${quizId}`).set(quiz);
            await window.firestore.collection("publicQuizzes").doc(quizId).set(quiz);
          }
          document.getElementById("createQuizModal").classList.remove("open");
          document.getElementById("createQuizModal").classList.add("hidden");
          showFeatToast(isPublic ? "✅ Quiz saved and is PUBLIC for everyone!" : "✅ Quiz saved privately.");
        } catch(e) {
          showFeatToast("Error saving: " + e.message);
        }
      });
    }
  }

  /* ── TOAST ──────────────────────────────────────────────────── */
  function showFeatToast(msg) {
    if (window.showToast) { window.showToast(msg); return; }
    const t = document.createElement("div");
    t.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:99999;background:rgba(17,24,39,0.95);border:1px solid rgba(255,255,255,0.15);color:white;padding:0.8rem 1.3rem;border-radius:14px;font-weight:600;font-size:0.9rem;box-shadow:0 8px 24px rgba(0,0,0,0.4);animation:lgFadeIn 0.3s ease;";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  /* ── INIT ───────────────────────────────────────────────────── */
  function init() {
    injectCSS();

    // Show login gate on every page load if not signed in
    window.auth.onAuthStateChanged(user => {
      if (user) {
        hideLoginGate();
        startSessionTracking();
        loadCoins();
        checkAndShowTop5Banner();
        // Check for pending friend requests
        window.database.ref(`accounts/${user.uid}/friendRequests`).once("value", snap => {
          const reqs = snap.val();
          if (reqs && Object.keys(reqs).length > 0) {
            showFeatToast(`👋 You have ${Object.keys(reqs).length} friend request(s)!`);
          }
        });
        // Check for team invites
        window.database.ref(`accounts/${user.uid}/teamInvites`).once("value", snap => {
          const invites = snap.val();
          if (invites && Object.keys(invites).length > 0) {
            const teamId = Object.keys(invites)[0];
            const invite = invites[teamId];
            if (confirm(`⚔️ ${invite.fromName} invited you to join their team! Accept?`)) {
              window._featJoinTeamById(teamId, user);
            }
          }
        });
      } else {
        showLoginGate();
      }
    });

    // Wait for DOM + app to fully boot, then patch
    const patchAll = () => {
      injectCoinsIntoHeader();
      injectDashboardTeamTab();
      fixQuizOverDashboard();
      patchSubmitQuiz();
      patchLeaderboard();
      patchPublicQuizzes();
    };

    if (document.readyState === "complete") {
      setTimeout(patchAll, 800);
    } else {
      window.addEventListener("load", () => setTimeout(patchAll, 800));
    }
  }

  window._featJoinTeamById = async function(teamId, user) {
    await window.database.ref(`teams/${teamId}/members/${user.uid}`).set({
      name: window.currentPlayer || user.displayName || "Player",
      xp: window.xp || 0, joinedAt: Date.now()
    });
    await window.database.ref(`teams/${teamId}/memberCount`).transaction(n => (n||0)+1);
    await window.database.ref(`accounts/${user.uid}/teamId`).set(teamId);
    await window.database.ref(`accounts/${user.uid}/teamInvites/${teamId}`).remove();
    myTeamId = teamId;
    showFeatToast("Joined team!");
  };

  waitForFirebase(init);

})();
