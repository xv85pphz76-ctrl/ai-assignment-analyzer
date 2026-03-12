const navAuth = document.getElementById("nav-auth");
const avatarSlot = document.getElementById("avatar-slot");
const drawerOverlay = document.getElementById("drawer-overlay");
const drawerHeader = document.getElementById("drawer-header");
const drawerLinks = document.getElementById("drawer-links");
const drawerClose = document.getElementById("drawer-close");
const profileBlock = document.getElementById("profile-block");
const historyList = document.getElementById("history-list");

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
  const res = await fetch("/assess/history");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    renderHistory([]);
    return;
  }
  renderHistory(data.history || []);
}

function setAuthState(user) {
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
            window.location.href = "/landing.html";
          });
        }
      }
    } else {
      if (avatarSlot) avatarSlot.innerHTML = "";
      navAuth.innerHTML = `
        <a class="btn ghost" href="./login.html">Log in</a>
        <a class="btn primary" href="./signup.html">Sign up</a>
      `;
    }
  }

  if (profileBlock) {
    if (user) {
      profileBlock.innerHTML = `
        <p><strong>Name:</strong> ${user.name || "Student"}</p>
        <p><strong>Email:</strong> ${user.email}</p>
      `;
    } else {
      profileBlock.innerHTML = `
        <p>Please log in to view your account.</p>
        <a class="btn primary" href="/login.html">Log in</a>
      `;
    }
  }
}

async function init() {
  const res = await fetch("/me");
  const data = await res.json().catch(() => ({}));
  const user = data.user || null;
  setAuthState(user);
  if (user) await loadHistory();
}

init();

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
