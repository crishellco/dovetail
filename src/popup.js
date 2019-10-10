import App from './popup/App.svelte';

const app = new App({
	target: document.body,
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