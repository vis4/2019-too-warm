<script>
    import { timeFormat } from 'd3-time-format';
    import { timeDay, timeMonth } from 'd3-time';
    import { maxDate, msg } from '../stores';

    const tfmt = timeFormat('%Y');

    $: yearStr = tfmt($maxDate);

    function changeDate(prop, offset, delay = 300) {
        let d = new Date($maxDate);
        d[`set${prop}`](d[`get${prop}`]() + offset);
        // move date to last of month
        d = timeDay.offset(timeMonth.ceil(d), -1);
        if (d >= new Date()) d = new Date();
        $maxDate = d;
    }

    const prevMonth = () => changeDate('Month', -1);
    const nextMonth = () => changeDate('Month', +1);
    const prevYear = () => changeDate('FullYear', -1);
    const nextYear = () => changeDate('FullYear', +1);

    function handleDateChange(event) {
        if (+event.target.value > 1881 && event.target.value < 2021) {
            $maxDate = new Date(event.target.value, 11, 31);
        }
    }
</script>

<style>
    .btn i.im {
        font-size: 10px;
        margin: 0 -3px;
    }
    input[type='number'] {
        max-width: 5em;
    }
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        /* display: none; <- Crashes Chrome on hover */
        -webkit-appearance: none;
        margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
    }
    input[type='number'] {
        -moz-appearance: textfield; /* Firefox */
    }
    .form-inline {
        margin-bottom: 20px;
    }
    .btn-group input[type='number'] {
        border-left: 0;
        border-right: 0;
        text-align: center;
        border-radius: 0;
    }
</style>

<div class="form-inline">

    <label>{$msg.month}</label>
    <div class="btn-group ml-2 mr-2">
        <button class="btn btn-sm btn-outline-secondary" on:click={prevMonth}>
            <i class="fa fa-caret-left" />
        </button>
        <button class="btn btn-sm btn-outline-secondary" on:click={nextMonth}>
            <i class="fa fa-caret-right" />
        </button>
    </div>

    <label>{$msg.year}</label>
    <div class="btn-group ml-2 mr-2">
        <button class="btn btn-sm btn-outline-secondary" on:click={prevYear}>
            <i class="fa fa-caret-left" />
        </button>
        <input
            class="form-control form-control-sm"
            type="number"
            value={$maxDate.getFullYear()}
            on:input={handleDateChange}
            on:change={handleDateChange} />
        <button class="btn btn-sm btn-outline-secondary" on:click={nextYear}>
            <i class="fa fa-caret-right" />
        </button>
    </div>

    <button
        class="btn btn-sm btn-outline-secondary ml-2"
        on:mousedown={() => ($maxDate = new Date())}>
        {$msg.today}
    </button>

</div>
