import { writable, derived } from 'svelte/store';
import { timeMonth, timeDay } from 'd3-time';
import { scaleLinear } from 'd3-scale';
import { de, en } from './locale';

export const contextMinYear = writable(1981);
export const contextRange = writable(30); // years
export const contextMaxYear = derived(
    [contextMinYear, contextRange],
    ([$contextMinYear, $contextRange]) => $contextMinYear + $contextRange
);

export const maxDate = writable(new Date(2019, 11, 31));

export const innerWidth = writable(window.innerWidth);
export const chartWidth = writable(1000);

export const showDays = derived(chartWidth, $cw =>
    $cw < 500 ? 180 : Math.max(365, Math.round(($cw - 50) / 4))
);

export const minDate = derived([maxDate, chartWidth, showDays], ([$a, $cw, $showDays]) => {
    const approxDays = $showDays;
    // compute exact days to match days
    const lastD = timeMonth.ceil($a);
    const minD = timeMonth.floor(new Date(lastD.getTime() - approxDays * 864e5));
    const days = timeDay.count(minD, lastD);
    return new Date($a.getTime() - days * 864e5);
});

export const language = writable('en');

export const showAnomalies = writable(true);
export const labelRecordTemperatures = writable(true);

export const smoothNormalRangeWidth = writable(0);

export const msg = derived(language, lang => {
    return lang === 'de' ? de : en;
});

export const useFahrenheit = writable(false);

export const formatTemp = derived([language, useFahrenheit], ([lang, useF]) => {
    return (d, unit = true, rel = false) => {
        if (!d.toFixed) return d;
        if (useF) d = d * 1.8 + (rel ? 0 : 32);
        const n = Math.abs(d)
            .toFixed(Math.round(d * 1e6) / 1e6 === Math.round(d) ? 0 : 1)
            .replace(lang === 'de' ? '.' : null, ',');
        const sign = d < 0 ? '&minus;' : rel && d > 0 ? '+' : rel && !d ? '&plusmn;' : '';
        return `${sign}${n}${unit ? `°${useF ? 'F' : 'C'}` : ''}`;
    };
});

export function toF(C) {
    return C * 1.8 + 32;
}
export function toC(F) {
    return (F - 32) / 1.8;
}

export const getTempTicks = derived(useFahrenheit, useF => {
    if (!useF) return (scale, num) => scale.ticks(num).sort((a, b) => b - a);
    return (scale, num) => {
        return scaleLinear()
            .domain(scale.domain().map(toF))
            .ticks(num)
            .map(toC)
            .sort((a, b) => b - a);
    };
});
