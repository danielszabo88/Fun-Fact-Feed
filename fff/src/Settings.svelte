<script>
    import feedStore from './feedStore'
    let amount = $feedStore.amount
    let refresh = $feedStore.refresh
    let active = $feedStore.active
    $: feedStore.update(currentSettings => {
        currentSettings.amount = amount
        currentSettings.refresh = refresh
        currentSettings.active = active
        return currentSettings
    })
</script>

<h3>Feed Settings</h3>
<label for="amount" >Amount: {amount}</label>
<input type="range" min=3 max=10 bind:value={amount} disabled={!$feedStore.active}>
<label for="refresh">Refresh Rate: {refresh}</label>
<input type="range" min=6 max=12 bind:value={refresh} disabled={!$feedStore.active}>
<br/>
<button on:click={() => active=!active}>{active ? "Stop Feed" : "Start Feed"}</button>