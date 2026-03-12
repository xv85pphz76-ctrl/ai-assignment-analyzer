const modalButtons = document.querySelectorAll("[data-modal]");
const modal = document.getElementById("info-modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");

const modalContent = {
  how: {
    title: "How it works",
    body: `\n      <ol>\n        <li>Upload your assignment brief (PDF or text).</li>\n        <li>Upload your draft or paste your text.</li>\n        <li>We return missing requirements, structure balance, and next-step suggestions.</li>\n      </ol>\n    `
  },
  benefits: {
    title: "Benefits",
    body: `\n      <ul>\n        <li>Know what’s missing before you submit.</li>\n        <li>Improve structure and clarity quickly.</li>\n        <li>Works with any university brief worldwide.</li>\n      </ul>\n    `
  },
  pricing: {
    title: "Pricing",
    body: `\n      <div class="modal-pricing">\n        <div>\n          <strong>Free</strong>\n          <p>1 check per week</p>\n        </div>\n        <div>\n          <strong>Pro</strong>\n          <p>£4.99 / month, unlimited checks</p>\n        </div>\n      </div>\n    `
  },
  faq: {
    title: "FAQ",
    body: `\n      <p><strong>Is this rewriting my work?</strong> No. We only highlight gaps and suggestions.</p>\n      <p><strong>Will my files be saved?</strong> Only if you sign up. Guests get 1 free check.</p>\n      <p><strong>Does it work globally?</strong> Yes, any university brief.</p>\n    `
  }
};

function openModal(key) {
  const content = modalContent[key];
  if (!content || !modal) return;
  modalTitle.textContent = content.title;
  modalBody.innerHTML = content.body;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

modalButtons.forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    openModal(btn.dataset.modal);
  });
});

if (modalClose) modalClose.addEventListener("click", closeModal);
if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});
