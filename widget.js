const sessionId = Math.random().toString(36).slice(2);

window.addEventListener("load", () => {
  if (location.hash) {
    history.replaceState(null, "", location.pathname);
  }
  window.scrollTo(0, 0);
});

function setupChat({ chatId, formId, inputId, handoffId, context }) {
  const chat = document.getElementById(chatId);
  const form = document.getElementById(formId);
  const input = document.getElementById(inputId);
  const handoffBtn = document.getElementById(handoffId);
  if (!chat || !form || !input || !handoffBtn) return;

  function addMessage(text, role) {
    const el = document.createElement("div");
    el.className = `msg ${role}`;
    el.textContent = text;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    addMessage(message, "user");
    input.value = "";

    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, message })
    });

    if (!res.ok) {
      addMessage("Sorry — something went wrong. Please try again.", "bot");
      return;
    }

    const data = await res.json();
    addMessage(data.answer, "bot");
    if (data.handoff_required) {
      addMessage("Need a human? Tap 'Contact Cafe Rosa' and we will pass it along.", "bot");
    }
  });

  handoffBtn.addEventListener("click", async () => {
    const question = prompt("What should we pass to Cafe Rosa?");
    if (!question) return;
    const contact = prompt("Best contact details? (email or phone)");
    const res = await fetch("/handoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, contact, context })
    });
    if (res.ok) {
      addMessage("Thanks — we will pass this to the Cafe Rosa team.", "bot");
    } else {
      addMessage("Message failed. Please try again later.", "bot");
    }
  });

  return { addMessage, chat };
}

setupChat({
  chatId: "chat",
  formId: "composer",
  inputId: "message",
  handoffId: "handoff",
  context: "Cafe Rosa website"
});

const floatingChat = setupChat({
  chatId: "chat-float",
  formId: "composer-float",
  inputId: "message-float",
  handoffId: "handoff-float",
  context: "Cafe Rosa floating chat"
});

const toggle = document.getElementById("floating-toggle");
const panel = document.getElementById("floating-panel");
const closeBtn = document.getElementById("floating-close");

function openFloatingChat() {
  if (!panel) return;
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
  if (toggle) toggle.setAttribute("aria-expanded", "true");
  if (floatingChat && floatingChat.chat && floatingChat.chat.children.length === 0) {
    floatingChat.addMessage("Hello! How can we help you today?", "bot");
  }
}

function closeFloatingChat() {
  if (!panel) return;
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  if (toggle) toggle.setAttribute("aria-expanded", "false");
}

if (toggle && panel) {
  toggle.addEventListener("click", () => {
    if (panel.classList.contains("open")) {
      closeFloatingChat();
    } else {
      openFloatingChat();
    }
  });
}

if (closeBtn) {
  closeBtn.addEventListener("click", closeFloatingChat);
}
