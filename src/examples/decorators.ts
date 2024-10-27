@component({
    template: "./counter.oml"
})
export class Counter extends Model {

    @state() counter = 0

    increment() {
        this.counter++
    }

}