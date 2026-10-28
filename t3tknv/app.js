(() => {
  const EVENT = {
    title: "حفل زفاف عماد و اسيل",
    place: "قاعات روز جولد - الجاردنز",
    start: "20261112T170000Z", // 8:00 PM Amman (UTC+3)
    end: "20261112T210000Z",   // 12:00 midnight Amman
    startMs: Date.UTC(2026, 10, 12, 17, 0, 0),
    map: "https://maps.app.goo.gl/LkycKCykVuMRFcHW6",
    share: "يتشرف آل ريالات و آل الرحاحله بدعوتكم لحضور حفل زفاف عماد و اسيل 💍\nالخميس 12/11/2026 · الساعة 8:00 مساءً · قاعات روز جولد\n"
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined";

  // ---------- flower sprays: real DOM copies so each part can animate ----------
  const spray = document.getElementById("spray");
  $$(".floral").forEach(svg => {
    svg.replaceChildren(spray.cloneNode(true));
    svg.firstChild.removeAttribute("id");
  });

  // ---------- verse: one span per word so the words can appear one by one ----------
  const verse = $("#verse");
  verse.innerHTML = verse.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(" ");

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
      $(".cd-title").hidden = true;
      const done = $("#cdDone");
      done.hidden = false;
      if (Date.now() > EVENT.startMs + 864e5) done.textContent = "شكراً لمشاركتكم فرحتنا ♥";
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
  // The tap on the envelope "unlocks" audio (phones only allow sound after a tap), but it stays
  // muted until the guest has scrolled past the Quran verse.
  const audio = $("#music");
  const musicBtn = $("#musicBtn");
  let audible = false;
  audio.addEventListener("error", () => { musicBtn.hidden = true; });
  audio.addEventListener("ended", () => { audio.currentTime = 0; audio.play(); });
  audio.addEventListener("pause", () => musicBtn.classList.remove("playing"));
  audio.addEventListener("playing", () => { if (audible) musicBtn.classList.add("playing"); });
  musicBtn.addEventListener("click", () => {
    if (audio.paused || audio.muted) { audio.muted = false; audio.play(); musicBtn.classList.add("playing"); }
    else audio.pause();
  });
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
  function unlockMusic() {
    audio.muted = true;
    audio.play().catch(() => {});
  }
  function startMusic() {
    if (audible || audio.error) return;
    audible = true;
    audio.currentTime = 0;
    audio.volume = 0;
    audio.muted = false;
    audio.play().then(() => {
      musicBtn.hidden = false;
      musicBtn.classList.add("playing");
      if (hasGsap) gsap.to(audio, { volume: 0.7, duration: 3 }); else audio.volume = 0.7;
    }).catch(() => { musicBtn.hidden = false; });
  }

  const intro = $("#intro");
  const card = $("#card");
  // always start at the top of the card, even when the phone restores an old scroll position
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  scrollTo(0, 0);
  addEventListener("load", () => { if (!document.getElementById("intro")?.dataset.open) scrollTo(0, 0); });
  document.body.classList.add("locked");

  if (!hasGsap) {
    intro.addEventListener("click", () => {
      intro.remove();
      document.body.classList.remove("locked");
      card.removeAttribute("aria-hidden");
      unlockMusic();
      addEventListener("scroll", function once() {
        if (scrollY > innerHeight * 0.5) { startMusic(); removeEventListener("scroll", once); }
      });
    }, { once: true });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ---------- line drawing helpers ----------
  function prepLines(scope) {
    return $$(".line-draw > *, .stem", scope).map(el => {
      const len = el.getTotalLength ? Math.ceil(el.getTotalLength()) + 1 : 400;
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
      return el;
    });
  }
  const draw = (els, opts) => gsap.to(els, { strokeDashoffset: 0, ease: "power1.inOut", ...opts });

  const rosetteLines = prepLines($(".rosette"));
  gsap.set(".portrait-frame", { opacity: 0, y: 30 });
  gsap.set("#couplePic", { scale: 1.12 });
  const florals = $$(".floral");
  florals.forEach(f => prepLines(f));

  gsap.set($$(".floral .fl, .floral .lf"), { scale: 0, transformOrigin: "50% 50%" });
  gsap.set(".verse .w", { opacity: 0, y: 10, filter: "blur(4px)" });
  gsap.set(".rv0", { opacity: 0, y: 14 });
  gsap.set(".twinkle path", { scale: 0, transformOrigin: "50% 50%" });

  // ---------- ambient: petals + sparkles ----------
  function ambient() {
    if (reduce) return;
    const layer = $(".petals");
    const colors = ["#f3d2c9", "#efc2b9", "#fbe9e4", "#e9b9a8", "#fffaf6"];
    for (let i = 0; i < 14; i++) {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      p.setAttribute("viewBox", "0 0 13 15");
      p.classList.add("petal");
      p.innerHTML = `<path d="M6.5 0C12 4 13 10 6.5 15 0 10 1 4 6.5 0Z" fill="${colors[i % colors.length]}" stroke="#e3b0a6" stroke-width=".4"/>`;
      layer.appendChild(p);
      gsap.set(p, { left: gsap.utils.random(0, 100) + "%", scale: gsap.utils.random(0.6, 1.3), opacity: gsap.utils.random(0.5, 0.95) });
      gsap.to(p, {
        y: innerHeight + 80, x: "+=" + gsap.utils.random(-90, 90), rotation: gsap.utils.random(-280, 280),
        duration: gsap.utils.random(10, 17), ease: "none", repeat: -1, delay: gsap.utils.random(0, 10)
      });
      gsap.to(p, { rotationY: 180, duration: gsap.utils.random(1.5, 3), repeat: -1, yoyo: true, ease: "sine.inOut" });
    }
    const sp = $(".sparkles");
    for (let i = 0; i < 12; i++) {
      const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.setAttribute("viewBox", "-5 -5 10 10");
      s.classList.add("spark");
      s.innerHTML = `<path d="M0-5 1.2-1.2 5 0 1.2 1.2 0 5-1.2 1.2-5 0-1.2-1.2Z" fill="#e2a99e"/>`;
      sp.appendChild(s);
      gsap.set(s, { left: gsap.utils.random(2, 96) + "%", top: gsap.utils.random(2, 96) + "%", scale: 0 });
      gsap.to(s, {
        scale: gsap.utils.random(0.6, 1.4), rotation: 90, duration: gsap.utils.random(0.8, 1.4),
        yoyo: true, repeat: -1, repeatDelay: gsap.utils.random(1, 4), delay: gsap.utils.random(0, 4), ease: "sine.inOut"
      });
    }
  }

  function bloom(svg, delay) {
    gsap.timeline({ delay })
      .add(draw($$(".stem", svg), { duration: 1.6, stagger: 0.15 }))
      .to($$(".lf", svg), { scale: 1, duration: 0.5, stagger: 0.07, ease: "back.out(2)" }, 0.5)
      .to($$(".fl", svg), { scale: 1, rotation: "+=25", duration: 0.7, stagger: 0.08, ease: "back.out(2.2)" }, 0.7)
      .add(() => {
        if (!reduce) gsap.to($(".sway", svg), { rotation: 1.6, svgOrigin: "0 0", duration: 3.5, yoyo: true, repeat: -1, ease: "sine.inOut" });
      });
  }

  // ---------- card entrance ----------
  function revealCard() {
    florals.forEach((f, i) => bloom(f, 0.1 + i * 0.25));
    gsap.timeline()
      .add(draw(rosetteLines, { duration: 2, stagger: 0.12 }), 0)
      .to(".basmala", { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" }, 0.4)
      .to(".verse .w", { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, stagger: 0.16, ease: "power2.out" }, 1.1)
      .to(".verse-ref", { opacity: 1, y: 0, duration: 0.7 }, ">-0.2")
      .to(".scroll-cue", { opacity: 1, y: 0, duration: 0.7 }, ">");

    $$(".rv").forEach(el => {
      gsap.from(el, { opacity: 0, y: 28, duration: 0.9, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 92%" } });
    });

    // the couple's portrait: the arch frame rises in, the painting inside settles from a slight zoom
    ScrollTrigger.create({
      trigger: ".portrait", start: "top 85%", once: true,
      onEnter: () => {
        gsap.timeline()
          .to(".portrait-frame", { opacity: 1, y: 0, duration: 1.1, ease: "power2.out" })
          .to("#couplePic", { scale: 1, duration: 2.4, ease: "power2.out" }, 0)
          .to(".twinkle path", { scale: 1, duration: 0.5, stagger: 0.2, ease: "back.out(3)" }, 0.8);
        if (!reduce) gsap.to(".twinkle path", { opacity: 0.3, duration: 1.2, stagger: 0.4, repeat: -1, yoyo: true, delay: 2.4 });
      }
    });

    // music begins once the verse has been read and the guest scrolls on
    ScrollTrigger.create({ trigger: ".families", start: "top 80%", once: true, onEnter: startMusic });

    ambient();
  }

  // ---------- open the envelope ----------
  let opened = false;
  function open() {
    if (opened) return;
    opened = true;
    scrollTo(0, 0);
    gsap.killTweensOf(".seal");
    unlockMusic();
    card.removeAttribute("aria-hidden");
    gsap.set(card, { opacity: 0, scale: 0.94, transformOrigin: "50% 30%" });

    const letter = $(".letter");
    const lr = letter.getBoundingClientRect();
    const fill = Math.max(innerWidth / lr.width, innerHeight / lr.height) * 1.25;
    const fast = reduce ? 0.3 : 1;

    const tl = gsap.timeline({
      onComplete: () => {
        intro.remove();
        gsap.set(card, { clearProps: "transform,opacity" });
        document.body.classList.remove("locked");
        ScrollTrigger.refresh();
      }
    });
    tl.to(".intro-text", { opacity: 0, y: 10, duration: 0.3 })
      .to(".seal", { scale: 1.15, duration: 0.18 }, 0)
      .to(".seal", { scale: 0.3, opacity: 0, rotation: -30, duration: 0.4, ease: "back.in(1.6)" })
      .to(".flap", { rotationX: 180, duration: 0.8 * fast, ease: "power2.inOut" }, "-=0.05")
      .set(".flap", { zIndex: 0 }, "-=0.4")
      .to(letter, { yPercent: -62, duration: 0.9 * fast, ease: "power2.out" }, "-=0.1")
      .set(letter, { zIndex: 6 })
      .to(".env-back, .env-front, .flap", { y: innerHeight * 0.7, opacity: 0, duration: 0.9 * fast, ease: "power2.in" }, "+=0.15")
      .to(letter, { yPercent: 0, y: innerHeight / 2 - (lr.top + lr.height / 2), duration: 0.9 * fast, ease: "power2.inOut" }, "<")
      .to(".letter-inner", { opacity: 0, duration: 0.5 }, "<0.3")
      .to(letter, { scale: fill, borderRadius: 0, duration: 0.9 * fast, ease: "power2.in" }, "-=0.35")
      .to(card, { opacity: 1, scale: 1, duration: 1.1 * fast, ease: "power2.out" }, "-=0.35")
      .to(intro, { opacity: 0, duration: 0.6 }, "<")
      .add(revealCard, "<0.2");
  }
  // ---------- first tap: silent car film, then the envelope opens by itself ----------
  const film = $("#film");
  const vid = $("#filmVid");
  let filmStarted = false;
  function playFilm() {
    if (filmStarted) return;
    filmStarted = true;
    unlockMusic(); // must happen inside the tap
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      // the film ends on ivory, so fading it away reveals the envelope seamlessly
      gsap.to(film, { autoAlpha: 0, duration: 0.6, onComplete: () => { vid.pause(); film.remove(); } });
      gsap.delayedCall(0.35, open);
    };
    gsap.to(film, { autoAlpha: 1, duration: 0.4 });
    vid.addEventListener("ended", finish, { once: true });
    vid.addEventListener("error", finish, { once: true });
    $("#filmSkip").addEventListener("click", e => { e.stopPropagation(); finish(); });
    vid.play().catch(finish);
    gsap.delayedCall(9, finish); // never get stuck on a slow connection
  }
  intro.addEventListener("click", playFilm);
  intro.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); playFilm(); } });

  gsap.to(".seal", { scale: 1.05, duration: 1.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
})();
