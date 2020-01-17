<script>
    import { scaleTime, scaleLinear } from 'd3-scale';
    import { clientPoint } from 'd3-selection';
    import scaleFisheye from './fisheye';
    import { timeMonth, timeDay, timeDays } from 'd3-time';
    import { timeFormat } from 'd3-time-format';
    import { mean, quantileSorted, group, ascending, max, min } from 'd3-array';
    import {
        msg,
        toF,
        innerWidth,
        chartWidth,
        formatTemp,
        minDate,
        maxDate,
        contextMinYear,
        contextMaxYear,
        getTempTicks,
        useFahrenheit,
        smoothNormalRangeWidth
    } from './stores';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    let chart;
    export let data = [];
    let tMin = -29;
    let tMax = 45;
    export let layers = [];

    $: zoomed = $distortion > 0;

    $: dataClean = data.filter(d => d.tMin > -999 && d.tMax > -999);

    $: dataSmooth =
        $smoothNormalRangeWidth > 0
            ? dataClean.map((d, i) => {
                  return {
                      date: d.date,
                      dateRaw: d.dateRaw,
                      tMin: mean(
                          dataClean
                              .slice(
                                  Math.max(0, i - $smoothNormalRangeWidth),
                                  i + $smoothNormalRangeWidth + 1
                              )
                              .map(d => d.tMin)
                      ),
                      tAvg: mean(
                          dataClean
                              .slice(
                                  Math.max(0, i - $smoothNormalRangeWidth),
                                  i + $smoothNormalRangeWidth + 1
                              )
                              .map(d => d.tAvg)
                      ),
                      tMax: mean(
                          dataClean
                              .slice(
                                  Math.max(0, i - $smoothNormalRangeWidth),
                                  i + $smoothNormalRangeWidth + 1
                              )
                              .map(d => d.tMax)
                      )
                  };
              })
            : dataClean;

    $: padding = { top: 20, right: 5, bottom: 30, left: innerWidth < 400 ? 30 : 40 };

    let distortion = tweened(0, {
        duration: 600,
        easing: cubicOut
    });
    let focus = 10;

    $: xScale = scaleFisheye(scaleTime, $distortion, focus)
        .domain([$minDate, $maxDate])
        .range([padding.left, $chartWidth - padding.right]);

    $: xTicks = xScale.ticks(timeMonth);

    $: yScale = scaleLinear()
        .domain([tMin, tMax])
        .range([height - padding.bottom, padding.top]);

    $: yTicks = $getTempTicks(yScale, 6);

    $: height = Math.max(
        450,
        Math.min(500, $chartWidth * ($chartWidth > 800 ? 0.35 : $chartWidth > 500 ? 0.7 : 1))
    );

    $: format = (d, i) => $msg.monthLong[d.getMonth()];
    $: formatMobile = (d, i) => $msg.monthShort[d.getMonth()];

    const midMonth = d => {
        return new Date(
            d.getTime() + (new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()) - d) / 2
        );
    };

    const fmt = timeFormat('-%m-%d');

    let grouped;

    function handleMouseClick(event) {
        const x = clientPoint(chart, event)[0];
        if (isNaN(x)) return;
        const oldFocus = focus;
        event.preventDefault();
        distortion.set(zoomed && (event.type !== 'touchstart')? 0 : 3);
        focus = x;
    }
    function handleMouseMove(event) {
        event.preventDefault();
        const x = clientPoint(chart, event)[0];
        if (isNaN(x)) return;
        focus = x;
    }
    function handleMouseLeave(event) {
        // distortion.set(0);
    }

    $: {
        const cache = group(dataClean, d => d.dateRaw.substr(4));
        const cacheSmooth = group(dataSmooth, d => d.dateRaw.substr(4));

        tMin = 99;
        tMax = -99;

        grouped = timeDays($minDate, timeDay.offset($maxDate, 1)).map(day => {
            const dayFmt = fmt(day);
            const groupedAll = cache.get(dayFmt).filter(d => d.date.getTime() < $minDate.getTime());
            const tMinAbs = min(groupedAll, d => d.tMin);
            const tMaxAbs = max(groupedAll, d => d.tMax);
            const grouped = cacheSmooth
                .get(dayFmt)
                .filter(
                    d =>
                        d.date.getFullYear() >= $contextMinYear &&
                        d.date.getFullYear() < $contextMaxYear
                );
            const tMinSorted = grouped.map(d => d.tMin).sort(ascending);
            const tAvgSorted = grouped.map(d => d.tAvg).sort(ascending);
            const tMaxSorted = grouped.map(d => d.tMax).sort(ascending);

            const dateRaw = day.getFullYear() + dayFmt;
            const cur = data.find(d => d.dateRaw === dateRaw);
            tMin = Math.min(tMin, tMinAbs - 5);
            tMax = Math.max(tMax, tMaxAbs + 5);
            if (cur) {
                tMin = Math.min(tMin, cur.tMin - 5);
                tMax = Math.max(tMax, cur.tMax + 5);
            }
            const tAvg = quantileSorted(tAvgSorted, 0.5);
            return {
                date: day,
                dateRaw,
                grouped,
                tMin: mean(tMinSorted),
                tAvg,
                tMax: mean(tMaxSorted),
                tMinAbs,
                tMaxAbs,
                tMinSorted,
                tAvgSorted,
                tMaxSorted
            };
        });

        while (tMax - tMin < 40) {
            tMax++;
            tMin--;
        }
    }
</script>

<style>
    .chart {
        width: 100%;
        margin-left: auto;
        margin-right: auto;
        cursor: zoom-in;
    }
    .chart.zoomed {
        cursor: zoom-out;
    }

    svg {
        position: relative;
        width: 100%;
        overflow: visible;
    }

    .tick {
        font-size: 0.725em;
        font-weight: 200;
    }

    .tick line {
        stroke: var(--tick-line);
        shape-rendering: crispEdges;
    }

    .tick text {
        fill: #666;
        font-weight: 500;
        font-size: 15px;
        text-anchor: start;
    }

    .x-axis .tick text {
        text-anchor: middle;
        dominant-baseline: alphabetic;
    }

    line.zero {
        shape-rendering: crispEdges;
        stroke: black;
        opacity: 0.25;
    }

    @media (max-width: 400px) {
        .tick text {
            font-size: 13px;
        }
    }
</style>

<svelte:window bind:innerWidth={$innerWidth} />

<div
    bind:this={chart}
    class:zoomed
    class="chart"
    bind:clientWidth={$chartWidth}
    on:click={handleMouseClick}
    on:touchstart={handleMouseClick}
    on:mousemove={handleMouseMove}
    on:touchmove={handleMouseMove}
    on:mouseleave={handleMouseLeave}>
    <svg {height}>
        <g>
            <!-- y axis -->
            <g class="axis y-axis">
                {#each yTicks as tick, i}
                    <g class="tick tick-{tick}" transform="translate(0, {yScale(tick)})">
                        <line x2="100%" />
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
                        <line y1="-{height}" y2="-{padding.bottom}" x1="0" x2="0" />
                        {#if midMonth(tick) < $maxDate}
                            <g transform="translate({xScale(midMonth(tick)) - xScale(tick)},-50)">
                                <text y="0">
                                    {innerWidth > 400 ? format(tick, i) : formatMobile(tick, i)}
                                </text>
                                {#if (!i && tick.getMonth() < 11) || !tick.getMonth()}
                                    <text class="year" y="20">{tick.getFullYear()}</text>
                                {/if}
                            </g>
                        {/if}
                    </g>
                {/each}
            </g>

            {#each layers as layer}
                <svelte:component this={layer} {data} {grouped} {xScale} {yScale} />
            {/each}

            <line class="zero" transform="translate(0,{yScale(0)})" x2="100%" />
        </g>
    </svg>
</div>
