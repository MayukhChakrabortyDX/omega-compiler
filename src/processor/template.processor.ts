import { tokenize, constructTree } from 'hyntax'
import type { TreeConstructor } from 'hyntax'
import { minify } from 'html-minifier'

//export for testing purposes.
export function processDynamicStrings(str: string, repr: string) {

    const bracketStack: string[] = []
    let fstr = ""
    let ostr = ""

    for (let char of str) {

        if (char == "{") {
            if (bracketStack.length == 0) {
                bracketStack.push(char)
                ostr += char
            } else {
                bracketStack.push(char)
                fstr += char
                ostr += char
            }
        } else if (char == "}") {
            if (bracketStack.length > 1) {
                fstr += char
                ostr += char
                bracketStack.pop()
            } else {
                ostr += char
                break
            }
        } else {
            if (bracketStack.length != 0) {
                fstr += char
                ostr += char
            }
        }

    }

    return {
        contents: fstr.trim(),
        replacedString: (() => {
            if (fstr != "") {
                return str.replace(ostr, repr)
            } else {
                return str
            }
        })()
    }
}

const NodeProcessingLookupTable = {

    style(node: TreeConstructor.StyleNode) {

        let attrs = ""
        if (node.content.attributes != undefined) {
            for (let attr of node.content.attributes) {
                if (attr.value?.content != undefined) {
                    attrs += `${attr.key?.content}="${attr.value?.content}" `
                } else {
                    attrs += attr.key?.content + " "
                }
            }
        }

        return {
            html: `<${`style ${attrs}`.trim()}>${node.content.value.content}</style>`,
            js: ""
        }

    },

    tag(node: TreeConstructor.TagNode) {

        let children = ""
        if (node.content.children != undefined) {
            for (let child of node.content.children) {

                if (child.nodeType == "comment" || child.nodeType == "doctype") {
                    continue
                }
                //@ts-ignore
                children += NodeProcessingLookupTable[child.nodeType](child).html
            }
        }

        let attrs = ""
        if (node.content.attributes != undefined) {
            for (let attribute of node.content.attributes) {
                if (attribute.value?.content != undefined) {
                    attrs += `${attribute.key?.content}="${attribute.value?.content}" `
                } else {
                    attrs += attribute.key?.content + " "
                }
            }
        }

        let html = `<${(node.content.name + " " + attrs).trim()}>${children}</${node.content.name}>`

        return {
            html,
            js: "" //for now.
        }

    },

    document(node: TreeConstructor.DocumentNode) {

        let html = ""
        for (let child of node.content.children) {

            if (child.nodeType == "comment" || child.nodeType == "doctype") {
                continue
            }

            //@ts-ignore
            html += NodeProcessingLookupTable[child.nodeType](child).html

        }

        return {
            html,
            js: ""
        }

    },

    text(node: TreeConstructor.TextNode) {

        //processing the text nodes, basically means something like { ..contents }
        //are to be processed.

        const processedTextNode = processDynamicStrings(node.content.value.content, `<span></span>`)

        if (processedTextNode.contents.startsWith("{") || processedTextNode.contents.endsWith("}")) {
            //this means the nodes are malformed. we can inform it here
        }

        /**
         * Now, if there is valid content inside of the brackets, it is very expensive to check them.
         * what we are going to do, is see if any states, methods or vectors are in there. If that's
         * the case, we can simplify our process and add event listeners as much as we want.
         * 
         * Hence we need the cascading indexing information. I.e an array of indexes passed to
         * it.
         * 
         * For example:
         * <div>
         *      Hello World
         *      <button>
         *          Click to increment { counter }
         *      </button>
         * </div>
         * 
         * can be roughly said as:
         * 
         * div (0)
         *      "Hello World" (0, 0)
         *      button (0, 1)
         *          "Click to increment" (0, 1, 0)
         *          { counter } (0, 1, 1)
         * 
         * This is done to get the nth child information.
         */

        return {
            html: processedTextNode.replacedString.replace('\n', ""),
            js: ""
        }

    },

    script(node: TreeConstructor.ScriptNode) {
        let attrs = ""
        if (node.content.attributes != undefined) {
            for (let attribute of node.content.attributes) {
                if (attribute.value?.content != undefined) {
                    attrs += `${attribute.key?.content}="${attribute.value?.content}" `
                } else {
                    attrs += attribute.key?.content + " "
                }
            }
        }
        return {
            html: `<${`script ${attrs}`.trim()}>${node.content.value.content}</script>`,
            js: ""
        }
    }
}

export type DataTable = {
    methods: string[],
    states: string[],
    vectors: string[]
}

export function processTemplate(template: string, dataTable: DataTable) {

    //first we need to minify the template
    const templateAST = constructTree(tokenize( minify(template, { collapseWhitespace: true, removeComments: true }) ).tokens).ast
    console.log(
        NodeProcessingLookupTable[templateAST.nodeType](templateAST).html
    )

}