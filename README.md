---
title: Reverse Engineered OpenAI ChatGPT - Use GPT without the API (theoretically)
date: 2026-03-10
---

## ChatGPT Turnstile - An Introduction
Before discussing ChatGPT’s anti-bot solution, let’s start with some basic background information.
Most people are aware that, in addition to the ChatGPT website, OpenAI also provides an API. This API allows developers to access and use the same models that power the website.

However, imagine someone wants to reduce costs. Instead of using the official API, they might inspect the network requests that the ChatGPT website sends to its backend and simply replicate those requests. In theory, this would allow them to interact with the models as if they were using an API, but without actually going through the official API service.

To address this, OpenAI introduced a sophisticated anti-fingerprinting and anti-bot system designed to verify whether a request to their backend originates from a real user interacting with the website or from an automated bot.

In this article, I will analyze the logic behind that anti-bot system and explain how it works. However, I will not cover how to fully automate the process, as doing so would violate OpenAI’s terms of service and could lead to legal consequences. 

The article will cover several technical topics, including deobfuscating their SDK, performing static analysis, and eventually disassembling the virtual machine that runs within the SDK. Before diving into the details, I will briefly introduce these concepts.

The purpose of this article is purely educational.

## The SDK

The moment you try to login to ChatGPT, OpenAI loads a JavaScript file into their website which contains all the logic for their antibot system.

![Javascript File](../public/images/sdk_load.png)

First `sdk.js` is loaded, which then dynamically adds another script via a `src` attribute.

```javascript
(function() {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://sentinel.openai.com/sentinel/20260219f9f6/sdk.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}
)()
```

As you can see here the sdk is loaded into src. 20260219f9f6 is the current version which dates to 19.02.2026 which is when they last updated it. This blog talks about the prior version (the logic is pretty much still the same though).

If we open the [SDK](https://sentinel.openai.com/sentinel/20260219f9f6/sdk.js), we can see there is alot of code which is obfuscated. They made it really hard to see what is happening and thus we need to deobfuscate the whole file.

## Understanding the obfuscated SDK
If you take a closer look at the SDK, the patterns used for their obfuscation become apparent quite quickly.
One of the techniques they use is array obfuscation. In this approach, the actual values (such as JavaScript method names) are stored inside an array, and the code later accesses them through indexed references instead of using the values directly.

Typically, the script begins by defining a function that returns this array containing the method names and other string values. The result of that function is then assigned to a variable, which is subsequently used throughout the code to retrieve the obfuscated values by index.

```javascript
function Tt() {
    const t = [
      "abs",
      "snapshot_dx",
      "toString",
      "src",
      "splice",
      "isArray",
      "fromCharCode",
      "length",
      "clear",
      "map",
      "set",
      "session_observer_vm_timeout",
      "collector_dx",
      "then",
      "parse",
      "match",
      "filter",
      "function",
      "finally",
      "apply",
      "resolve",
      "indexOf",
      "charCodeAt",
      "bind",
      "catch",
      "get",
      "(((.+)+)+)+$",
    ];
    return (Tt = function () {
      return t;
    })();
  }
```

After defining the array, they introduce a wrapper function that is used to resolve the obfuscated values. This function takes an index and a second parameter that is not actually used.

```javascript
function xt(t, n) {
    const e = Tt();
    return (xt = function (t, n) {
      return e[(t -= 0)];
    })(t, n);
  }
```
In this snippet, the array returned by Tt() is stored in the variable e. The function then redefines itself and simply returns the element from e at the given index t. The expression t -= 0 does not change the value and is only there as part of the obfuscation pattern.

Later in the code, this function is used to resolve the actual method names or string values:

```javascript
const t = xt;
(St[t(8)](),
St.set(J, Nt),
St[t(10)](G, (n, e) =>
  St[t(10)](n, Rt("" + St[t(25)](n), "" + St.get(e))),
))
```
Here, xt is assigned to t and used to look up values from the hidden array. Calls such as t(8), t(10), or t(25) return the real property or method names stored in the array. This allows the script to access functions and values without ever referencing them directly in plain text, making the code harder to read and analyze.


Now that we know that we can jump into deobfscuating the SDK. The following part only includes the deobfuscating to make everything readable. I will not go into some anti-debugging/anti-tampering which they use in the SDk because I wanna keep it small. If you have questions about it you can always get in touch with me.

## Deobfuscating the SDK

For deobfuscation I will use Babel.  
Babel is a JavaScript compiler that parses source code into an Abstract Syntax Tree, applies transformations to the tree, and then generates equivalent JavaScript code from the modified AST.

We first get all string arrays with by doing the following
```javascript
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
```
This step scans the code for function declarations and function expressions that match a specific pattern: they take no parameters and their body consists of exactly two statements.

In the example above, the function Tt() fits this pattern. It accepts no parameters and contains two statements in its body. The first statement defines the array that holds the obfuscated string values, while the second statement returns a function.

During analysis, the function name is recorded first. Then the values stored in the array are extracted. Both the function name and the corresponding array contents are stored in a dictionary for later use.

Once these mappings have been collected, the final step of the deobfuscation process can be applied. This step replaces the indexed function calls with their actual string values using the dictionary that was built in the previous stage.

After that we apply the final step to deobscation

```javascript
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
```

We first find all the getter functions which take an index and an unused variable. We then check the offset (its always 0 for some reason) and finally we go through the whole code replacing each function call with the actual value of the array. 
I will keep this part rather short in explanation. Deobfuscation is something that could get its own blog.

After we run the SDK through this script we can see that the output looks way better now. Everything is fully readable now. The obfuscated example looks like this now.

```javascript
((function () {
(St.clear(),
  St.set(J, Nt),
  St.set(G, (n, e) => St.set(n, Rt("" + St.get(n), "" + St.(e)))),
  St.set(W, (n, e) => St.set(n, e)),
  St.set(V, (n, e) => {
    const o = St.get(n);
    Array.isArray(o) ? o.push(St.get(e)) : St.set(n, o + St.(e));
  }))
}))
```

Since we have a readable script now we can get into the static analysis and the reverse engineering of their VM.

## Static Analysis - Finding the VM

Before going into the VM we first need to find it. Thus we chat with ChatGPT and set a breakpoint in the script where the final request is being sent. From there we work backwards to see how each value is generated. The final token we need - which uses the VM is being generated in the function `getEnforcementToken`.

```javascript
try {
    const r = await P.getEnforcementToken(e.cachedChatReq),
      o = ce(
        {
          p: r,
          t: e.cachedChatReq?.["turnstile"]?.dx
            ? await _n(e.cachedChatReq, e.cachedChatReq.turnstile.dx)
            : null,
          c: e.cachedChatReq.token,
        },
        t,
      );
}
```

This function calls asynchronously ```_n``` with 2 pararmeters. _n is our final VM for our final token. `_n` looks like this which at first looks like random code. I will explain in the next part what is happening.

```javascript
const $t = 0,
    Ft = 1,
    Lt = 2,
    Jt = 3,
    Gt = 4,
    Wt = 5,
    zt = 6,
    Ht = 24,
    Vt = 7,
    Bt = 8,
    Zt = 9,
    Kt = 10,
    Qt = 11,
    Yt = 12,
    Xt = 13,
    tn = 14,
    nn = 15,
    en = 16,
    rn = 17,
    on = 18,
    cn = 19,
    sn = 23,
    un = 20,
    an = 21,
    fn = 22,
    ln = 25,
    dn = 26,
    hn = 27,
    pn = 28,
    mn = 29,
    gn = 30,
    wn = 33,
    yn = 34,
    vn = 35,
    bn = new Map();
  let kn = 0,
    Sn = Promise.resolve();
  function Cn(t) {
    const n = Sn.then(t, t);
    return (
      (Sn = n.then(
        () => {},
        () => {},
      )),
      n
    );
  }
  async function An() {
    for (; bn.get(Zt).length > 0; ) {
      const [n, ...e] = bn.get(Zt).shift(),
        r = bn.get(n)(...e);
      (r && typeof r.then === "function" && (await r), kn++);
    }
  }
  function On(t) {
    return Cn(
      () =>
        new Promise((n, e) => {
          let o = !1;
          (setTimeout(() => {
            ((o = !0), n("" + kn));
          }, 500),
            bn.set(Jt, (t) => {
              !o && ((o = !0), n(btoa("" + t)));
            }),
            bn.set(Gt, (t) => {
              !o && ((o = !0), e(btoa("" + t)));
            }),
            bn.set(gn, (t, n, e, i) => {
              const s = Array.isArray(i),
                u = s ? e : [],
                a = (s ? i : e) || [];
              bn.set(t, (...t) => {
                if (o) return;
                const r = [...bn.get(Zt)];
                if (s)
                  for (let n = 0; n < u.length; n++) {
                    const e = u[n],
                      r = t[n];
                    bn.set(e, r);
                  }
                return (
                  bn.set(Zt, [...a]),
                  An()
                    .then(() => bn.get(n))
                    .catch((t) => "" + t)
                    .finally(() => {
                      bn.set(Zt, r);
                    })
                );
              });
            }));
          try {
            (bn.set(Zt, JSON.parse(Tn(atob(t), "" + bn.get(en)))),
              An().catch((t) => {}));
          } catch (t) {}
        }),
    );
  }
  function _n(t, n) {
    return Cn(
      () =>
        new Promise((e, r) => {
          const i = $(t ?? {}) ?? "";
          ((function () {
            (bn.clear(),
              bn.set($t, On),
              bn.set(Ft, (n, e) =>
                bn.set(n, Tn("" + bn.get(n), "" + bn.get(e))),
              ),
              bn.set(Lt, (n, e) => bn.set(n, e)),
              bn.set(Wt, (n, e) => {
                const o = bn.get(n);
                Array.isArray(o) ? o.push(bn.get(e)) : bn.set(n, o + bn.get(e));
              }),
              bn.set(hn, (n, e) => {
                const o = bn.get(n);
                Array.isArray(o)
                  ? o.splice(o.indexOf(bn.get(e)), 1)
                  : bn.set(n, o - bn.get(e));
              }),
              bn.set(mn, (n, e, r) => bn.set(n, bn.get(e) < bn.get(r))),
              bn.set(wn, (n, e, r) => {
                const i = Number(bn.get(e)),
                  c = Number(bn.get(r));
                bn.set(n, i * c);
              }),
              bn.set(vn, (n, e, r) => {
                const i = Number(bn.get(e)),
                  c = Number(bn.get(r));
                bn.set(n, 0 === c ? 0 : i / c);
              }),
              bn.set(zt, (n, e, r) => bn.set(n, bn.get(e)[bn.get(r)])),
              bn.set(Vt, (n, ...e) => bn.get(n)(...e.map((n) => bn.get(n)))),
              bn.set(rn, (n, e, ...r) => {
                try {
                  const t = bn.get(e)(...r.map((t) => bn.get(t)));
                  if (t && typeof t.then === "function")
                    return t
                      .then((t) => {
                        bn.set(n, t);
                      })
                      .catch((t) => {
                        bn.set(n, "" + t);
                      });
                  bn.set(n, t);
                } catch (t) {
                  bn.set(n, "" + t);
                }
              }),
              bn.set(Xt, (n, e, ...r) => {
                try {
                  bn.get(e)(...r);
                } catch (t) {
                  bn.set(n, "" + t);
                }
              }),
              bn.set(Bt, (n, e) => bn.set(n, bn.get(e))),
              bn.set(Kt, window),
              bn.set(Qt, (n, e) =>
                bn.set(
                  n,
                  (Array.from(document.scripts || [])
                    .map((n) => n?.src?.["match"](bn.get(e)))
                    .filter((n) => n?.["length"])[0] ?? [])[0] ?? null,
                ),
              ),
              bn.set(Yt, (n) => bn.set(n, bn)),
              bn.set(tn, (n, e) => bn.set(n, JSON.parse("" + bn.get(e)))),
              bn.set(nn, (n, e) => bn.set(n, JSON.stringify(bn.get(e)))),
              bn.set(on, (n) => bn.set(n, atob("" + bn.get(n)))),
              bn.set(cn, (n) => bn.set(n, btoa("" + bn.get(n)))),
              bn.set(un, (n, e, r, ...o) =>
                bn.get(n) === bn.get(e) ? bn.get(r)(...o) : null,
              ),
              bn.set(an, (n, e, r, o, ...i) =>
                Math.abs(bn.get(n) - bn.get(e)) > bn.get(r)
                  ? bn.get(o)(...i)
                  : null,
              ),
              bn.set(sn, (n, e, ...r) =>
                void 0 !== bn.get(n) ? bn.get(e)(...r) : null,
              ),
              bn.set(Ht, (n, e, r) =>
                bn.set(n, bn.get(e)[bn.get(r)].bind(bn.get(e))),
              ),
              bn.set(yn, (n, e) => {
                try {
                  const t = bn.get(e);
                  return Promise.resolve(t).then((t) => {
                    bn.set(n, t);
                  });
                } catch (t) {
                  return;
                }
              }),
              bn.set(fn, (n, e) => {
                const o = [...bn.get(Zt)];
                return (
                  bn.set(Zt, [...e]),
                  An()
                    .catch((t) => {
                      bn.set(n, "" + t);
                    })
                    .finally(() => {
                      bn.set(Zt, o);
                    })
                );
              }),
              bn.set(pn, () => {}),
              bn.set(dn, () => {}),
              bn.set(ln, () => {}));
          })(),
            (kn = 0),
            bn.set(en, i));
          let c = !1;
          (setTimeout(() => {
            ((c = !0), e("" + kn));
          }, 500),
            bn.set(Jt, (t) => {
              !c && ((c = !0), e(btoa("" + t)));
            }),
            bn.set(Gt, (t) => {
              !c && ((c = !0), r(btoa("" + t)));
            }),
            bn.set(gn, (t, n, e, r) => {
              const s = Array.isArray(r),
                u = s ? e : [],
                a = (s ? r : e) || [];
              bn.set(t, (...t) => {
                if (c) return;
                const r = [...bn.get(Zt)];
                if (s)
                  for (let n = 0; n < u.length; n++) {
                    const e = u[n],
                      r = t[n];
                    bn.set(e, r);
                  }
                return (
                  bn.set(Zt, [...a]),
                  An()
                    .then(() => bn.get(n))
                    .catch((t) => "" + t)
                    .finally(() => {
                      bn.set(Zt, r);
                    })
                );
              });
            }));
          try {
            (bn.set(Zt, JSON.parse(Tn(atob(n), "" + bn.get(en)))),
              An().catch((t) => {
                e(btoa(kn + ": " + t));
              }));
          } catch (t) {
            e(btoa(kn + ": " + t));
          }
        }),
    );
  }
```

Keep this in mind for the following part. However I will get back to it anyway. 

## VM Part - What is a VM?

Before getting into the interesting parts, it's important to understand what a virtual machine (VM) is and how we approach reversing something we don't fully understand. A VM is essentially a program that emulates a CPU executing a binary program. However, in many obfuscated systems the VM is custom-built—often written in JavaScript—and its instruction set (opcodes) does not match any real CPU. These opcodes frequently include custom operations that don't exist on actual hardware.

In these systems, the VM uses its custom “CPU” to execute a program represented as bytecode. The VM reads this bytecode, sometimes decoding or decrypting it first, and then interprets the instructions one by one. VM-based obfuscation is currently one of the strongest protection techniques available. It is significantly more difficult to analyze than common methods like control flow flattening (CFF) because reversing it typically requires building a disassembler and often a decompiler for the VM itself. Even after doing that, you still need to analyze and reverse the algorithm that was originally compiled into the VM’s bytecode.

There are different types of VMs. One common type is register-based, which mimics how modern CPUs operate. For example, the native programs running on your computer are executed by a register-based CPU. Another type is stack-based, which relies on pushing and popping values from a stack instead of storing them in registers. Many older CPU designs and virtual machines use this approach; the Java Virtual Machine (JVM) and WebAssembly (WASM) are both stack-based.

With this knowledge we can go into ChatGPTs VM.


## ChatGPT's VM

Looking at the function `_n` we have two parameters it takes in.
The parameter ```n```is our encrypted bytecode sequence, with all instructions. The parameter ```t``` includes the key to decrypt our bytecode to make it readable.

The variable `n` looks something like this:
`PBp5bWFzcnlLcRluUjZfaTdgAHRiemJ5bHxJe2JtR3xfHFVuMnNJYEtXVW5bWlZ7SG5oZWMMXm0fd0ZjcnlDdGJZHl...` (way longer usually).

The variable `t`is a dict which includes our key which is needed to decrypt `n`.

The function `Tn(t,n)`decrypts the bytecode string to make it readable.

```javascript
function Tn(t, n) {
    let r = "";
    for (let o = 0; o < t.length; o++)
      r += String.fromCharCode(t.charCodeAt(o) ^ n.charCodeAt(o % n.length));
    return r;
  }
```
After decrypting, it looks like this.

`[[8, 21.18, 8], [21.18, 45.66, 15], [21.18, 15.61, 15], [21.18, 55.27, 1], [21.18, 86.45, 1], [21.18, 40.96, 7]...]]`

With our knowledge about VMs we can already guess what this could be. At first glance it looks like we have opcodes and registers in each array. Thus this means we have our flow of the VM here, which is executed. 

Before we get into the VM itself we need to check what `_n` is doing overall.
`bn` in the code acts as our "computer". It handles registers and also the logic of the "code". 

Looking at the first few lines of the VM we have the following 

```javascript
bn.set($t, On),
bn.set(Ft, (n, e) =>
  bn.set(n, Tn("" + bn.get(n), "" + bn.get(e))),
),
bn.set(Lt, (n, e) => bn.set(n, e))
```

bn is being set up. For example `$t` is the key (in this case 0) and it loads the value `On`. In this case `On` is another VM which is also being run. 
The second line overrides bn.set so that when it’s called with (n, e), it sets key n to the result of Tn() applied to the stringified current values of keys n and e, effectively combining those two stored values into a new one for n.
We see a pattern here. It loads different values and functions to some keys.
We can derive those functions and get the following opcode map:

```
0: 'LOAD_PROGRAM' 
1: 'XOR_REG' 
2: 'SET'
3: 'RESOLVE' 
4: 'REJECT'
5: 'ADD
6: 'GET_INDEX'
7: 'CALL' 
8: 'COPY'
9: 'IP'
10: 'window'
11: 'SCRIPT_MATCH'
12: 'GET_VM'
13: 'TRY_CALL'
14: 'JSON_PARSE'
15: 'JSON_STRINGIFY'
16: 'KEY'
17: 'TRY_CALL_RESULT'
18: 'ATOB'
19: 'BTOA'
20: 'IF_EQUAL' 
21: 'IF_NOT_CLOSE' 
22: 'SUBROUTINE'
23: 'IF_DEFINED'
24: 'BIND' 
27: 'SUB'
29: 'LESS_THAN'
30: 'DEFINE_FUNC'
33: 'MULTIPLY' 
34: 'AWAIT'
35: 'DIVIDE'
```

Finally the function An() is starting our VM and thus the bytecode is executed.

```javascript
async function An() {
    for (; bn.get(Zt).length > 0; ) {
      const [n, ...e] = bn.get(Zt).shift(),
        r = bn.get(n)(...e);
      (r && typeof r.then === "function" && (await r), kn++);
    }
  }
```

It gets the bytecode sequence from bn.get(9) (Zt = 9) and runs it.
If we remember, the decrypted bytecode looks like this:

`[[8, 21.18, 8], [21.18, 45.66, 15], [21.18, 15.61, 15], [21.18, 55.27, 1], [21.18, 86.45, 1], [21.18, 40.96, 7]...]]`

Now we know what each value is.

The first one is our opcode, the rest are arguments which are being passed. `r` is our function call in the VM. It gets the value from `n` and runs it with `e`, our arguments.

With this knowledge we can finally properly debug the VM and get all values we need.

## What the VM collects

ChatGPT’s VM gathers several pieces of basic environment information. This includes details about your browser, the current window context, and your location and timezone. It also retrieves information about your graphics hardware, such as the graphics card vendor.

## The final disassembler - python only

The final step is to implement the disassembler. Its purpose is to translate the bytecode into a higher-level representation—Python in this case. In essence, the disassembler reads the bytecode instructions and converts them into their corresponding Python constructs, producing code that is easier to understand and analyze. It typically follows a structure similar to the following.


```python
def handle_opcode(self, args: list, operation_name: str, pc):

        if operation_name == "COPY":
            
            return self.handle_copy(args)

        elif operation_name == "SET":

            return self.handle_set(args)

        elif operation_name == "GET_INDEX":
            
            return self.handle_get_index(args)
            

        elif operation_name == "BIND":
            
            return self.handle_bind(args)
        
        
        elif operation_name == "TRY_CALL_RESULT":
            
            return self.handle_try_call_result(args)
            

        elif operation_name == "XOR_REG":
            
            return self.handle_xor(args)
            

        elif operation_name == "BTOA":

            return self.handle_btoa(args)

        elif operation_name == "IF_DEFINED":

            return self.handle_if_defined(args)
            

        elif operation_name == "ATOB":
            
            return self.handle_atob(args)

            
        elif operation_name == "JSON_PARSE":
            
            return self.handle_json_parse(args)

        elif operation_name == "ADD":
            
            return self.handle_add(args)

        elif operation_name == "CALL":

            return self.handle_call(args)

        elif operation_name == "JSON_STRINGIFY":
            
            self.handle_json_stringify(args)


        elif operation_name == "TRY_CALL":

            return self.handle_try_call(args)

        elif operation_name == "IF_EQUAL":

            return self.handle_if_equal(args)

        elif operation_name == "SUBROUTINE":

            return self.disasm_program(args[1], False)
        
        elif operation_name == "AWAIT":

            return self.handle_await([args][0])


def disasm_program(self, program, count_pc: True):

    for _, instruction in enumerate(program):
        opcode = instruction[0]
        args = instruction[1:]
        if opcode in self.PROGRAM:
            operation_name = self.PROGRAM[opcode]
            value = self.handle_opcode(args, operation_name, self.pc)
        
        if count_pc:
            self.pc += 1
    return value
```

In the final step, the encrypted bytecode is provided together with the decryption key. The bytecode is first decrypted to obtain the actual instruction sequence. This resulting bytecode is then passed through the disassembler, which converts it into readable Python code.

At the end of this process, the final value can be recovered.

`SRsaHwIEGxQTdVpad3BlY3ptYwBwe294fnpea3R1VVJIExgQCxofAAsbFAMNBA8dAQwFDh0JDB4bGQIaBwsMCw0DCxYFBB4bGwAaBBsUE3VjBBMTGBAAGR8HAxsUE3t2YFt+YGMEDB0WAAAABAcQAwxmXwNYf2RXe39Jd2dqf2B/Z2d/b3lyQnt2c0Bgf0ZWfWReZ398c3N5eQVCaXhwZVR4fAF+dmsWcHNea3x5QwtpbwBxd30eVnxzf2BVclUEExMYEAsbHwIGGxQTZ2BNfmMFZFt4aVhrbGtrZnZ4XXd3VVJLeWZobXoBDWtuZkFXYAh0UmZaSntwdWd7bWB9Zm97Y21gCB8FYgMAT3RDBnpoYExjaEJ/ZWNUeFNlWkp7cFMCXGkBBVduaAB4U1V8dGZefGNyQ1F6aGBMaGx4RVFgUntmd3NeSHNDAlxpAFhrbGtrZnZ4XXd3VVJLeWZoent3bmduZmtXalJ4UnFzdEpwYVkEDB0WBw0ACAYQAwxQZkZJdl1AZG97QmZUb1ZQdXB0d3R8YGl7XwVRbXtFUHRRGnN1VX9eExgQABkfBAobFBNgXElsVWEHD09LBA8bAhMDBRcYEw4QanxFY3dOGnJyY0Fnd1NVcGZWcX9xRkVuZX9sdmFjTmJzZWNpb3B5d3h/....`

This at first glance looks like a random string. However this includes all fingerprint data and is used to register/login a User and also chat with the model.


## The End
This was my first time going into reverse engineering VMs and I must say it was alot of fun. Hopefully someone could take something from this little write up. If you got any question, feel free to get in touch with me!

(I will upload everything to my github - you can check it out there)

Best regards,    
Jonathan






