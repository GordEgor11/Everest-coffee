const coffeeItems = document.querySelectorAll(".coffee");
const siteNav = document.querySelector(".site-nav");
const heroScroll = document.querySelector(".hero-scroll");
const heroSection = document.querySelector(".hero");
const navLinks = document.querySelectorAll(".site-nav__link[href^='#']");
const transitionScreen = document.querySelector(".transition-screen");
const transitionPanels = document.querySelectorAll(".transition-screen__panel");
const transitionPanelItems = Array.from(transitionPanels);
const transitionLine = document.querySelector(".transition-screen__line");
const typingText = document.querySelector(".hero__typing-text");
const gallerySlides = Array.from(document.querySelectorAll(".gallery-slide"));
const galleryButtons = document.querySelectorAll("[data-gallery-direction]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let isTransitioning = false;
let galleryIndex = 0;
const typingWords = ["COFFE", "DESSERTS", "TEA"];

const updateScroll = () => {
  coffeeItems.forEach((item) => {
    const speed = Number(item.dataset.speed);
    item.style.setProperty("--offset-y", `${window.scrollY * speed}px`);
  });

  if (siteNav && heroScroll && heroSection) {
    const heroTop = heroScroll.getBoundingClientRect().top + window.scrollY;
    const heroBottom = heroTop + heroSection.offsetHeight;
    siteNav.classList.toggle("is-hidden", window.scrollY >= heroBottom - 2);
  }
};

const jumpToTarget = (target, hash) => {
  target.scrollIntoView({ behavior: "auto", block: "start" });
  history.pushState(null, "", hash);
  updateScroll();
};

const animateWithGsap = (target, hash) => {
  const { gsap } = window;

  gsap.killTweensOf([...transitionPanelItems, transitionLine]);
  gsap.set(transitionScreen, { autoAlpha: 1 });
  gsap.set(transitionPanelItems, { scaleY: 0 });
  gsap.set(transitionLine, { opacity: 0, scaleX: 0 });

  const timeline = gsap.timeline({
    defaults: { ease: "power3.inOut" },
    onStart: () => {
      transitionScreen.classList.add("is-active");
      document.body.classList.add("is-transitioning");
    },
    onComplete: () => {
      transitionScreen.classList.remove("is-active");
      document.body.classList.remove("is-transitioning");
      gsap.set(transitionScreen, { clearProps: "opacity,visibility" });
      isTransitioning = false;
    },
  });

  timeline
    .to(transitionPanelItems, { scaleY: 1, duration: 0.7, stagger: 0.04 })
    .to(transitionLine, { opacity: 1, scaleX: 1, duration: 0.36, ease: "power2.out" }, "-=0.3")
    .add(() => jumpToTarget(target, hash), "+=0.08")
    .to(transitionLine, { opacity: 0, scaleX: 0, duration: 0.3, ease: "power2.in" }, "+=0.08")
    .to(transitionPanelItems, { scaleY: 0, duration: 0.78, stagger: 0.04 }, "-=0.08");
};

const animateWithNativeMotion = async (target, hash) => {
  transitionScreen.classList.add("is-active");
  document.body.classList.add("is-transitioning");

  const closeAnimation = transitionPanelItems.map((panel, index) =>
    panel.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], {
      duration: 700,
      delay: index * 40,
      easing: "cubic-bezier(0.76, 0, 0.24, 1)",
      fill: "forwards",
    }),
  );
  const lineIn = transitionLine.animate(
    [
      { opacity: 0, transform: "scaleX(0)" },
      { opacity: 1, transform: "scaleX(1)" },
    ],
    {
      duration: 360,
      delay: 390,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "forwards",
    },
  );

  await Promise.all([...closeAnimation, lineIn].map((animation) => animation.finished));
  jumpToTarget(target, hash);

  const lineOut = transitionLine.animate(
    [
      { opacity: 1, transform: "scaleX(1)" },
      { opacity: 0, transform: "scaleX(0)" },
    ],
    {
      duration: 300,
      delay: 80,
      easing: "cubic-bezier(0.64, 0, 0.78, 0)",
      fill: "forwards",
    },
  );
  const openAnimation = transitionPanelItems.map((panel, index) =>
    panel.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(0)" }], {
      duration: 780,
      delay: 120 + index * 40,
      easing: "cubic-bezier(0.76, 0, 0.24, 1)",
      fill: "forwards",
    }),
  );

  await Promise.all([lineOut, ...openAnimation].map((animation) => animation.finished));

  transitionScreen.classList.remove("is-active");
  document.body.classList.remove("is-transitioning");
  isTransitioning = false;
};

const handleNavClick = (event) => {
  const link = event.currentTarget;
  const hash = link.getAttribute("href");
  const target = document.querySelector(hash);

  if (!target || isTransitioning) {
    return;
  }

  event.preventDefault();
  isTransitioning = true;

  if (reduceMotion.matches) {
    jumpToTarget(target, hash);
    isTransitioning = false;
    return;
  }

  if (window.gsap) {
    animateWithGsap(target, hash);
    return;
  }

  const canAnimateNatively =
    transitionPanelItems.every((panel) => typeof panel.animate === "function") &&
    typeof transitionLine.animate === "function";

  if (!canAnimateNatively) {
    jumpToTarget(target, hash);
    isTransitioning = false;
    return;
  }

  animateWithNativeMotion(target, hash);
};

const startTypingLoop = () => {
  if (!typingText) {
    return;
  }

  if (reduceMotion.matches) {
    typingText.textContent = typingWords.join(", ");
    return;
  }

  let wordIndex = 0;
  let letterIndex = typingWords[wordIndex].length;
  let isDeleting = true;

  const tick = () => {
    const word = typingWords[wordIndex];
    typingText.textContent = word.slice(0, letterIndex);

    if (isDeleting) {
      letterIndex -= 1;

      if (letterIndex < 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % typingWords.length;
        letterIndex = 0;
      }
    } else {
      letterIndex += 1;

      if (letterIndex > typingWords[wordIndex].length) {
        isDeleting = true;
        setTimeout(tick, 900);
        return;
      }
    }

    setTimeout(tick, isDeleting ? 70 : 115);
  };

  setTimeout(tick, 900);
};

const updateGallery = () => {
  if (!gallerySlides.length) {
    return;
  }

  const lastIndex = gallerySlides.length - 1;
  const previousIndex = galleryIndex === 0 ? lastIndex : galleryIndex - 1;
  const nextIndex = galleryIndex === lastIndex ? 0 : galleryIndex + 1;

  gallerySlides.forEach((slide, index) => {
    slide.classList.toggle("is-active", index === galleryIndex);
    slide.classList.toggle("is-prev", index === previousIndex);
    slide.classList.toggle("is-next", index === nextIndex);
    slide.setAttribute("aria-hidden", index === galleryIndex ? "false" : "true");
    slide.setAttribute("tabindex", index === galleryIndex ? "-1" : "0");
  });
};

const moveGallery = (direction) => {
  if (!gallerySlides.length) {
    return;
  }

  galleryIndex = (galleryIndex + direction + gallerySlides.length) % gallerySlides.length;
  updateGallery();
};

const activateGallerySlide = (index) => {
  if (index === galleryIndex) {
    return;
  }

  galleryIndex = index;
  updateGallery();
};

updateScroll();
startTypingLoop();
updateGallery();
window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("resize", updateScroll);
navLinks.forEach((link) => link.addEventListener("click", handleNavClick));
galleryButtons.forEach((button) => {
  button.addEventListener("click", () => moveGallery(Number(button.dataset.galleryDirection)));
});
gallerySlides.forEach((slide, index) => {
  slide.addEventListener("click", () => activateGallerySlide(index));
  slide.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activateGallerySlide(index);
    }
  });
});

window.addEventListener("keydown", (event) => {
  const activeElement = document.activeElement;
  const isTyping = activeElement && ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName);

  if (isTyping || !gallerySlides.length) {
    return;
  }

  if (event.key === "ArrowLeft") {
    moveGallery(-1);
  }

  if (event.key === "ArrowRight") {
    moveGallery(1);
  }
});
