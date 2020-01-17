<script>
    export let value;
    export let label;

    const id = `checkbox-${Math.round(Math.random() * 1e6).toString(30)}`;
</script>

<style>
    :global(.form-inline) .custom-checkbox {
        margin-right: 20px;
    }
</style>

<div class="custom-control custom-checkbox">
    <input bind:checked={value} type="checkbox" class="custom-control-input" {id} />
    <label class="custom-control-label" for={id}>
        {@html label}
    </label>
</div>
