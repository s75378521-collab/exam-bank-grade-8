javascript

/* ================================================================
   EXAM BANK PORTAL X — FEATURES MODULE  v3.0
   ✓ Login gate (every load) + "Continue as Guest"
   ✓ Session timeout (30 min idle → re-login)
   ✓ Quiz launches OVER dashboard (no exit needed)
   ✓ Coins: 100%=50, 90%=45, 80%=40, 70%=25, 60%=15, 50%=8
   ✓ Market / shop with badges, frames, boosts
   ✓ Teams with leaderboard (NitroType style)
   ✓ Player profile pages with friend requests + team invites
   ✓ Top-5 banner badge
   ✓ XP synced to Firebase across devices
================================================================ */

(function () {
  "use strict";

  /* ── CONFIG ──────────────────────────────────────────────────── */
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min idle
  const SESSION_KEY = "exambank_session_ts";  // localStorage key

  /* ── WAIT FOR FIREBASE ───────────────────────────────────────── */
  function waitForFirebase(cb) {
    if (window.firebase && window.auth && window.database && window.firestore) {
      cb();
    } else {
      setTimeout(() => waitForFirebase(cb), 80);
    }
  }

  /* ── INJECT CSS ──────────────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById("featCSS")) return;
    const style = document.createElement("style");
    style.id = "featCSS";
    style.textContent = `
      /* ── LOGIN GATE ── */
      #loginGate {
        position:fixed;inset:0;z-index:99999;
        background:radial-gradient(circle at 20% 20%,rgba(96,165,250,.18),transparent 40%),
                   radial-gradient(circle at 80% 80%,rgba(124,240,194,.15),transparent 40%),
                   linear-gradient(135deg,#08111f,#11182b 50%,#1c2b4a);
        display:flex;align-items:center;justify-content:center;
        flex-direction:column;padding:1rem;font-family:"Manrope",sans-serif;
      }
      #loginGate.lg-hidden{display:none!important;}
      .lg-card{
        background:rgba(255,255,255,.07);backdrop-filter:blur(24px);
        border:1px solid rgba(255,255,255,.13);border-radius:28px;
        padding:clamp(1.5rem,5vw,3rem);width:100%;max-width:420px;
        box-shadow:0 24px 80px rgba(0,0,0,.4);animation:lgIn .5s ease;
      }
      @keyframes lgIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      .lg-logo{font-size:2.8rem;font-weight:900;font-family:"Space Grotesk",sans-serif;
        background:linear-gradient(90deg,#60a5fa,#7cf0c2,#ffb1cb);
        -webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.25rem;}
      .lg-sub{color:rgba(226,232,240,.7);font-size:.95rem;margin-bottom:2rem;}
      .lg-google-btn{
        width:100%;padding:.9rem 1.5rem;border-radius:16px;border:none;cursor:pointer;
        background:white;color:#111;font-weight:700;font-size:1rem;
        display:flex;align-items:center;justify-content:center;gap:10px;
        transition:transform .2s,box-shadow .2s;box-shadow:0 4px 12px rgba(0,0,0,.2);margin-bottom:1rem;
      }
      .lg-google-btn:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,.3);}
      .lg-divider{display:flex;align-items:center;gap:1rem;margin:1.2rem 0;color:rgba(255,255,255,.3);font-size:.85rem;}
      .lg-divider::before,.lg-divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.1);}
      .lg-field{width:100%;padding:.8rem 1rem;border-radius:12px;border:1px solid rgba(255,255,255,.15);
        background:rgba(0,0,0,.3);color:white;font-size:.95rem;margin-bottom:.75rem;outline:none;box-sizing:border-box;}
      .lg-field:focus{border-color:#60a5fa;}
      .lg-row{display:flex;gap:.6rem;margin-bottom:.75rem;}
      .lg-btn{flex:1;padding:.8rem;border-radius:12px;border:none;font-weight:700;font-size:.9rem;cursor:pointer;transition:all .2s;}
      .lg-btn-primary{background:#60a5fa;color:#000;}
      .lg-btn-secondary{background:#10b981;color:#000;}
      .lg-btn:hover{opacity:.88;transform:translateY(-1px);}
      .lg-guest-btn{width:100%;padding:.7rem;border-radius:12px;border:1px solid rgba(255,255,255,.15);
        background:transparent;color:rgba(255,255,255,.6);font-size:.9rem;cursor:pointer;transition:all .2s;margin-top:.25rem;}
      .lg-guest-btn:hover{background:rgba(255,255,255,.06);color:white;}
      .lg-err{color:#f87171;font-size:.85rem;margin-bottom:.5rem;min-height:1.2rem;}
      .lg-tabs{display:flex;gap:.5rem;margin-bottom:1.2rem;}
      .lg-tab{flex:1;padding:.5rem;border-radius:10px;border:1px solid rgba(255,255,255,.1);
        background:transparent;color:rgba(255,255,255,.5);font-weight:700;font-size:.85rem;cursor:pointer;transition:all .2s;}
      .lg-tab.active{background:rgba(96,165,250,.2);border-color:#60a5fa;color:white;}

      /* ── TOP-5 BANNER ── */
      .top5-banner{
        background:linear-gradient(90deg,#f59e0b,#ef4444,#a855f7,#3b82f6);
        background-size:300% 100%;animation:shimmer 3s linear infinite;
        border-radius:12px;padding:.4rem 1rem;font-weight:900;font-size:.82rem;
        color:white;display:inline-flex;align-items:center;gap:6px;
        text-shadow:0 1px 2px rgba(0,0,0,.3);letter-spacing:.04em;box-shadow:0 0 20px rgba(245,158,11,.5);
      }
      @keyframes shimmer{0%{background-position:0%}100%{background-position:300%}}
      #top5HomeBanner{
        position:fixed;top:0;left:0;right:0;z-index:500;padding:.45rem;text-align:center;
        background:linear-gradient(90deg,#f59e0b,#ef4444,#a855f7,#3b82f6);
        background-size:300%;animation:shimmer 3s linear infinite;
        font-weight:900;color:white;font-size:.88rem;letter-spacing:.05em;cursor:pointer;
      }

      /* ── COINS ── */
      .coins-display{
        display:inline-flex;align-items:center;gap:6px;
        background:rgba(255,213,42,.15);border:1px solid rgba(255,213,42,.3);
        border-radius:999px;padding:4px 12px;font-weight:800;color:#ffd12a;
        font-size:.9rem;cursor:pointer;transition:all .2s;
      }
      .coins-display:hover{background:rgba(255,213,42,.25);}

      /* ── COIN ANIMATION ── */
      .coin-pop{
        position:fixed;font-size:1.4rem;font-weight:900;color:#ffd12a;
        pointer-events:none;z-index:99999;animation:coinFloat 1.6s ease forwards;
      }
      @keyframes coinFloat{
        0%{opacity:1;transform:translateY(0) scale(1)}
        60%{opacity:1;transform:translateY(-70px) scale(1.3)}
        100%{opacity:0;transform:translateY(-110px) scale(.8)}
      }

      /* ── MODAL BASE ── */
      .feat-modal{
        position:fixed;inset:0;z-index:8500;background:rgba(0,0,0,.8);
        display:none;align-items:flex-start;justify-content:center;
        padding:1rem;overflow-y:auto;
      }
      .feat-modal.open{display:flex;}
      .feat-shell{
        width:100%;margin:auto;border-radius:28px;
        padding:clamp(1.2rem,4vw,2.5rem);box-shadow:0 30px 80px rgba(0,0,0,.5);
        animation:lgIn .3s ease;
      }
      .feat-close-btn{
        background:rgba(255,255,255,.1);border:none;color:white;
        width:38px;height:38px;border-radius:50%;font-size:1.3rem;cursor:pointer;
        flex-shrink:0;transition:background .2s;
      }
      .feat-close-btn:hover{background:rgba(255,255,255,.2);}

      /* ── MARKET ── */
      #marketModal .feat-shell{
        max-width:680px;
        background:radial-gradient(circle at 10% 10%,rgba(255,213,42,.12),transparent 50%),
                   linear-gradient(135deg,#0d1a2e,#131f35);
        border:1px solid rgba(255,213,42,.2);
      }
      .market-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:1rem;margin-top:1.5rem;}
      .market-item{
        background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);
        border-radius:18px;padding:1.2rem;text-align:center;cursor:pointer;transition:all .25s;
      }
      .market-item:hover{transform:translateY(-4px);background:rgba(255,255,255,.1);border-color:rgba(255,213,42,.4);}
      .market-item.owned{border-color:rgba(124,240,194,.5);background:rgba(124,240,194,.07);}
      .market-item.equipped{border-color:#7cf0c2;box-shadow:0 0 14px rgba(124,240,194,.3);}
      .market-emoji{font-size:2.5rem;display:block;margin-bottom:.5rem;}
      .market-name{font-weight:800;font-size:.9rem;margin-bottom:.3rem;color:white;}
      .market-price{color:#ffd12a;font-weight:700;font-size:.85rem;}
      .market-owned{color:#7cf0c2;font-size:.8rem;font-weight:700;}

      /* ── TEAMS ── */
      #teamsModal .feat-shell{
        max-width:720px;
        background:radial-gradient(circle at 90% 10%,rgba(96,165,250,.15),transparent 50%),
                   linear-gradient(135deg,#0d1a2e,#131f35);
        border:1px solid rgba(96,165,250,.2);
      }
      .team-card{
        background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);
        border-radius:18px;padding:1.25rem;margin-bottom:.75rem;transition:all .2s;
      }
      .team-card:hover{background:rgba(255,255,255,.09);}
      .team-card.my-team{border-color:rgba(96,165,250,.5);}
      .tlb-row{
        display:flex;align-items:center;gap:.75rem;padding:.75rem;
        border-radius:14px;background:rgba(255,255,255,.04);margin-bottom:.5rem;transition:background .2s;
        cursor:pointer;
      }
      .tlb-row:hover{background:rgba(255,255,255,.08);}

      /* ── PROFILE ── */
      #profileModal .feat-shell{
        max-width:600px;
        background:radial-gradient(circle at 20% 0%,rgba(124,240,194,.12),transparent 40%),
                   linear-gradient(160deg,#0a1628,#111c34);
        border:1px solid rgba(255,255,255,.12);
      }
      .profile-avatar{width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.2);}
      .profile-btn{
        padding:.55rem 1.1rem;border-radius:12px;border:none;font-weight:700;
        font-size:.85rem;cursor:pointer;transition:all .2s;
      }
      .profile-btn:hover{opacity:.85;transform:translateY(-1px);}

      /* ── QUIZ OVER DASHBOARD ── */
      #quizOverlay{z-index:10000!important;}
      #quizShell{z-index:10001!important;}

      /* ── NOTIF BADGE ── */
      .notif-badge{
        position:absolute;top:-4px;right:-4px;background:#ef4444;color:white;
        border-radius:999px;font-size:.65rem;font-weight:900;min-width:16px;height:16px;
        display:flex;align-items:center;justify-content:center;padding:0 3px;
        border:2px solid #0d1a2e;
      }

      /* ── INPUT HELPER ── */
      .feat-input{
        width:100%;padding:.75rem 1rem;border-radius:12px;
        border:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.3);
        color:white;font-size:.92rem;outline:none;box-sizing:border-box;
        transition:border-color .2s;
      }
      .feat-input:focus{border-color:#60a5fa;}
      .feat-btn{
        padding:.7rem 1.4rem;border-radius:12px;border:none;font-weight:700;
        font-size:.9rem;cursor:pointer;transition:all .2s;
      }
      .feat-btn:hover{opacity:.88;transform:translateY(-1px);}
      .feat-btn-blue{background:#3b82f6;color:white;}
      .feat-btn-green{background:#10b981;color:white;}
      .feat-btn-red{background:rgba(239,68,68,.2);border:1px solid rgba(239,68,68,.4);color:#f87171;}
      .feat-btn-ghost{background:rgba(255,255,255,.1);color:rgba(255,255,255,.85);}
    `;
    document.head.appendChild(style);
  }

  /* ── SESSION TIMEOUT ─────────────────────────────────────────── */
  let _sessionTimer = null;

  function resetSessionTimer() {
    clearTimeout(_sessionTimer);
    _sessionTimer = setTimeout(async () => {
      if (window.auth?.currentUser) {
        await window.auth.signOut().catch(() => {});
        localStorage.removeItem(SESSION_KEY);
        showLoginGate();
        showFeatToast("⏱ Session expired. Please sign in again.");
      }
    }, SESSION_TIMEOUT_MS);
    localStorage.setItem(SESSION_KEY, Date.now());
  }

  function startSessionTracking() {
    ["mousemove", "keydown", "click", "touchstart", "scroll"].forEach(ev =>
      document.addEventListener(ev, resetSessionTimer, { passive: true })
    );
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        // Check if session expired while tab was hidden
        const lastTs = parseInt(localStorage.getItem(SESSION_KEY) || "0");
        if (lastTs && Date.now() - lastTs > SESSION_TIMEOUT_MS) {
          window.auth?.signOut().then(() => {
            localStorage.removeItem(SESSION_KEY);
            showLoginGate();
            showFeatToast("⏱ Session expired. Please sign in again.");
          });
        } else {
          resetSessionTimer();
        }
      }
    });
    resetSessionTimer();
  }

  /* ── LOGIN GATE ──────────────────────────────────────────────── */
  function buildLoginGate() {
    if (document.getElementById("loginGate")) return;
    const el = document.createElement("div");
    el.id = "loginGate";
    el.innerHTML = `
      <div class="lg-card">
        <div class="lg-logo">📚 ExamBank</div>
        <p class="lg-sub">Sign in to sync your XP, streaks & quizzes across all devices</p>

        <button class="lg-google-btn" id="lgGoogleBtn">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div class="lg-divider">or use email</div>
        <div class="lg-tabs">
          <button class="lg-tab active" id="lgTabSignIn">Sign In</button>
          <button class="lg-tab" id="lgTabSignUp">Sign Up</button>
        </div>
        <div class="lg-err" id="lgErr"></div>
        <input class="lg-field" type="email" id="lgEmail" placeholder="Email address" autocomplete="email">
        <input class="lg-field" type="password" id="lgPassword" placeholder="Password" autocomplete="current-password">
        <button class="lg-btn lg-btn-primary" id="lgEmailBtn" style="width:100%;margin-bottom:.75rem;">Sign In</button>

        <div class="lg-divider">or</div>
        <button class="lg-guest-btn" id="lgGuest">Continue as Guest (progress won't be saved)</button>
      </div>
    `;
    document.body.appendChild(el);

    // Tab toggle
    let isSignUp = false;
    document.getElementById("lgTabSignIn").addEventListener("click", () => {
      isSignUp = false;
      document.getElementById("lgTabSignIn").classList.add("active");
      document.getElementById("lgTabSignUp").classList.remove("active");
      document.getElementById("lgEmailBtn").textContent = "Sign In";
      document.getElementById("lgPassword").autocomplete = "current-password";
    });
    document.getElementById("lgTabSignUp").addEventListener("click", () => {
      isSignUp = true;
      document.getElementById("lgTabSignUp").classList.add("active");
      document.getElementById("lgTabSignIn").classList.remove("active");
      document.getElementById("lgEmailBtn").textContent = "Create Account";
      document.getElementById("lgPassword").autocomplete = "new-password";
    });

    // Google
    document.getElementById("lgGoogleBtn").addEventListener("click", async () => {
      document.getElementById("lgErr").textContent = "";
      const btn = document.getElementById("lgGoogleBtn");
      btn.disabled = true;
      btn.innerHTML = '<div style="width:18px;height:18px;border:2px solid rgba(0,0,0,.2);border-top-color:#333;border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0;"></div> Signing in...';
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      try {
        await window.auth.signInWithPopup(provider);
      } catch (e) {
        btn.disabled = false;
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Continue with Google';
        if (e.code === "auth/popup-blocked" || e.code === "auth/popup-closed-by-user") {
          try { await window.auth.signInWithRedirect(provider); } catch (e2) { /* noop */ }
        } else {
          document.getElementById("lgErr").textContent = e.message || "Google sign-in failed";
        }
      }
    });

    // Email
    document.getElementById("lgEmailBtn").addEventListener("click", async () => {
      const email = document.getElementById("lgEmail").value.trim();
      const pw = document.getElementById("lgPassword").value;
      const errEl = document.getElementById("lgErr");
      errEl.textContent = "";
      if (!email || !pw) { errEl.textContent = "Enter email and password."; return; }
      if (isSignUp && pw.length < 6) { errEl.textContent = "Password must be 6+ characters."; return; }
      try {
        if (isSignUp) {
          await window.auth.createUserWithEmailAndPassword(email, pw);
        } else {
          await window.auth.signInWithEmailAndPassword(email, pw);
        }
      } catch (e) {
        const msgs = {
          "auth/user-not-found": "No account with that email.",
          "auth/wrong-password": "Incorrect password.",
          "auth/email-already-in-use": "Email already in use — try Sign In.",
          "auth/invalid-email": "Invalid email address.",
          "auth/weak-password": "Password too weak.",
          "auth/too-many-requests": "Too many attempts. Try again later.",
          "auth/network-request-failed": "No internet connection.",
        };
        errEl.textContent = msgs[e.code] || e.message || "Sign-in failed.";
      }
    });

    // Enter key on password
    document.getElementById("lgPassword").addEventListener("keydown", e => {
      if (e.key === "Enter") document.getElementById("lgEmailBtn").click();
    });

    // Guest
    document.getElementById("lgGuest").addEventListener("click", () => {
      hideLoginGate();
      showFeatToast("👋 Continuing as guest — progress won't be saved.");
    });
  }

  function showLoginGate() {
    buildLoginGate();
    const gate = document.getElementById("loginGate");
    if (gate) gate.classList.remove("lg-hidden");
  }

  function hideLoginGate() {
    const gate = document.getElementById("loginGate");
    if (gate) gate.classList.add("lg-hidden");
  }

  /* ── COINS STATE ─────────────────────────────────────────────── */
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
    window.database.ref(`accounts/${user.uid}`).update({ coins, ownedItems, equippedItems, updatedAt: Date.now() });
  }

  function updateCoinsDisplay() {
    document.querySelectorAll(".coins-val").forEach(el => el.textContent = coins.toLocaleString());
  }

  function awardCoins(accuracy) {
    let earned = 0;
    if (accuracy === 100)     earned = 50;
    else if (accuracy >= 90)  earned = 45;
    else if (accuracy >= 80)  earned = 40;
    else if (accuracy >= 70)  earned = 25;
    else if (accuracy >= 60)  earned = 15;
    else if (accuracy >= 50)  earned = 8;
    if (earned > 0) {
      // Apply coin boost if equipped
      if (equippedItems["boost"] === "coin_boost_1") {
        earned *= 2;
        delete equippedItems["boost"];
        showFeatToast("⚡ 2× Coin Boost used!");
      }
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
    pop.style.cssText = `top:${Math.max(100, window.innerHeight / 2 - 80)}px;left:${Math.max(20, window.innerWidth / 2 - 40)}px;`;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 1700);
  }

  /* ── SHOP ITEMS ──────────────────────────────────────────────── */
  const SHOP_ITEMS = [
    { id: "badge_star",    name: "⭐ Star Badge",          emoji: "⭐", price: 100, type: "badge", desc: "Show off on your profile!" },
    { id: "badge_fire",    name: "🔥 Fire Badge",          emoji: "🔥", price: 80,  type: "badge", desc: "You're on fire!" },
    { id: "badge_rocket",  name: "🚀 Rocket Badge",        emoji: "🚀", price: 120, type: "badge", desc: "Blast off to the top!" },
    { id: "badge_diamond", name: "💎 Diamond Badge",       emoji: "💎", price: 200, type: "badge", desc: "Rare and precious." },
    { id: "badge_crown",   name: "👑 Crown Badge",         emoji: "👑", price: 300, type: "badge", desc: "For true royalty." },
    { id: "badge_lightning",name: "⚡ Lightning Badge",    emoji: "⚡", price: 160, type: "badge", desc: "Fast and unstoppable." },
    { id: "frame_gold",    name: "Gold Frame",             emoji: "🟡", price: 150, type: "frame", desc: "Golden profile border." },
    { id: "frame_neon",    name: "Neon Frame",             emoji: "🟢", price: 180, type: "frame", desc: "Glowing neon border." },
    { id: "frame_galaxy",  name: "Galaxy Frame",           emoji: "🌌", price: 250, type: "frame", desc: "Out of this world." },
    { id: "frame_fire",    name: "Fire Frame",             emoji: "🔴", price: 220, type: "frame", desc: "Burning hot profile." },
    { id: "theme_sunset",  name: "Sunset Theme",           emoji: "🌅", price: 200, type: "theme", desc: "Warm sunset colors." },
    { id: "theme_ocean",   name: "Ocean Theme",            emoji: "🌊", price: 200, type: "theme", desc: "Deep ocean vibes." },
    { id: "theme_forest",  name: "Forest Theme",           emoji: "🌲", price: 200, type: "theme", desc: "Calm forest greens." },
    { id: "xp_boost_1",   name: "2× XP Boost",           emoji: "⚡", price: 60,  type: "xpboost", desc: "Double XP for 1 quiz!" },
    { id: "coin_boost_1",  name: "2× Coin Boost",         emoji: "🪙", price: 60,  type: "boost", desc: "Double coins for 1 quiz!" },
    { id: "title_scholar", name: "Scholar Title",          emoji: "🎓", price: 400, type: "title", desc: 'Show "Scholar" on profile.' },
    { id: "title_champion",name: "Champion Title",         emoji: "🏆", price: 500, type: "title", desc: 'Show "Champion" on profile.' },
  ];

  /* ── MARKET ──────────────────────────────────────────────────── */
  function buildMarketModal() {
    if (document.getElementById("marketModal")) return;
    const el = document.createElement("div");
    el.id = "marketModal";
    el.className = "feat-modal";
    el.innerHTML = `
      <div class="feat-shell" style="max-width:680px;background:radial-gradient(circle at 10% 10%,rgba(255,213,42,.12),transparent 50%),linear-gradient(135deg,#0d1a2e,#131f35);border:1px solid rgba(255,213,42,.2);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem;">
          <div>
            <h2 style="margin:0;font-size:1.7rem;font-weight:900;">🛒 Market</h2>
            <p style="color:#9ca3af;margin:.25rem 0 0;font-size:.88rem;">Spend your hard-earned coins</p>
          </div>
          <div style="display:flex;align-items:center;gap:.75rem;">
            <span class="coins-display"><span class="coins-val">${coins}</span> 🪙</span>
            <button class="feat-close-btn" id="closeMarketModal">×</button>
          </div>
        </div>
        <div class="market-grid" id="marketGrid"></div>
      </div>
    `;
    document.body.appendChild(el);
    document.getElementById("closeMarketModal").addEventListener("click", () => el.classList.remove("open"));
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
          <div style="font-size:.75rem;color:#9ca3af;margin-bottom:.4rem;">${item.desc}</div>
          ${owned
            ? `<div class="market-owned">${equipped ? "✓ Equipped" : "Owned — click to equip"}</div>`
            : `<div class="market-price">${item.price} 🪙</div>`}
        </div>`;
    }).join("");
    updateCoinsDisplay();
  }

  window._featBuyItem = function (itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    if (ownedItems[itemId]) {
      equippedItems[item.type] === itemId
        ? (delete equippedItems[item.type], showFeatToast(`${item.emoji} ${item.name} unequipped`))
        : (equippedItems[item.type] = itemId, showFeatToast(`${item.emoji} ${item.name} equipped!`));
      saveCoins(); renderMarket(); return;
    }
    if (coins < item.price) { showFeatToast(`Not enough coins! Need ${item.price - coins} more 🪙`); return; }
    if (!confirm(`Buy ${item.name} for ${item.price} 🪙?`)) return;
    coins -= item.price;
    ownedItems[itemId] = true;
    if (!["boost", "xpboost"].includes(item.type)) equippedItems[item.type] = itemId;
    updateCoinsDisplay(); saveCoins(); renderMarket();
    showFeatToast(`${item.emoji} ${item.name} purchased!`);
  };

  window.openMarket = function () {
    buildMarketModal();
    renderMarket();
    document.getElementById("marketModal").classList.add("open");
  };

  /* ── TEAMS ───────────────────────────────────────────────────── */
  let myTeamId = null;

  function buildTeamsModal() {
    if (document.getElementById("teamsModal")) return;
    const el = document.createElement("div");
    el.id = "teamsModal";
    el.className = "feat-modal";
    el.innerHTML = `
      <div class="feat-shell" style="max-width:720px;background:radial-gradient(circle at 90% 10%,rgba(96,165,250,.15),transparent 50%),linear-gradient(135deg,#0d1a2e,#131f35);border:1px solid rgba(96,165,250,.2);margin-top:1.5rem;margin-bottom:1.5rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;">
          <div>
            <h2 style="margin:0;font-size:1.7rem;font-weight:900;">⚔️ Teams</h2>
            <p style="color:#9ca3af;margin:.2rem 0 0;font-size:.88rem;">Compete together · Rise together</p>
          </div>
          <button class="feat-close-btn" id="closeTeamsModal">×</button>
        </div>

        <h3 style="margin:0 0 .75rem;font-size:1.05rem;font-weight:800;color:#60a5fa;">🏆 Team Leaderboard</h3>
        <div id="teamLeaderboardList"><div style="text-align:center;padding:1.5rem;color:#666;">Loading...</div></div>

        <h3 style="margin:1.75rem 0 .75rem;font-size:1.05rem;font-weight:800;color:#7cf0c2;">👥 My Team</h3>
        <div id="myTeamDisplay"><div style="text-align:center;padding:1rem;color:#666;">You're not in a team yet.</div></div>

        <div style="margin-top:1.25rem;display:flex;flex-wrap:wrap;gap:.75rem;">
          <button onclick="window._featShowCreateTeam()" class="feat-btn feat-btn-blue">+ Create Team</button>
          <button onclick="window._featShowJoinTeam()" class="feat-btn feat-btn-ghost">🔑 Join by Code</button>
        </div>
        <div id="teamActionArea" style="margin-top:1rem;"></div>
      </div>
    `;
    document.body.appendChild(el);
    document.getElementById("closeTeamsModal").addEventListener("click", () => el.classList.remove("open"));
    el.addEventListener("click", e => { if (e.target === el) el.classList.remove("open"); });
  }

  window.openTeams = function () {
    buildTeamsModal();
    document.getElementById("teamsModal").classList.add("open");
    loadTeamLeaderboard();
    loadMyTeam();
  };

  function loadTeamLeaderboard() {
    const list = document.getElementById("teamLeaderboardList");
    if (!list) return;
    window.database.ref("teams").orderByChild("totalXp").limitToLast(10).on("value", snap => {
      const teams = [];
      snap.forEach(child => teams.push({ id: child.key, ...child.val() }));
      teams.sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0));
      if (!teams.length) {
        list.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#666;">No teams yet. Be the first!</div>';
        return;
      }
      const medals = ["🥇", "🥈", "🥉"];
      const highest = Math.max(1, teams[0].totalXp || 1);
      list.innerHTML = teams.map((t, i) => {
        const fill = Math.min(100, Math.round(((t.totalXp || 0) / highest) * 100));
        const isMyTeam = t.id === myTeamId;
        return `
          <div class="tlb-row${isMyTeam ? ' my-team' : ''}" style="${isMyTeam ? 'border:1px solid rgba(96,165,250,.4);background:rgba(96,165,250,.08);' : ''}">
            <span style="font-size:1.3rem;width:32px;text-align:center;">${medals[i] || "#" + (i + 1)}</span>
            <span style="font-size:1.6rem;">${t.emoji || "⚔️"}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.name || "Unnamed"}${isMyTeam ? " ⭐" : ""}</div>
              <div style="height:4px;border-radius:99px;background:rgba(0,0,0,.35);margin-top:4px;">
                <div style="height:100%;width:${fill}%;border-radius:99px;background:linear-gradient(90deg,#60a5fa,#7cf0c2);transition:width .4s;"></div>
              </div>
              <div style="font-size:.75rem;color:#9ca3af;margin-top:2px;">${t.memberCount || 0} members</div>
            </div>
            <strong style="color:#ffd12a;white-space:nowrap;">${(t.totalXp || 0).toLocaleString()} XP</strong>
          </div>`;
      }).join("");
    });
  }

  function loadMyTeam() {
    const user = window.auth?.currentUser;
    const display = document.getElementById("myTeamDisplay");
    if (!user || !display) return;
    window.database.ref(`accounts/${user.uid}/teamId`).once("value", snap => {
      myTeamId = snap.val();
      if (!myTeamId) {
        display.innerHTML = '<p style="color:#9ca3af;margin:0;">You\'re not in a team yet.</p>';
        return;
      }
      window.database.ref(`teams/${myTeamId}`).once("value", tSnap => {
        const team = tSnap.val();
        if (!team) { display.innerHTML = '<p style="color:#9ca3af;">Team not found.</p>'; return; }
        const members = team.members || {};
        const isLeader = team.leaderId === user.uid;
        display.innerHTML = `
          <div class="team-card my-team">
            <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem;">
              <span style="font-size:2.5rem;">${team.emoji || "⚔️"}</span>
              <div>
                <div style="font-weight:900;font-size:1.15rem;">${team.name}</div>
                <div style="font-size:.8rem;color:#9ca3af;">
                  Code: <strong style="color:#60a5fa;user-select:all;">${myTeamId}</strong>
                  · ${Object.keys(members).length} members
                  ${isLeader ? ' · <span style="color:#ffd12a;">👑 Leader</span>' : ""}
                </div>
              </div>
              <strong style="margin-left:auto;color:#ffd12a;">${(team.totalXp || 0).toLocaleString()} XP</strong>
            </div>
            <div style="font-size:.85rem;color:#9ca3af;margin-bottom:.5rem;">Members:</div>
            <div>
              ${Object.keys(members).map(uid => `
                <div style="display:flex;align-items:center;gap:.6rem;padding:.5rem;background:rgba(255,255,255,.04);border-radius:10px;margin-bottom:.35rem;cursor:pointer;"
                     onclick="window._openPlayerProfile('${uid}')">
                  <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(members[uid]?.name || "?")}&background=111827&color=fff"
                       style="width:28px;height:28px;border-radius:50%;object-fit:cover;">
                  <span style="font-weight:600;">${members[uid]?.name || "Unknown"}</span>
                  <span style="color:#ffd12a;margin-left:auto;font-size:.85rem;">${(members[uid]?.xp || 0).toLocaleString()} XP</span>
                </div>`).join("")}
            </div>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem;">
              <button onclick="window._featLeaveTeam()" class="feat-btn feat-btn-red" style="font-size:.82rem;padding:.5rem .9rem;">Leave Team</button>
              ${isLeader ? `
                <button onclick="window._featInviteToTeamBySearch()" class="feat-btn feat-btn-ghost" style="font-size:.82rem;padding:.5rem .9rem;">+ Invite Player</button>
              ` : ""}
            </div>
          </div>`;
      });
    });
  }

  window._featShowCreateTeam = function () {
    const user = window.auth?.currentUser;
    if (!user) { showFeatToast("Sign in to create a team!"); return; }
    document.getElementById("teamActionArea").innerHTML = `
      <div style="background:rgba(255,255,255,.05);border-radius:16px;padding:1.2rem;margin-top:.5rem;">
        <h4 style="margin:0 0 1rem;font-weight:800;">Create a Team</h4>
        <input id="newTeamName" class="feat-input" placeholder="Team name" style="margin-bottom:.6rem;">
        <input id="newTeamEmoji" class="feat-input" placeholder="Team emoji (e.g. 🦁)" style="margin-bottom:.75rem;">
        <button onclick="window._featCreateTeam()" class="feat-btn feat-btn-blue">Create!</button>
      </div>`;
  };

  window._featCreateTeam = async function () {
    const user = window.auth?.currentUser;
    if (!user) return;
    if (myTeamId) { showFeatToast("Leave your current team first!"); return; }
    const name = document.getElementById("newTeamName").value.trim();
    const emoji = document.getElementById("newTeamEmoji").value.trim() || "⚔️";
    if (!name) { showFeatToast("Enter a team name!"); return; }
    const teamId = "team_" + Date.now().toString(36);
    await window.database.ref(`teams/${teamId}`).set({
      name, emoji,
      leaderId: user.uid,
      totalXp: window.xp || 0,
      memberCount: 1,
      members: { [user.uid]: { name: window.currentPlayer || user.displayName || "Player", xp: window.xp || 0, joinedAt: Date.now() } },
      createdAt: Date.now()
    });
    await window.database.ref(`accounts/${user.uid}/teamId`).set(teamId);
    myTeamId = teamId;
    document.getElementById("teamActionArea").innerHTML = "";
    loadMyTeam(); loadTeamLeaderboard();
    showFeatToast(`Team "${name}" created! Share code: ${teamId}`);
  };

  window._featShowJoinTeam = function () {
    document.getElementById("teamActionArea").innerHTML = `
      <div style="background:rgba(255,255,255,.05);border-radius:16px;padding:1.2rem;margin-top:.5rem;">
        <h4 style="margin:0 0 .75rem;font-weight:800;">Join a Team</h4>
        <input id="joinTeamCode" class="feat-input" placeholder="Enter team code" style="margin-bottom:.6rem;">
        <button onclick="window._featJoinTeam()" class="feat-btn feat-btn-green">Join!</button>
      </div>`;
  };

  window._featJoinTeam = async function () {
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
    await window.database.ref(`teams/${code}/memberCount`).transaction(n => (n || 0) + 1);
    await window.database.ref(`accounts/${user.uid}/teamId`).set(code);
    myTeamId = code;
    document.getElementById("teamActionArea").innerHTML = "";
    loadMyTeam(); loadTeamLeaderboard();
    showFeatToast("🎉 Joined team!");
  };

  window._featLeaveTeam = async function () {
    const user = window.auth?.currentUser;
    if (!user || !myTeamId) return;
    if (!confirm("Leave your team? You can rejoin with the code.")) return;
    await window.database.ref(`teams/${myTeamId}/members/${user.uid}`).remove();
    await window.database.ref(`teams/${myTeamId}/memberCount`).transaction(n => Math.max(0, (n || 1) - 1));
    await window.database.ref(`accounts/${user.uid}/teamId`).remove();
    myTeamId = null;
    loadMyTeam(); loadTeamLeaderboard();
    showFeatToast("Left team.");
  };

  window._featJoinTeamById = async function (teamId, user) {
    await window.database.ref(`teams/${teamId}/members/${user.uid}`).set({
      name: window.currentPlayer || user.displayName || "Player",
      xp: window.xp || 0, joinedAt: Date.now()
    });
    await window.database.ref(`teams/${teamId}/memberCount`).transaction(n => (n || 0) + 1);
    await window.database.ref(`accounts/${user.uid}/teamId`).set(teamId);
    await window.database.ref(`accounts/${user.uid}/teamInvites/${teamId}`).remove();
    myTeamId = teamId;
    showFeatToast("🎉 Joined team!");
  };

  /* ── PLAYER PROFILE PAGE ─────────────────────────────────────── */
  function buildProfileModal() {
    if (document.getElementById("profileModal")) return;
    const el = document.createElement("div");
    el.id = "profileModal";
    el.className = "feat-modal";
    el.innerHTML = `
      <div class="feat-shell" style="max-width:600px;background:radial-gradient(circle at 20% 0%,rgba(124,240,194,.12),transparent 40%),linear-gradient(160deg,#0a1628,#111c34);border:1px solid rgba(255,255,255,.12);margin-top:1.5rem;margin-bottom:1.5rem;">
        <div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">
          <button class="feat-close-btn" id="closeProfileModal">×</button>
        </div>
        <div id="profileBody"><div style="text-align:center;padding:2rem;color:#9ca3af;">Loading...</div></div>
      </div>`;
    document.body.appendChild(el);
    document.getElementById("closeProfileModal").addEventListener("click", () => el.classList.remove("open"));
    el.addEventListener("click", e => { if (e.target === el) el.classList.remove("open"); });
  }

  window._openPlayerProfile = async function (uid) {
    buildProfileModal();
    const modal = document.getElementById("profileModal");
    const body = document.getElementById("profileBody");
    modal.classList.add("open");
    body.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;">Loading profile...</div>';

    try {
      const [accSnap, lbSnap] = await Promise.all([
        window.database.ref(`accounts/${uid}`).once("value"),
        window.database.ref(`leaderboard/${uid}`).once("value"),
      ]);
      const acc = accSnap.val() || {};
      const lb = lbSnap.val() || {};
      const name = acc.username || acc.displayName || lb.name || "Player";
      const avatar = acc.photoURL || acc.avatar || lb.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111827&color=fff`;
      const xpVal = Number(acc.xp || lb.points || 0);
      const quizzesN = Number(lb.quizzes || 0);
      const league = lb.league || "Bronze";

      const badges = Object.values(acc.equippedItems || {})
        .map(id => { const it = SHOP_ITEMS.find(i => i.id === id); return it ? it.emoji : ""; })
        .filter(Boolean).join("  ");
      const titleItem = SHOP_ITEMS.find(i => i.id === acc.equippedItems?.title);
      const titleLabel = titleItem ? titleItem.name.replace(/^[^ ]+ /, "") : null;

      const myUid = window.auth?.currentUser?.uid;
      const isMe = myUid === uid;
      const isTop5 = await checkIsTop5(uid);

      let friendStatus = "none";
      if (!isMe && myUid) {
        const fs = await window.database.ref(`accounts/${myUid}/friends/${uid}`).once("value");
        friendStatus = fs.val() || "none";
      }

      // Frame class
      const frameId = acc.equippedItems?.frame;
      const frameStyles = {
        frame_gold: "border:3px solid #ffd12a;box-shadow:0 0 16px rgba(255,209,42,.4);",
        frame_neon: "border:3px solid #7cf0c2;box-shadow:0 0 16px rgba(124,240,194,.4);",
        frame_galaxy: "border:3px solid #a855f7;box-shadow:0 0 16px rgba(168,85,247,.4);",
        frame_fire:  "border:3px solid #ef4444;box-shadow:0 0 16px rgba(239,68,68,.4);",
      };
      const frameStyle = frameStyles[frameId] || "";

      body.innerHTML = `
        ${isTop5 ? `<div style="margin-bottom:1.5rem;"><span class="top5-banner">🏆 TOP 5 PLAYER · ${new Date().getFullYear()}</span></div>` : ""}
        <div style="display:flex;align-items:center;gap:1.25rem;margin-bottom:2rem;flex-wrap:wrap;">
          <div style="position:relative;flex-shrink:0;">
            <img src="${avatar}" class="profile-avatar" style="${frameStyle}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111827&color=fff'">
            ${isTop5 ? '<div style="position:absolute;bottom:-6px;right:-6px;background:linear-gradient(90deg,#f59e0b,#ef4444);border-radius:999px;padding:2px 7px;font-size:.62rem;font-weight:900;">TOP 5</div>' : ""}
          </div>
          <div style="flex:1;min-width:0;">
            <h2 style="margin:0 0 .2rem;font-size:1.5rem;font-weight:900;overflow:hidden;text-overflow:ellipsis;">${name}</h2>
            ${titleLabel ? `<div style="font-size:.78rem;color:#ffd12a;font-weight:700;margin-bottom:.4rem;">${titleLabel}</div>` : ""}
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;margin-bottom:.4rem;">
              <span style="background:rgba(255,255,255,.08);border-radius:8px;padding:3px 10px;font-size:.8rem;">${league}</span>
              <span style="color:#ffd12a;font-weight:800;">${xpVal.toLocaleString()} XP</span>
              <span style="color:#9ca3af;font-size:.82rem;">${quizzesN} quizzes</span>
            </div>
            ${badges ? `<div style="font-size:1.25rem;letter-spacing:.15em;">${badges}</div>` : ""}
          </div>
        </div>

        ${!isMe ? `
          <div style="display:flex;flex-wrap:wrap;gap:.65rem;margin-bottom:2rem;">
            ${friendStatus === "friends"
              ? `<button class="profile-btn feat-btn-red" onclick="window._featRemoveFriend('${uid}','${name}')">💔 Remove Friend</button>`
              : friendStatus === "pending"
              ? `<button class="profile-btn" style="background:rgba(255,255,255,.08);color:#9ca3af;" disabled>✉️ Request Sent</button>`
              : `<button class="profile-btn" style="background:#3b82f6;color:white;" onclick="window._featSendFriendReq('${uid}','${name}')">👋 Add Friend</button>`}
            ${myTeamId
              ? `<button class="profile-btn" style="background:#7c3aed;color:white;" onclick="window._featInviteToTeam('${uid}','${name}')">⚔️ Invite to Team</button>`
              : ""}
          </div>
        ` : `<div style="color:#9ca3af;font-size:.85rem;margin-bottom:1.5rem;">✨ This is your profile</div>`}

        <div style="background:rgba(255,255,255,.04);border-radius:16px;padding:1.25rem;">
          <h4 style="margin:0 0 .75rem;font-weight:800;">📊 Stats</h4>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.65rem;">
            ${[["Total XP", xpVal.toLocaleString(), "#ffd12a"], ["Quizzes", quizzesN, "#60a5fa"], ["League", league, "#7cf0c2"]].map(([label, val, color]) => `
              <div style="background:rgba(255,255,255,.05);border-radius:12px;padding:.9rem;text-align:center;">
                <div style="font-size:1.4rem;font-weight:900;color:${color};">${val}</div>
                <div style="font-size:.72rem;color:#9ca3af;margin-top:2px;">${label}</div>
              </div>`).join("")}
          </div>
        </div>
      `;
    } catch (e) {
      body.innerHTML = `<p style="color:#f87171;">Could not load profile: ${e.message}</p>`;
    }
  };

  async function checkIsTop5(uid) {
    const snap = await window.database.ref("leaderboard").orderByChild("points").limitToLast(5).once("value");
    const top5 = [];
    snap.forEach(c => top5.push(c.key));
    return top5.includes(uid);
  }

  window._featSendFriendReq = async function (targetUid, targetName) {
    const user = window.auth?.currentUser;
    if (!user) { showFeatToast("Sign in first!"); return; }
    await window.database.ref(`accounts/${user.uid}/friends/${targetUid}`).set("pending");
    await window.database.ref(`accounts/${targetUid}/friendRequests/${user.uid}`).set({
      from: user.uid, name: window.currentPlayer || user.displayName || "Player", ts: Date.now()
    });
    showFeatToast(`Friend request sent to ${targetName}! 👋`);
    window._openPlayerProfile(targetUid);
  };

  window._featRemoveFriend = async function (targetUid, targetName) {
    const user = window.auth?.currentUser;
    if (!user) return;
    await window.database.ref(`accounts/${user.uid}/friends/${targetUid}`).remove();
    await window.database.ref(`accounts/${targetUid}/friends/${user.uid}`).remove();
    showFeatToast(`Removed ${targetName}`);
    window._openPlayerProfile(targetUid);
  };

  window._featInviteToTeam = async function (targetUid, targetName) {
    const user = window.auth?.currentUser;
    if (!user || !myTeamId) { showFeatToast("Join a team first!"); return; }
    await window.database.ref(`accounts/${targetUid}/teamInvites/${myTeamId}`).set({
      from: user.uid, fromName: window.currentPlayer || user.displayName || "Player",
      teamId: myTeamId, ts: Date.now()
    });
    showFeatToast(`Team invite sent to ${targetName}! ⚔️`);
  };

  /* ── COINS IN HEADER ─────────────────────────────────────────── */
  function injectCoinsIntoHeader() {
    const anchor = document.getElementById("openDashboardBtn") ||
      document.getElementById("hamburgerBtn") ||
      document.querySelector("header button, nav button");
    if (!anchor || document.getElementById("coinsHeaderBtn")) return;
    const btn = document.createElement("button");
    btn.id = "coinsHeaderBtn";
    btn.className = "coins-display";
    btn.innerHTML = `<span class="coins-val">${coins.toLocaleString()}</span> 🪙`;
    btn.addEventListener("click", window.openMarket);
    anchor.parentElement.insertBefore(btn, anchor);
  }

  /* ── TEAM TAB IN DASHBOARD ───────────────────────────────────── */
  function injectDashboardTeamTab() {
    const tabs = document.querySelector("#dashboardModal .tabs");
    if (!tabs || document.querySelector('[data-tab="teams"]')) return;

    const tab = document.createElement("div");
    tab.className = "tab";
    tab.dataset.tab = "teams";
    tab.textContent = "⚔️ Teams";
    tabs.appendChild(tab);

    const dashContent = document.getElementById("dashboardContent");
    if (!dashContent) return;
    const panel = document.createElement("div");
    panel.className = "tab-content";
    panel.id = "teamsTab";
    panel.style.display = "none";
    panel.innerHTML = `
      <div style="padding:1rem 0;">
        <p style="color:#9ca3af;margin:0 0 1.25rem;font-size:.9rem;">Form a team, compete on the team leaderboard, and invite friends — NitroType style.</p>
        <div style="display:flex;flex-wrap:wrap;gap:.75rem;margin-bottom:1.5rem;">
          <button onclick="window.openTeams()" class="feat-btn feat-btn-blue">⚔️ Open Teams</button>
          <button onclick="window.openMarket()" class="feat-btn" style="background:rgba(255,213,42,.15);color:#ffd12a;border:1px solid rgba(255,213,42,.3);">🛒 Market</button>
        </div>
        <div id="dashTeamPreview"></div>
      </div>`;
    dashContent.appendChild(panel);

    tab.addEventListener("click", () => {
      document.querySelectorAll("#dashboardModal .tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll("#dashboardModal .tab-content").forEach(c => c.style.display = "none");
      document.getElementById("quizDetailView") && (document.getElementById("quizDetailView").style.display = "none");
      tab.classList.add("active");
      panel.style.display = "block";
      // Render mini team preview
      renderDashTeamPreview();
    });
  }

  function renderDashTeamPreview() {
    const preview = document.getElementById("dashTeamPreview");
    if (!preview) return;
    const user = window.auth?.currentUser;
    if (!user) { preview.innerHTML = '<p style="color:#9ca3af;">Sign in to see your team.</p>'; return; }
    if (!myTeamId) { preview.innerHTML = '<p style="color:#9ca3af;">You\'re not in a team yet. Open Teams to create or join one.</p>'; return; }
    window.database.ref(`teams/${myTeamId}`).once("value", snap => {
      const team = snap.val();
      if (!team) { preview.innerHTML = '<p style="color:#9ca3af;">Team not found.</p>'; return; }
      preview.innerHTML = `
        <div style="background:rgba(255,255,255,.05);border-radius:16px;padding:1.1rem;border:1px solid rgba(96,165,250,.2);">
          <div style="display:flex;align-items:center;gap:.75rem;">
            <span style="font-size:2rem;">${team.emoji || "⚔️"}</span>
            <div>
              <div style="font-weight:900;">${team.name}</div>
              <div style="font-size:.8rem;color:#9ca3af;">${Object.keys(team.members || {}).length} members · <span style="color:#ffd12a;">${(team.totalXp || 0).toLocaleString()} XP</span></div>
            </div>
          </div>
        </div>`;
    });
  }

  /* ── QUIZ OVER DASHBOARD ─────────────────────────────────────── */
  function fixQuizOverDashboard() {
    const quizOverlay = document.getElementById("quizOverlay");
    if (quizOverlay) quizOverlay.style.zIndex = "10000";
    const quizShell = document.getElementById("quizShell");
    if (quizShell) quizShell.style.zIndex = "10001";

    // Patch startCustomQuiz so it doesn't close dashboard
    const orig = window.startCustomQuiz;
    if (orig && !orig._featPatched) {
      window.startCustomQuiz = function (idx) {
        return orig.call(this, idx);
      };
      window.startCustomQuiz._featPatched = true;
    }

    // Capture quiz-start clicks inside dashboard without closing it
    const dashContent = document.getElementById("dashboardContent");
    if (dashContent && !dashContent._featWired) {
      dashContent._featWired = true;
      dashContent.addEventListener("click", function (e) {
        const btn = e.target.closest('[data-action="launch-custom-quiz"], .play-btn[data-quiz-id]');
        if (!btn) return;
        e.stopPropagation();
        const qid = btn.dataset.quizId || btn.dataset.quizIndex;
        const allQ = [...(window.customQuizzes || []), ...(window.publicQuizzes || [])];
        let quiz = allQ.find(q => String(q.id) === String(qid));
        if (!quiz && !isNaN(+qid)) quiz = allQ[+qid];
        if (quiz) {
          let idx = (window.customQuizzes || []).findIndex(q => q.id === quiz.id);
          if (idx < 0) {
            window.customQuizzes = window.customQuizzes || [];
            window.customQuizzes.push(quiz);
            idx = window.customQuizzes.length - 1;
          }
          if (window.startCustomQuiz) window.startCustomQuiz(idx);
        }
      }, true);
    }
  }

  /* ── PATCH submitQuiz ────────────────────────────────────────── */
  function patchSubmitQuiz() {
    const orig = window.submitQuiz;
    if (!orig || orig._featCoinPatched) return;
    window.submitQuiz = async function () {
      const result = await orig.apply(this, arguments);
      setTimeout(() => {
        const accuracy = Number(window._lastQuizAccuracy || 0);
        awardCoins(accuracy);

        // Apply XP boost if equipped
        if (equippedItems["xpboost"] === "xp_boost_1") {
          const bonus = (window.xp || 0); // already counted once; just add same amount
          window.xp = (window.xp || 0) + (accuracy > 0 ? Math.round(accuracy / 10) * 10 : 0);
          delete equippedItems["xpboost"];
          saveCoins();
          showFeatToast("⚡ 2× XP Boost applied!");
        }

        // Update team XP
        const user = window.auth?.currentUser;
        if (user && myTeamId) {
          window.database.ref(`teams/${myTeamId}/members/${user.uid}/xp`).set(window.xp || 0);
          window.database.ref(`teams/${myTeamId}/members`).once("value", s => {
            let total = 0;
            s.forEach(c => total += Number(c.val()?.xp || 0));
            window.database.ref(`teams/${myTeamId}/totalXp`).set(total);
          });
        }

        // Write leaderboard
        if (user) {
          const name = window.currentPlayer || user.displayName || "Player";
          const avatar = user.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111827&color=fff`;
          window.database.ref(`leaderboard/${user.uid}`).set({
            uid: user.uid, name,
            points: window.xp || 0,
            weeklyXp: window.xp || 0,
            quizzes: (window.history || []).length,
            league: (typeof window.getLeague === "function" ? window.getLeague(window.xp || 0).name : "Bronze"),
            avatar, updatedAt: Date.now()
          });
        }

        checkAndShowTop5Banner();
      }, 500);
      return result;
    };
    window.submitQuiz._featCoinPatched = true;
  }

  /* ── LEADERBOARD PATCH ───────────────────────────────────────── */
  function patchLeaderboard() {
    window.showLeaderboard = function () {
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
          return { uid, name, points: Number(d.points || d.weeklyXp || d.xp || 0),
            quizzes: Number(d.quizzes || 0), league: d.league || "Bronze",
            avatar: d.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111827&color=fff` };
        }).sort((a, b) => b.points - a.points);

        const myUid = window.auth?.currentUser?.uid;
        const myIdx = entries.findIndex(e => myUid ? e.uid === myUid : e.name === window.currentPlayer);
        const myEntry = myIdx >= 0 ? entries[myIdx] : null;

        if (ur) ur.innerHTML = `
          <div style="width:44px;height:44px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;margin-right:.9rem;font-weight:900;font-size:.9rem;">
            #${myIdx >= 0 ? myIdx + 1 : "-"}
          </div>
          <div style="flex:1;display:flex;justify-content:space-between;align-items:center;gap:.5rem;">
            <span style="font-weight:700;">${myEntry?.name || window.currentPlayer}</span>
            <span style="font-weight:700;color:#ffd12a;">${(myEntry?.points ?? (window.xp || 0)).toLocaleString()} XP</span>
          </div>`;

        if (!lc) return;
        const top20 = entries.slice(0, 20);
        if (!top20.length) { lc.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;">No players yet!</div>'; return; }
        const medals = ["🥇", "🥈", "🥉"];
        const highest = Math.max(1, top20[0].points);
        lc.innerHTML = '<div style="display:flex;flex-direction:column;gap:.45rem;">' +
          top20.map((e, i) => {
            const isMe = myUid ? e.uid === myUid : e.name === window.currentPlayer;
            const fill = Math.min(100, Math.round(e.points / highest * 100));
            return `<div style="display:flex;align-items:center;gap:.7rem;padding:.8rem;border-radius:14px;
              border:${isMe ? "2px solid rgba(96,165,250,.6)" : "1px solid rgba(255,255,255,.08)"};
              background:${isMe ? "rgba(96,165,250,.08)" : "rgba(255,255,255,.04)"};cursor:pointer;"
              onclick="window._openPlayerProfile('${e.uid}')">
              <div style="width:36px;text-align:center;font-weight:900;font-size:${i < 3 ? "1.2" : ".88"}rem;">${medals[i] || "#" + (i + 1)}</div>
              <img src="${e.avatar}" style="width:34px;height:34px;border-radius:10px;object-fit:cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(e.name)}&background=111827&color=fff'">
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${e.name}${isMe ? " ⭐" : ""}</div>
                <div style="height:4px;border-radius:99px;background:rgba(0,0,0,.3);margin-top:3px;">
                  <div style="height:100%;width:${fill}%;border-radius:99px;background:linear-gradient(90deg,#60a5fa,#7cf0c2);"></div>
                </div>
              </div>
              <strong style="white-space:nowrap;font-size:.95rem;">${e.points.toLocaleString()} XP</strong>
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

  /* ── PUBLIC QUIZZES SYNC ─────────────────────────────────────── */
  function patchPublicQuizzes() {
    window.database.ref("publicQuizzes").on("value", snap => {
      const data = snap.val() || {};
      const quizzes = Object.values(data).filter(q => q?.questions?.length);
      quizzes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      const list = document.getElementById("publicQuizzesList");
      if (!list) return;
      if (!quizzes.length) {
        list.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;">No public quizzes yet. Create one!</div>';
        return;
      }
      const myUid = window.auth?.currentUser?.uid;
      list.innerHTML = quizzes.map(quiz => {
        const id = String(quiz.id || "").replace(/['"<>]/g, "");
        const isMine = myUid && quiz.authorId === myUid;
        const qCount = (quiz.questions || []).length;
        return `
          <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:1.1rem;margin-bottom:.65rem;">
            <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem;">
              <span style="font-size:.75rem;color:#9ca3af;">🌐 Public${isMine ? " · <span style='color:#93c5fd;'>Yours</span>" : ""}</span>
            </div>
            <h3 style="margin:0 0 .3rem;font-weight:800;font-size:1rem;">${quiz.title || "Untitled"}</h3>
            ${quiz.description ? `<p style="color:#9ca3af;font-size:.85rem;margin:0 0 .4rem;">${quiz.description}</p>` : ""}
            <div style="font-size:.75rem;color:#6b7280;margin-bottom:.65rem;">By ${quiz.author || "Unknown"} · ${qCount} questions</div>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
              <button onclick="window._playPublicQuiz('${id}')" class="feat-btn feat-btn-blue" style="font-size:.85rem;padding:.42rem 1rem;">▶ Play</button>
              ${isMine ? `<button onclick="window._deletePublicQuiz('${id}')" class="feat-btn feat-btn-red" style="font-size:.85rem;padding:.42rem .9rem;">🗑 Delete</button>` : ""}
            </div>
          </div>`;
      }).join("");
    });

    window._playPublicQuiz = function (quizId) {
      window.database.ref(`publicQuizzes/${quizId}`).once("value", snap => {
        const quiz = snap.val();
        if (!quiz?.questions) { showFeatToast("Quiz not found."); return; }
        window.customQuizzes = window.customQuizzes || [];
        const existing = window.customQuizzes.findIndex(q => q.id === quizId);
        let idx;
        if (existing >= 0) { idx = existing; }
        else { window.customQuizzes.push(quiz); idx = window.customQuizzes.length - 1; }
        if (window.startCustomQuiz) window.startCustomQuiz(idx);
      });
    };

    window._deletePublicQuiz = async function (quizId) {
      if (!confirm("Delete this public quiz?")) return;
      await window.database.ref(`publicQuizzes/${quizId}`).remove();
      await window.firestore.collection("publicQuizzes").doc(quizId).delete().catch(() => {});
      showFeatToast("Quiz deleted.");
    };
  }

  /* ── TOP-5 BANNER ────────────────────────────────────────────── */
  function checkAndShowTop5Banner() {
    const user = window.auth?.currentUser;
    if (!user) return;
    checkIsTop5(user.uid).then(isTop5 => {
      const existing = document.getElementById("top5HomeBanner");
      if (!isTop5) { if (existing) existing.remove(); return; }
      if (existing) return;
      const banner = document.createElement("div");
      banner.id = "top5HomeBanner";
      banner.innerHTML = "🏆 YOU'RE IN THE TOP 5! 🏆";
      banner.addEventListener("click", () => window._openPlayerProfile(user.uid));
      document.body.prepend(banner);
    });
  }

  /* ── TOAST ───────────────────────────────────────────────────── */
  function showFeatToast(msg) {
    if (window.showToast) { window.showToast(msg); return; }
    const t = document.createElement("div");
    t.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:99999;background:rgba(17,24,39,.96);border:1px solid rgba(255,255,255,.15);color:white;padding:.75rem 1.2rem;border-radius:14px;font-weight:600;font-size:.9rem;box-shadow:0 8px 24px rgba(0,0,0,.4);animation:lgIn .3s ease;max-width:320px;";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  /* ── INIT ────────────────────────────────────────────────────── */
  function init() {
    injectCSS();

    window.auth.onAuthStateChanged(user => {
      if (user) {
        hideLoginGate();
        startSessionTracking();
        loadCoins();
        checkAndShowTop5Banner();
        // Load team ID
        window.database.ref(`accounts/${user.uid}/teamId`).once("value", s => { myTeamId = s.val(); });
        // Notify pending friend requests
        window.database.ref(`accounts/${user.uid}/friendRequests`).once("value", snap => {
          const reqs = snap.val();
          if (reqs) showFeatToast(`👋 You have ${Object.keys(reqs).length} friend request(s)!`);
        });
        // Handle team invites
        window.database.ref(`accounts/${user.uid}/teamInvites`).once("value", snap => {
          const invites = snap.val();
          if (!invites) return;
          const teamId = Object.keys(invites)[0];
          const invite = invites[teamId];
          if (confirm(`⚔️ ${invite.fromName} invited you to join their team "${teamId}"! Accept?`)) {
            window._featJoinTeamById(teamId, user);
          } else {
            window.database.ref(`accounts/${user.uid}/teamInvites/${teamId}`).remove();
          }
        });
      } else {
        showLoginGate();
        clearTimeout(_sessionTimer);
        localStorage.removeItem(SESSION_KEY);
      }
    });

    // Patch everything after app boots
    const patchAll = () => {
      injectCoinsIntoHeader();
      injectDashboardTeamTab();
      fixQuizOverDashboard();
      patchSubmitQuiz();
      patchLeaderboard();
      patchPublicQuizzes();
    };

    if (document.readyState === "complete") {
      setTimeout(patchAll, 900);
    } else {
      window.addEventListener("load", () => setTimeout(patchAll, 900));
    }
  }

  waitForFirebase(init);
})();
