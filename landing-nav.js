const navItems = document.querySelectorAll(".nav-item");
const isMobile = () => window.matchMedia("(max-width: 700px)").matches;

function closeAll() {
  navItems.forEach((item) => item.classList.remove("open"));
}

navItems.forEach((item) => {
  const trigger = item.querySelector(".nav-trigger");
  if (!trigger) return;
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const isOpen = item.classList.contains("open");
    closeAll();
    if (!isOpen) {
      item.classList.add("open");
    }
  });
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".nav-item")) return;
  closeAll();
});

window.addEventListener("scroll", () => {
  closeAll();
}, { passive: true });
