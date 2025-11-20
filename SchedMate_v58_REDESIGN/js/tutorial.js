// Improved tutorial dismissal
const banner = document.getElementById("tutorialBanner");
const dismissBtn = document.getElementById("dismissTutorial");

if (banner && dismissBtn) {
  const key = "schedmate_tutorial_dismissed";
  const dismissed = localStorage.getItem(key);

  if (dismissed === "1") {
    banner.style.display = "none";
    banner.hidden = true;
  } else {
    banner.style.display = "block";
    banner.hidden = false;
  }

  dismissBtn.addEventListener("click", () => {
    banner.style.display = "none";
    banner.hidden = true;
    localStorage.setItem(key, "1");
  });
}
