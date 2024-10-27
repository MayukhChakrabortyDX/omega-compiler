OmegaJS Compiled Output Specifications.

1. General Layouts

Omega will use a custom templating language to
define highly compilable and optimizable templates.

```otl
<!-- Filename: counter.otl -->
<template>
    <button @on:click={ () => increment() }>Click to increment { counter }</button>
</template>
<script main>
    import { Component } from '@indivice/omega'

    export default class Counter extends Component {
        counter = 0;
        increment() {
            this.counter++
        }
    }
</script>
```
will be compiled to:

```js
import { template, txt } from '@indivice/omega/template'

const $$templ_Counter = template.cloneNode();
$$templ_Counter.innerHTML = `<button>Click to increment <span></span></button>`
export default class Counter {
    //since counter was used as a property in view
    $$dynamic_counter = 0
    $$sub_counter = new Set()
    get counter() {
        return this.$$dynamic_counter
    }
    set counter(v) {
        this.$$dynamic_counter = v
        for ( const s of this.$$sub_counter ) s();
    }
    increment() {
        this.counter++
    }
    //the element can also be real dom to make sure it's server rendered.
    static render(instance, element = $$templ_Counter.cloneNode(true).content) {
        //connecting the model to the view
        element.children[0].onclick = () => instance.increment();
        const loc_txt = txt.cloneNode()
        element.children[0].children[0].replaceWith(loc_txt)
        //since loc_txt needs to detect changes from counter
        instance.$$sub_counter.add(() => {
            loc_txt.textContent = `${ instance.counter }`
        })
        return element
    }
}
```