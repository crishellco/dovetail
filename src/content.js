import App from './content/App.svelte';

const target = document.querySelector('[data-project-hovercards-enabled]');
const app = new App({
	anchor: target.firstChild,
	target,
});

app.port.onMessage.addListener(function({type, data}) {
	switch(type) {
		default:
		break;
	}
});

app.postMessage({ type: 'ready' });

export default app;