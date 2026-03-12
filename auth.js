async function handleLogin(event) {
  event.preventDefault();
  const errorEl = document.getElementById("auth-error");
  if (errorEl) errorEl.textContent = "";
  const payload = {
    email: document.getElementById("login-email").value.trim(),
    password: document.getElementById("login-password").value
  };
  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (errorEl) errorEl.textContent = data.error || "Login failed.";
    return;
  }
  window.location.href = "/landing.html";
}

async function handleSignup(event) {
  event.preventDefault();
  const errorEl = document.getElementById("auth-error");
  if (errorEl) errorEl.textContent = "";
  const payload = {
    name: document.getElementById("signup-name").value.trim(),
    email: document.getElementById("signup-email").value.trim(),
    password: document.getElementById("signup-password").value
  };
  const res = await fetch("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (errorEl) errorEl.textContent = data.error || "Sign up failed.";
    return;
  }
  window.location.href = "/landing.html";
}

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

if (loginForm) loginForm.addEventListener("submit", handleLogin);
if (signupForm) signupForm.addEventListener("submit", handleSignup);
