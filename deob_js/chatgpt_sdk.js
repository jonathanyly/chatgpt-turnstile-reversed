var SentinelSDK = function (t) {
  "use strict";

  
  const c = [];
  let l;
  const d = new Uint8Array(16);
  
  var y = {
    randomUUID: typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto)
  };
    
  function C(t, n, r) {
    if (y.randomUUID && !t) return y.randomUUID();
    const i = (t = t || {}).random ?? t.rng?.() ?? function () {
      if (!l) {
        if ("undefined" == typeof crypto || !crypto.getRandomValues) throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
        l = crypto.getRandomValues.bind(crypto);
      }
      return l(d);
    }();
    if (i.length < 16) throw new Error("Random bytes length must be >= 16");
    return i[6] = 15 & i[6] | 64, i[8] = 63 & i[8] | 128, function (t, n = 0) {
      return (c[t[n + 0]] + c[t[n + 1]] + c[t[n + 2]] + c[t[n + 3]] + "-" + c[t[n + 4]] + c[t[n + 5]] + "-" + c[t[n + 6]] + c[t[n + 7]] + "-" + c[t[n + 8]] + c[t[n + 9]] + "-" + c[t[n + 10]] + c[t[n + 11]] + c[t[n + 12]] + c[t[n + 13]] + c[t[n + 14]] + c[t[n + 15]]).toLowerCase();
    }(i);
  }
  class _ {
    ["answers"] = new Map();
    maxAttempts = 5e5;
    ["requirementsSeed"] = function () {return  "" + Math.random();}();
    ["sid"] = C();
    ["errorPrefix"] = "wQ8Lk5FbGpA2NcR9dShT6gYjU7VxZ4D";
    async initializeAndGatherData(t) {
      this._getAnswer(t);
    }
    async startEnforcement(t) {
      this._getAnswer(t);
    }
    getEnforcementTokenSync(t) {
      const e = this._getAnswer(t);
      return typeof e === "string" ? e : null;
    }
    async getEnforcementToken(t, n) {
      return this._getAnswer(t, n?.["forceSync"]);
    }
    async getRequirementsToken() {
      return !this.answers.has(this.requirementsSeed) && this.answers.set(this.requirementsSeed, this._generateAnswerAsync(this.requirementsSeed, "0")), "gAAAAAC" + (await this.answers.get(this.requirementsSeed));
    }
    getRequirementsTokenBlocking() {
      return "gAAAAAC" + this._generateRequirementsTokenAnswerBlocking();
    }
    _getAnswer(t, n = !1) {
      const r = "gAAAAAB";
      if (!t?.["proofofwork"]?.["required"]) return null;
      const {
        seed: o,
        difficulty: i
      } = t.proofofwork;
      if (typeof o !== "string" || "string" != typeof i) return null;
      const c = this.answers.get(o);
      if (typeof c === "string") return c;
      if (n) {
        const t = this._generateAnswerSync(o, i),
          n = r + t;
        return this.answers.set(o, n), n;
      }
      return !this.answers.has(o) && this.answers.set(o, this._generateAnswerAsync(o, i)), Promise.resolve().then(async () => {
        return r + (await this.answers.get(o));
      }).then(t => {
        return this.answers.set(o, t), t;
      });
    }
    ["_runCheck"] = (t, n, e, r, o) => {
      r[3] = o, r[9] = Math.round(performance.now() - t);
      const c = U(r),
        s = function (t) {
          let e = 2166136261;
          for (let r = 0; r < t.length; r++) e ^= t.charCodeAt(r), e = Math.imul(e, 16777619) >>> 0;
          return e ^= e >>> 16, e = Math.imul(e, 2246822507) >>> 0, e ^= e >>> 13, e = Math.imul(e, 3266489909) >>> 0, e ^= e >>> 16, (e >>> 0).toString(16).padStart(8, "0");
        }(n + c);
      return s.substring(0, e.length) <= e ? c + "~S" : null;
    };
    buildGenerateFailMessage(t) {
      return this.errorPrefix + U(String(t ?? "e"));
    }
    _generateAnswerSync(t, n) {
      const r = performance.now();
      try {
        const o = this.getConfig();
        for (let i = 0; i < this.maxAttempts; i++) {
          const e = this._runCheck(r, t, n, o, i);
          if (e) return e;
        }
      } catch (t) {
        return this.buildGenerateFailMessage(t);
      }
      return this.buildGenerateFailMessage();
    }
    async _generateAnswerAsync(t, n) {
      const r = performance.now();
      try {
        let o = null;
        const i = this.getConfig();
        for (let c = 0; c < this.maxAttempts; c++) {
          (!o || o.timeRemaining() <= 0) && (o = await new Promise(t => {
            const e = window.requestIdleCallback || P;
            e(n => {
              t(n);
            }, {
              timeout: 10
            });
          }));
          const s = this._runCheck(r, t, n, i, c);
          if (s) return s;
        }
      } catch (t) {
        return this.buildGenerateFailMessage(t);
      }
      return this.buildGenerateFailMessage();
    }
    _generateRequirementsTokenAnswerBlocking() {
      let n = "e";
      const e = performance.now();
      try {
        const t = this.getConfig();
        return t[3] = 1, t[9] = performance.now() - e, U(t);
      } catch (t) {
        n = U(String(t));
      }
      return this.errorPrefix + n;
    }
    getConfig() {
      return [screen?.width + screen?.["height"], "" + new Date(), performance?.["memory"]?.["jsHeapSizeLimit"], Math?.["random"](), navigator.userAgent, j(Array.from(document.scripts).map(n => n?.["src"]).filter(t => t)), (Array.from(document.scripts || []).map(n => n?.["src"]?.["match"]("c/[^/]*/_")).filter(t => t?.length)[0] ?? [])[0] ?? document.documentElement.getAttribute("data-build"), navigator.language, navigator.languages?.["join"](","), Math?.["random"](), N(), j(Object.keys(document)), j(Object.keys(window)), performance.now(), this.sid, [...new URLSearchParams(window.location.search).keys()].join(","), navigator?.["hardwareConcurrency"], performance.timeOrigin, Number("ai" in window), Number("createPRNG" in window), Number("cache" in window), Number("data" in window), Number("solana" in window), Number("dump" in window), Number("InstallTrigger" in window)];
    }
  }
  function j(t) {
    return t[Math.floor(Math.random() * t.length)];
  }
  
  function N() {
    const n = j(Object.keys(Object.getPrototypeOf(navigator)));
    try {
      return n + "−" + navigator[n].toString();
    } catch {
      return "" + n;
    }
  }
  function U(t) {
    return t = JSON.stringify(t), window.TextEncoder ? btoa(String.fromCharCode(...new TextEncoder().encode(t))) : btoa(unescape(encodeURIComponent(t)));
  }
  function P(t) {
    return setTimeout(() => {
      t({
        timeRemaining: () => 1,
        didTimeout: !1
      });
    }, 0), 0;
  }
  var R = new _();
  const F = 0,
    G = 1,
    J = 2,
    z = 3,
    W = 4,
    H = 5,
    V = 6,
    B = 24,
    Z = 7,
    K = 8,
    Q = 9,
    Y = 10,
    X = 11,
    tt = 12,
    nt = 13,
    et = 14,
    rt = 15,
    ot = 16,
    it = 17,
    ct = 18,
    st = 19,
    ut = 23,
    at = 20,
    ft = 21,
    lt = 22,
    dt = 25,
    pt = 26,
    ht = 27,
    gt = 28,
    mt = 29,
    wt = 30,
    yt = 33,
    vt = 34,
    bt = 35,
    kt = new Map();
  let St = 0,
    Ct = Promise.resolve();
  function At(t) {
    const e = Ct.then(t, t);
    return Ct = e.then(() => {}, () => {}), e;
  }
  async function _t() {
    for (; kt.get(Q).length > 0;) {
      const [n, ...e] = kt.get(Q).shift(),
        r = kt.get(n)(...e);
      r && typeof r.then === "function" && (await r), St++;
    }
  }
  function jt(t) {
    return At(() => new Promise((n, e) => {
      let o = !1;
      setTimeout(() => {
        o = !0, n("" + St);
      }, 500), kt.set(z, t => {
        !o && (o = !0, n(btoa("" + t)));
      }), kt.set(W, t => {
        !o && (o = !0, e(btoa("" + t)));
      }), kt.set(wt, (t, n, e, i) => {
        const s = Array.isArray(i),
          u = s ? e : [],
          a = (s ? i : e) || [];
        kt.set(t, (...t) => {
          if (o) return;
          const r = [...kt.get(Q)];
          if (s) for (let n = 0; n < u.length; n++) {
            const r = u[n],
              o = t[n];
            kt.set(r, o);
          }
          return kt.set(Q, [...a]), _t().then(() => kt.get(n)).catch(t => "" + t).finally(() => {
            kt.set(Q, r);
          });
        });
      });
      try {
        kt.set(Q, JSON.parse(Nt(atob(t), "" + kt.get(ot)))), _t().catch(t => {
          n(btoa(St + ": " + t));
        });
      } catch (t) {
        n(btoa(St + ": " + t));
      }
    }));
  }
  function Et(t) {
    At(async () => {
      return function () {
        kt.clear(), kt.set(F, jt), kt.set(G, (n, e) => kt.set(n, Nt("" + kt.get(n), "" + kt.get(e)))), kt.set(J, (n, e) => kt.set(n, e)), kt.set(H, (n, e) => {
          const o = kt.get(n);
          Array.isArray(o) ? o.push(kt.get(e)) : kt.set(n, o + kt.get(e));
        }), kt.set(ht, (n, e) => {
          const o = kt.get(n);
          Array.isArray(o) ? o.splice(o.indexOf(kt.get(e)), 1) : kt.set(n, o - kt.get(e));
        }), kt.set(mt, (n, e, r) => kt.set(n, kt.get(e) < kt.get(r))), kt.set(yt, (n, e, r) => {
          const i = Number(kt.get(e)),
            c = Number(kt.get(r));
          kt.set(n, i * c);
        }), kt.set(bt, (t, n, e) => {
          const r = Number(kt.get(n)),
            o = Number(kt.get(e));
          kt.set(t, 0 === o ? 0 : r / o);
        }), kt.set(V, (n, e, r) => kt.set(n, kt.get(e)[kt.get(r)])), kt.set(Z, (n, ...e) => kt.get(n)(...e.map(n => kt.get(n)))), kt.set(it, (n, e, ...r) => {
          try {
            const t = kt.get(e)(...r.map(t => kt.get(t)));
            if (t && typeof t.then === "function") return t.then(t => {
              kt.set(n, t);
            }).catch(t => {
              kt.set(n, "" + t);
            });
            kt.set(n, t);
          } catch (t) {
            kt.set(n, "" + t);
          }
        }), kt.set(nt, (n, e, ...r) => {
          try {
            kt.get(e)(...r);
          } catch (t) {
            kt.set(n, "" + t);
          }
        }), kt.set(K, (n, e) => kt.set(n, kt.get(e))), kt.set(Y, window), kt.set(X, (n, e) => kt.set(n, (Array.from(document.scripts || []).map(n => n?.["src"]?.["match"](kt.get(e))).filter(n => n?.["length"])[0] ?? [])[0] ?? null)), kt.set(tt, n => kt.set(n, kt)), kt.set(et, (n, e) => kt.set(n, JSON.parse("" + kt.get(e)))), kt.set(rt, (n, e) => kt.set(n, JSON.stringify(kt.get(e)))), kt.set(ct, n => kt.set(n, atob("" + kt.get(n)))), kt.set(st, n => kt.set(n, btoa("" + kt.get(n)))), kt.set(at, (n, e, r, ...o) => kt.get(n) === kt.get(e) ? kt.get(r)(...o) : null), kt.set(ft, (n, e, r, o, ...i) => Math.abs(kt.get(n) - kt.get(e)) > kt.get(r) ? kt.get(o)(...i) : null), kt.set(ut, (n, e, ...r) => void 0 !== kt.get(n) ? kt.get(e)(...r) : null), kt.set(B, (n, e, r) => kt.set(n, kt.get(e)[kt.get(r)].bind(kt.get(e)))), kt.set(vt, (n, e) => {
          try {
            const t = kt.get(e);
            return Promise.resolve(t).then(t => {
              kt.set(n, t);
            });
          } catch (t) {
            return;
          }
        }), kt.set(lt, (n, e) => {
          const o = [...kt.get(Q)];
          return kt.set(Q, [...e]), _t().catch(t => {
            kt.set(n, "" + t);
          }).finally(() => {
            kt.set(Q, o);
          });
        }), kt.set(gt, () => {}), kt.set(pt, () => {}), kt.set(dt, () => {});
      }(), St = 0, kt.set(ot, t), null;
    });
  }
  function Nt(t, n) {
    let r = "";
    for (let o = 0; o < t.length; o++) r += String.fromCharCode(t.charCodeAt(o) ^ n.charCodeAt(o % n.length));
    return r;
  }
  var Ut = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {};
  var Pt,
    Rt = Object.freeze({
      __proto__: null,
      commonjsGlobal: Ut,
      getAugmentedNamespace: function (t) {
        if (t.__esModule) return t;
        var n = t.default;
        if ("function" == typeof n) {
          var e = function t() {
            if (this instanceof t) {
              var e = [null];
              return e.push.apply(e, arguments), new (Function.bind.apply(n, e))();
            }
            return n.apply(this, arguments);
          };
          e.prototype = n.prototype;
        } else e = {};
        return Object.defineProperty(e, "__esModule", {
          value: !0
        }), Object.keys(t).forEach(function (n) {
          var r = Object.getOwnPropertyDescriptor(t, n);
          Object.defineProperty(e, n, r.get ? r : {
            enumerable: !0,
            get: function () {
              return t[n];
            }
          });
        }), e;
      },
      getDefaultExportFromCjs: function (t) {
        return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
      },
      getDefaultExportFromNamespaceIfNotNamed: function (t) {
        return t && Object.prototype.hasOwnProperty.call(t, "default") && 1 === Object.keys(t).length ? t.default : t;
      },
      getDefaultExportFromNamespaceIfPresent: function (t) {
        return t && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
      }
    }),
    Tt = {},
    xt = {};
  "use strict", xt.parse = function (t, n) {
    if ("string" != typeof t) throw new TypeError("argument str must be a string");
    for (var r = {}, o = n || {}, i = t.split(";"), c = o.decode || decodeURIComponent, s = 0; s < i.length; s++) {
      var u = i[s],
        a = u.indexOf("=");
      if (!(a < 0)) {
        var f = u.substring(0, a).trim();
        if (null == r[f]) {
          var l = u.substring(a + 1, u.length).trim();
          '"' === l[0] && (l = l.slice(1, -1)), r[f] = Jt(l, c);
        }
      }
    }
    return r;
  }, xt.serialize = function (t, n, e) {
    var o = e || {},
      i = o.encode || encodeURIComponent;
    if ("function" != typeof i) throw new TypeError("option encode is invalid");
    if (!Ft.test(t)) throw new TypeError("argument name is invalid");
    var c = i(n);
    if (c && !Ft.test(c)) throw new TypeError("argument val is invalid");
    var s = t + "=" + c;
    if (null != o.maxAge) {
      var u = o.maxAge - 0;
      if (isNaN(u) || !isFinite(u)) throw new TypeError("option maxAge is invalid");
      s += "; Max-Age=" + Math.floor(u);
    }
    if (o.domain) {
      if (!Ft.test(o.domain)) throw new TypeError("option domain is invalid");
      s += "; Domain=" + o.domain;
    }
    if (o.path) {
      if (!Ft.test(o.path)) throw new TypeError("option path is invalid");
      s += "; Path=" + o.path;
    }
    if (o.expires) {
      if (typeof o.expires.toUTCString !== "function") throw new TypeError("option expires is invalid");
      s += "; Expires=" + o.expires.toUTCString();
    }
    if (o.httpOnly && (s += "; HttpOnly"), o.secure && (s += "; Secure"), o.sameSite) {
      switch (typeof o.sameSite === "string" ? o.sameSite.toLowerCase() : o.sameSite) {
        case !0:
          s += "; SameSite=Strict";
          break;
        case "lax":
          s += "; SameSite=Lax";
          break;
        case "strict":
          s += "; SameSite=Strict";
          break;
        case "none":
          s += "; SameSite=None";
          break;
        default:
          throw new TypeError("option sameSite is invalid");
      }
    }
    return s;
  };
  var Ft = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
  function Jt(t, n) {
    try {
      return n(t);
    } catch (n) {
      return t;
    }
  }
  
  !function (t) {
    var n;
    var i = Ut && Rt.commonjsGlobal.__assign || function () {
        return i = Object.assign || function (n) {
          for (var e, o = 1, i = arguments.length; o < i; o++) for (var c in e = arguments[o]) Object.prototype.hasOwnProperty.call(e, c) && (n[c] = e[c]);
          return n;
        }, i.apply(this, arguments);
      },
      c = Ut && Rt.commonjsGlobal.__rest || function (t, n) {
        var o = {};
        for (var i in t) Object.prototype.hasOwnProperty.call(t, i) && n.indexOf(i) < 0 && (o[i] = t[i]);
        if (null != t && "function" == typeof Object.getOwnPropertySymbols) {
          var c = 0;
          for (i = Object.getOwnPropertySymbols(t); c < i.length; c++) n.indexOf(i[c]) < 0 && Object.prototype.propertyIsEnumerable.call(t, i[c]) && (o[i[c]] = t[i[c]]);
        }
        return o;
      };
    Object.defineProperty(t, "__esModule", {
      value: !0
    }), t.checkCookies = t.hasCookie = t.removeCookies = t.deleteCookie = t.setCookies = t.setCookie = t.getCookie = t.getCookies = void 0;
    var u = function () {
        return typeof window !== "undefined";
      },
      a = function (t) {
        void 0 === t && (t = "");
        try {
          var r = JSON.stringify(t);
          return /^[\{\[]/.test(r) ? r : t;
        } catch (n) {
          return t;
        }
      };
    t.getCookies = function (t) {
      var n;
      if (t && (n = t.req), !u()) return n && n.cookies ? n.cookies : n && n.headers && n.headers.cookie ? (0, xt.parse)(n.headers.cookie) : {};
      for (var o = {}, i = document.cookie ? document.cookie.split("; ") : [], c = 0, a = i.length; c < a; c++) {
        var f = i[c].split("="),
          l = f.slice(1).join("=");
        o[f[0]] = l;
      }
      return o;
    };
    t.getCookie = function (n, r) {
      var o = (0, t.getCookies)(r)[n];
      if (void 0 !== o) return function (t) {
        return t === "true" || t !== "false" && (t !== "undefined" ? "null" === t ? null : t : void 0);
      }(function (t) {
        return t ? t.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent) : t;
      }(o));
    };
    t.setCookie = function (t, n, r) {
      var o, f, l;
      r && (f = r.req, l = r.res, o = c(r, ["req", "res"]));
      var p = (0, xt.serialize)(t, a(n), i({
        path: "/"
      }, o));
      if (u()) document.cookie = p;else if (l && f) {
        var h = l.getHeader("Set-Cookie");
        if (!Array.isArray(h) && (h = h ? [String(h)] : []), l.setHeader("Set-Cookie", h.concat(p)), f && f.cookies) {
          var g = f.cookies;
          "" === n ? delete g[t] : g[t] = a(n);
        }
        if (f && f.headers && f.headers.cookie) {
          g = (0, xt.parse)(f.headers.cookie);
          "" === n ? delete g[t] : g[t] = a(n), f.headers.cookie = Object.entries(g).reduce(function (t, n) {
            return t.concat("".concat(n[0], "=").concat(n[1], ";"));
          }, "");
        }
      }
    };
    t.setCookies = function (n, r, o) {
      return console.warn("[WARN]: setCookies was deprecated. It will be deleted in the new version. Use setCookie instead."), (0, t.setCookie)(n, r, o);
    };
    t.deleteCookie = function (n, r) {
      return (0, t.setCookie)(n, "", i(i({}, r), {
        maxAge: -1
      }));
    };
    t.removeCookies = function (n, r) {
      return console.warn("[WARN]: removeCookies was deprecated. It will be deleted in the new version. Use deleteCookie instead."), (0, t.deleteCookie)(n, r);
    };
    t.hasCookie = function (n, r) {
      return !!n && (0, t.getCookies)(r).hasOwnProperty(n);
    };
    t.checkCookies = function (n, r) {
      return console.warn("[WARN]: checkCookies was deprecated. It will be deleted in the new version. Use hasCookie instead."), (0, t.hasCookie)(n, r);
    };
  }(Tt), Rt.getDefaultExportFromCjs(Tt);
  const Bt = "https://chatgpt.com/backend-api/sentinel/";
  const Zt = function () {
      if (typeof document !== "undefined") {
        const n = document.currentScript;
        if (n?.["src"]) try {
          const e = new URL(n.src);
          if (e.pathname.includes("/sentinel/")) return e.origin + "/backend-api/sentinel/";
        } catch {}
      }
      return Bt;
    }(),
    Kt = function () {
      if (typeof document === "undefined") return null;
      const r = document.currentScript;
      if (!r?.["src"]) return null;
      try {
        const n = new URL(r.src).pathname.match(/\/sentinel\/([^/]+)\/sdk\.js$/);
        return n?.[1] ? decodeURIComponent(n[1]) : null;
      } catch {
        return null;
      }
    }(),
    Qt = Kt ? "frame.html?sv=" + encodeURIComponent(Kt) : "frame.html",
    Yt = new URL(Qt, Zt),
    Xt = (() => {
      if (window.top === window) return !1;
      try {
        const n = new URL(window.location.href);
        return Yt.pathname === n.pathname;
      } catch {
        return !1;
      }
    })();
  const tn = 5e3;
  let nn = null,
    en = null,
    rn = 0;
  const on = t => t ? t.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent) : t;
  function cn(t, n) {
    return t.id = function () {
      const n = Tt.getCookies()["oai-did"];
      return void 0 === n ? void 0 : on(n);
    }(), t.flow = n, JSON.stringify(t);
  }
  async function un(t, n) {
    for (let r = 0; r < 3; r++) try {
      const r = await fetch(Zt + "req", {
        method: "POST",
        body: cn({
          p: n
        }, t),
        credentials: "include"
      }).then(t => t.json());
      return rn = Date.now(), void (en = r);
    } catch (o) {
      if (r >= 2) return cn({
        e: o.message,
        p: n,
        a: r
      }, t);
    }
  }
  const an = Yt.origin;
  let fn = null,
    ln = !1;
  const dn = new Map();
  let pn = 0;
  function hn() {
    const n = document.createElement("iframe");
    return n.style.display = "none", n.src = Yt.href, document.body.appendChild(n), n;
  }
  function gn(t, n, e) {
    return new Promise((r, o) => {
      function c() {
        const c = "req_" + ++pn;
        dn.set(c, {
          resolve: r,
          reject: o
        }), fn?.["contentWindow"]?.["postMessage"]({
          type: t,
          flow: n,
          requestId: c,
          ...e
        }, an);
      }
      fn ? ln ? c() : fn.addEventListener("load", () => {
        ln = !0, c();
      }) : (fn = hn(), fn.addEventListener("load", () => {
        ln = !0, c();
      }));
    });
  }
  async function mn(t) {
    if (Xt) throw new Error("init() should not be called from within an iframe.");
    const e = await R.getRequirementsToken();
    return nn = e, Et(nn), gn("init", t, {
      p: e
    });
  }
  async function wn(t) {
    if (Xt) throw new Error("token() should not be called from within an iframe.");
    const e = Date.now();
    if (!en || e - rn > 54e4) {
      const e = await R.getRequirementsToken();
      nn = e, Et(nn);
      const r = await gn("token", t, {
        p: e
      });
      if (typeof r === "string") return r;
      en = r.cachedChatReq, nn = r.cachedProof;
    }
    try {
      const e = await R.getEnforcementToken(en),
        r = cn({
          p: e,
          t: en?.["turnstile"]?.dx ? await jt(en.turnstile.dx) : null,
          c: en.token
        }, t);
      return en = null, setTimeout(async () => {
        const r = t + "__auto",
          o = await R.getRequirementsToken();
        nn = o, Et(nn), gn("init", r, {
          p: o
        });
      }, tn), r;
    } catch (e) {
      const r = cn({
        e: e.message,
        p: en?.p
      }, t);
      return en = null, r;
    }
  }
  
  return Xt ? window.addEventListener("message", async t => {
    if (t.source === window) return;
    const {
      type: e,
      flow: r,
      requestId: o,
      p: i
    } = t.data ?? {};
    if (e === "init" || e === "token") try {
      let c;
      e === "init" ? c = await un(r, i) : e === "token" && (c = await async function (t, n) {
        const r = Date.now();
        if (!en || r - rn > 54e4) {
          const r = await Promise.race([un(t, n), new Promise(e => setTimeout(() => e(cn({
            e: "elapsed",
            p: n
          }, t)), 4e3))]);
          if (null != r) return r;
        }
        return rn = 0, {
          cachedChatReq: en,
          cachedProof: nn
        };
      }(r, i)), t.source?.["postMessage"]({
        type: "response",
        requestId: o,
        result: c
      }, {
        targetOrigin: t.origin
      });
    } catch (e) {
      t.source?.postMessage({
        type: "response",
        requestId: o,
        error: e.message
      }, {
        targetOrigin: t.origin
      });
    }
  }) : function () {
    window.addEventListener("message", n => {
      if (n.source === fn?.contentWindow) {
        const {
          type: t,
          requestId: r,
          result: o,
          error: i
        } = n.data;
        if (t === "response" && r && dn.has(r)) {
          const {
            resolve: t,
            reject: n
          } = dn.get(r);
          i ? n(i) : t(o), dn.delete(r);
        }
      }
    }), !fn && (fn = hn(), fn.addEventListener("load", () => {
      ln = !0;
    }));
  }(), function () {
    (!window?.["__sentinel_token_pending"] || 0 === window?.["__sentinel_token_pending"]["length"]) && (window?.["__sentinel_init_pending"]?.forEach(({
      args: n,
      resolve: e
    }) => {
      mn.apply(null, n).then(e);
    }), window.__sentinel_init_pending = []), window?.["__sentinel_token_pending"]?.["forEach"](({
      args: t,
      resolve: n
    }) => {
      wn.apply(null, t).then(n);
    }), window.__sentinel_token_pending = [];
  }(), t.init = mn, t.token = wn, t;
}({});