import { processDynamicStrings, processTemplate } from "./template.processor";

function testTemplate() {
    processTemplate(
        `
    <!-- We want turing completion -->
    
    <div @if="this.condition">
        <!-- Do something -->
    </div>
    <div @else>
        <!-- Don't do something -->
    </div>
    
    <div @for="[each, index] of this.items">
        <!-- We can now use 'each' & 'index' -->
        <li @on:click="() => this.delete(each)">{ index+1 }: { each }, click to delete</li>
    </div>
    
    { this.method() }
    { this.data }
    { this.data.someValue }
    { JSON.stringify( this.data ) } //fully powered javascript engine methods
    
    <div @on:event="this.callback">
    
    </div>
        `,
        {
            states: [],
            vectors: [],
            methods: []
        }
    )
}

function testDynamicStringProcessor() {
    console.log(
        processDynamicStrings(`hello { something } world`, '<span></span>')
    )
}

/**Tests */

testTemplate()
//testDynamicStringProcessor()