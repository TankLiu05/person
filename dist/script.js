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
  const updateProgress = () => {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const value = distance > 0 ? window.scrollY / distance : 0;
    bar.style.transform = `scaleX(${Math.min(1, Math.max(0, value))})`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

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
      dragStartX = event.clientX;
      dragStartScroll = copyrightViewport.scrollLeft;
      copyrightViewport.classList.add("dragging");
      copyrightViewport.setPointerCapture(event.pointerId);
    });

    copyrightViewport.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      copyrightViewport.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
    });

    const finishDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      copyrightViewport.classList.remove("dragging");
      if (copyrightViewport.hasPointerCapture(event.pointerId)) {
        copyrightViewport.releasePointerCapture(event.pointerId);
      }
      const index = Math.round(copyrightViewport.scrollLeft / copyrightViewport.clientWidth);
      goToSlide(index);
    };
    copyrightViewport.addEventListener("pointerup", finishDrag);
    copyrightViewport.addEventListener("pointercancel", finishDrag);
    window.requestAnimationFrame(() => goToSlide(0, false));
  }

  const copyButton = document.getElementById("copy-email");
  const status = document.getElementById("copy-status");
  copyButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(copyButton.dataset.email || "");
      copyButton.textContent = "已复制";
      status.textContent = "邮箱已复制，可以直接粘贴使用。";
      window.setTimeout(() => {
        copyButton.textContent = "复制邮箱";
        status.textContent = "";
      }, 2200);
    } catch {
      status.textContent = "复制失败，请使用：18330177876@163.com";
    }
  });

  document.getElementById("year").textContent = String(new Date().getFullYear());
})();
