<script>
    import { clientPoint } from '../utils.js';
    import { timeFormat } from 'd3-time-format';
    import { timeDay } from 'd3-time';
    import {
        msg,
        language,
        minDate,
        maxDate,
        showAnomalies,
        labelRecordTemperatures,
        formatTemp
    } from '../stores';

    export let xScale;
    export let yScale;
    export let data;
    export let grouped;

    $: fmt = date =>
        $language === 'de'
            ? `${date.getDate()}. ${$msg.monthShort[date.getMonth()]}`
            : `${$msg.monthShort[date.getMonth()]} ${date.getDate()}`;

    const compFmt = timeFormat('%Y-%m-%d');

    let layer;
    let highlight;

    $: pxPerDay = (xScale.range()[1] - xScale.range()[0]) / timeDay.count(...xScale.domain());
    $: thin = pxPerDay < 3;
    $: filteredData = data.filter(
        d => d.dateRaw >= compFmt($minDate) && d.dateRaw <= compFmt($maxDate)
    );

    $: highlightDay = highlight ? filteredData.find(d => sameDay(d.date, highlight)) : null;

    $: currentTempData = filteredData
        .map(d => {
            if ($showAnomalies) {
                const m = grouped.find(e => e.dateRaw === d.dateRaw);
                // console.log(m);
                if (m) {
                    d.trendMin = m.tMin;
                    d.trendMax = m.tMax;
                    d.tMinAbs = m.tMinAbs;
                    d.tMaxAbs = m.tMaxAbs;
                    if (d.tMax > d.tMaxAbs || d.tMin < d.tMinAbs) {
                        d.labelMaxRecord = true;
                        d.labelMinRecord = true;
                    }
                }
            }
            return d;
        })
        .map((d, i) => {
            if ($labelRecordTemperatures) {
                if (d.tMax > d.tMaxAbs || d.tMin < d.tMinAbs) {
                    // check if we're a local max
                    const checkDays = pxPerDay < 3 ? 13 : 8;
                    filteredData.slice(Math.max(0, i - checkDays), i + checkDays + 1).forEach(e => {
                        if (d !== e && e.tMax > e.tMaxAbs && e.labelMaxRecord) {
                            // e is also a record
                            if (e.tMax >= d.tMax) {
                                d.labelMaxRecord = false;
                            }
                        }
                        if (d !== e && e.tMin < e.tMinAbs && e.labelMinRecord) {
                            // e is also a record
                            if (e.tMin <= d.tMin) {
                                d.labelMinRecord = false;
                            }
                        }
                    });
                }
            }
            return d;
        });

    function handleMouseMove(event) {
        const [x, y] = clientPoint(layer, event);
        const date = xScale.invert(x);
        const temp = yScale.invert(y);
        highlight = temp >= yScale.domain()[0] && temp <= yScale.domain()[1] ? date : null;
    }

    function sameYear(date1, date2) {
        return date1.getFullYear() === date2.getFullYear();
    }
    function sameMonth(date1, date2) {
        return sameYear(date1, date2) && date1.getMonth() === date2.getMonth();
    }
    function sameDay(date1, date2) {
        return sameMonth(date1, date2) && date1.getDate() === date2.getDate();
    }
</script>

<style>
    circle {
        fill: var(--def-color);
    }
    line {
        stroke: var(--def-color);
        stroke-width: 2;
        shape-rendering: crispEdges;
    }
    .thin line {
        stroke-width: 1;
    }
    circle.hotter,
    .record.high path,
    .record.high text {
        fill: var(--hotter-color);
    }
    circle.colder,
    .record.low path,
    .record.low text {
        fill: var(--colder-color);
    }
    circle.normal {
        fill: var(--normal-color);
    }
    line.hotter {
        stroke: var(--hotter-color);
    }
    line.colder {
        stroke: var(--colder-color);
    }
    line.normal {
        stroke: var(--normal-color);
    }
    g.record text {
        font-weight: 400;
        font-size: 13px;
        dominant-baseline: central;
    }
    g.highlight g.day.highlight {
        opacity: 1;
    }
    g.highlight g.day.highlight line {
        stroke: black;
        stroke-width: 2;
    }
    g.highlight g.day.highlight circle {
        fill: black;
        stroke: black;
        stroke-width: 1;
    }
    g.highlight g.day.highlight .buffer line {
        stroke: #dedede;
        stroke-linejoin: round;
        stroke-linecap: round;
        stroke-width: 8;
    }
    g.highlight g.day.highlight .buffer circle {
        fill: #dedede;
        stroke: #dedede;
        stroke-width: 4;
    }

    text {
        pointer-events: none;
        text-anchor: middle;
        font-size: 14px;
        font-weight: 500;
    }
    text.date {
        opacity: 0.6;
    }
    text.min {
        dominant-baseline: text-before-edge;
    }
    text.avg {
        text-anchor: start;
        dominant-baseline: central;
    }
    .highlight .buffer text {
        fill: var(--bg);
        stroke: var(--bg);
        stroke-width: 4;
        stroke-linejoin: round;
        stroke-linecap: round;
    }
    .highlight.focus {
        pointer-events: none;
    }
</style>

<svelte:window
    on:mousemove={handleMouseMove}
    on:touchmove={handleMouseMove}
    on:mouseout={() => (highlight = null)} />

<g bind:this={layer} class:highlight>
    {#each currentTempData as d}
        <g
            class="day"
            class:thin
            class:highlight={highlight && sameDay(highlight, d.date)}
            transform="translate({xScale(d.date)},0)">
            {#if $showAnomalies && !(highlight && sameDay(highlight, d.date))}
                {#if d.tMin < d.trendMin}
                    <line
                        class="colder"
                        y1={yScale(d.tMin)}
                        y2={yScale(Math.min(d.tMax, d.trendMin))} />
                {/if}
                {#if d.tMax > d.trendMax}
                    <line
                        class="hotter"
                        y1={yScale(d.tMax)}
                        y2={yScale(Math.max(d.tMin, d.trendMax))} />
                {/if}
                {#if d.tMin < d.trendMax && d.tMax > d.trendMin}
                    <line
                        class="normal"
                        y1={yScale(Math.max(d.trendMin, d.tMin))}
                        y2={yScale(Math.min(d.trendMax, d.tMax))} />
                {/if}
            {:else}
                <line y1={yScale(d.tMin)} y2={yScale(d.tMax)} />
            {/if}

            <circle
                class:hotter={$showAnomalies && d.tAvg > d.trendMax}
                class:colder={$showAnomalies && d.tAvg < d.trendMin}
                class:normal={$showAnomalies && d.tAvg >= d.trendMin && d.tAvg <= d.trendMax}
                r={(highlight && sameDay(highlight, d.date) ? 3 : 2) * (thin ? 0.75 : 1)}
                transform="translate(0,{yScale(d.tAvg)})" />

            {#if $labelRecordTemperatures}
                {#if d.tMax > d.tMaxAbs}
                    <g class="record high" transform="translate(0, {yScale(d.tMax) - 7})">
                        {#if d.labelMaxRecord}
                            <text y="-15">
                                {@html $formatTemp(d.tMax, false)}
                            </text>
                        {/if}
                        <path d="M0,0 L-4,-4 L 4,-4 Z" />
                    </g>
                {/if}
                {#if d.tMin < d.tMinAbs}
                    <g class="record low" transform="translate(0, {yScale(d.tMin) + 7})">
                        {#if d.labelMinRecord}
                            <text y="15">
                                {@html $formatTemp(d.tMin, false)}
                            </text>
                        {/if}
                        <path d="M0,0 L-4,4 L 4,4 Z" />
                    </g>
                {/if}
            {/if}
        </g>
    {/each}
    {#if highlightDay}
        <g class="highlight day focus" transform="translate({xScale(highlightDay.date)},0)">
            <g class="buffer">
                <line y1={yScale(highlightDay.tMin)} y2={yScale(highlightDay.tMax)} />
                <circle
                    r={3 * (thin ? 0.75 : 1)}
                    transform="translate(0,{yScale(highlightDay.tAvg)})" />
                <text class="date" y={yScale(highlightDay.tMax) - 35}>
                    {fmt(highlightDay.date)}
                </text>
                <text y={yScale(highlightDay.tMax) - 15}>
                    {@html $formatTemp(highlightDay.tMax)}
                </text>
                <text class="min" y={yScale(highlightDay.tMin) + 15}>
                    {@html $formatTemp(highlightDay.tMin)}
                </text>
            </g>

            <line y1={yScale(highlightDay.tMin)} y2={yScale(highlightDay.tMax)} />
            <circle
                r={3 * (thin ? 0.75 : 1)}
                transform="translate(0,{yScale(highlightDay.tAvg)})" />

            <text class="date" y={yScale(highlightDay.tMax) - 35}>{fmt(highlightDay.date)}</text>
            <text y={yScale(highlightDay.tMax) - 15}>
                {@html $formatTemp(highlightDay.tMax)}
            </text>
            <text class="min" y={yScale(highlightDay.tMin) + 15}>
                {@html $formatTemp(highlightDay.tMin)}
            </text>
            <!-- {#if yScale(highlightDay.tMin) - yScale(highlightDay.tMax) > 30}
            <text class="avg" x="5" y={yScale(highlightDay.tAvg)}>{@html $formatTemp(highlightDay.tAvg)}</text>
        {/if} -->
        </g>
    {/if}
</g>
