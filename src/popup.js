import App from "./popup/App.svelte";

const app = new App({
  target: document.body
});

app.sendReady(false);

export default app;
