import { initUi, showFatalError } from "./ui";

export function initApp(): void {
  try {
    const warning = document.getElementById("js-warning");
    if (warning) {
      warning.classList.add("hidden");
    }
    initUi();
  } catch (error) {
    showFatalError(error);
  }
}
