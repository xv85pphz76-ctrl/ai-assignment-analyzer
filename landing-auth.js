const navAuth = document.getElementById("nav-auth");
const avatarSlot = document.getElementById("avatar-slot");
const drawerOverlay = document.getElementById("drawer-overlay");
const drawerHeader = document.getElementById("drawer-header");
const drawerLinks = document.getElementById("drawer-links");
const drawerClose = document.getElementById("drawer-close");
const pricingLink = document.getElementById("pricing-link");
const pricingCta = document.getElementById("pricing-cta");

function initialsFromName(name, email) {
  const source = (name || "").trim() || (email || "").trim();
  if (!source) return "U";
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
  return letters.toUpperCase();
}

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

async function loadHomeReports() {
  const section = document.getElementById("reports-section");
  const list = document.getElementById("home-reports");
  if (!section || !list) return;
  const res = await fetch("/assess/history");
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.history) {
    section.classList.add("hidden");
    return;
  }
  if (data.history.length === 0) {
    section.classList.add("hidden");
    return;
  }
  section.classList.remove("hidden");
  list.innerHTML = data.history
    .slice(0, 4)
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

async function refreshAuth() {
  if (!navAuth) return;
  const res = await fetch("/me");
  const data = await res.json().catch(() => ({}));
  const user = data.user || null;
  if (user) {
    if (pricingLink) pricingLink.href = "./pricing.html";
    if (pricingCta) pricingCta.href = "./pricing.html";
    if (avatarSlot) {
      const initials = initialsFromName(user.name, user.email);
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
          refreshAuth();
        });
      }
    }
    loadHomeReports();
  } else {
    if (pricingLink) pricingLink.href = "./pricing.html";
    if (pricingCta) pricingCta.href = "./pricing.html";
    if (avatarSlot) avatarSlot.innerHTML = "";
    navAuth.innerHTML = `
      <a class="btn ghost" href="./login.html">Log in</a>
      <a class="btn primary" href="./signup.html">Sign up</a>
    `;
    const section = document.getElementById("reports-section");
    if (section) section.classList.add("hidden");
  }
}

if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
if (drawerOverlay) {
  drawerOverlay.addEventListener("click", (event) => {
    if (event.target === drawerOverlay) closeDrawer();
  });
}

refreshAuth();
