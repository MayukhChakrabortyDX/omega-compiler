
class Model {
}
var $$templ_HelloWorld = document.createElement("template");
$$templ_HelloWorld.innerHTML = `<button>A sample of what we can do</button>`;
class HelloWorld {
    $$state_counter = 0;
    $$sub_counter = new Set();
    get counter() { return this.$$state_counter; }
    set counter(v) { this.$$state_counter = v; for (var s of this.$$state_counter)
        s(); }
}
function state() { }
function vector() { }
function derive() { }
function component() {
}

