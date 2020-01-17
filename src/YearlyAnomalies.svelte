<script>
    import { scaleTime, scaleLinear } from 'd3-scale';
    import { timeFormat } from 'd3-time-format';
    import { mean, group } from 'd3-array';
    import {
        contextMinYear,
        contextMaxYear,
        contextRange,
        formatTemp,
        useFahrenheit,
        getTempTicks
    } from './stores';
    import leastSquares from './leastSquares';

    export let data = [];

    export let day = new Date(2019, 11, 18);

    const height = 200;
    let width = 600;

    const fmt = timeFormat('%Y-%m');
    $: dayFmt = fmt(day);

    const minYear = 1900;
    const maxYear = 2019;

    $: dataClean = data.filter(d => d.tMin > -999 && d.tMax > -999);

    $: byYear = Array.from(group(dataClean, d => d.date.getFullYear()))
        .map(([key, values]) => ({
            year: values[0].date.getFullYear(),
            tAvg: values.length > 340 ? mean(values, d => d.tAvg) : Number.NaN
        }))
        .filter(d => !isNaN(d.tAvg) && d.year >= minYear && d.year <= maxYear)
        .sort((a, b) => a.year - b.year);

    $: baseTemp = mean(
        byYear.filter(d => d.year >= $contextMinYear && d.year < $contextMaxYear),
        d => d.tAvg
    );

    let dtMin = 99;
    let dtMax = -99;

    $: {
        dtMin = 99;
        dtMax = -99;
        byYear.forEach(d => {
            const dt = d.tAvg - baseTemp;
            dtMin = Math.min(dtMin, dt);
            dtMax = Math.max(dtMax, dt);
        });
    }

    $: sq = leastSquares(
        byYear.map(d => d.year),
        byYear.map(d => d.tAvg - baseTemp)
    );
    $: padding = { top: 20, right: 60, bottom: 30, left: 20 };

    $: xScale = scaleLinear()
        .domain([byYear[0].year, byYear[byYear.length - 1].year + 1])
        .range([padding.left, width - padding.right]);

    $: yScale = scaleLinear()
        .domain([dtMin, dtMax])
        .range([height - padding.bottom - padding.top, 0]);

    $: yTicks = $getTempTicks(yScale, 4);

    const format = (d, i) => d;
</script>

<style>
    svg {
        position: relative;
        width: 100%;
        overflow: hidden;
    }

    .tick line {
        stroke: var(--tick-line);
        shape-rendering: crispEdges;
    }

    .tick text {
        fill: var(--tick);
        font-weight: 500;
        font-size: 14px;
        text-anchor: start;
    }

    .x-axis .tick text {
        dominant-baseline: text-after-edge;
        text-anchor: middle;
    }

    .y-axis text {
        dominant-baseline: central;
        text-anchor: start;
        fill: var(--tick);
        font-weight: 500;
        font-size: 14px;
    }

    .y-axis line {
        stroke-width: 1;
        shape-rendering: crispEdges;
        stroke: var(--tick-line);
    }
    .y-axis line.zero {
        stroke: var(--tick);
    }
    text.buffer {
        fill: #eee;
        stroke: #eee;
        stroke-width: 2;
        stroke-linejoin: round;
    }

    @media (max-width: 400px) {
        .tick text {
            font-size: 13px;
        }
    }

    .chart {
        max-width: 650px;
        margin-bottom: 20px;
    }

    .year line {
        stroke: #bbb;
        stroke-width: 3;
        shape-rendering: crispEdges;
    }

    @media (max-width: 500px) {
        .year line {
            stroke-width: 3;
        }
        .x-axis .tick:nth-child(2n) text {
            display: none;
        }
    }
    line.hotter {
        stroke: var(--hotter-color);
    }
    line.colder {
        stroke: var(--colder-color);
    }
    line.trend {
        stroke: black;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        opacity: 0.8;
        stroke-dasharray: 2, 6;
    }
</style>

<div class="chart" bind:clientWidth={width}>
    <svg {height}>
        <g transform="translate(0,{padding.top})">
            <!-- y axis -->
            <g class="axis y-axis">
                {#each yTicks as tick, i}
                    <text x={width - padding.right + 5} y={yScale(tick)}>
                        {@html $formatTemp(tick, !i, true)}
                    </text>
                    <line
                        class:zero={!tick}
                        transform="translate(0,{yScale(tick)})"
                        x1={padding.left}
                        x2={width - padding.right} />
                {/each}
            </g>
            <!-- x axis -->
            <g class="axis x-axis">
                {#each xScale.ticks(8) as tick, i}
                    <g class="tick" transform="translate({xScale(tick)}, 0)">
                        <line y2={height - padding.bottom - padding.top} />
                        <g transform="translate(0,0)">
                            <text y={height - padding.bottom - padding.top + 25}>
                                {format(tick, i)}
                            </text>
                        </g>
                    </g>
                {/each}
            </g>
            <g class="values">
                {#each byYear as d}
                    <g class="year" transform="translate({xScale(d.year + 0.5)},0)">

                        {#if d.tAvg < baseTemp}
                            <line class="colder" y1={yScale(0)} y2={yScale(d.tAvg - baseTemp)} />
                        {/if}
                        {#if d.tAvg > baseTemp}
                            <line class="hotter" y1={yScale(0)} y2={yScale(d.tAvg - baseTemp)} />
                        {/if}

                    </g>
                {/each}
            </g>
            <g class="axis y-axis">
                <line
                    class="zero"
                    transform="translate(0,{yScale(0)})"
                    x1={padding.left}
                    x2={width - padding.right} />
            </g>

            <line
                class="trend"
                x1={xScale(byYear[0].year)}
                y1={yScale(sq(byYear[0].year))}
                x2={xScale(maxYear + 1)}
                y2={yScale(sq(maxYear + 1))} />
        </g>
    </svg>
</div>
