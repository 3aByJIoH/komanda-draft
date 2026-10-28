// Черновик сайта команды: меню, появление секций, тэглайн по словам, калькуляторы, плеер.
(() => {
  const TELEGRAM = "https://t.me/XKAKAOMAMA";
  const rub = (n) => n.toLocaleString("ru-RU").replace(/ | /g, " ") + " ₽";
  const round500 = (n) => Math.round(n / 500) * 500;

  // ---------- Мобильное меню ----------
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("mobile-menu");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    menu.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    menu.classList.toggle("open", open);
    menu.querySelectorAll("li").forEach((li, i) => {
      // по 60 мс на пункт, вся цепочка не дольше 400 мс
      li.style.animationDelay = open ? Math.min(i * 60, 400) + "ms" : "";
    });
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) setMenu(false); });

  // ---------- Текущий раздел в меню ----------
  const navLinks = [...document.querySelectorAll(".nav-links a")];
  const sectionsForNav = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + en.target.id)));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sectionsForNav.forEach((s) => navObserver.observe(s));

  // ---------- Появление секций (один раз) ----------
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("shown"); obs.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  // ---------- Тэглайн: слова загораются по одному ----------
  document.querySelectorAll("[data-words]").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((w, i) => {
      const span = document.createElement("span");
      span.className = "w";
      span.textContent = w;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    const wordObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("on"); obs.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -40% 0px" }); // линия срабатывания на 60% высоты экрана
    el.querySelectorAll(".w").forEach((s) => wordObserver.observe(s));
  });

  // ---------- Вкладки калькулятора ----------
  const tabs = [...document.querySelectorAll(".tab")];
  const selectTab = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(next); next.focus();
    });
  });

  // ---------- Калькулятор сайта ----------
  const site = document.getElementById("calc-site");
  const pagesInput = site.querySelector("[name=pages]");
  const pagesOut = document.getElementById("pages-out");
  const pagesField = site.querySelector(".pages-field");

  const siteState = () => {
    const type = site.querySelector("[name=type]:checked");
    const multi = type.dataset.name === "Многостраничный";
    pagesField.classList.toggle("off", !multi);
    if (!multi) { pagesInput.value = "0"; pagesOut.textContent = "0"; }
    const pages = Number(pagesInput.value);
    const picked = [type, ...site.querySelectorAll("[name=design]:checked, [name=catalog]:checked, [name=motion]:checked, [name=extra]:checked")];
    const once = picked.reduce((sum, el) => sum + Number(el.value), 0) + pages * 1500;
    const monthly = site.querySelector("[name=monthly]:checked");
    const items = picked.map((el) => el.dataset.name).filter(Boolean);
    if (pages) items.push("Дополнительных страниц: " + pages);
    if (monthly) items.push("Сопровождение 1 500 ₽ в месяц");
    return { once, monthly: monthly ? Number(monthly.value) : 0, items };
  };
  const renderSite = () => {
    const s = siteState();
    site.querySelector("[data-sum]").textContent = rub(s.once) + " – " + rub(round500(s.once * 1.25));
    const m = site.querySelector("[data-monthly]");
    m.hidden = !s.monthly;
    m.textContent = s.monthly ? "плюс " + rub(s.monthly) + " в месяц" : "";
  };
  site.addEventListener("change", renderSite);
  site.querySelectorAll(".step-btn").forEach((b) => b.addEventListener("click", () => {
    const v = Math.max(0, Math.min(20, Number(pagesInput.value) + Number(b.dataset.step)));
    pagesInput.value = String(v); pagesOut.textContent = String(v); renderSite();
  }));
  renderSite();

  // ---------- Калькулятор контента (каркас) ----------
  const content = document.getElementById("calc-content");
  const contentState = () => {
    const sales = [...content.querySelectorAll("[name=sales]:checked")];
    const once = sales.reduce((sum, el) => sum + Number(el.value), 0);
    const items = [...content.querySelectorAll("input:checked")].map((el) => el.dataset.name).filter(Boolean);
    return { once, items };
  };
  const renderContent = () => {
    const s = contentState();
    content.querySelector("[data-sum]").textContent = s.once ? "от " + rub(s.once) : "0 ₽";
  };
  content.addEventListener("change", renderContent);
  renderContent();

  // ---------- Отправка: копируем состав и открываем Telegram ----------
  const send = async (form, title, state, sumText) => {
    const status = form.querySelector("[data-status]");
    const text = "Здравствуйте! Посчитала на сайте: " + title + ".\n" +
      state.items.map((i) => "• " + i).join("\n") + "\nПримерно: " + sumText + "\nХочу бесплатную консультацию.";
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; } catch (_) { /* буфер недоступен */ }
    status.textContent = copied
      ? "Состав расчёта скопирован. Вставь его в чат Telegram, который сейчас откроется."
      : "Открываем Telegram. Напиши, что выбрала в калькуляторе.";
    window.open(TELEGRAM, "_blank", "noopener");
  };
  site.querySelector("[data-send]").addEventListener("click", () =>
    send(site, "сайт", siteState(), site.querySelector("[data-sum]").textContent));
  content.querySelector("[data-send]").addEventListener("click", () => {
    const s = contentState();
    if (!s.items.length) {
      content.querySelector("[data-status]").textContent = "Отметь хотя бы один пункт, и сразу откроем чат.";
      return;
    }
    send(content, "контент и продажи", s, content.querySelector("[data-sum]").textContent + " за продажи, контент на консультации");
  });

  // ---------- Плеер: ролик грузится только по нажатию ----------
  const player = document.getElementById("player");
  const video = player.querySelector("video");
  document.querySelectorAll("[data-video]").forEach((btn) => btn.addEventListener("click", () => {
    video.src = btn.dataset.video;
    player.showModal();
    video.play().catch(() => {});
  }));
  const closePlayer = () => { video.pause(); video.removeAttribute("src"); video.load(); player.close(); };
  player.querySelector(".player-close").addEventListener("click", closePlayer);
  player.addEventListener("click", (e) => { if (e.target === player) closePlayer(); });
  player.addEventListener("cancel", (e) => { e.preventDefault(); closePlayer(); });
})();
