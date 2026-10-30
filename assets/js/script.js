(() => {
  "use strict";

  const root = document.documentElement;
  const header = document.querySelector("[data-header]");
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const menuClose = document.querySelector("[data-menu-close]");
  const mobileNavigation = document.querySelector("[data-mobile-navigation]");
  const mobileLinks = mobileNavigation?.querySelectorAll("a") ?? [];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let previousScrollY = window.scrollY;
  let ticking = false;

  const setTheme = (theme) => {
    root.dataset.theme = theme;
    const isDark = theme === "dark";
    themeToggle?.setAttribute("aria-pressed", String(isDark));
    themeToggle?.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    localStorage.setItem("portfolio-theme", theme);
  };

  const savedTheme = localStorage.getItem("portfolio-theme");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  setTheme(savedTheme || systemTheme);

  themeToggle?.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));

  const setMenuState = (isOpen) => {
    mobileNavigation?.classList.toggle("is-open", isOpen);
    mobileNavigation?.setAttribute("aria-hidden", String(!isOpen));
    menuToggle?.setAttribute("aria-expanded", String(isOpen));
    menuToggle?.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  };

  menuToggle?.addEventListener("click", () => setMenuState(!mobileNavigation?.classList.contains("is-open")));
  menuClose?.addEventListener("click", () => setMenuState(false));
  mobileLinks.forEach((link) => link.addEventListener("click", () => setMenuState(false)));

  const updateHeaderOnScroll = () => {
    const currentScrollY = window.scrollY;
    const distance = Math.abs(currentScrollY - previousScrollY);
    if (distance < 6) {
      ticking = false;
      return;
    }

    if (currentScrollY > previousScrollY && currentScrollY > 12) {
      header?.classList.remove("is-revealed");
      header?.classList.add("is-hidden");
    } else if (currentScrollY < previousScrollY) {
      header?.classList.remove("is-hidden");
      header?.classList.add("is-revealed");
    }

    if (currentScrollY <= 12) header?.classList.remove("is-hidden", "is-revealed");
    previousScrollY = currentScrollY;
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeaderOnScroll);
      ticking = true;
    }
  }, { passive: true });

  const aboutSection = document.querySelector(".about-section");
  if (aboutSection) {
    if (reducedMotion || !("IntersectionObserver" in window)) {
      aboutSection.classList.add("is-visible");
    } else {
      const aboutObserver = new IntersectionObserver(([entry], observer) => {
        if (!entry.isIntersecting) return;
        aboutSection.classList.add("is-visible");
        observer.disconnect();
      }, { threshold: 0.18 });
      aboutObserver.observe(aboutSection);
    }
  }

  if (reducedMotion) header?.style.setProperty("transition-duration", "0.01ms");
})();

(() => {
  const year = document.querySelector("[data-current-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();

(() => {
  "use strict";

  const section = document.querySelector("[data-process-journey]")?.closest(".process-section");
  const journey = document.querySelector("[data-process-journey]");
  const landscape = journey?.querySelector(".process-landscape");
  const desktopPath = journey?.querySelector('[data-process-path="desktop"]');
  const mobilePath = journey?.querySelector('[data-process-path="mobile"]');
  const energy = journey?.querySelector("[data-process-energy]");
  const energyHalo = journey?.querySelector("[data-process-energy-halo]");
  const milestones = [...(journey?.querySelectorAll("[data-process-milestone]") ?? [])];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!section || !journey || !landscape || !desktopPath || !mobilePath || !energy || !energyHalo || !milestones.length) return;

  let activePath = desktopPath;
  let pathLength = 0;
  let running = false;
  let animationFrame = 0;
  let startTime = 0;
  const travelDuration = 14500;
  const resetDuration = 1200;

  const isMobile = () => window.matchMedia("(max-width: 860px)").matches;

  const choosePath = () => {
    const mobile = isMobile();
    activePath = mobile ? mobilePath : desktopPath;
    landscape.setAttribute("viewBox", mobile ? "0 0 360 980" : "0 0 1000 600");
    pathLength = activePath.getTotalLength();

    milestones.forEach((milestone, index) => {
      if (mobile) {
        milestone.style.left = "";
        milestone.style.top = "";
        return;
      }
      const point = activePath.getPointAtLength(pathLength * (index / (milestones.length - 1)));
      milestone.style.left = `${point.x / 1000 * 100}%`;
      milestone.style.top = `${point.y / 600 * 100}%`;
    });
  };

  const placeEnergy = (progress) => {
    const point = activePath.getPointAtLength(pathLength * progress);
    energy.setAttribute("cx", point.x);
    energy.setAttribute("cy", point.y);
    energyHalo.setAttribute("cx", point.x);
    energyHalo.setAttribute("cy", point.y);
  };

  const setActiveMilestones = (progress) => {
    milestones.forEach((milestone, index) => {
      const threshold = index === milestones.length - 1 ? .985 : index / (milestones.length - 1);
      milestone.classList.toggle("is-active", progress >= threshold);
    });
  };

  const animate = (timestamp) => {
    if (!running) return;
    const elapsed = (timestamp - startTime) % (travelDuration + resetDuration);
    if (elapsed <= travelDuration) {
      const progress = Math.min(1, elapsed / travelDuration);
      placeEnergy(progress);
      energy.style.opacity = "1";
      energyHalo.style.opacity = ".22";
      setActiveMilestones(progress);
    } else {
      energy.style.opacity = "0";
      energyHalo.style.opacity = "0";
      milestones.forEach((milestone) => milestone.classList.remove("is-active"));
    }
    animationFrame = window.requestAnimationFrame(animate);
  };

  const start = () => {
    if (running || reducedMotion) return;
    running = true;
    startTime = performance.now();
    animationFrame = window.requestAnimationFrame(animate);
  };

  const stop = () => {
    running = false;
    window.cancelAnimationFrame(animationFrame);
  };

  choosePath();
  if (reducedMotion) {
    section.classList.add("is-static");
    placeEnergy(1);
    energy.style.opacity = "0";
    energyHalo.style.opacity = "0";
    milestones.forEach((milestone) => milestone.classList.add("is-active"));
  } else {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    }, { threshold: .12 });
    observer.observe(section);
  }

  window.addEventListener("resize", choosePath, { passive: true });
})();

(() => {
  "use strict";

  const previewSvg = (title, category, accent) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500">
      <rect width="1200" height="1500" fill="#ffffff"/>
      <rect width="1200" height="78" fill="#252a34"/>
      <circle cx="38" cy="39" r="9" fill="#ff2e63"/><circle cx="68" cy="39" r="9" fill="#08d9d6"/><circle cx="98" cy="39" r="9" fill="#eaeaea"/>
      <rect x="210" y="25" width="780" height="28" rx="14" fill="#eaeaea"/><text x="600" y="44" text-anchor="middle" fill="#252a34" font-family="Arial" font-size="14">editable-project-preview.local</text>
      <rect x="0" y="78" width="1200" height="92" fill="#ffffff"/><text x="70" y="132" fill="#252a34" font-family="Arial" font-size="28" font-weight="700">${title}</text><text x="1090" y="132" text-anchor="end" fill="${accent}" font-family="Arial" font-size="18" font-weight="700">${category.toUpperCase()}</text>
      <rect x="70" y="225" width="530" height="320" rx="18" fill="${accent}" opacity=".92"/><rect x="110" y="275" width="320" height="18" rx="9" fill="#252a34" opacity=".85"/><rect x="110" y="315" width="400" height="12" rx="6" fill="#ffffff" opacity=".8"/><rect x="110" y="342" width="350" height="12" rx="6" fill="#ffffff" opacity=".8"/><rect x="110" y="405" width="145" height="42" rx="21" fill="#252a34"/><text x="182" y="431" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="14">EXPLORE</text>
      <rect x="650" y="225" width="480" height="320" rx="18" fill="#eaeaea"/><circle cx="890" cy="385" r="105" fill="${accent}" opacity=".75"/><circle cx="890" cy="385" r="55" fill="#ffffff" opacity=".75"/>
      <text x="70" y="650" fill="#252a34" font-family="Arial" font-size="18" font-weight="700">${category} website experience</text><rect x="70" y="680" width="1060" height="2" fill="#eaeaea"/>
      <g fill="#eaeaea"><rect x="70" y="735" width="330" height="220" rx="14"/><rect x="435" y="735" width="330" height="220" rx="14"/><rect x="800" y="735" width="330" height="220" rx="14"/></g>
      <g fill="${accent}" opacity=".85"><rect x="70" y="1010" width="510" height="18" rx="9"/><rect x="70" y="1050" width="420" height="12" rx="6"/><rect x="620" y="1010" width="510" height="18" rx="9"/><rect x="620" y="1050" width="380" height="12" rx="6"/></g>
      <rect x="70" y="1160" width="1060" height="220" rx="18" fill="#252a34"/><text x="105" y="1235" fill="#08d9d6" font-family="Arial" font-size="16">EDITABLE PLACEHOLDER</text><text x="105" y="1285" fill="#ffffff" font-family="Arial" font-size="30" font-weight="700">Replace with your live project screenshot</text>
    </svg>`)} `;

  const projects = [
    { title: "Editable WordPress Project 01", category: "WordPress", description: "Editable placeholder preview for a WordPress business website.", tags: ["WordPress", "Elementor", "Custom Theme"], accent: "#08d9d6", url: "#contact" },
    { title: "Editable Shopify Project 01", category: "Shopify", description: "Editable placeholder preview for a Shopify storefront experience.", tags: ["Shopify", "Custom Theme"], accent: "#96bf48", url: "#contact" },
    { title: "Editable WooCommerce Project", category: "WordPress", description: "Editable placeholder preview for a WooCommerce e-commerce store.", tags: ["WordPress", "WooCommerce", "PHP"], accent: "#ff2e63", url: "#contact" },
    { title: "Editable Shopify Project 02", category: "Shopify", description: "Editable placeholder preview for a Shopify product collection.", tags: ["Shopify", "Custom Theme"], accent: "#08d9d6", url: "#contact" },
    { title: "Editable WordPress Project 02", category: "WordPress", description: "Editable placeholder preview for a responsive WordPress website.", tags: ["WordPress", "PHP", "Elementor"], accent: "#ff2e63", url: "#contact" },
    { title: "Editable Shopify Project 03", category: "Shopify", description: "Editable placeholder preview for a Shopify commerce experience.", tags: ["Shopify", "Custom Theme"], accent: "#96bf48", url: "#contact" },
    { title: "Editable WordPress Project 03", category: "WordPress", description: "Editable placeholder preview for a custom WordPress layout.", tags: ["WordPress", "Custom Theme"], accent: "#08d9d6", url: "#contact" },
    { title: "Editable Shopify Project 04", category: "Shopify", description: "Editable placeholder preview for a branded Shopify store.", tags: ["Shopify", "Custom Theme"], accent: "#ff2e63", url: "#contact" },
    { title: "Editable WordPress Project 04", category: "WordPress", description: "Editable placeholder preview for a WordPress content experience.", tags: ["WordPress", "PHP"], accent: "#96bf48", url: "#contact" }
  ].map((project) => ({ ...project, thumbnail: previewSvg(project.title, project.category, project.accent), image: previewSvg(project.title, project.category, project.accent) }));

  const grid = document.querySelector("[data-project-grid]");
  const loadMore = document.querySelector("[data-project-load-more]");
  const filters = [...document.querySelectorAll("[data-project-filter]")];
  const lightbox = document.querySelector("[data-project-lightbox]");
  const lightboxImage = document.querySelector("[data-project-lightbox-image]");
  const lightboxClose = document.querySelector("[data-project-lightbox-close]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!grid || !loadMore || !lightbox || !lightboxImage) return;

  let activeFilter = "all";
  let visibleCount = 6;
  let previousBodyOverflow = "";

  const filteredProjects = () => activeFilter === "all" ? projects : projects.filter((project) => project.category === activeFilter);

  const setupPreviewScroll = (card) => {
    if (reducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const preview = card.querySelector(".project-preview");
    const image = card.querySelector(".project-preview-image");
    const startScroll = () => {
      const renderedHeight = image.naturalWidth ? image.naturalHeight / image.naturalWidth * preview.clientWidth : image.getBoundingClientRect().height;
      const distance = Math.max(0, renderedHeight - preview.clientHeight);
      image.style.setProperty("--project-scroll-duration", `${Math.max(2.2, distance / 85)}s`);
      image.style.transform = `translateY(-${distance}px)`;
    };
    preview.addEventListener("pointerenter", startScroll);
    preview.addEventListener("pointerleave", () => { image.style.transform = "translateY(0)"; });
  };

  const openLightbox = (project) => {
    lightboxImage.src = project.image;
    lightboxImage.alt = `${project.title} full-screen preview`;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lightboxClose?.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.removeAttribute("src");
    document.body.style.overflow = previousBodyOverflow;
  };

  const renderProjects = (revealFrom = 0) => {
    const visibleProjects = filteredProjects().slice(0, visibleCount);
    grid.innerHTML = visibleProjects.map((project, index) => `<article class="project-card${index >= revealFrom ? " project-card--new" : ""}">
      <div class="project-preview" role="button" tabindex="0" aria-label="Open ${project.title} image preview">
        <img class="project-preview-image" src="${project.thumbnail}" alt="${project.title} website screenshot placeholder" loading="lazy" decoding="async" />
      </div>
      <div class="project-card-content">
        <h3>${project.title}</h3>
        <p class="project-card-description">${project.description}</p>
        <ul class="project-tags">${project.tags.map((tag) => `<li>${tag}</li>`).join("")}</ul>
        <a class="project-link" href="${project.url}" aria-label="Edit project URL for ${project.title}">Project link placeholder <span aria-hidden="true">↗</span></a>
      </div>
    </article>`).join("");

    visibleProjects.forEach((project, index) => {
      const card = grid.children[index];
      const preview = card.querySelector(".project-preview");
      preview.addEventListener("click", () => openLightbox(project));
      preview.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openLightbox(project); }
      });
      setupPreviewScroll(card);
    });
    loadMore.hidden = visibleCount >= filteredProjects().length;
  };

  filters.forEach((filter) => filter.addEventListener("click", () => {
    activeFilter = filter.dataset.projectFilter;
    visibleCount = 6;
    filters.forEach((item) => { const isActive = item === filter; item.classList.toggle("is-active", isActive); item.setAttribute("aria-pressed", String(isActive)); });
    renderProjects();
  }));

  loadMore.addEventListener("click", () => {
    const previousVisibleCount = visibleCount;
    loadMore.disabled = true;
    loadMore.classList.add("is-loading");
    window.setTimeout(() => {
      visibleCount += 3;
      renderProjects(previousVisibleCount);
      loadMore.classList.remove("is-loading");
      loadMore.disabled = false;
    }, reducedMotion ? 120 : 500);
  });
  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox(); });
  renderProjects();
})();

(() => {
  "use strict";

  const form = document.querySelector("[data-contact-form]");
  const feedback = document.querySelector("[data-contact-feedback]");
  if (!form || !feedback) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    feedback.className = "contact-feedback";

    if (!form.checkValidity()) {
      feedback.textContent = "Please complete the required fields with valid details.";
      feedback.classList.add("is-error");
      form.querySelector(":invalid")?.focus();
      return;
    }

    feedback.textContent = "Thanks for reaching out. The form is ready for a backend or form-service connection.";
    feedback.classList.add("is-success");
    form.reset();
  });
})();
