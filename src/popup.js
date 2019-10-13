import App from "./popup/App.svelte";

const app = new App({
  target: document.body
});

app.port.onMessage.addListener(function({ type, data }) {
  switch (type) {
    default:
      break;
  }
});

app.sendReady();

export default app;
