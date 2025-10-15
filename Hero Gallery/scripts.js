document.addEventListener("DOMContentLoaded", () => {
  const figures = Array.from(document.querySelectorAll(".hero__image"));
  const btnNext = document.querySelector(".hero__control--next");
  const btnPrev = document.querySelector(".hero__control--prev");

  if (!figures.length) return;

  const total = figures.length;
  const getOneSrcs = () => figures.map(f => f.querySelector(".hero__image__one").src);

  const preload = (src) =>
    new Promise((res) => {
      if (!src) return res();
      const img = new Image();
      img.onload = img.onerror = () => res();
      img.src = src;
    });

  const whenTransitionEnd = (el, timeout = 1000) =>
    new Promise((res) => {
      let done = false;
      const timer = setTimeout(() => {
        if (!done) res();
        done = true;
      }, timeout + 200);

      el.addEventListener("transitionend", (e) => {
        if (done) return;
        if (e.target === el && e.propertyName === "transform") {
          done = true;
          clearTimeout(timer);
          res();
        }
      });
    });

  async function slide(direction = "next") {
    // Disable buttons during animation to prevent spam clicks
    btnNext.disabled = btnPrev.disabled = true;

    const oneSrcs = getOneSrcs();
    const twoTargets = new Array(total);

    if (direction === "next") {
      for (let i = 0; i < total; i++) {
        twoTargets[i] = oneSrcs[(i + 1) % total];
      }
    } else {
      for (let i = 0; i < total; i++) {
        twoTargets[i] = oneSrcs[(i - 1 + total) % total];
      }
    }

    // Preload all upcoming images to prevent flicker
    await Promise.all(twoTargets.map(preload));

    figures.forEach((fig, i) => {
      const imgTwo = fig.querySelector(".hero__image__two");
      imgTwo.src = twoTargets[i];
      imgTwo.style.transition = "none";
      if (direction === "next") {
        imgTwo.style.transform = "translate(100%, 100%)";
      } else {
        imgTwo.style.transform = "translate(-100%, -100%)";
      }
      imgTwo.style.opacity = "1";
      imgTwo.style.zIndex = "2"; // make sure it's on top
    });

    // Force reflow to ensure browser applies above transform before animating
    void document.body.offsetHeight;

    figures.forEach((fig) => {
      const imgTwo = fig.querySelector(".hero__image__two");
      imgTwo.style.transition = "transform 0.8s cubic-bezier(.2,.9,.2,1)";
      imgTwo.style.transform = "translate(0, 0)";
    });

    // Wait for all transitions to finish
    await Promise.all(figures.map((fig) =>
      whenTransitionEnd(fig.querySelector(".hero__image__two"), 800)
    ));

    figures.forEach((fig) => {
      const imgOne = fig.querySelector(".hero__image__one");
      const imgTwo = fig.querySelector(".hero__image__two");
      imgOne.src = imgTwo.src;
    });

    figures.forEach((fig) => {
      const imgTwo = fig.querySelector(".hero__image__two");
      imgTwo.style.transition = "none";
      imgTwo.style.transform =
        direction === "next"
          ? "translate(100%, 100%)"
          : "translate(-100%, -100%)";
      imgTwo.style.opacity = "0";
      imgTwo.style.zIndex = "2";
    });

    // Reflow again before enabling buttons
    void document.body.offsetHeight;

    // Re-enable navigation buttons
    btnNext.disabled = btnPrev.disabled = false;
  }

  btnNext.addEventListener("click", () => slide("next"));
  btnPrev.addEventListener("click", () => slide("prev"));
});