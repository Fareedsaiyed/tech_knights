function createLogoMosaic() {
  const holder = document.getElementById("logoMosaic");
  if (!holder) return;

  const rows = 7;
  const cols = 7;
  holder.innerHTML = "";
  holder.style.setProperty("--rows", rows);
  holder.style.setProperty("--cols", cols);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const block = document.createElement("span");
      block.className = "logo-block";
      block.style.setProperty("--x", c);
      block.style.setProperty("--y", r);
      block.style.animationDelay = `${(r * 0.07) + (c * 0.04)}s`;
      holder.appendChild(block);
    }
  }

  setTimeout(() => holder.classList.add("assembled"), 1600);
  setTimeout(() => {
    const finalWrap = document.getElementById("logoFinalWrap");
    if (finalWrap) finalWrap.classList.add("show");
  }, 1900);
}

function speakWelcome() {
  const text = "Welcome to Ganpat University";
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.pitch = 1;
  utter.volume = 1;
  window.speechSynthesis.speak(utter);
}

document.addEventListener("DOMContentLoaded", () => {
  getState();
  createLogoMosaic();
  setTimeout(speakWelcome, 900);
  const enterBtn = document.getElementById("enterBtn");
  if (enterBtn) {
    enterBtn.addEventListener("click", () => {
      location.href = "login.html";
    });
  }
});
