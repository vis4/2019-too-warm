<script>
    export let value;
    export let label;

    const id = `switch-${Math.round(Math.random() * 1e6).toString(30)}`;
</script>

<div class="custom-control custom-switch">
    <input bind:checked={value} type="checkbox" class="custom-control-input" {id} />
    <label class="custom-control-label" for={id}>
        {@html label}
    </label>
</div>
