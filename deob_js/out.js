var SentinelSDK = function (t) {
  "use strict";

  const i = [];
  for (let t = 0; t < 256; ++t) i.push((t + 256).toString(16).slice(1));
  let a;
  const d = new Uint8Array(16);
  var y = {
    randomUUID: typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto)
  };
  function C(t, n, r) {
    if (y.randomUUID && !t) return y.randomUUID();
    const c = (t = t || {}).random ?? t.rng?.() ?? function () {
      if (!a) {
        if ("undefined" == typeof crypto || !crypto.getRandomValues) throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
        a = crypto.getRandomValues.bind(crypto);
      }
      return a(d);
    }();
    if (c.length < 16) throw new Error("Random bytes length must be >= 16");
    return c[6] = 15 & c[6] | 64, c[8] = 63 & c[8] | 128, function (t, n = 0) {
      return (i[t[n + 0]] + i[t[n + 1]] + i[t[n + 2]] + i[t[n + 3]] + "-" + i[t[n + 4]] + i[t[n + 5]] + "-" + i[t[n + 6]] + i[t[n + 7]] + "-" + i[t[n + 8]] + i[t[n + 9]] + "-" + i[t[n + 10]] + i[t[n + 11]] + i[t[n + 12]] + i[t[n + 13]] + i[t[n + 14]] + i[t[n + 15]]).toLowerCase();
    }(c);
  }
  class _ {
    ["answers"] = new Map();
    ["maxAttempts"] = 5e5;
    ["requirementsSeed"] = function () {
      return n(), "" + Math.random();
    }();
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
      if (typeof o !== "string" || typeof i !== "string") return null;
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
      const c = N(r),
        s = function (t) {
          let e = 2166136261;
          for (let r = 0; r < t.length; r++) e ^= t.charCodeAt(r), e = Math.imul(e, 16777619) >>> 0;
          return e ^= e >>> 16, e = Math.imul(e, 2246822507) >>> 0, e ^= e >>> 13, e = Math.imul(e, 3266489909) >>> 0, e ^= e >>> 16, (e >>> 0).toString(16).padStart(8, "0");
        }(n + c);
      return s.substring(0, e.length) <= e ? c + "~S" : null;
    };
    buildGenerateFailMessage(t) {
      return this.errorPrefix + N(String(t ?? "e"));
    }
    _generateAnswerSync(t, n) {
      const r = performance.now();
      try {
        const o = this.getConfig();
        for (let i = 0; i < this.maxAttempts; i++) {
          const c = this._runCheck(r, t, n, o, i);
          if (c) return c;
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
            const e = window.requestIdleCallback || q;
            e(n => {}, {
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
        const n = this.getConfig();
        return n[3] = 1, n[9] = performance.now() - e, N(n);
      } catch (t) {
        n = N(String(t));
      }
      return this.errorPrefix + n;
    }
    getConfig() {
      return [screen?.width + screen?.height, "" + new Date(), performance?.["memory"]?.["jsHeapSizeLimit"], Math?.["random"](), navigator.userAgent, R(Array.from(document.scripts).map(n => n?.["src"]).filter(t => t)), (Array.from(document.scripts || []).map(n => n?.["src"]?.["match"]("c/[^/]*/_")).filter(n => n?.["length"])[0] ?? [])[0] ?? document.documentElement.getAttribute("data-build"), navigator.language, navigator.languages?.["join"](","), Math?.["random"](), T(), R(Object.keys(document)), R(Object.keys(window)), performance.now(), this.sid, [...new URLSearchParams(window.location.search).keys()].join(","), navigator?.["hardwareConcurrency"], performance.timeOrigin, Number("ai" in window), Number("createPRNG" in window), Number("cache" in window), Number("data" in window), Number("solana" in window), Number("dump" in window), Number("InstallTrigger" in window)];
    }
  }
  function R(t) {
    return t[Math.floor(Math.random() * t.length)];
  }
  function T() {
    const t = R(Object.keys(Object.getPrototypeOf(navigator)));
    try {
      return t + "−" + navigator[t].toString();
    } catch {
      return "" + t;
    }
  }
  function N(t) {
    return t = JSON.stringify(t), window.TextEncoder ? btoa(String.fromCharCode(...new TextEncoder().encode(t))) : btoa(unescape(encodeURIComponent(t)));
  }
  function q(t) {
    return setTimeout(() => {}, 0), 0;
  }
  var P = new _();
  const I = new WeakMap();
  function D(t, n) {
    I.set(t, n);
  }
  function $(t) {
    return I.get(t);
  }
  const J = 0,
    G = 1,
    W = 2,
    z = 3,
    H = 4,
    V = 5,
    B = 6,
    Z = 24,
    K = 7,
    Q = 8,
    Y = 9,
    X = 10,
    tt = 11,
    nt = 12,
    et = 13,
    rt = 14,
    ot = 15,
    it = 16,
    ct = 17,
    st = 18,
    ut = 19,
    at = 23,
    ft = 20,
    lt = 21,
    dt = 22,
    ht = 25,
    pt = 26,
    mt = 27,
    gt = 28,
    wt = 29,
    yt = 30,
    vt = 33,
    bt = 34,
    kt = 35,
    St = new Map();
  let Ct = 0,
    At = Promise.resolve();
  function Ot(t) {
    const e = At.then(t, t);
    return At = e.then(() => {}, () => {}), e;
  }
  async function _t() {
    for (; St.get(Y).length > 0;) {
      const [n, ...e] = St.get(Y).shift(),
        r = St.get(n)(...e);
      r && typeof r.then === "function" && (await r), Ct++;
    }
  }
  function Rt(t, n) {
    let r = "";
    for (let o = 0; o < t.length; o++) r += String.fromCharCode(t.charCodeAt(o) ^ n.charCodeAt(o % n.length));
    return r;
  }
  function Nt(t) {
    return Ot(() => jt(t));
  }
  function jt(t, n) {
    return new Promise((e, r) => {
      void 0 !== n && (function () {
        St.clear(), St.set(J, Nt), St.set(G, (n, e) => St.set(n, Rt("" + St.get(n), "" + St.get(e)))), St.set(W, (n, e) => St.set(n, e)), St.set(V, (n, e) => {
          const o = St.get(n);
          Array.isArray(o) ? o.push(St.get(e)) : St.set(n, o + St.get(e));
        }), St.set(mt, (n, e) => {
          const o = St.get(n);
          Array.isArray(o) ? o.splice(o.indexOf(St.get(e)), 1) : St.set(n, o - St.get(e));
        }), St.set(wt, (n, e, r) => St.set(n, St.get(e) < St.get(r))), St.set(vt, (n, e, r) => {
          const i = Number(St.get(e)),
            c = Number(St.get(r));
          St.set(n, i * c);
        }), St.set(kt, (n, e, r) => {
          const i = Number(St.get(e)),
            c = Number(St.get(r));
          St.set(n, 0 === c ? 0 : i / c);
        }), St.set(B, (n, e, r) => St.set(n, St.get(e)[St.get(r)])), St.set(K, (n, ...e) => St.get(n)(...e.map(n => St.get(n)))), St.set(ct, (n, e, ...r) => {
          try {
            const t = St.get(e)(...r.map(t => St.get(t)));
            if (t && typeof t.then === "function") return t.then(t => {
              St.set(n, t);
            }).catch(t => {
              St.set(n, "" + t);
            });
            St.set(n, t);
          } catch (t) {
            St.set(n, "" + t);
          }
        }), St.set(et, (n, e, ...r) => {
          try {
            St.get(e)(...r);
          } catch (t) {
            St.set(n, "" + t);
          }
        }), St.set(Q, (n, e) => St.set(n, St.get(e))), St.set(X, window), St.set(tt, (n, e) => St.set(n, (Array.from(document.scripts || []).map(n => n?.["src"]?.["match"](St.get(e))).filter(n => n?.["length"])[0] ?? [])[0] ?? null)), St.set(nt, n => St.set(n, St)), St.set(rt, (n, e) => St.set(n, JSON.parse("" + St.get(e)))), St.set(ot, (n, e) => St.set(n, JSON.stringify(St.get(e)))), St.set(st, n => St.set(n, atob("" + St.get(n)))), St.set(ut, n => St.set(n, btoa("" + St.get(n)))), St.set(ft, (n, e, r, ...o) => St.get(n) === St.get(e) ? St.get(r)(...o) : null), St.set(lt, (n, e, r, o, ...i) => Math.abs(St.get(n) - St.get(e)) > St.get(r) ? St.get(o)(...i) : null), St.set(at, (n, e, ...r) => void 0 !== St.get(n) ? St.get(e)(...r) : null), St.set(Z, (n, e, r) => St.set(n, St.get(e)[St.get(r)].bind(St.get(e)))), St.set(bt, (n, e) => {
          try {
            const t = St.get(e);
            return Promise.resolve(t).then(t => {
              St.set(n, t);
            });
          } catch {
            return;
          }
        }), St.set(dt, (n, e) => {
          const o = [...St.get(Y)];
          return St.set(Y, [...e]), _t().catch(t => {
            St.set(n, "" + t);
          }).finally(() => {
            St.set(Y, o);
          });
        }), St.set(gt, () => {}), St.set(pt, () => {}), St.set(ht, () => {});
      }(), Ct = 0, St.set(it, n));
      let i = !1;
      const c = setTimeout(() => {
          !i && (i = !0, r(new Error("session_observer_vm_timeout")));
        }, 6e4),
        s = t => {
          i || (i = !0, clearTimeout(c), e(t));
        };
      St.set(z, t => {}), St.set(H, t => {
        (t => {
          i || (i = !0, clearTimeout(c), r(t));
        })(btoa("" + t));
      }), St.set(yt, (t, n, e, r) => {
        const c = Array.isArray(r),
          s = c ? e : [],
          u = (c ? r : e) || [];
        St.set(t, (...t) => {
          const r = [...St.get(Y)];
          if (c) for (let n = 0; n < s.length; n++) {
            const r = s[n],
              o = t[n];
            St.set(r, o);
          }
          return St.set(Y, [...u]), _t().then(() => St.get(n)).catch(t => "" + t).finally(() => {
            St.set(Y, r);
          });
        });
      });
      try {
        St.set(Y, JSON.parse(Rt(atob(t), "" + St.get(it)))), _t().catch(t => {});
      } catch (t) {}
    });
  }
  function qt(t) {
    return t?.so ?? null;
  }
  function Pt(t) {
    return !0 === t?.required;
  }
  function Et(t) {
    const e = qt(t);
    t && Pt(e) && e?.["collector_dx"] && function (t, n) {
      const e = $(t ?? {}) ?? "";
      return Ot(() => jt(n, e));
    }(t, e.collector_dx).catch(() => {});
  }
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
    return Sn = n.then(() => {}, () => {}), n;
  }
  async function An() {
    for (; bn.get(Zt).length > 0;) {
      const [n, ...e] = bn.get(Zt).shift(),
        r = bn.get(n)(...e);
      r && typeof r.then === "function" && (await r), kn++;
    }
  }
  function On(t) {
    return Cn(() => new Promise((n, e) => {
      let o = !1;
      setTimeout(() => {
        o = !0, n("" + kn);
      }, 500), bn.set(Jt, t => {
        !o && (o = !0, n(btoa("" + t)));
      }), bn.set(Gt, t => {
        !o && (o = !0, e(btoa("" + t)));
      }), bn.set(gn, (t, n, e, i) => {
        const s = Array.isArray(i),
          u = s ? e : [],
          a = (s ? i : e) || [];
        bn.set(t, (...t) => {
          if (o) return;
          const r = [...bn.get(Zt)];
          if (s) for (let n = 0; n < u.length; n++) {
            const e = u[n],
              r = t[n];
            bn.set(e, r);
          }
          return bn.set(Zt, [...a]), An().then(() => bn.get(n)).catch(t => "" + t).finally(() => {
            bn.set(Zt, r);
          });
        });
      });
      try {
        bn.set(Zt, JSON.parse(Tn(atob(t), "" + bn.get(en)))), An().catch(t => {});
      } catch (t) {}
    }));
  }
  function _n(t, n) {
    return Cn(() => new Promise((e, r) => {
      const i = $(t ?? {}) ?? "";
      (function () {
        bn.clear(), bn.set($t, On), bn.set(Ft, (n, e) => bn.set(n, Tn("" + bn.get(n), "" + bn.get(e)))), bn.set(Lt, (n, e) => bn.set(n, e)), bn.set(Wt, (n, e) => {
          const o = bn.get(n);
          Array.isArray(o) ? o.push(bn.get(e)) : bn.set(n, o + bn.get(e));
        }), bn.set(hn, (n, e) => {
          const o = bn.get(n);
          Array.isArray(o) ? o.splice(o.indexOf(bn.get(e)), 1) : bn.set(n, o - bn.get(e));
        }), bn.set(mn, (n, e, r) => bn.set(n, bn.get(e) < bn.get(r))), bn.set(wn, (n, e, r) => {
          const i = Number(bn.get(e)),
            c = Number(bn.get(r));
          bn.set(n, i * c);
        }), bn.set(vn, (n, e, r) => {
          const i = Number(bn.get(e)),
            c = Number(bn.get(r));
          bn.set(n, 0 === c ? 0 : i / c);
        }), bn.set(zt, (n, e, r) => bn.set(n, bn.get(e)[bn.get(r)])), bn.set(Vt, (n, ...e) => bn.get(n)(...e.map(n => bn.get(n)))), bn.set(rn, (n, e, ...r) => {
          try {
            const t = bn.get(e)(...r.map(t => bn.get(t)));
            if (t && typeof t.then === "function") return t.then(t => {
              bn.set(n, t);
            }).catch(t => {
              bn.set(n, "" + t);
            });
            bn.set(n, t);
          } catch (t) {
            bn.set(n, "" + t);
          }
        }), bn.set(Xt, (n, e, ...r) => {
          try {
            bn.get(e)(...r);
          } catch (t) {
            bn.set(n, "" + t);
          }
        }), bn.set(Bt, (n, e) => bn.set(n, bn.get(e))), bn.set(Kt, window), bn.set(Qt, (n, e) => bn.set(n, (Array.from(document.scripts || []).map(n => n?.src?.["match"](bn.get(e))).filter(n => n?.["length"])[0] ?? [])[0] ?? null)), bn.set(Yt, n => bn.set(n, bn)), bn.set(tn, (n, e) => bn.set(n, JSON.parse("" + bn.get(e)))), bn.set(nn, (n, e) => bn.set(n, JSON.stringify(bn.get(e)))), bn.set(on, n => bn.set(n, atob("" + bn.get(n)))), bn.set(cn, n => bn.set(n, btoa("" + bn.get(n)))), bn.set(un, (n, e, r, ...o) => bn.get(n) === bn.get(e) ? bn.get(r)(...o) : null), bn.set(an, (n, e, r, o, ...i) => Math.abs(bn.get(n) - bn.get(e)) > bn.get(r) ? bn.get(o)(...i) : null), bn.set(sn, (n, e, ...r) => void 0 !== bn.get(n) ? bn.get(e)(...r) : null), bn.set(Ht, (n, e, r) => bn.set(n, bn.get(e)[bn.get(r)].bind(bn.get(e)))), bn.set(yn, (n, e) => {
          try {
            const t = bn.get(e);
            return Promise.resolve(t).then(t => {
              bn.set(n, t);
            });
          } catch (t) {
            return;
          }
        }), bn.set(fn, (n, e) => {
          const o = [...bn.get(Zt)];
          return bn.set(Zt, [...e]), An().catch(t => {
            bn.set(n, "" + t);
          }).finally(() => {
            bn.set(Zt, o);
          });
        }), bn.set(pn, () => {}), bn.set(dn, () => {}), bn.set(ln, () => {});
      })(), kn = 0, bn.set(en, i);
      let c = !1;
      setTimeout(() => {
        c = !0, e("" + kn);
      }, 500), bn.set(Jt, t => {
        !c && (c = !0, e(btoa("" + t)));
      }), bn.set(Gt, t => {
        !c && (c = !0, r(btoa("" + t)));
      }), bn.set(gn, (t, n, e, r) => {
        const s = Array.isArray(r),
          u = s ? e : [],
          a = (s ? r : e) || [];
        bn.set(t, (...t) => {
          if (c) return;
          const r = [...bn.get(Zt)];
          if (s) for (let n = 0; n < u.length; n++) {
            const e = u[n],
              r = t[n];
            bn.set(e, r);
          }
          return bn.set(Zt, [...a]), An().then(() => bn.get(n)).catch(t => "" + t).finally(() => {
            bn.set(Zt, r);
          });
        });
      });
      try {
        bn.set(Zt, JSON.parse(Tn(atob(n), "" + bn.get(en)))), An().catch(t => {
          e(btoa(kn + ": " + t));
        });
      } catch (t) {
        e(btoa(kn + ": " + t));
      }
    }));
  }
  function Tn(t, n) {
    let r = "";
    for (let o = 0; o < t.length; o++) r += String.fromCharCode(t.charCodeAt(o) ^ n.charCodeAt(o % n.length));
    return r;
  }
  var Nn = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {};
  var jn = Object.freeze({
      __proto__: null,
      commonjsGlobal: Nn,
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
    qn = {},
    Pn = {};
  In(), Pn.parse = function (t, n) {
    if (typeof t !== "string") throw new TypeError("argument str must be a string");
    for (var r = {}, o = n || {}, i = t.split(";"), c = o.decode || decodeURIComponent, s = 0; s < i.length; s++) {
      var u = i[s],
        a = u.indexOf("=");
      if (!(a < 0)) {
        var f = u.substring(0, a).trim();
        if (null == r[f]) {
          var l = u.substring(a + 1, u.length).trim();
          '"' === l[0] && (l = l.slice(1, -1)), r[f] = Jn(l, c);
        }
      }
    }
    return r;
  }, Pn.serialize = function (t, n, e) {
    var o = e || {},
      i = o.encode || encodeURIComponent;
    if (typeof i !== "function") throw new TypeError("option encode is invalid");
    if (!Ln.test(t)) throw new TypeError("argument name is invalid");
    var c = i(n);
    if (c && !Ln.test(c)) throw new TypeError("argument val is invalid");
    var s = t + "=" + c;
    if (null != o.maxAge) {
      var u = o.maxAge - 0;
      if (isNaN(u) || !isFinite(u)) throw new TypeError("option maxAge is invalid");
      s += "; Max-Age=" + Math.floor(u);
    }
    if (o.domain) {
      if (!Ln.test(o.domain)) throw new TypeError("option domain is invalid");
      s += "; Domain=" + o.domain;
    }
    if (o.path) {
      if (!Ln.test(o.path)) throw new TypeError("option path is invalid");
      s += "; Path=" + o.path;
    }
    if (o.expires) {
      if ("function" != typeof o.expires.toUTCString) throw new TypeError("option expires is invalid");
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
  var Ln = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
  function Jn(t, n) {
    try {
      return n(t);
    } catch (n) {
      return t;
    }
  }
  !function (t) {
    var i = jn.commonjsGlobal && jn.commonjsGlobal.__assign || function () {
        return i = Object.assign || function (t) {
          for (var n, r = 1, o = arguments.length; r < o; r++) for (var i in n = arguments[r]) Object.prototype.hasOwnProperty.call(n, i) && (t[i] = n[i]);
          return t;
        }, i.apply(this, arguments);
      },
      c = jn.commonjsGlobal && jn.commonjsGlobal.__rest || function (t, n) {
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
      if (t && (n = t.req), !u()) return n && n.cookies ? n.cookies : n && n.headers && n.headers.cookie ? (0, Pn.parse)(n.headers.cookie) : {};
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
        return t === "true" || t !== "false" && ("undefined" !== t ? t === "null" ? null : t : void 0);
      }(function (t) {
        return t ? t.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent) : t;
      }(o));
    };
    t.setCookie = function (t, n, r) {
      var o, f, l;
      r && (f = r.req, l = r.res, o = c(r, ["req", "res"]));
      var h = (0, Pn.serialize)(t, a(n), i({
        path: "/"
      }, o));
      if (u()) document.cookie = h;else if (l && f) {
        var p = l.getHeader("Set-Cookie");
        if (!Array.isArray(p) && (p = p ? [String(p)] : []), l.setHeader("Set-Cookie", p.concat(h)), f && f.cookies) {
          var m = f.cookies;
          "" === n ? delete m[t] : m[t] = a(n);
        }
        if (f && f.headers && f.headers.cookie) {
          m = (0, Pn.parse)(f.headers.cookie);
          "" === n ? delete m[t] : m[t] = a(n), f.headers.cookie = Object.entries(m).reduce(function (t, n) {
            return t.concat("".concat(n[0], "=").concat(n[1], ";"));
          }, "");
        }
      }
    };
    t.setCookies = function (n, r, o) {
      return console.warn("[WARN]: setCookies was deprecated. It will be deleted in the new version. Use setCookie instead."), (0, t.setCookie)(n, r, o);
    };
    t.deleteCookie = function (n, e) {
      return (0, t.setCookie)(n, "", i(i({}, e), {
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
  }(qn), jn.getDefaultExportFromCjs(qn);
  const Bn = function () {
      if (typeof document !== "undefined") {
        const n = document.currentScript;
        if (n?.["src"]) try {
          const e = new URL(n.src);
          if (e.pathname.includes("/sentinel/")) return e.origin + "/backend-api/sentinel/";
        } catch {}
      }
      return "https://chatgpt.com/backend-api/sentinel/";
    }(),
    Zn = function () {
      if (e(), typeof document === "undefined") return null;
      const r = document.currentScript;
      if (!r?.src) return null;
      try {
        const n = new URL(r.src).pathname.match(/\/sentinel\/([^/]+)\/sdk\.js$/);
        return n?.[1] ? decodeURIComponent(n[1]) : null;
      } catch {
        return null;
      }
    }(),
    Kn = Zn ? "frame.html?sv=" + encodeURIComponent(Zn) : "frame.html",
    Qn = new URL(Kn, Bn),
    Yn = (() => {
      if (window.top === window) return !1;
      try {
        const n = new URL(window.location.href);
        return Qn.pathname === n.pathname;
      } catch {
        return !1;
      }
    })();
  const Xn = 5e3,
    te = "__default__",
    ne = new Map(),
    ee = new Map();
  function re(t) {
    let e = ne.get(t);
    return !e && (e = {
      cachedProof: null,
      cachedChatReq: null,
      lastFetchTime: 0,
      sessionObserverCollectorActive: !1,
      cachedSOChatReq: null
    }, ne.set(t, e)), e;
  }
  function oe(t) {
    let e = ee.get(t);
    return !e && (e = {
      cachedProof: null,
      cachedChatReq: null,
      lastFetchTime: 0
    }, ee.set(t, e)), e;
  }
  const ie = t => t ? t.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent) : t;
  function ce(t, n) {
    return t.id = function () {
      const n = qn.getCookies()["oai-did"];
      return void 0 === n ? void 0 : ie(n);
    }(), t.flow = n, JSON.stringify(t);
  }
  function se(t, n) {
    const r = re(t);
    if (!r.sessionObserverCollectorActive) return function (t) {
      const e = t?.so;
      return !0 === e?.["required"] && typeof e.collector_dx === "string" && typeof e.snapshot_dx === "string";
    }(n) ? (r.cachedSOChatReq = n, r.sessionObserverCollectorActive = !0, void Et(n)) : (r.cachedSOChatReq = null, void (r.sessionObserverCollectorActive = !1));
  }
  async function ue(t, n) {
    const r = oe(t);
    r.cachedProof = n;
    for (let o = 0; o < 3; o++) try {
      const o = await fetch(Bn + "req", {
        method: "POST",
        body: ce({
          p: n
        }, t),
        credentials: "include"
      }).then(t => t.json());
      return r.lastFetchTime = Date.now(), r.cachedChatReq = o, {
        cachedChatReq: r.cachedChatReq,
        cachedProof: r.cachedProof
      };
    } catch (r) {
      if (o >= 2) return ce({
        e: r.message,
        p: n,
        a: o
      }, t);
    }
  }
  const ae = Qn.origin;
  let fe = null,
    le = !1;
  const de = new Map();
  let he = 0;
  function me() {
    const n = document.createElement("iframe");
    return n.style.display = "none", n.src = Qn.href, document.body.appendChild(n), n;
  }
  function ge(t, n, e) {
    return new Promise((r, o) => {
      fe ? le ? c() : fe.addEventListener("load", () => {
        le = !0, c();
      }) : (fe = me(), fe.addEventListener("load", () => {
        le = !0, c();
      }));
    });
  }
  async function we(t) {
    if (Yn) throw new Error("init() should not be called from within an iframe.");
    return async function (t, n) {
      const r = re(t),
        o = await ge("init", t, {
          p: n
        });
      return null == o ? null : "string" == typeof o ? o : (r.cachedProof = o.cachedProof, D(o.cachedChatReq, o.cachedProof), r.cachedChatReq = null, r.lastFetchTime = 0, se(t, o.cachedChatReq), null);
    }(t, await P.getRequirementsToken());
  }
  async function ye(t) {
    if (Yn) throw new Error("token() should not be called from within an iframe.");
    const e = re(t),
      r = Date.now();
    if (!e.cachedChatReq || r - e.lastFetchTime > 54e4) {
      const r = await P.getRequirementsToken();
      e.cachedProof = r;
      const o = await ge("token", t, {
        p: r
      });
      if (typeof o === "string") return o;
      e.cachedChatReq = o.cachedChatReq, e.cachedProof = o.cachedProof, D(o.cachedChatReq, o.cachedProof), e.lastFetchTime = Date.now();
    }
    se(t, e.cachedChatReq);
    try {
      const r = await P.getEnforcementToken(e.cachedChatReq),
        o = ce({
          p: r,
          t: e.cachedChatReq?.["turnstile"]?.dx ? await _n(e.cachedChatReq, e.cachedChatReq.turnstile.dx) : null,
          c: e.cachedChatReq.token
        }, t);
      return e.cachedChatReq = null, setTimeout(async () => {
        const n = await P.getRequirementsToken();
        re(t).cachedProof = n, ge("init", t, {
          p: n
        });
      }, Xn), o;
    } catch (r) {
      const o = ce({
        e: r.message,
        p: e.cachedProof
      }, t);
      return e.cachedChatReq = null, o;
    }
  }
  return Yn ? function () {
    window.addEventListener("message", async n => {
      if (n.source === window) return;
      const {
        type: r,
        flow: o,
        requestId: i,
        p: c
      } = n.data ?? {};
      if ("init" !== r && r !== "token") return;
      const s = "string" == typeof o && o.length > 0 ? o : te;
      try {
        let t;
        r === "init" ? t = await ue(s, c) : "token" === r && (t = await async function (t, n) {
          const r = oe(t),
            o = Date.now();
          if (!r.cachedChatReq || o - r.lastFetchTime > 54e4 || r.cachedProof !== n) {
            const r = await Promise.race([ue(t, n), new Promise(r => setTimeout(() => r(ce({
              e: "elapsed",
              p: n
            }, t)), 4e3))]);
            if ("string" == typeof r) return r;
          }
          return r.lastFetchTime = 0, {
            cachedChatReq: r.cachedChatReq,
            cachedProof: r.cachedProof
          };
        }(s, c)), n.source?.["postMessage"]({
          type: "response",
          requestId: i,
          result: t
        }, {
          targetOrigin: n.origin
        });
      } catch (t) {
        n.source?.["postMessage"]({
          type: "response",
          requestId: i,
          error: t.message
        }, {
          targetOrigin: n.origin
        });
      }
    });
  }() : function () {
    window.addEventListener("message", n => {
      if (n.source === fe?.["contentWindow"]) {
        const {
          type: t,
          requestId: r,
          result: o,
          error: i
        } = n.data;
        if (t === "response" && r && de.has(r)) {
          const {
            resolve: t,
            reject: n
          } = de.get(r);
          i ? n(i) : t(o), de.delete(r);
        }
      }
    }), !fe && (fe = me(), fe.addEventListener("load", () => {
      le = !0;
    }));
  }(), function () {
    (!window?.["__sentinel_token_pending"] || 0 === window?.__sentinel_token_pending.length) && (window?.["__sentinel_init_pending"]?.["forEach"](({
      args: n,
      resolve: e
    }) => {
      we.apply(null, n).then(e);
    }), window.__sentinel_init_pending = []), window?.["__sentinel_token_pending"]?.["forEach"](({
      args: n,
      resolve: e
    }) => {
      ye.apply(null, n).then(e);
    }), window.__sentinel_token_pending = [];
  }(), t.init = we, t.sessionObserverToken = async function (t) {
    if (Yn) throw new Error("sessionObserverToken() should not be called from within an iframe.");
    const e = ne.get(t);
    if (!e) return null;
    const r = e.cachedSOChatReq;
    e.cachedSOChatReq = null, e.sessionObserverCollectorActive = !1;
    const o = await async function (t) {
      const e = qt(t);
      if (!t || !Pt(e) || !e?.["snapshot_dx"]) return null;
      try {
        return await Nt(e.snapshot_dx);
      } catch {
        return null;
      }
    }(r);
    return o ? r?.["token"] ? ce({
      so: o,
      c: r.token
    }, t) : o : null;
  }, t.token = ye, t;
}({});