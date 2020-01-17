<script>
    import { showAnomalies } from '../stores';
    import Steps from './Steps.svelte';

    export let xScale;
    export let yScale;
    export let grouped;
</script>

<style>
    g :global(path) {
        fill: #888;
        opacity: 0.5;
    }
    g.faint :global(path) {
        opacity: 0.25;
    }
</style>

<g class="normal-temp-range" class:faint={$showAnomalies}>
    <Steps {xScale} {yScale} data={grouped} />
</g>
