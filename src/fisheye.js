import { extent } from 'd3-array';
import { scaleTime, scaleLinear } from 'd3-scale';

export default function scaleFisheye(scaleType, distortion = 3, focus = 0) {
    let scale = scaleType();
    const isTimeScale = scaleType === scaleTime;
    let timeScale;

    if (isTimeScale) {
        timeScale = scale;
        scale = scaleLinear()
            .domain(timeScale.domain().map(d => d.getTime()))
            .range(timeScale.range());
    }

    function fisheye(_) {
        if (isTimeScale) _ = _.getTime();
        const x = scale(_);
        const left = x < focus;
        const range = extent(scale.range());
        const min = range[0];
        const max = range[1];
        let m = left ? focus - min : max - focus;
        if (m === 0) m = max - min;
        return (
            ((left ? -1 : 1) * m * (distortion + 1)) / (distortion + m / Math.abs(x - focus)) +
            focus
        );
    }

    fisheye.invert = _ => {
        // const left = _ < focus;
        // const range = extent(scale.range());
        // const min = range[0];
        // const max = range[1];
        // let m = left ? focus - min : max - focus;
        // if (m === 0) m = max - min;
        // const p = left ? -1 : 1;
        // // var xf = p * m * (distortion + 1) / (distortion + (m / Math.abs(x - focus))) + focus;
        // const x = (focus + m / ( m*(distortion+1)*p/_ - distortion - focus)) * p;
        return (timeScale || scale).invert(_);
    };

    fisheye.distortion = _ => {
        if (!arguments.length) return distortion;
        distortion = +_;
        return fisheye;
    };

    fisheye.focus = _ => {
        if (!arguments.length) return focus;
        focus = +_;
        return fisheye;
    };

    fisheye.copy = () => scaleFisheye(scale.copy(), distortion, focus);

    fisheye.nice = (timeScale || scale).nice;
    fisheye.ticks = (timeScale || scale).ticks;
    fisheye.tickFormat = (timeScale || scale).tickFormat;

    fisheye.domain = _ => {
        if (_ === undefined) return (timeScale || scale).domain();
        if (isTimeScale) {
            scale.domain(_.map(d => d.getTime()));
            timeScale.domain(_);
        } else {
            scale.domain(_);
        }
        return fisheye;
    };

    fisheye.range = _ => {
        if (_ === undefined) return (timeScale || scale).range();
        scale.range(_);
        if (isTimeScale) timeScale.range(_);
        return fisheye;
    };

    return fisheye;
    // return rebind(fisheye, scale, "domain", "range");
}

function rebind(target, source) {
    let i = 1;
    const n = arguments.length;
    let method;
    while (++i < n) target[(method = arguments[i])] = d3Rebind(target, source, source[method]);
    return target;
}

// Method is assumed to be a standard D3 getter-setter:
// If passed with no arguments, gets the value.
// If passed with arguments, sets the value and returns the target.
function d3Rebind(target, source, method) {
    return function() {
        var value = method.apply(source, arguments);
        return value === source ? target : value;
    };
}
