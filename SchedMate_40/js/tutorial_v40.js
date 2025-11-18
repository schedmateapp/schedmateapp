const banner = document.getElementById("tutorialBanner");
const dismissBtn = document.getElementById("dismissTutorial");

if (banner && dismissBtn) {
  const key = "schedmate_tutorial_dismissed";
  const already = localStorage.getItem(key);

  if (!already) {
    banner.hidden = false;
  }

  dismissBtn.addEventListener("click", () => {
    banner.hidden = true;
    localStorage.setItem(key, "1");
  });
}
