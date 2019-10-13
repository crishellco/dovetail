import App from "./content/App.svelte";

let app;

function setup() {
  const target = document.querySelector("[data-project-hovercards-enabled]");

  if (!target) {
    return;
  }

  app = new App({
    anchor: target.firstChild,
    target
  });

  app.postMessage({ type: "ready", data: window.location.href, fetchTemplates: true });
}

chrome.runtime.onMessage.addListener(({ type, data }, sender, sendResponse) => {
  switch (type) {
    case "onCompare":
      setup();
      break;
    case "templates":
      app.$set({ templates: data });
      break;
  }
});
