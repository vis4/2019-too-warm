<script>
    import BaseChart from './BaseChart.svelte';
    import RecordTemperatures from './layers/RecordTemperatures.svelte';
    import NormalTemperature from './layers/NormalTemperature.svelte';
    import NormalTemperatureRange from './layers/NormalTemperatureRange.svelte';
    import CurrentTemperatures from './layers/CurrentTemperatures.svelte';

    $: layerRecord = true;
    $: layerNormal = true;
    $: layerNormalRange = true;

    $: layers = [
        RecordTemperatures,
        NormalTemperatureRange,
        CurrentTemperatures,
        NormalTemperature
    ];

    export let data;

    $: globalMinYear = data[data.length - 1].date.getFullYear();
    $: globalMaxYear = data[0].date.getFullYear();
</script>

<style>
    input[type='number'] {
        width: 5em;
    }
    s .form-group .form-control {
        margin-bottom: 0;
    }
    .form-text {
        margin-top: 0;
    }
    .form-inline + .form-inline {
        margin-top: 10px;
    }
    .btn i.im {
        font-size: 10px;
        margin: 0 -3px;
    }
</style>

<BaseChart {data} {layers} />
