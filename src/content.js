import App from './content/App.svelte';

const target = document.querySelector('[data-project-hovercards-enabled]');
const app = new App({
	anchor: target.firstChild,
	target,
});

const port = chrome.runtime.connect({ name: 'template-api' });

port.onMessage.addListener(function({type, data}) {
	switch(type) {
		default:
		break;
	}
});

port.postMessage({ type: 'ready' });

export default app;