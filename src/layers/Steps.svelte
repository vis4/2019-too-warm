<script>
    import { area, curveStep } from 'd3-shape';

    export let low = 'tMin';
    export let high = 'tMax';

    export let xScale;
    export let yScale;
    export let data;

    $: path = area()
        .curve(curveStep)
        .x(d => xScale(d.date))
        .y0(d => yScale(d[low]))
        .y1(d => yScale(d[high]))(data);
</script>

<path d={path} />
