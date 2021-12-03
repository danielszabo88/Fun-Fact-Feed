<script>
    import feedStore from './feedStore'
    import Fact from './Fact.svelte'

    let logo = "img/fff_logo_sm.jpg"

    let endpoints = [{URL: "https://catfact.ninja/fact", factprop: "fact"}, 
                    {URL:"https://v2.jokeapi.dev/joke/Any?type=single", factprop: "joke"},
                    {URL:"http://numbersapi.com/random/math", factprop: ""},
                    {URL: "https://api.punkapi.com/v2/beers/random", factprop: "description"},
                    {URL: "https://geek-jokes.sameerkumar.website/api", factprop: ""}, 
                    {URL: "https://some-random-api.ml/facts/dog", factprop: "fact"},
                    {URL: "https://some-random-api.ml/facts/panda", factprop: "fact"},
                    {URL: "https://some-random-api.ml/facts/koala", factprop: "fact"},    
                    {URL: "https://some-random-api.ml/facts/fox", factprop: "fact"},
                    {URL: "https://some-random-api.ml/facts/bird", factprop: "fact"}]

    let facts = []

    $: {
        while(facts.length < $feedStore.amount && facts.length){
            facts = [...facts, '']
        }
        while(facts.length > $feedStore.amount){
            facts = facts.slice(0, facts.length - 1)
        }
    }

    let currentID
    $: {
        if($feedStore.active){
            if(currentID){
                clearInterval(currentID)
            } else {
                initializeFeed()
            }
            currentID = setInterval(updateFeed, $feedStore.refresh*1000)
        } else {
            clearInterval(currentID)
            currentID = null
        }
    }

    const getRandomFact = async () => {
        let randomFact = ""
        let fetchIndex = Math.floor(Math.random() * endpoints.length)
        let url = endpoints[fetchIndex].URL
        let factProp = endpoints[fetchIndex].factprop
        if(factProp){
            let data = await (await fetch(url)).json()
            if(data[0]){
                data = data[0]
            }
            randomFact = data[factProp]
        } else {
            randomFact = await (await fetch(url)).text()
        }
        return randomFact
    }

    const updateFeed = async () => {
        facts = facts.slice(0, facts.length - 1)
        facts = [await getRandomFact(), ...facts]
    }

    const initializeFeed = async () => {
        for(let i=0; i < $feedStore.amount; i++){
            facts.unshift(await getRandomFact())
        }
    }
</script>

<img src={logo} alt="fff logo" />

{#if $feedStore.amount > 9}
    <h4>Too many sentences to display!</h4>
{:else if $feedStore.amount < 4}
    <h4>Too little amount of sentences!</h4>
{:else}
    <h4>Amount: {$feedStore.amount} Facts</h4>
{/if}

{#if facts.length}
    <ol>
        {#each facts as fact}
            <li><Fact factprop={fact}/></li>
        {/each}
    </ol>
{:else}
    <h3>Loading the Facts......</h3>
{/if}