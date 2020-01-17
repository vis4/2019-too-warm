<script>
    import { scaleTime, scaleLinear } from 'd3-scale';
    import { timeFormat } from 'd3-time-format';
    import { mean, group } from 'd3-array';
    import {
        contextMinYear,
        contextMaxYear,
        contextRange,
        formatTemp,
        useFahrenheit
    } from './stores';

    export let data = [];

    export let day = new Date(2019, 11, 18);

    let width = 400;

    const fmt = timeFormat('%Y-%m');
    $: dayFmt = fmt(day);

    $: minYear = Math.max(1950, dataClean[0].year);
    $: maxYear = dataClean[dataClean.length - 1].year;

    $: dataClean = data
        .filter(d => d.tMin > -999 && d.tMax > -999)
        .map(d => {
            d.year = d.date.getFullYear();
            d.decade = Math.floor(d.year / 10) * 10;
            d.yearMonth = fmt(d.date);
            return d;
        })
        .filter(d => d.year >= 1960 && d.year < 2020);

    $: byMonth = Array.from(group(dataClean, d => d.yearMonth)).map(([key, values]) => ({
        year: values[0].year,
        decade: values[0].decade,
        month: values[0].date.getMonth(),
        date: new Date(values[0].year, values[0].date.getMonth(), 1),
        tAvg: mean(values, d => d.tAvg)
    }));

    $: byMonthBase = byMonth.filter(d => d.year >= $contextMinYear && d.year < $contextMaxYear);

    $: monthlyNormalRange = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(month => {
        const monthValues = byMonthBase.filter(d => d.month === month);
        return {
            tAvg: mean(monthValues, d => d.tAvg)
        };
    });

    $: monthlyNormalAvg = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(month => {
        const monthValues = byMonthBase.filter(d => d.month === month);
        return mean(monthValues, d => d.tAvg);
    });

    $: byDecade = Array.from(group(byMonth, d => d.decade).values()).map(d => ({
        decade: d[0].decade,
        xScale: scaleTime()
            .domain([new Date(d[0].decade, 0, 1), new Date(d[0].decade + 10, 0, 0)])
            .range([0, width - 40]),
        values: d
    }));

    let dtMin = 99;
    let dtMax = -99;

    $: {
        dtMin = 99;
        dtMax = -99;
        byMonth.forEach(d => {
            const dt = d.tAvg - monthlyNormalAvg[d.month];
            dtMin = Math.min(dtMin, dt);
            dtMax = Math.max(dtMax, dt);
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

    $: padding = { top: 40, right: 180, bottom: 30, left: width < 500 ? 40 : 60 };

    $: decadeH = width < 500 ? 80 : 100;

    $: yScale = scaleLinear()
        .domain([dtMin, dtMax])
        .range([decadeH - 20, 0]);

    const format = (d, i) => (i ? `'${String(d.getFullYear()).substr(2)}` : d.getFullYear());
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
        dominant-baseline: alphabetic;
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

    .month line {
        stroke: #bbb;
        stroke-width: 3;
        shape-rendering: crispEdges;
    }

    @media (max-width: 500px) {
        .month line {
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
</style>

<div class="chart" bind:clientWidth={width}>
    <svg height={byDecade.length * decadeH + 20}>
        {#each byDecade as decade, d}
            <g class="decade" transform="translate(0, {d * decadeH + 10})">

                <!-- y axis -->
                <g class="axis y-axis">
                    {#each $useFahrenheit ? [3.888888888, 0, -3.88888888] : [-4, 0, 4] as tick, i}
                        {#if !d}
                            <text x={width - 35} y={yScale(tick)}>
                                {@html $formatTemp(tick, !i, true)}
                            </text>
                        {/if}
                        <line
                            class:zero={!tick}
                            transform="translate(0,{yScale(tick)})"
                            x2={width - 40} />
                    {/each}
                </g>
                <!-- x axis -->
                <g class="axis x-axis">
                    {#each decade.xScale.ticks(8) as tick, i}
                        <g class="tick" transform="translate({decade.xScale(tick)}, 0)">
                            <line y1={yScale(-6)} y2={yScale(6)} />
                            <g transform="translate(0,{decadeH - 5})">
                                <text
                                    class="buffer"
                                    x={decade.xScale(new Date(tick.getTime() + 864e5 * 182)) - decade.xScale(tick)}
                                    y="-10">
                                    {format(tick, i)}
                                </text>
                                <text
                                    x={decade.xScale(new Date(tick.getTime() + 864e5 * 182)) - decade.xScale(tick)}
                                    y="-15">
                                    {format(tick, i)}
                                </text>
                            </g>
                        </g>
                    {/each}
                </g>
                <g class="values">
                    {#each decade.values as d}
                        <g
                            class="month"
                            transform="translate({decade.xScale(new Date(d.date.getTime() + 864e5 * 15))},0)">

                            {#if d.tAvg < monthlyNormalAvg[d.month]}
                                <line
                                    class="colder"
                                    y1={yScale(0)}
                                    y2={yScale(d.tAvg - monthlyNormalAvg[d.month])} />
                            {/if}
                            {#if d.tAvg > monthlyNormalAvg[d.month]}
                                <line
                                    class="hotter"
                                    y1={yScale(0)}
                                    y2={yScale(d.tAvg - monthlyNormalAvg[d.month])} />
                            {/if}

                        </g>
                    {/each}
                </g>
            </g>
        {/each}
    </svg>
</div>
