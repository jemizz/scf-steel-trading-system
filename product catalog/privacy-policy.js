const links = [...document.querySelectorAll("nav.toc a")];
    const sections = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
    const toc = document.getElementById("toc");
    const btn = document.getElementById("menuBtn");
    function setActive() {
      let current = sections[0];
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= 120) current = s;
      }
      links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + current.id));
    }
    document.addEventListener("scroll", setActive, { passive: true });
    setActive();
    btn.addEventListener("click", () => toc.classList.toggle("open"));
    links.forEach(a => a.addEventListener("click", () => toc.classList.remove("open")));