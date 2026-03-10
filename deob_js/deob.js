const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const inputFile = 'deob_js/in.js';
const outputFile = 'deob_js/out.js';

console.log(`Reading from: ${inputFile}`);

let obfuscatedCode;
try {
    obfuscatedCode = fs.readFileSync(inputFile, 'utf8');
    console.log(`File size: ${obfuscatedCode.length} bytes`);
} catch (error) {
    console.error(`Error reading file ${inputFile}:`, error.message);
    process.exit(1);

}




function deobfuscate(code) {
    console.log('Parsing AST...');
    const ast = parser.parse(code, {
        sourceType: 'script',
    });

    // Store found artifacts
    const stringArrays = new Map();        // function name -> array values

    function removeAntiDebugging(ast) {
    const antiDebugNames = new Set();
    
    traverse(ast, {
        VariableDeclaration(path) {
            const declarations = path.node.declarations;
            if (declarations.length < 2 || declarations.length > 3) return;
            
            const last = declarations.at(-1);
            const init = last?.init;
            
            if (!t.isCallExpression(init)) return;
            if (init.arguments?.length !== 2) return;
            
            const lastArg = init.arguments.at(-1);
            if (!t.isFunctionExpression(lastArg) && !t.isArrowFunctionExpression(lastArg)) return;
            
            const body = lastArg.body?.body;
            if (!body || body.length === 0) return;
            
            // Suche nach "(((.+)+)+)+$" irgendwo im Body
            let isAntiDebug = false;
            traverse(lastArg, {
                StringLiteral(innerPath) {
                    if (innerPath.node.value === "(((.+)+)+)+$") {
                        isAntiDebug = true;
                        innerPath.stop();
                    }
                },
                noScope: true
            });
            
            if (!isAntiDebug) return;
            
            for (const decl of declarations) {
                if (t.isIdentifier(decl.id)) {
                    antiDebugNames.add(decl.id.name);
                    console.log(`Found anti-debug: ${decl.id.name}`);
                }
            }
            
            path.remove();
        },
        
            ExpressionStatement(path) {
                if (
                    t.isCallExpression(path.node.expression) &&
                    t.isIdentifier(path.node.expression.callee) &&
                    antiDebugNames.has(path.node.expression.callee.name)
                ) {
                    console.log(`Removed anti-debug call: ${path.node.expression.callee.name}()`);
                    path.remove();
                }
            }
        });
    }
    function inlineGetterAliases(ast) {
        traverse(ast, {
            VariableDeclarator(path) {
                if (
                    t.isIdentifier(path.node.id) &&
                    t.isIdentifier(path.node.init)
                ) {
                    const aliasName = path.node.id.name;
                    const originalName = path.node.init.name;
                    const binding = path.scope.getBinding(aliasName);
                    
                    if (!binding || binding.constantViolations.length > 0) return;
                    for (const ref of binding.referencePaths) {
                        ref.replaceWith(t.identifier(originalName));
                    }
                    console.log(`Inlined alias: ${aliasName} -> ${originalName}`);
                    path.remove();
                }
            }
        });
    }
    function bracketToDot(ast) {
        traverse(ast, {
            MemberExpression(path) {
                if (
                    path.node.computed &&
                    t.isStringLiteral(path.node.property) &&
                    /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(path.node.property.value)
                ) {
                    path.node.computed = false;
                    path.node.property = t.identifier(path.node.property.value);
                }
            }
        });
    }
    function resolveStringCalls(ast, stringArrays) {
        traverse(ast, {
            FunctionDeclaration(path) {
                // Finde Getter: function n(t, e) { const r = i(); return ... }
                if (path.node.params.length === 2 && path.node.id) {
                    const body = path.node.body.body;
                    if (body.length === 2 &&
                        t.isVariableDeclaration(body[0]) &&
                        t.isReturnStatement(body[1])
                    ) {
                        const functionName = path.node.id.name;
                        const arrayName = body[0].declarations[0].init.callee?.name;
                        const arrayValues = stringArrays.get(arrayName);
                        
                        if (!arrayValues) return;
                        
                        // Offset aus t -= X finden
                        let offset = 0;
                        path.traverse({
                            AssignmentExpression(innerPath) {
                                if (innerPath.node.operator === "-=" &&
                                    t.isNumericLiteral(innerPath.node.right)) {
                                    offset = innerPath.node.right.value;
                                }
                            }
                        });
                        
                        console.log(`Found getter: ${functionName}, array: ${arrayName}, offset: ${offset}`);
                        
                        // Alle n(x) Calls im ganzen AST ersetzen
                        traverse(ast, {
                            CallExpression(callPath) {
                                if (
                                    t.isIdentifier(callPath.node.callee, { name: functionName }) &&
                                    callPath.node.arguments.length >= 1 &&
                                    t.isNumericLiteral(callPath.node.arguments[0])
                                ) {
                                    const index = callPath.node.arguments[0].value - offset;
                                    const resolved = arrayValues[index];
                                    if (resolved !== undefined) {
                                        console.log(`  ${functionName}(${callPath.node.arguments[0].value}) -> "${resolved}"`);
                                        callPath.replaceWith(t.stringLiteral(resolved));
                                    }
                                }
                            }
                        });
                        
                        // Getter-Funktion entfernen
                        path.remove();
                    }
                }
            }
        });
    }
    function cleanComputedMethods(ast) {
        traverse(ast, {
            "ObjectMethod|ClassMethod"(path) {
                if (
                    path.node.computed &&
                    t.isStringLiteral(path.node.key) &&
                    /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(path.node.key.value)
                ) {
                    path.node.computed = false;
                    path.node.key = t.identifier(path.node.key.value);
                }
            },
            ObjectProperty(path) {
                if (
                    path.node.computed &&
                    t.isStringLiteral(path.node.key) &&
                    /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(path.node.key.value)
                ) {
                    path.node.computed = false;
                    path.node.key = t.identifier(path.node.key.value);
                }
            }
        });
    }
    function getStringArrays(ast) {
        traverse(ast, {
            "FunctionDeclaration|FunctionExpression"(path) {
                if (
                    path.node.body.body.length === 2 &&
                    path.node.params.length === 0 &&
                    path.node.id
                ) {
                    const first_body = path.node.body.body[0];
                    if (t.isVariableDeclaration(first_body)) {
                        const init = first_body.declarations[0].init;
                        if (t.isArrayExpression(init)) {
                            const functionName = path.node.id.name;
                            const arrayValues = init.elements.map(elem => elem.value);
                            console.log(`Found string array: ${functionName} with ${arrayValues.length} strings`);
                            stringArrays.set(functionName, arrayValues);
                        }
                    }
                }
            }
        });
    }
    function removeStringArrays(ast, stringArrays) {
    traverse(ast, {
        FunctionDeclaration(path) {
            if (path.node.id && stringArrays.has(path.node.id.name)) {
                console.log(`Removed string array function: ${path.node.id.name}`);
                path.remove();
            }
        }
    });
    }
    function removeUnusedCode(ast) {
            let changed = true;
            
            // Mehrfach durchlaufen weil Entfernen neuen Dead Code erzeugen kann
            while (changed) {
                changed = false;
                
                traverse(ast, {
                    // Unused Functions
                    FunctionDeclaration(path) {
                        const binding = path.scope.getBinding(path.node.id.name);
                        if (binding && binding.references === 0) {
                            console.log(`Removed unused function: ${path.node.id.name}`);
                            path.remove();
                            changed = true;
                        }
                    },
                    
                    // Unused Variables
                    VariableDeclarator(path) {
                        if (!t.isIdentifier(path.node.id)) return;
                        const binding = path.scope.getBinding(path.node.id.name);
                        if (binding && binding.references === 0) {
                            // Sicherheitscheck: keine Side Effects im Init
                            const init = path.node.init;
                            if (
                                !init ||
                                t.isLiteral(init) ||
                                t.isIdentifier(init) ||
                                t.isArrayExpression(init) ||
                                t.isFunctionExpression(init)
                            ) {
                                console.log(`Removed unused variable: ${path.node.id.name}`);
                                if (path.parent.declarations.length === 1) {
                                    path.parentPath.remove();
                                } else {
                                    path.remove();
                                }
                                changed = true;
                            }
                        }
                    }
                });
            }
        }
    function removeDeadCalls(ast) {
        let changed = true;
        
        while (changed) {
            changed = false;
            
            traverse(ast, {
                // Aufrufe zu nicht-existierenden Funktionen
                CallExpression(path) {
                    if (t.isIdentifier(path.node.callee)) {
                        const binding = path.scope.getBinding(path.node.callee.name);
                        if (!binding) {
                            // Wenn es ein ExpressionStatement ist, komplett entfernen
                            if (t.isExpressionStatement(path.parent)) {
                                console.log(`Removed dead call: ${path.node.callee.name}()`);
                                path.parentPath.remove();
                                changed = true;
                            }
                        }
                    }
                },
                
                // Referenzen zu nicht-existierenden Variablen
                ExpressionStatement(path) {
                    if (t.isIdentifier(path.node.expression)) {
                        const binding = path.scope.getBinding(path.node.expression.name);
                        if (!binding) {
                            console.log(`Removed dead reference: ${path.node.expression.name}`);
                            path.remove();
                            changed = true;
                        }
                    }
                }
            });
        }
    }
    inlineGetterAliases(ast);
    getStringArrays(ast);
    resolveStringCalls(ast, stringArrays);
    bracketToDot(ast);
    cleanComputedMethods(ast);
    removeStringArrays(ast, stringArrays)
    removeUnusedCode(ast)
    removeDeadCalls(ast)
    removeAntiDebugging(ast)

    const output = generate(ast, {
        retainLines: false,
        concise: false,
        compact: false,
        minified: false,
        comments: false
    });

    return output.code;
}

try {
    console.log('Starting deobfuscation...');
    const deobfuscated = deobfuscate(obfuscatedCode);
    
    console.log(`\nWriting to: ${outputFile}`);
    fs.writeFileSync(outputFile, deobfuscated, 'utf8');
    
    console.log('\n✓ Deobfuscation complete!');
    console.log(`  Input size:  ${obfuscatedCode.length} bytes`);
    console.log(`  Output size: ${deobfuscated.length} bytes`);
    console.log(`  Reduction:   ${((1 - deobfuscated.length/obfuscatedCode.length) * 100).toFixed(1)}%`);
    
} catch (error) {
    console.error('Deobfuscation failed:', error);
    console.error(error.stack);
}