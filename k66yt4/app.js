(() => {
  const EVENT = {
    title: "حفل حنة اسيل رحاحلة",
    place: "قصر اليوسفي",
    start: "20261104T160000Z", // 7:00 PM Amman (UTC+3)
    end: "20261104T183000Z",   // 9:30 PM Amman
    startMs: Date.UTC(2026, 10, 4, 16, 0, 0),
    endMs: Date.UTC(2026, 10, 4, 18, 30, 0),
    map: "https://maps.app.goo.gl/AdSmGbMoG8Bj4x2t6",
    share: "يشرفني دعوتكم لحضور حفل حنة اسيل 🌿\nالأربعاء 4/11 · قصر اليوسفي · 7:00 مساءً\n"
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined";

  // ---------- corner florals: real DOM copies so each part can animate ----------
  const spray = document.getElementById("cornerSpray");
  $$(".floral").forEach(svg => {
    svg.replaceChildren(spray.cloneNode(true));
    svg.firstChild.removeAttribute("id");
  });

  // ---------- buttons ----------
  $("#mapBtn").href = EVENT.map;

  const isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
  $("#calBtn").href = isApple
    ? "invite.ics"
    : "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(EVENT.title) +
      "&dates=" + EVENT.start + "/" + EVENT.end +
      "&location=" + encodeURIComponent(EVENT.place) +
      "&details=" + encodeURIComponent(EVENT.map);
  if (isApple) $("#calBtn").removeAttribute("target");

  const pageUrl = location.href.split("#")[0];
  $("#waBtn").href = "https://wa.me/?text=" + encodeURIComponent(EVENT.share + pageUrl);

  // ---------- countdown ----------
  const units = { d: 864e5, h: 36e5, m: 6e4, s: 1e3 };
  const cells = Object.fromEntries($$("#countdown b").map(b => [b.dataset.u, b]));
  function tick() {
    let left = EVENT.startMs - Date.now();
    if (left <= 0) {
      $("#countdown").hidden = true;
      const done = $("#cdDone");
      done.hidden = false;
      if (Date.now() > EVENT.endMs + 6 * 36e5) done.textContent = "شكراً لمشاركتكم فرحتنا ♥";
      $(".cd-title").hidden = true;
      return;
    }
    for (const [u, ms] of Object.entries(units)) {
      const v = Math.floor(left / ms);
      left -= v * ms;
      cells[u].textContent = String(v).padStart(2, "0");
    }
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  tick();

  // ---------- music ----------
  const audio = $("#music");
  const musicBtn = $("#musicBtn");
  let musicOk = false;
  audio.addEventListener("canplay", () => { musicOk = true; }, { once: true });
  audio.addEventListener("error", () => { musicOk = false; musicBtn.hidden = true; });
  audio.addEventListener("playing", () => { musicBtn.hidden = false; musicBtn.classList.add("playing"); });
  audio.addEventListener("pause", () => musicBtn.classList.remove("playing"));
  // the file is a short intro followed by the drop; when it ends, loop back to the drop, not the intro
  const DROP_AT = 5.5;
  audio.addEventListener("ended", () => { audio.currentTime = DROP_AT; audio.play(); });
  musicBtn.addEventListener("click", () => (audio.paused ? audio.play() : audio.pause()));
  // stop the music when the guest leaves the invitation (switches app/tab or closes it),
  // and pick it back up if they come back
  let resumeOnReturn = false;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (!audio.paused) { resumeOnReturn = true; audio.pause(); }
    } else if (resumeOnReturn) {
      resumeOnReturn = false;
      audio.play().catch(() => {});
    }
  });
  addEventListener("pagehide", () => audio.pause());
  function startMusic() {
    audio.volume = 0;
    audio.play().then(() => {
      if (hasGsap) gsap.to(audio, { volume: 0.7, duration: 3 });
      else audio.volume = 0.7;
    }).catch(() => { if (musicOk) musicBtn.hidden = false; });
  }

  // ---------- no animation library? show everything ----------
  const intro = $("#intro");
  const card = $("#card");
  // always start at the top of the card, even when the phone restores an old scroll position
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  scrollTo(0, 0);
  addEventListener("load", () => { if (!document.getElementById("intro")?.dataset.open) scrollTo(0, 0); });
  document.body.classList.add("locked");

  // ---------- wall with a doorway-shaped hole ----------
  const DOOR = [["M", 2, 160], ["V", 25], ["Q", 2, 18.6, 9.5, 17.6], ["Q", 15.6, 16.8, 17.6, 12.4],
    ["Q", 21.4, 5.6, 33.5, 4.8], ["Q", 44, 4.1, 50, 0.9], ["Q", 56, 4.1, 66.5, 4.8], ["Q", 78.6, 5.6, 82.4, 12.4],
    ["Q", 84.4, 16.8, 90.5, 17.6], ["Q", 98, 18.6, 98, 25], ["V", 160], ["Z"]];
  function buildWall() {
    if (!intro.isConnected || intro.dataset.open) return;
    const r = $(".doors").getBoundingClientRect();
    const W = innerWidth, H = innerHeight;
    const px = x => (r.left + (x / 100) * r.width).toFixed(1);
    const py = y => (r.top + (y / 160) * r.height).toFixed(1);
    const hole = DOOR.map(([c, ...n]) => {
      if (c === "V") return "V" + py(n[0]);
      if (c === "Z") return "Z";
      const out = [];
      for (let i = 0; i < n.length; i += 2) out.push(px(n[i]) + " " + py(n[i + 1]));
      return c + out.join(" ");
    }).join("");
    $(".wall").setAttribute("viewBox", `0 0 ${W} ${H}`);
    $$(".wall-shape").forEach(p => p.setAttribute("d", `M0 0H${W}V${H}H0Z` + hole));
    intro.classList.add("walled");
  }
  buildWall();
  addEventListener("resize", buildWall);
  document.fonts?.ready.then(buildWall);

  if (!hasGsap) {
    intro.addEventListener("click", () => {
      intro.remove();
      document.body.classList.remove("locked");
      card.removeAttribute("aria-hidden");
      startMusic();
    }, { once: true });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ---------- prepare line drawing ----------
  function prepLines(scope) {
    if (!scope) return [];
    return $$(".henna-line > *, .stem", scope).map(el => {
      const src = el.tagName === "use" ? document.querySelector(el.getAttribute("href")) : el;
      const len = src.getTotalLength ? Math.ceil(src.getTotalLength()) + 1 : 400;
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
      return el;
    });
  }
  const draw = (els, opts) => gsap.to(els, { strokeDashoffset: 0, ease: "power1.inOut", ...opts });

  const mandalaLines = prepLines($(".mandala"));
  const flowLines = prepLines($(".cone-art"));
  const thobeLines = prepLines($(".thobe"));
  const florals = $$(".floral");
  florals.forEach(f => prepLines(f));

  gsap.set($$(".floral .fl, .floral .lf"), { scale: 0, transformOrigin: "50% 50%" });
  gsap.set(".henna-dots circle", { scale: 0, transformOrigin: "50% 50%" });
  gsap.set(".cone", { opacity: 0, x: -30, y: -30 });

  // ---------- falling petals ----------
  function petals() {
    if (reduce) return;
    const layer = $(".petals");
    const colors = ["#f3e6d4", "#e9cfc0", "#d9b47a", "#f8efe4"];
    for (let i = 0; i < 14; i++) {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      p.setAttribute("viewBox", "0 0 12 14");
      p.classList.add("petal");
      p.innerHTML = `<path d="M6 0C11 4 12 9 6 14 0 9 1 4 6 0Z" fill="${colors[i % colors.length]}"/>`;
      layer.appendChild(p);
      const size = gsap.utils.random(0.6, 1.3);
      gsap.set(p, { left: gsap.utils.random(0, 100) + "%", scale: size, opacity: gsap.utils.random(0.45, 0.9) });
      gsap.to(p, {
        y: innerHeight + 80, x: "+=" + gsap.utils.random(-80, 80), rotation: gsap.utils.random(-260, 260),
        duration: gsap.utils.random(9, 16), ease: "none", repeat: -1, delay: gsap.utils.random(0, 10)
      });
      gsap.to(p, { rotationY: 180, duration: gsap.utils.random(1.5, 3), repeat: -1, yoyo: true, ease: "sine.inOut" });
    }
  }

  // ---------- card entrance ----------
  // Text already on screen was seen through the doorway, so it stays put; only text further
  // down fades in as the guest scrolls to it.
  let belowFold = [];
  function hideBelowFold() {
    belowFold = $$(".rv").filter(el => el.getBoundingClientRect().top > innerHeight);
    gsap.set(belowFold, { opacity: 0, y: 28 });
  }

  function revealCard() {
    florals.forEach((f, i) => bloom(f, i * 0.25));
    draw(mandalaLines, { duration: 3, stagger: 0.04 });

    belowFold.forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 92%" }
      });
    });

    ScrollTrigger.create({
      trigger: ".thobe", start: "top 85%", once: true,
      onEnter: () => draw(thobeLines, { duration: 1.6, stagger: 0.08 })
    });

    ScrollTrigger.create({
      trigger: ".cone-art", start: "top 92%", once: true,
      onEnter: () => {
        gsap.timeline()
          .to(".cone", { opacity: 1, x: 0, y: 0, duration: 0.8, ease: "back.out(1.6)" })
          .add(draw(flowLines, { duration: 2.4, stagger: 0.22 }))
          .to(".henna-dots circle", { scale: 1, duration: 0.3, stagger: 0.08, ease: "back.out(3)" }, "-=1.4")
          .to(".cone", { rotation: 4, svgOrigin: "40 142", duration: 1.2, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.8);
      }
    });

    petals();
    showScrollCue();
  }

  // ---------- "scroll down" hint ----------
  function showScrollCue() {
    const cue = $("#scrollCue");
    const hide = () => {
      if (scrollY < 40) return;
      removeEventListener("scroll", hide);
      gsap.to(cue, { autoAlpha: 0, y: 10, duration: 0.4, onComplete: () => cue.remove() });
    };
    gsap.fromTo(cue, { autoAlpha: 0, y: 12, xPercent: -50, x: 0 }, { autoAlpha: 1, y: 0, duration: 0.7, delay: 2.2, ease: "power2.out" });
    addEventListener("scroll", hide, { passive: true });
  }

  function bloom(svg, delay) {
    const tl = gsap.timeline({ delay });
    tl.add(draw($$(".stem", svg), { duration: 1.6, stagger: 0.15 }))
      .to($$(".lf", svg), { scale: 1, duration: 0.5, stagger: 0.07, ease: "back.out(2)" }, 0.5)
      .to($$(".fl", svg), { scale: 1, rotation: "+=25", duration: 0.7, stagger: 0.09, ease: "back.out(2.2)" }, 0.7)
      .add(() => {
        if (!reduce) gsap.to($(".sway", svg), {
          rotation: 1.6, svgOrigin: "0 0", duration: 3.5, yoyo: true, repeat: -1, ease: "sine.inOut"
        });
      });
  }

  // ---------- open the doors ----------
  let opened = false;
  function open() {
    if (opened) return;
    opened = true;
    scrollTo(0, 0);
    intro.dataset.open = "1";
    gsap.killTweensOf(".seal");
    startMusic();
    card.removeAttribute("aria-hidden");

    // walk through the doorway: the wall and doors zoom past the viewer while the card,
    // seen through the opening, comes forward to meet them
    const r = $(".doors").getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height * 0.45;
    hideBelowFold();
    // Only transform and opacity are animated, and the moving pieces get their own GPU layers,
    // so phones can run this smoothly. A plain overlay stands in for darkening the card.
    const dim = document.createElement("div");
    dim.style.cssText = "position:fixed;inset:0;z-index:45;background:#2a050b;opacity:.32;pointer-events:none";
    document.body.appendChild(dim);
    gsap.set(".doors, .seal", { filter: "none" });
    gsap.set(intro, { transformOrigin: `${cx}px ${cy}px`, willChange: "transform, opacity", force3D: true });
    gsap.set(card, { transformOrigin: `50% ${cy}px`, scale: 0.82, willChange: "transform", force3D: true });

    const tl = gsap.timeline({
      onComplete: () => {
        intro.remove();
        dim.remove();
        gsap.set(card, { clearProps: "transform,willChange" });
        document.body.classList.remove("locked");
        ScrollTrigger.refresh();
      }
    });
    tl.to(".intro-text", { opacity: 0, y: 10, duration: 0.3 })
      .to(".seal", { scale: 1.15, duration: 0.18, ease: "power1.out" }, 0)
      .to(".seal", { scale: 0.2, opacity: 0, rotation: 40, duration: 0.45, ease: "back.in(1.6)" })
      .to(".door-l", { rotationY: -100, duration: reduce ? 0.3 : 1.6, ease: "power2.inOut" }, "-=0.1")
      .to(".door-r", { rotationY: 100, duration: reduce ? 0.3 : 1.6, ease: "power2.inOut" }, "<")
      .to(intro, { scale: 7, duration: reduce ? 0.4 : 1.7, ease: "power2.in" }, "<0.5")
      .to(card, { scale: 1, duration: reduce ? 0.4 : 1.9, ease: "power2.inOut" }, "<")
      .to(dim, { opacity: 0, duration: reduce ? 0.4 : 1.9, ease: "power2.inOut" }, "<")
      .to(intro, { opacity: 0, duration: 0.3 }, "-=0.35")
      .add(revealCard, "-=0.9");
  }
  intro.addEventListener("click", open);
  intro.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });

  // gentle breathing on the seal while waiting
  gsap.to(".seal", { scale: 1.05, duration: 1.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
})();
