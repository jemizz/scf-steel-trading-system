const links = [...document.querySelectorAll("nav.toc a")];
const sections = links
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);
const toc = document.getElementById("toc");
const btn = document.getElementById("menuBtn");

function setActive() {
  if (!sections.length) return;
  let current = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 120) current = section;
  }
  links.forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === "#" + current.id);
  });
}

document.addEventListener("scroll", setActive, { passive: true });
setActive();

if (btn && toc) {
  btn.addEventListener("click", () => toc.classList.toggle("open"));
}

links.forEach((a) => {
  a.addEventListener("click", () => {
    if (toc) toc.classList.remove("open");
  });
});