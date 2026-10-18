(() => {
  const root = document.documentElement;
  let resizeFrame = 0;

  const applyViewportProfile = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const layout = width >= 1600
      ? "desktop-wide"
      : width >= 1100
        ? "desktop"
        : width >= 760
          ? "compact"
          : "mobile";

    root.dataset.layout = layout;
    root.dataset.viewport = `${width}x${height}`;
    root.style.setProperty("--viewport-height", `${height}px`);
  };

  const scheduleViewportUpdate = () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(applyViewportProfile);
  };

  applyViewportProfile();
  window.addEventListener("resize", scheduleViewportUpdate, { passive: true });
  window.addEventListener("orientationchange", scheduleViewportUpdate, { passive: true });

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = [...document.querySelectorAll(".reveal")];

  items.forEach((item) => {
    const siblings = [...item.parentElement.children].filter((child) => child.classList.contains("reveal"));
    const position = siblings.indexOf(item);
    if (position > 0) item.dataset.revealDelay = String(Math.min(position, 3));
  });

  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }),
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );
    items.forEach((item) => observer.observe(item));
  }

  const bar = document.querySelector(".progress span");
  const globalNav = document.querySelector(".global-nav");
  const updateProgress = () => {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const value = distance > 0 ? window.scrollY / distance : 0;
    bar.style.transform = `scaleX(${Math.min(1, Math.max(0, value))})`;
    globalNav?.classList.toggle("scrolled", window.scrollY > 18);
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  const navigationLinks = [
    ...document.querySelectorAll(
      '.nav-links a[href^="#"], .nav-menu-links a[href^="#"], .nav-contact[href^="#"]',
    ),
  ];
  const navigationTargets = navigationLinks
    .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
    .filter(({ section }) => section);

  if ("IntersectionObserver" in window && navigationTargets.length) {
    const visibleSections = new Map();
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visibleSections.set(entry.target.id, entry.intersectionRatio);
        else visibleSections.delete(entry.target.id);
      });
      const active = [...visibleSections.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      navigationTargets.forEach(({ link, section }) => {
        const selected = section.id === active;
        link.classList.toggle("active", selected);
        if (selected) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-28% 0px -58% 0px", threshold: [0, 0.1, 0.25, 0.5] });
    navigationTargets.forEach(({ section }) => navObserver.observe(section));
  }

  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.getElementById("nav-menu");
  const navMain = document.querySelector("main");
  const navFooter = document.querySelector("footer");
  const desktopNav = window.matchMedia("(min-width: 801px)");
  let menuOpen = false;

  const setMenu = (open, restoreFocus = true) => {
    if (!navToggle || !navMenu) return;
    menuOpen = open;
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "关闭导航菜单" : "打开导航菜单");
    navMenu.classList.toggle("open", open);
    navMenu.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);
    if (navMain) navMain.inert = open;
    if (navFooter) navFooter.inert = open;
    if (open) {
      window.setTimeout(() => {
        if (menuOpen) navMenu.querySelector("a")?.focus({ preventScroll: true });
      }, 80);
    } else if (restoreFocus) {
      navToggle.focus({ preventScroll: true });
    }
  };

  navToggle?.addEventListener("click", () => setMenu(!menuOpen));

  navMenu?.addEventListener("click", (event) => {
    if (event.target.closest('a[href^="#"]')) {
      setMenu(false, false);
      return;
    }
    if (!event.target.closest(".nav-menu-inner")) setMenu(false);
  });

  document.addEventListener("click", (event) => {
    if (!menuOpen) return;
    if (event.target.closest("#nav-menu") || event.target.closest(".nav-toggle")) return;
    setMenu(false, false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuOpen) setMenu(false);
  });

  desktopNav.addEventListener("change", (event) => {
    if (event.matches && menuOpen) setMenu(false, false);
  });

    const hero = document.querySelector(".hero");
  const aura = document.querySelector(".hero-aura");
  if (!reduced && hero && aura && window.matchMedia("(pointer: fine)").matches) {
    let pointerFrame = 0;
    hero.addEventListener("pointermove", (event) => {
      window.cancelAnimationFrame(pointerFrame);
      pointerFrame = window.requestAnimationFrame(() => {
        const bounds = hero.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 22;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 16;
        aura.style.transform = `translate3d(calc(-50% + ${x}px), ${y}px, 0)`;
      });
    }, { passive: true });
    hero.addEventListener("pointerleave", () => {
      aura.style.transform = "translate3d(-50%, 0, 0)";
    });
  }

  let lastCarouselDrag = 0;

  const copyrightViewport = document.getElementById("copyright-viewport");
  if (copyrightViewport) {
    const slides = [...copyrightViewport.querySelectorAll(".copyright-slide")];
    const dots = [...document.querySelectorAll("[data-copyright-slide]")];
    const current = document.getElementById("copyright-current");
    const previous = document.getElementById("copyright-prev");
    const next = document.getElementById("copyright-next");
    let activeIndex = 0;
    let scrollFrame = 0;
    let dragging = false;
    let dragMoved = false;
    let dragStartX = 0;
    let dragStartScroll = 0;

    const updateCarouselState = (index) => {
      activeIndex = Math.max(0, Math.min(slides.length - 1, index));
      current.textContent = String(activeIndex + 1).padStart(2, "0");
      dots.forEach((dot, dotIndex) => {
        const selected = dotIndex === activeIndex;
        dot.classList.toggle("active", selected);
        if (selected) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
    };

    const goToSlide = (index, smooth = true) => {
      const wrapped = (index + slides.length) % slides.length;
      copyrightViewport.scrollTo({
        left: slides[wrapped].offsetLeft,
        behavior: smooth && !reduced ? "smooth" : "auto",
      });
      updateCarouselState(wrapped);
    };

    previous?.addEventListener("click", () => goToSlide(activeIndex - 1));
    next?.addEventListener("click", () => goToSlide(activeIndex + 1));
    dots.forEach((dot, index) => dot.addEventListener("click", () => goToSlide(index)));

    copyrightViewport.addEventListener("scroll", () => {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(() => {
        const index = Math.round(copyrightViewport.scrollLeft / copyrightViewport.clientWidth);
        updateCarouselState(index);
      });
    }, { passive: true });

    copyrightViewport.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToSlide(activeIndex - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToSlide(activeIndex + 1);
      }
    });

    copyrightViewport.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse") return;
      dragging = true;
      dragMoved = false;
      dragStartX = event.clientX;
      dragStartScroll = copyrightViewport.scrollLeft;
      copyrightViewport.classList.add("dragging");
      copyrightViewport.setPointerCapture(event.pointerId);
    });

    copyrightViewport.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      if (Math.abs(event.clientX - dragStartX) > 6) dragMoved = true;
      copyrightViewport.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
    });

    const finishDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      copyrightViewport.classList.remove("dragging");
      if (copyrightViewport.hasPointerCapture(event.pointerId)) {
        copyrightViewport.releasePointerCapture(event.pointerId);
      }
      if (dragMoved) lastCarouselDrag = Date.now();
      const index = Math.round(copyrightViewport.scrollLeft / copyrightViewport.clientWidth);
      goToSlide(index);
    };
    copyrightViewport.addEventListener("pointerup", finishDrag);
    copyrightViewport.addEventListener("pointercancel", finishDrag);
    window.requestAnimationFrame(() => goToSlide(0, false));
  }

  // 轮播图在进入视口附近时提前加载，避免切换时出现空白
  const carouselImages = [...document.querySelectorAll(".copyright-slide img")];
  const copyrightsSection = document.getElementById("copyrights");
  if (carouselImages.length && copyrightsSection && "IntersectionObserver" in window) {
    const preload = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        carouselImages.forEach((image) => {
          image.loading = "eager";
        });
        preload.disconnect();
      },
      { rootMargin: "300px 0px" },
    );
    preload.observe(copyrightsSection);
  }

  const viewer = document.getElementById("image-viewer");
  const viewerImage = document.getElementById("viewer-image");
  const viewerCaption = document.getElementById("viewer-caption");
  const viewerClose = viewer?.querySelector(".viewer-close");
  const viewerPrevious = viewer?.querySelector(".viewer-prev");
  const viewerNext = viewer?.querySelector(".viewer-next");
  const previewImages = [...document.querySelectorAll(".copyright-certificate img, .award-media img")];
  let viewerTrigger = null;
  let viewerIndex = -1;
  let viewerSwitchTimer = 0;

  const closeViewer = () => {
    if (!viewer?.classList.contains("open")) return;
    window.clearTimeout(viewerSwitchTimer);
    viewer.classList.remove("open");
    viewer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("viewer-open");
    window.setTimeout(() => {
      viewerImage.removeAttribute("src");
      viewerTrigger?.focus();
    }, reduced ? 0 : 320);
  };

  const showViewerImage = (index) => {
    if (!viewer || !viewerImage || !viewerCaption) return;
    viewerIndex = (index + previewImages.length) % previewImages.length;
    const image = previewImages[viewerIndex];
    if (!image) return;
    window.clearTimeout(viewerSwitchTimer);
    viewerImage.classList.add("switching");
    viewerSwitchTimer = window.setTimeout(() => {
      viewerImage.src = image.currentSrc || image.src;
      viewerImage.alt = image.alt;
      viewerCaption.textContent = image.alt;
      viewerImage.classList.remove("switching");
    }, reduced ? 0 : 120);
  };

  const openViewer = (image) => {
    if (!viewer || !viewerImage || !viewerCaption) return;
    viewerTrigger = image;
    showViewerImage(previewImages.indexOf(image));
    viewer.classList.add("open");
    viewer.setAttribute("aria-hidden", "false");
    document.body.classList.add("viewer-open");
    viewerClose?.focus();
  };

  previewImages.forEach((image) => {
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", `查看大图：${image.alt}`);
    image.setAttribute("aria-haspopup", "dialog");
    image.addEventListener("click", () => {
      if (image.closest("#copyright-viewport") && Date.now() - lastCarouselDrag < 400) return;
      openViewer(image);
    });
    image.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openViewer(image);
    });
  });
  viewerClose?.addEventListener("click", closeViewer);
  viewerPrevious?.addEventListener("click", () => showViewerImage(viewerIndex - 1));
  viewerNext?.addEventListener("click", () => showViewerImage(viewerIndex + 1));
  viewer?.querySelector("[data-viewer-close]")?.addEventListener("click", closeViewer);
  document.addEventListener("keydown", (event) => {
    if (!viewer?.classList.contains("open")) return;
    if (event.key === "Escape") closeViewer();
    if (event.key === "ArrowLeft") showViewerImage(viewerIndex - 1);
    if (event.key === "ArrowRight") showViewerImage(viewerIndex + 1);
    if (event.key === "Tab") {
      const controls = [viewerClose, viewerPrevious, viewerNext].filter(Boolean);
      const current = controls.indexOf(document.activeElement);
      const next = event.shiftKey
        ? (current - 1 + controls.length) % controls.length
        : (current + 1) % controls.length;
      event.preventDefault();
      controls[next].focus();
    }
  });

  const copyButton = document.getElementById("copy-email");
  const status = document.getElementById("copy-status");

  const copyViaSelection = (text) => {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, field.value.length);
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    field.remove();
    return copied;
  };

  copyButton?.addEventListener("click", async () => {
    const email = copyButton.dataset.email || "";
    const succeed = () => {
      copyButton.textContent = "已复制";
      status.textContent = "邮箱已复制，可以直接粘贴使用。";
      window.setTimeout(() => {
        copyButton.textContent = "复制邮箱";
        status.textContent = "";
      }, 2200);
    };

    try {
      await navigator.clipboard.writeText(email);
      succeed();
      return;
    } catch {
      // 本地 file:// 预览或旧浏览器可能拒绝 Clipboard API，改用选区兜底
    }

    if (copyViaSelection(email)) {
      succeed();
      return;
    }

    status.textContent = `复制失败，请使用：${email}`;
  });

  document.getElementById("year").textContent = String(new Date().getFullYear());
})();
