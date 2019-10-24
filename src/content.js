import App from "./content/App.svelte";

window.onload = () => {
  const target = document.querySelector("[data-project-hovercards-enabled]");

  if (target) {
    const app = new App({
      anchor: target.firstChild,
      target
    });

    app.port.onMessage.addListener(({ type, data }) => {
      switch (type) {
        case "templates":
          app.$set({ templates: data });
          break;
        default:
          break;
      }
    });

    app.postMessage({ type: "ready", data: window.location.href, fetchTemplates: true });
  }
}
