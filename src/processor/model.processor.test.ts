import ts, { createPrinter, createSourceFile, EmitHint, factory, ListFormat, NewLineKind, ScriptTarget } from "typescript";
import { processModel, createSignal } from "./model.processor";

function testProcessModel() {
    const output = processModel(`

        const Model = class Something {}
        class Model {
        }

        @data()
        class Store {
            @state() todos = []
        }
        
        @component()
        class HelloWorld {

            @someOtherModifier()
            @state() 
            counter = 0;
        }
        
        function state() {}
        function vector() {}
        function derive() {}
        function component() {
        }
        
        `, 'test://test.ts').replace('\n', "")

    console.log(output)
}

testProcessModel()

function testCS() {

    const dummy = createSourceFile("test.ts", "", ScriptTarget.ESNext)
    console.log(
        createPrinter({}).printList(
            ListFormat.SingleLine,
            //@ts-ignore
            createSignal("app", factory.createNumericLiteral(10), []),
            dummy
        )
    )

}

//testCS()