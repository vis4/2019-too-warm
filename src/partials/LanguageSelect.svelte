<script>
    import { language } from '../stores';
    const options = ['deutsch', 'english'];
</script>

<style>
    .btn-group {
        margin-bottom: 20px;
    }
</style>

<div class="btn-group btn-group-toggle" data-toggle="buttons">
    {#each options as opt}
        <label
            class="btn btn-sm btn-outline-secondary"
            class:active={$language === opt.substr(0, 2)}>
            <input bind:group={$language} value={opt.substr(0, 2)} type="radio" name="options" />
            {opt}
        </label>
    {/each}
</div>
