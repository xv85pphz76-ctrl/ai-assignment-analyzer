const navAuth = document.getElementById("nav-auth");
const avatarSlot = document.getElementById("avatar-slot");
const drawerOverlay = document.getElementById("drawer-overlay");
const drawerHeader = document.getElementById("drawer-header");
const drawerLinks = document.getElementById("drawer-links");
const drawerClose = document.getElementById("drawer-close");

const profileForm = document.getElementById("profile-form");
const profileMessage = document.getElementById("profile-message");
const passwordForm = document.getElementById("password-form");
const passwordMessage = document.getElementById("password-message");
const marketingOpt = document.getElementById("marketing-opt");
const savePreferences = document.getElementById("save-preferences");
const prefMessage = document.getElementById("pref-message");
const exportData = document.getElementById("export-data");
const deleteForm = document.getElementById("delete-form");
const deleteMessage = document.getElementById("delete-message");

let currentUser = null;

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

function setAuthState(user) {
  currentUser = user;
  if (navAuth) {
    if (user) {
      const initials = initialsFromName(user.name, user.email);
      if (avatarSlot) {
        avatarSlot.innerHTML = `<button class="avatar-button" id="avatar-button">${initials}</button>`;
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
        drawerHeader.innerHTML = `<strong>${user.name || "Student"}</strong><span class="muted">${user.email}</span>`;
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
}

async function init() {
  const res = await fetch("/me");
  const data = await res.json().catch(() => ({}));
  const user = data.user || null;
  if (!user) {
    window.location.href = "/login.html";
    return;
  }
  setAuthState(user);
  currentUser = user;
  document.getElementById("profile-name").value = user.name || "";
  document.getElementById("profile-email").value = user.email || "";
  marketingOpt.checked = Boolean(user.marketing_opt_in);
}

if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
if (drawerOverlay) {
  drawerOverlay.addEventListener("click", (event) => {
    if (event.target === drawerOverlay) closeDrawer();
  });
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  profileMessage.textContent = "";
  const payload = {
    name: document.getElementById("profile-name").value.trim(),
    email: document.getElementById("profile-email").value.trim(),
    current_password: document.getElementById("profile-password").value
  };
  const res = await fetch("/settings/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    profileMessage.textContent = data.error || "Update failed.";
    return;
  }
  profileMessage.textContent = "Profile updated.";
  currentUser = data.user;
});

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  passwordMessage.textContent = "";
  const payload = {
    current_password: document.getElementById("current-password").value,
    new_password: document.getElementById("new-password").value
  };
  const res = await fetch("/settings/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    passwordMessage.textContent = data.error || "Update failed.";
    return;
  }
  passwordMessage.textContent = "Password updated.";
  passwordForm.reset();
});

savePreferences.addEventListener("click", async () => {
  prefMessage.textContent = "";
  const res = await fetch("/settings/preferences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ marketing_opt_in: marketingOpt.checked })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    prefMessage.textContent = data.error || "Update failed.";
    return;
  }
  prefMessage.textContent = "Preferences saved.";
});

exportData.addEventListener("click", async () => {
  const res = await fetch("/settings/export");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    prefMessage.textContent = data.error || "Export failed.";
    return;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "assessment-checker-export.json";
  a.click();
  URL.revokeObjectURL(url);
});

deleteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  deleteMessage.textContent = "";
  const res = await fetch("/settings/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password: document.getElementById("delete-password").value })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    deleteMessage.textContent = data.error || "Delete failed.";
    return;
  }
  window.location.href = "/landing.html";
});

init();
