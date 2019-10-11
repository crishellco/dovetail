import App from './content/App.svelte';

const target = document.querySelector('[data-project-hovercards-enabled]');
const app = new App({
	anchor: target.firstChild,
	target,
});

app.port.onMessage.addListener(function({type, data}) {
	switch(type) {
		case 'templates':
			app.$set({ templates: data });
			break;
		default:
			break;
	}
});

app.postMessage({ type: 'ready', data: window.location.href });

export default app;
