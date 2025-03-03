const clampNumber = (low, slope, up) => Math.max(low, Math.min(slope, up));
const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
const navbar = document.getElementById("navbar");
const content = document.getElementById("content");
const sticky = navbar.offsetTop;

function updateNavbarSticky() {
  const isSticky = window.pageYOffset > sticky;
  navbar.classList.toggle("sticky", isSticky);

  const paddingTop = isSticky ? clampNumber(48, 0.13 * vw, 64) : 0;
  content.style.paddingTop = `${paddingTop}px`;
}

window.addEventListener("scroll", updateNavbarSticky);

const page = document.getElementById("page");
const pageprop = window.getComputedStyle(page);

const popups = document.querySelectorAll(".popup");

popups.forEach(function(popup) {
    popup.style.left = pageprop.marginLeft;
});
