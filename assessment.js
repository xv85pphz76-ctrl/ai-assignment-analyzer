const form = document.getElementById("assessment-form");
const statusEl = document.getElementById("assessment-status");
const resultEl = document.getElementById("assessment-result");
const historyList = document.getElementById("history-list");
const navAuth = document.getElementById("nav-auth");
const avatarSlot = document.getElementById("avatar-slot");
const drawerOverlay = document.getElementById("drawer-overlay");
const drawerHeader = document.getElementById("drawer-header");
const drawerLinks = document.getElementById("drawer-links");
const drawerClose = document.getElementById("drawer-close");
const guestHint = document.getElementById("guest-hint");

let currentUser = null;

function renderList(items) {
  if (!items || !items.length) return "<p class=\"empty\">None listed.</p>";
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function renderResult(data) {
  const structure = data.structure || {};
  return `
    <div class="result-block">
      <h3>Summary</h3>
      <p>${data.summary || ""}</p>
    </div>
    <div class="result-grid">
      <div class="result-block">
        <h3>Coverage score</h3>
        <p class="score">${data.coverage_score ?? "-"}/100</p>
      </div>
      <div class="result-block">
        <h3>Structure</h3>
        <p>Intro: ${structure.intro_word_count ?? 0} words</p>
        <p>Body: ${structure.body_word_count ?? 0} words</p>
        <p>Conclusion: ${structure.conclusion_word_count ?? 0} words</p>
        <p class="muted">${structure.notes || ""}</p>
      </div>
    </div>
    <div class="result-block">
      <h3>Missing requirements</h3>
      ${renderList(data.missing_requirements)}
    </div>
    <div class="result-block">
      <h3>Suggestions to improve</h3>
      ${renderList(data.improvement_suggestions)}
    </div>
    <div class="result-block">
      <h3>Grammar insights</h3>
      ${renderList(data.grammar_insights)}
    </div>
    <div class="result-block">
      <h3>Citations note</h3>
      <p>${data.citations_note || ""}</p>
    </div>
    ${data.raw ? `<div class="result-block"><h3>Raw output</h3><pre>${data.raw}</pre></div>` : ""}
  `;
}

function renderHistory(items) {
  if (!historyList) return;
  if (!items || !items.length) {
    historyList.innerHTML = "<p class=\"empty\">No saved checks yet.</p>";
    return;
  }
  historyList.innerHTML = items
    .map((item) => {
      const date = new Date(item.created_at).toLocaleString();
      const score = item.result?.coverage_score ?? "-";
      const summary = item.result?.summary || "No summary.";
      return `
        <div class="history-card">
          <div>
            <strong>${date}</strong>
            <p>${summary}</p>
          </div>
          <span class="history-score">${score}</span>
        </div>
      `;
    })
    .join("");
}

async function loadHistory() {
  if (!currentUser) {
    renderHistory([]);
    return;
  }
  const res = await fetch("/assess/history");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    renderHistory([]);
    return;
  }
  renderHistory(data.history || []);
}

function setAuthState(user) {
  currentUser = user;
  if (navAuth) {
    if (user) {
      const initials = initialsFromName(user.name, user.email);
      if (avatarSlot) {
        avatarSlot.innerHTML = `
          <button class="avatar-button" id="avatar-button">${initials}</button>
        `;
        const avatarBtn = document.getElementById("avatar-button");
        if (avatarBtn) {
          avatarBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            openDrawer();
          });
        }
      }
      navAuth.innerHTML = "";
      if (drawerHeader) {
        drawerHeader.innerHTML = `
          <strong>${user.name || "Student"}</strong>
          <span class="muted">${user.email}</span>
        `;
      }
      if (drawerLinks) {
        drawerLinks.innerHTML = `
          <a href="./dashboard.html">Dashboard</a>
          <a href="./account.html">Account</a>
          <a href="./assessment.html">Saved checks</a>
          <a href="./pricing.html">Billing & subscription</a>
          <a href="./settings.html">Settings</a>
          <button id="logout-button" type="button">Log out</button>
        `;
        const logoutBtn = document.getElementById("logout-button");
        if (logoutBtn) {
          logoutBtn.addEventListener("click", async () => {
            await fetch("/auth/logout", { method: "POST" });
            closeDrawer();
            setAuthState(null);
            await loadHistory();
          });
        }
      }
      if (guestHint) guestHint.textContent = "Signed in: your checks will be saved automatically.";
    } else {
      if (avatarSlot) avatarSlot.innerHTML = "";
      navAuth.innerHTML = `
        <a class="btn ghost" href="./login.html">Log in</a>
        <a class="btn primary" href="./signup.html">Sign up</a>
      `;
      if (guestHint) guestHint.textContent = "Guest access: 1 free check (sign up to save history).";
    }
  }
}

async function refreshAuth() {
  const res = await fetch("/me");
  const data = await res.json().catch(() => ({}));
  setAuthState(data.user || null);
  await loadHistory();
}

// Auth handled via separate login/signup pages.

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "";
  resultEl.innerHTML = "";

  const formData = new FormData();
  const briefFile = document.getElementById("brief-file").files[0];
  const draftFile = document.getElementById("draft-file").files[0];
  const briefText = document.getElementById("brief-text").value.trim();
  const draftText = document.getElementById("draft-text").value.trim();

  if (briefFile) formData.append("brief_file", briefFile);
  if (draftFile) formData.append("draft_file", draftFile);
  if (briefText) formData.append("brief_text", briefText);
  if (draftText) formData.append("draft_text", draftText);

  const streamBox = document.createElement("div");
  streamBox.id = "stream-box";
  streamBox.className = "stream-box";
  streamBox.textContent = "Analyzing...";
  resultEl.appendChild(streamBox);

  try {
    const res = await fetch("/assess?stream=1", {
      method: "POST",
      body: formData
    });

    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      statusEl.textContent = data.error || "Something went wrong.";
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      if (streamBox) {
        streamBox.textContent = "Analyzing...";
      }
    }

    const cleaned = fullText.replace(/\\n\\n__END__\\s*$/m, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const extracted = extractJson(cleaned);
      if (extracted) {
        parsed = extracted;
      } else {
        statusEl.textContent = "";
        if (streamBox) {
          streamBox.textContent = cleaned || "Analysis complete (no output).";
        }
        return;
      }
    }

    statusEl.textContent = "";
    resultEl.innerHTML = renderResult(parsed);
    await loadHistory();
  } catch (err) {
    statusEl.textContent = "Request failed. Please try again.";
  }
});

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

refreshAuth();

function openDrawer() {
  if (drawerOverlay) {
    drawerOverlay.classList.add("open");
    drawerOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
  }
}

function closeDrawer() {
  if (drawerOverlay) {
    drawerOverlay.classList.remove("open");
    drawerOverlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("drawer-open");
  }
}

if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
if (drawerOverlay) {
  drawerOverlay.addEventListener("click", (event) => {
    if (event.target === drawerOverlay) closeDrawer();
  });
}

function initialsFromName(name, email) {
  const source = (name || "").trim() || (email || "").trim();
  if (!source) return "U";
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
  return letters.toUpperCase();
}
