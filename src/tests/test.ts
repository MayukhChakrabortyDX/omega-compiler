const gdeps = []
class Something {

    state = 0
    subs = new Set()
    get _state() {
        gdeps.push(this.subs)
        return this.state
    }

    getGDEPS() {
        
        console.log(this._state)
        console.log(gdeps)

    }

}

(new Something()).getGDEPS()