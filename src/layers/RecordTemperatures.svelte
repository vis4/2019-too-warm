<script>
    import Steps from './Steps.svelte';

    export let xScale;
    export let yScale;
    export let grouped;

    $: records = grouped.map(d => ({
        date: d.date,
        tMin: d.tMinAbs,
        tMax: d.tMaxAbs
    }));
</script>

<style>
    g :global(path) {
        fill: var(--context-color);
        opacity: 0.3;
    }
</style>

<g>
    <Steps {xScale} {yScale} data={records} />
</g>
