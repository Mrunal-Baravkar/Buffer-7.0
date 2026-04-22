"use strict";

/* =============================================
   GOOGLE SEARCH CLONE — script.js
   Dead Link Recovery System + BFS Graph
   ============================================= */

// ─── BACKEND CONFIG ───────────────────────────
const BACKEND = "http://localhost:8000";

// ─── DOM REFS ─────────────────────────────────
const searchInput = document.getElementById("searchInput");
const contextMenu = document.getElementById("contextMenu");
const suggestBox = document.getElementById("suggestBox");
const overlay404 = document.getElementById("overlay404");
const overlay404Url = document.getElementById("overlay404Url");
const overlay404Msg = document.getElementById("overlay404Msg");
const recoverBtn = document.getElementById("recoverBtn");
const recoveringSpinner = document.getElementById("recoveringSpinner");
const checkingToast = document.getElementById("checkingToast");
const toastMsg = document.getElementById("toastMsg");
const bfsLog = document.getElementById("bfsLog");

// ─── STATE ────────────────────────────────────
let currentDeadUrl = null;
let toastTimer = null;

// ─── SEARCH FUNCTIONS ─────────────────────────

function doSearch() {
  const query = searchInput.value.trim();
  if (!query) return;
  window.open(
    `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    "_blank",
  );
}

function clearSearch() {
  searchInput.value = "";
  searchInput.focus();
  hideSuggestBox();
}

function resetPage() {
  close404();
}

// ─── SEARCH SUGGESTIONS ───────────────────────

const SUGGESTIONS = [
  "govt websites india",
  "india portal",
  "digital india services",
  "mygov citizen portal",
  "nic e-governance",
  "digilocker documents",
];

function showSuggestBox(val) {
  const matches = SUGGESTIONS.filter((s) => s.includes(val.toLowerCase()));
  if (!matches.length) {
    hideSuggestBox();
    return;
  }
  suggestBox.innerHTML = "";
  matches.forEach((m) => {
    const li = document.createElement("li");
    li.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="#9aa0a6"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg> ${m}`;
    li.addEventListener("click", () => {
      searchInput.value = m;
      hideSuggestBox();
      doSearch();
    });
    suggestBox.appendChild(li);
  });
  suggestBox.classList.add("show");
}

function hideSuggestBox() {
  suggestBox.innerHTML = "";
  suggestBox.classList.remove("show");
}

searchInput.addEventListener("input", (e) => {
  const val = e.target.value;
  val.length > 0 ? showSuggestBox(val) : hideSuggestBox();
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    doSearch();
    hideSuggestBox();
  }
  if (e.key === "Escape") {
    searchInput.blur();
    hideSuggestBox();
  }
});

// ─── KEYBOARD SHORTCUT (/) ───────────────────

document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== searchInput) {
    e.preventDefault();
    searchInput.focus();
  }
});

// ─── NAV TABS ─────────────────────────────────

document.querySelectorAll(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", (e) => {
    e.preventDefault();
    document
      .querySelectorAll(".nav-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
  });
});

// ─── CONTEXT MENU ─────────────────────────────

function toggleMenu(btn) {
  const rect = btn.getBoundingClientRect();
  contextMenu.style.top = `${rect.bottom + 4}px`;
  contextMenu.style.left = `${Math.min(rect.left, window.innerWidth - 210)}px`;
  contextMenu.classList.toggle("visible");
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".context-menu") && !e.target.closest(".more-btn")) {
    contextMenu.classList.remove("visible");
  }
  if (!e.target.closest(".search-bar")) {
    hideSuggestBox();
  }
});

// ─── PAGINATION ────────────────────────────────

function setPage(el, num) {
  document
    .querySelectorAll(".page-link")
    .forEach((p) => p.classList.remove("active"));
  el.classList.add("active");
  document
    .querySelector(".results-container")
    .scrollIntoView({ behavior: "smooth" });
}

// ─── TOAST HELPER ─────────────────────────────

function showToast(msg) {
  toastMsg.textContent = msg;
  checkingToast.classList.add("show");
  clearTimeout(toastTimer);
}

function hideToast() {
  checkingToast.classList.remove("show");
}

// ─── 404 OVERLAY HELPERS ──────────────────────

function show404(url) {
  currentDeadUrl = url;
  overlay404Url.textContent = url;
  overlay404Msg.textContent =
    "This page could not be reached. The link may be broken or removed.";

  recoverBtn.disabled = false;
  recoverBtn.style.opacity = "1";
  recoverBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
    </svg>
    Recover Page`;

  recoveringSpinner.classList.remove("show");
  overlay404.classList.add("show");
}

function close404() {
  overlay404.classList.remove("show");
  currentDeadUrl = null;
  recoveringSpinner.classList.remove("show");
}

overlay404.addEventListener("click", (e) => {
  if (e.target === overlay404) close404();
});

// ─── RECOVER BUTTON ───────────────────────────

recoverBtn.addEventListener("click", async () => {
  if (!currentDeadUrl) return;

  recoverBtn.disabled = true;
  recoverBtn.style.opacity = "0.6";
  recoveringSpinner.classList.add("show");
  overlay404Msg.textContent = "Searching recovery map for an alternative link…";

  bfsAppend(`🔁 Recovery requested for: ${currentDeadUrl}`, "recover");
  bfsAppend(`   Querying backend /recover endpoint…`, "visit");

  try {
    const res = await fetch(
      `${BACKEND}/recover?url=${encodeURIComponent(currentDeadUrl)}`,
    );
    const newUrl = await res.text();

    if (newUrl && newUrl.trim() !== "NONE") {
      recoveringSpinner.classList.remove("show");
      overlay404Msg.textContent = `✅ Recovery found! Redirecting to: ${newUrl.trim()}`;
      bfsAppend(`✅ Recovered! → ${newUrl.trim()}`, "alive");
      bfsAppend(`   Redirecting browser now…`, "visit");
      await delay(1200);
      close404();
      window.location.href = newUrl.trim();
    } else {
      bfsAppend(`❌ No recovery link found for this URL.`, "dead");
      recoveringSpinner.classList.remove("show");
      overlay404Msg.textContent =
        "No recovery link is available for this page.";
      recoverBtn.disabled = false;
      recoverBtn.style.opacity = "1";
    }
  } catch (err) {
    console.error("❌ Backend not reachable:", err);
    bfsAppend(
      `⚠ Backend not reachable. Start server.java on port 8000.`,
      "dead",
    );
    recoveringSpinner.classList.remove("show");
    overlay404Msg.textContent =
      "⚠ Backend server is not running. Start server.java on port 8000.";
    recoverBtn.disabled = false;
    recoverBtn.style.opacity = "1";
  }
});

// ─── LINK CLICK HANDLER ───────────────────────

/**
 * Intercepts every link click.
 * 1. Prevents default navigation immediately.
 * 2. Calls backend /check?url=… (HashMap-based dead detection).
 * 3. If dead  → show custom 404 overlay (no navigation).
 * 4. If alive → navigate to the URL.
 * Recovery only happens when user explicitly clicks "Recover Page".
 */
async function handleLinkClick(e, anchor) {
  e.preventDefault();
  e.stopPropagation();

  const url = anchor.href;
  const isDead = anchor.dataset.dead === "true"; // fallback flag

  showToast("Checking link…");
  bfsAppend(`🔍 Clicked → ${url}`, "visit");
  bfsAppend(`   Sending request to /check endpoint…`, "visit");

  try {
    const res = await fetch(`${BACKEND}/check?url=${encodeURIComponent(url)}`);
    const status = (await res.text()).trim();

    hideToast();

    if (status === "404") {
      bfsAppend(`💀 DEAD link confirmed by HashMap: ${url}`, "dead");
      bfsAppend(
        `   Showing 404 overlay — click "Recover Page" to recover`,
        "recover",
      );
      show404(url);
    } else {
      bfsAppend(`✅ ALIVE: ${url}`, "alive");
      bfsAppend(`   Navigating…`, "visit");
      window.open(url, "_self");
    }
  } catch (err) {
    // Backend unreachable — fall back to data-dead attribute
    hideToast();
    console.warn("⚠ Backend unreachable, using HTML data-dead attribute");

    if (isDead) {
      bfsAppend(`💀 DEAD (offline fallback): ${url}`, "dead");
      bfsAppend(
        `   Showing 404 overlay — click "Recover Page" to recover`,
        "recover",
      );
      show404(url);
    } else {
      bfsAppend(`✅ Navigating (offline fallback): ${url}`, "alive");
      window.open(url, "_self");
    }
  }
}

// Attach click handlers — use a single delegated listener to avoid duplicates
document.querySelectorAll("a.result-link, a.result-main-link").forEach((a) => {
  a.addEventListener("click", (e) => handleLinkClick(e, a));
});

// ─── RIPPLE EFFECT ────────────────────────────

document.querySelectorAll(".result-title a").forEach((link) => {
  link.addEventListener("click", function (e) {
    const ripple = document.createElement("span");
    ripple.style.cssText = `
      position:absolute; border-radius:50%;
      background:rgba(138,180,248,0.25);
      width:60px; height:60px;
      left:${e.offsetX - 30}px; top:${e.offsetY - 30}px;
      transform:scale(0); animation:ripple .5s ease-out forwards; pointer-events:none;
    `;
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

const rippleStyle = document.createElement("style");
rippleStyle.textContent = `@keyframes ripple { to { transform:scale(4); opacity:0; } }`;
document.head.appendChild(rippleStyle);

// ─────────────────────────────────────────────
//  GRAPH + BFS TRAVERSAL  (DSA Core)
// ─────────────────────────────────────────────

/**
 * Website graph as Adjacency List.
 * Mirrors the HashMap in server.java so BFS panel stays in sync.
 */
const GRAPH = {
  "india.gov.in": [
    "india.gov.in/topics/agriculture",
    "india.gov.in/topics/education", // DEAD
    "india.gov.in/topics/health", // DEAD
    "india.gov.in/topics/infrastructure",
  ],
  "mha.gov.in": [
    "egazette.gov.in",
    "data.gov.in",
    "eci.gov.in",
    "mospi.gov.in/sdgs-broken", // DEAD
  ],
  "nic.in": [
    "digilocker.gov.in",
    "web.umang.gov.in",
    "esanjeevani.mohfw.gov.in",
  ],
  "digitalindia.gov.in": [
    "meity.gov.in",
    "csc.gov.in/old-portal", // DEAD
  ],
  "mygov.in": ["india.gov.in", "digitalindia.gov.in"],
};

const DEAD_LINKS = new Set([
  "india.gov.in/topics/education",
  "india.gov.in/topics/health",
  "mospi.gov.in/sdgs-broken",
  "csc.gov.in/old-portal",
]);

const RECOVERY_MAP = {
  "india.gov.in/topics/education": "https://www.education.gov.in",
  "india.gov.in/topics/health": "https://www.mohfw.gov.in",
  "mospi.gov.in/sdgs-broken": "https://mospi.gov.in",
  "csc.gov.in/old-portal": "https://csc.gov.in",
};

// ─── BFS LOG UI ───────────────────────────────

function bfsAppend(text, type = "visit") {
  const idle = bfsLog.querySelector(".bfs-idle");
  if (idle) idle.remove();

  const span = document.createElement("span");
  span.className = `bfs-entry ${type}`;
  span.textContent = text;
  bfsLog.appendChild(span);
  bfsLog.scrollTop = bfsLog.scrollHeight;
}

function bfsClear() {
  bfsLog.innerHTML = "";
}

// ─── BFS ALGORITHM ────────────────────────────

/**
 * BFS over the website graph.
 * Uses a Queue (array as FIFO) and a visited Set to avoid cycles.
 * Dead links are detected via the DEAD_LINKS Set (mirrors server HashMap).
 * Recovery URLs are looked up from RECOVERY_MAP.
 * Every step is logged in the BFS panel.
 */
async function runBFS() {
  bfsClear();

  const startNode = Object.keys(GRAPH)[0];
  const visited = new Set();
  const queue = [startNode]; // Array used as FIFO queue
  visited.add(startNode);

  let deadCount = 0;
  let recoveredCount = 0;

  bfsAppend(`🚀 BFS crawl started from: ${startNode}`, "visit");
  bfsAppend(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, "visit");
  await delay(100);

  let level = 0;

  while (queue.length > 0) {
    const levelSize = queue.length;
    bfsAppend(`\n📊 Level ${level} — ${levelSize} node(s) in queue`, "visit");
    await delay(80);

    const levelNodes = queue.splice(0, levelSize);

    for (const node of levelNodes) {
      bfsAppend(`\n  📍 Crawling: ${node}`, "visit");
      await delay(80);

      const neighbors = GRAPH[node] || [];

      if (neighbors.length === 0) {
        bfsAppend(`     ↳ Leaf node — no outgoing links`, "visit");
        await delay(40);
        continue;
      }

      bfsAppend(
        `     Found ${neighbors.length} link(s), checking each…`,
        "visit",
      );
      await delay(60);

      for (const neighbor of neighbors) {
        bfsAppend(`\n     ─ Checking: ${neighbor}`, "visit");
        await delay(60);

        if (DEAD_LINKS.has(neighbor)) {
          deadCount++;
          bfsAppend(`     💀 DEAD link detected! (HashMap match)`, "dead");
          await delay(60);
          bfsAppend(`     🔍 Recovering: searching recovery map…`, "recover");
          await delay(80);

          const recovery = RECOVERY_MAP[neighbor];
          if (recovery) {
            recoveredCount++;
            bfsAppend(`     ✅ Recovered! → ${recovery}`, "alive");
            bfsAppend(`     ✔  Continuing crawl with recovered URL`, "alive");
          } else {
            bfsAppend(`     ⛔ No recovery found — link skipped`, "dead");
          }
        } else {
          bfsAppend(`     ✅ ALIVE — OK`, "alive");
        }

        await delay(50);

        if (!visited.has(neighbor) && GRAPH[neighbor]) {
          visited.add(neighbor);
          queue.push(neighbor);
          bfsAppend(`     ➕ Enqueued: ${neighbor}`, "visit");
        }
      }
    }

    level++;
    await delay(50);
  }

  bfsAppend(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, "visit");
  bfsAppend(`🏁 BFS complete — ${visited.size} nodes traversed`, "alive");
  bfsAppend(`   Dead links found : ${deadCount}`, "dead");
  bfsAppend(`   Links recovered  : ${recoveredCount}`, "alive");
  bfsAppend(
    `   Unrecovered      : ${deadCount - recoveredCount}`,
    deadCount - recoveredCount > 0 ? "dead" : "alive",
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── INIT ─────────────────────────────────────

(function init() {
  console.log("✅ Google Search Clone + Dead Link Recovery System Loaded");
  console.log("📊 Graph nodes:", Object.keys(GRAPH).length);
  console.log("💀 Dead links:", DEAD_LINKS.size);
  console.log("🔁 Recovery entries:", Object.keys(RECOVERY_MAP).length);
  console.log(
    '💡 Press "/" to focus search. Click "▶ Run BFS Now" to trace the graph.',
  );
})();
