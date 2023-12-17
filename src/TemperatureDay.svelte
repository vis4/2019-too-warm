<script>
    import { scaleLinear } from 'd3-scale';
    import { timeFormat } from 'd3-time-format';
    import { mean } from 'd3-array';
    import {
        msg,
        contextMinYear,
        contextRange,
        getTempTicks,
        toF,
        useFahrenheit,
        formatTemp
    } from './stores';

    export let data = [];

    export let day = new Date(2019, 11, 18);
    const fmt = timeFormat('-%m-%d');
    $: dayFmt = fmt(day);

    $: minYear = Math.max(1950, dataClean[0].year);
    $: maxYear = dataClean[dataClean.length - 1].year;

    $: dataClean = data
        .filter(d => d.tMin > -999 && d.tMax > -999)
        .map(d => {
            d.year = d.date.getFullYear();
            return d;
        })
        .filter(d => d.dateRaw.substr(4) === dayFmt && d.year >= 1950)
        .reverse();

    let tMin = 99;
    let tMax = -99;

    $: {
        tMin = 99;
        tMax = -99;
        dataClean.forEach(d => {
            tMin = Math.min(tMin, d.tMin);
            tMax = Math.max(tMax, d.tMax);
        });
    }

    let localContextMin = $contextMinYear;
    $: localContextMax = localContextMin + $contextRange;

    $: {
        localContextMin = $contextMinYear;
    }

    $: contextYears = dataClean.filter(d => d.year >= localContextMin && d.year < localContextMax);
    $: normalLow = mean(contextYears, d => d.tMin);
    $: normalHigh = mean(contextYears, d => d.tMax);

    let width = 400;
    const height = 300;

    $: padding = { top: 40, right: 180, bottom: 30, left: width < 500 ? 40 : 60 };

    $: xScale = scaleLinear()
        .domain([minYear, maxYear])
        .range([padding.left, width - padding.right]);

    $: xTicks = xScale.ticks(5);

    $: yScale = scaleLinear()
        .domain([tMin - 3, tMax + 3])
        .range([height - padding.bottom, padding.top]);

    $: yTicks = $getTempTicks(yScale, 6);

    $: format = (d, i) => d;
    $: formatMobile = (d, i) => `'${String(d).substr(2)}`;

    let dragging = false;
    let dragStartX;

    function dragstart(event) {
        dragStartX = getOffset(event);
        dragging = true;
    }
    function getOffset(event) {
        return event.targetTouches ? event.targetTouches[0].screenX : event.clientX;
    }
    function drag(event) {
        if (dragging) {
            const offset = getOffset(event) - dragStartX;
            localContextMin = Math.min(
                maxYear - $contextRange,
                Math.max(minYear, Math.round(xScale.invert(xScale(localContextMin) + offset)))
            );
            dragStartX = getOffset(event);
        }
    }
    function dragend(event) {
        if (dragging) {
            dragging = false;
            $contextMinYear = localContextMin;
        }
    }
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
        text-anchor: middle;
        dominant-baseline: alphabetic;
    }

    line.zero {
        stroke-width: 2;
        stroke: currentColor;
        stroke-dasharray: 3, 3;
        opacity: 0.5;
    }

    @media (max-width: 400px) {
        .tick text {
            font-size: 13px;
        }
    }

    .chart {
        max-width: 600px;
        margin-bottom: 20px;
    }
    .day line {
        pointer-events: none;
        stroke: #888;
        stroke-width: 2;
        shape-rendering: crispEdges;
    }
    .day.reference line {
        stroke: currentColor;
    }
    .context {
        cursor: grab;
    }
    .context rect {
        fill: var(--white);
        opacity: 0.5;
    }
    .context text {
        fill: var(--tick);
        pointer-events: none;
        text-anchor: middle;
        font-size: 14px;
        dominant-baseline: central;
    }
    .day:last-child line {
        stroke-width: 4;
    }
    .day line.hotter {
        stroke: var(--hotter-color);
    }
    .day line.colder {
        stroke: var(--colder-color);
    }
    .normal-high text,
    .normal-low text {
        font-weight: 400;
        font-size: 13px;
        fill: #6c757d;
    }
    .normal-high text {
        dominant-baseline: alphabetic;
    }
    .normal-low text {
        dominant-baseline: hanging;
    }
    .normal-high text.temp,
    .normal-low text.temp {
        font-weight: 500;
        font-size: 15px;
    }
    .normal-high text.temp {
        fill: var(--hotter-color);
    }
    .normal-low text.temp {
        fill: var(--colder-color);
    }
    .normal-range {
        opacity: 0.03;
    }
    .normal text {
        dominant-baseline: central;
        font-size: 14px;
        font-weight: 400;
        fill: #6c757d;
    }
</style>

<svelte:window on:mousemove={drag} on:mouseup={dragend} on:touchmove={drag} on:touchend={dragend} />

<div class="chart" bind:clientWidth={width}>
    <svg {height}>
        <g>
            <!-- y axis -->
            <g class="axis y-axis">
                {#each yTicks as tick, i}
                    <g class="tick tick-{tick}" transform="translate(0, {yScale(tick)})">
                        <line x2="5" />
                        <text y="-4">
                            {@html $formatTemp(tick, !i)}
                        </text>
                    </g>
                {/each}
            </g>

            <!-- x axis -->
            <g class="axis x-axis">
                {#each xTicks as tick, i}
                    <g class="tick tick-{tick}" transform="translate({xScale(tick)},{height})">
                        <line y1="-{height - padding.top}" y2="-{padding.bottom}" x1="0" x2="0" />
                        <g>
                            <text y="0">{(width < 500 ? formatMobile : format)(tick, i)}</text>

                        </g>
                    </g>
                {/each}
            </g>

            <g class="context" on:mousedown={dragstart} on:touchstart={dragstart}>
                <rect
                    x={xScale(localContextMin - 0.5)}
                    width={xScale(localContextMax) - xScale(localContextMin)}
                    height={height - padding.bottom} />
                <text
                    transform="translate({xScale(0.5 * (localContextMin + localContextMax - 1))},
                    20)">
                    ◂ {$msg.basePeriod} ▸
                </text>
            </g>

            <rect
                class="normal-range"
                height={yScale(normalLow) - yScale(normalHigh)}
                width={width - 40}
                y={yScale(normalHigh)}
                x={padding.left - 20} />

            <g>
                {#each dataClean as d}
                    <g
                        class="day"
                        class:reference={d.year >= localContextMin && d.year < localContextMax}
                        transform="translate({Math.round(xScale(d.year))},0)">
                        {#if d.year < localContextMin || d.year >= localContextMax}
                            <g transform="translate({d.year === 2019 ? 10 : 0},0)">
                                {#if d.tMin < normalLow}
                                    <line
                                        class="colder"
                                        y1={yScale(d.tMin)}
                                        y2={yScale(Math.min(d.tMax, normalLow))} />
                                {/if}
                                {#if d.tMax > normalHigh}
                                    <line
                                        class="hotter"
                                        y1={yScale(d.tMax)}
                                        y2={yScale(Math.max(d.tMin, normalHigh))} />
                                {/if}
                                {#if d.tMin < normalHigh && d.tMax > normalLow}
                                    <line
                                        class="normal"
                                        y1={yScale(Math.max(normalLow, d.tMin))}
                                        y2={yScale(Math.min(normalHigh, d.tMax))} />
                                {/if}
                            </g>
                        {:else}
                            <line y1={yScale(d.tMin)} y2={yScale(d.tMax)} />
                        {/if}
                        <!-- <circle
                        r="3"
                        transform="translate(0,{yScale(d.tAvg)})" /> -->
                    </g>
                {/each}
            </g>

            <g class="normal-high" transform="translate(0,{yScale(normalHigh)})">
                <line class="zero" x1={padding.left - 20} x2={width} />
                <g transform="translate({width - padding.right + 30},-5)">
                    <text class="temp">
                        {@html $formatTemp(normalHigh)}
                    </text>
                    <text transform="translate(0,-35)">
                        <tspan x="0">{$msg.dailyAvgHighOn}</tspan>
                        <tspan x="0" dy="15">
                            18.12. ({localContextMin} - {localContextMax - 1})
                        </tspan>
                    </text>
                </g>
            </g>

            <g class="normal-low" transform="translate(0,{yScale(normalLow)})">
                <line class="zero" x1={padding.left - 20} x2={width} />
                <text class="temp" transform="translate({width - padding.right + 30},+5)">
                    {@html $formatTemp(normalLow)}
                </text>
                <text transform="translate({width - padding.right + 30},25)">
                    <tspan x="0">{$msg.dailyAvgLowOn}</tspan>
                    <tspan x="0" dy="15">18.12. ({localContextMin} - {localContextMax - 1})</tspan>
                </text>
            </g>

            <g class="normal" transform="translate(0,{yScale((normalLow + normalHigh) * 0.5)})">
                <text transform="translate({width - padding.right + 30},0)">
                    "{$msg.normalRange}"
                </text>
            </g>
        </g>
    </svg>
</div>
