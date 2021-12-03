import { writable } from 'svelte/store'

const feedStore = writable({
    amount: 5,
    refresh: 8,
    active: true
})

export default feedStore