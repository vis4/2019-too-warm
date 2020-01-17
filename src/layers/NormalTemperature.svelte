<script>
    export let xScale;
    export let yScale;
    export let grouped;

    import { line, curveBasis } from 'd3-shape';

    $: pathData = path(grouped);

    $: path = line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.tAvg))
        .curve(curveBasis);
</script>

<style>
    path {
        stroke: #000;
        opacity: 0.75;
        stroke-linejoin: round;
        fill: none;
    }
</style>

<g class="normal-temp">
    <path d={pathData} />
</g>
