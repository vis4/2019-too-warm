import App from './App.svelte';

const app = new App({
    target: document.querySelector('.too-warm-body') || document.body,
    props: {}
});

export default app;
