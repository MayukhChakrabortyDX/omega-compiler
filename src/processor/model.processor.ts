//Credit: https://astexplorer.net/ for helping us to understand how
//typescript creates it's ASTs.
//If you get stuck, just go there

//Credit: https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
//This website contains some surface level information about the compiler API.
//hopefully someday a detailed version will be there.

import {
    createPrinter,
    createSourceFile,
    EmitHint,
    factory,
    NodeFlags,
    ScriptTarget,
    SyntaxKind,
    type CallExpression,
    type ClassDeclaration,
    type Decorator,
    type Expression,
    type Identifier,
    type Modifier,
    type PropertyDeclaration
} from 'typescript'

function createClassMembersForDataAndComponent(statement: ClassDeclaration) {
    const classMembers = []
    for (const member of statement.members) {

        //ofcourse we are interested in @state & others.
        if (member.kind == SyntaxKind.PropertyDeclaration) {

            const searchState = searchDecorator('state', member as PropertyDeclaration)
            const searchVector = searchDecorator('vector', member as PropertyDeclaration)
            const searchDerives = searchDecorator('derive', member as PropertyDeclaration)

            if (searchState.result) {

                classMembers.push(
                    ...createSignal(
                        ((member as PropertyDeclaration).name as Identifier).escapedText.toString(),
                        //@ts-ignore
                        (member as PropertyDeclaration).initializer,
                        (member as PropertyDeclaration).modifiers?.filter(modifier => modifier != searchState.modifier)
                ))

            } else {

                classMembers.push(member)

            }

            //derives are statements, but are actually converted to callbacks!!! (ohmagod)
            //very simillar to how effects would work, except much more efficiently.

        } else {
            classMembers.push(member)
        }

    }
    
    return classMembers
}

function searchDecorator(name: string, member: PropertyDeclaration) {
    if (member.modifiers != undefined) {
        //@ts-ignore
        for (let modifier of member.modifiers) {
            if (modifier.kind == SyntaxKind.Decorator) {
                if ((modifier as Decorator).expression.kind == SyntaxKind.CallExpression) {
                    if (((modifier as Decorator).expression as CallExpression).expression.kind == SyntaxKind.Identifier) {
                        if ((((modifier as Decorator).expression as CallExpression).expression as Identifier).escapedText == name) {
                            //yes, then after so bad nesting, we finally found the state decorator.
                            return {
                                result: true,
                                modifier
                            }
                        }
                    }
                }
            }
        }
    }

    return {
        result: false,
        modifier: undefined
    }
}

function assignTemplateToClass(template: string, className: string) {

    return [
        factory.createVariableStatement([], factory.createVariableDeclarationList([
            factory.createVariableDeclaration(
                `$$templ_${className}`,
                undefined,
                undefined,
                factory.createCallExpression(
                    factory.createPropertyAccessExpression(
                        factory.createIdentifier('document'),
                        'createElement'
                    ),
                    undefined,
                    [
                        factory.createStringLiteral('template')
                    ]
                )
            )
        ])),

        factory.createExpressionStatement(
            factory.createBinaryExpression(
                factory.createPropertyAccessExpression(
                    factory.createIdentifier(`$$templ_${className}`),
                    'innerHTML'
                ),
                factory.createToken(SyntaxKind.EqualsToken),
                factory.createNoSubstitutionTemplateLiteral(template, template)
            )
        )
    ]

}

export function createSignal(name: string, initializer: Expression, modifiers: Modifier[]) {

    return [
        factory.createPropertyDeclaration(modifiers, `$$state_${name}`, undefined, undefined, initializer),

        factory.createPropertyDeclaration([], `$$sub_${name}`, undefined, undefined,
            factory.createNewExpression(factory.createIdentifier('Set'), undefined, [])
        ),

        factory.createGetAccessorDeclaration([], name, [], undefined,
            factory.createBlock([
                factory.createReturnStatement(
                    factory.createPropertyAccessExpression(
                        factory.createThis(),
                        `$$state_${name}`
                    )
                )
            ])
        ),

        factory.createSetAccessorDeclaration([], name, [
            factory.createParameterDeclaration([], undefined, "v", undefined, undefined, undefined)
        ],
            factory.createBlock(
                [
                    factory.createExpressionStatement(
                        factory.createBinaryExpression(
                            factory.createPropertyAccessExpression(
                                factory.createThis(),
                                `$$state_${name}`
                            ),
                            factory.createToken(SyntaxKind.EqualsToken),
                            factory.createIdentifier('v')
                        )
                    ),

                    factory.createForOfStatement(undefined,
                        factory.createVariableDeclarationList([
                            factory.createVariableDeclaration("s")
                        ]),
                        factory.createPropertyAccessExpression(
                            factory.createThis(),
                            `$$state_${name}`
                        ),
                        factory.createExpressionStatement(

                            factory.createCallExpression(
                                factory.createIdentifier('s'),
                                undefined,
                                []
                            )
                        )
                    )
                ]
            )
        )
    ]

}

function transpileComponents(statement: ClassDeclaration) {

    let isComponent = false
    let isData = false
    let decoratorModifier = undefined
    let dataModifier = undefined

    //we also need the data of the component class. Also, we can process data classes as well.

    //check if the class is a component or not:
    //criteria: Has the @component decorator
    if (statement.modifiers != undefined) {
        for (let modifier of statement.modifiers) {
            if (modifier.kind == SyntaxKind.Decorator) {
                if (modifier.expression.kind == SyntaxKind.CallExpression) {
                    if ((modifier.expression as CallExpression).expression.kind == SyntaxKind.Identifier) {
                        if (((modifier.expression as CallExpression).expression as Identifier).escapedText == "component") {
                            //yep, is a component.
                            //do stuff now (whoos.)
                            decoratorModifier = modifier
                            isComponent = true
                            break
                        } else if ( ((modifier.expression as CallExpression).expression as Identifier).escapedText == "data" ) {
                            dataModifier = modifier
                            isData = true
                            break
                        }
                    }
                }
            }
        }
    } else {
        return [statement]
    }

    if ( isData ) {

        //we will perform tasks for the data class too.
        const classMembers = createClassMembersForDataAndComponent(statement)
        return [
            factory.createClassDeclaration(statement.modifiers.filter(modifier => modifier != dataModifier), statement.name, statement.typeParameters, statement.heritageClauses, classMembers)
        ]

    } else if (isComponent) {

        //now that we have confirmed our suspicions, we can now proceed with the component.
        //let's now process the properties!

        const classMembers = createClassMembersForDataAndComponent(statement)
        //also add a render() method as described by our template (which we will go through later lol)
        classMembers.push(
            factory.createMethodDeclaration([], undefined, 'render', undefined, undefined, [], undefined,
                factory.createBlock([

                ]) //this block will be given by our template processor.
            )
        )

        return [
            //@ts-ignore
            ...assignTemplateToClass(`<button>A sample of what we can do</button>`, (statement.name as Identifier).escapedText),
            factory.createClassDeclaration(statement.modifiers.filter(modifier => modifier != decoratorModifier), statement.name, statement.typeParameters, statement.heritageClauses, classMembers)
        ]

    } else {
        return [statement]
    }
}

export function processModel(model: string, filename: string) {

    const ModelAST = createSourceFile(filename, model, ScriptTarget.ESNext)
    const ModifiedStatements = []

    for (const statement of ModelAST.statements) {

        if (statement.kind == SyntaxKind.ClassDeclaration) {
            ModifiedStatements.push(
                ...transpileComponents(statement as ClassDeclaration)
            )
        } else {
            ModifiedStatements.push(statement)
        }

    }

    //recreate the output ast
    //@ts-ignore
    const OutputAST = factory.createSourceFile(ModifiedStatements, factory.createToken(SyntaxKind.EndOfFileToken), NodeFlags.None)
    return createPrinter({}).printNode(
        EmitHint.SourceFile,
        OutputAST,
        OutputAST
    )

}