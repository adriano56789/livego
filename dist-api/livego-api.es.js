var ye = Object.defineProperty;
var Ee = (t, e, i) => e in t ? ye(t, e, { enumerable: !0, configurable: !0, writable: !0, value: i }) : t[e] = i;
var P = (t, e, i) => Ee(t, typeof e != "symbol" ? e + "" : e, i);
import h from "react";
const ve = process.env.NODE_ENV === "production", _e = "https://livego.store", Te = ve ? _e : "", Pe = {
  /**
   * URL base para chamadas HTTP (fetch).
   * - Em Produção: 'https://livego.store/api'
   * - Em Desenvolvimento: '/api' (redirecionado pelo proxy do Vite para http://localhost:3000/api)
   */
  BASE_URL: `${Te}/api`
};
class we {
  constructor() {
    P(this, "logs", []);
    P(this, "failures", []);
    P(this, "listeners", []);
    P(this, "failureListeners", []);
    P(this, "nextId", 0);
  }
  addLog(e, i) {
    const r = `req-${this.nextId++}`, n = {
      id: r,
      method: e,
      endpoint: i,
      status: "Pending",
      startTime: Date.now()
    };
    return this.logs.unshift(n), this.logs.length > 100 && this.logs.pop(), this.notifyListeners(), r;
  }
  updateLog(e, i) {
    const r = this.logs.findIndex((n) => n.id === e);
    if (r > -1) {
      const n = this.logs[r];
      this.logs[r] = { ...n, ...i }, i.duration || (this.logs[r].duration = Date.now() - n.startTime), this.notifyListeners(), (i.status === "Error" || i.status === "Timeout") && (this.failures.some((a) => a.id === e) || (this.failures.unshift(this.logs[r]), this.notifyFailureListeners()));
    }
  }
  clearLogs() {
    this.logs = [], this.failures = [], this.notifyListeners(), this.notifyFailureListeners();
  }
  clearFailures() {
    this.failures = [], this.notifyFailureListeners();
  }
  getLogs() {
    return this.logs;
  }
  getFailures() {
    return this.failures;
  }
  subscribe(e) {
    return this.listeners.push(e), () => {
      this.listeners = this.listeners.filter((i) => i !== e);
    };
  }
  subscribeToFailures(e) {
    return this.failureListeners.push(e), () => {
      this.failureListeners = this.failureListeners.filter((i) => i !== e);
    };
  }
  notifyListeners() {
    for (const e of this.listeners)
      e([...this.logs]);
  }
  notifyFailureListeners() {
    for (const e of this.failureListeners)
      e([...this.failures]);
  }
}
const S = new we(), be = () => h.createElement("span", { className: "text-4xl" }, "🚀"), ke = () => h.createElement("span", { className: "text-4xl" }, "✈️"), Se = () => h.createElement("span", { className: "text-4xl" }, "💍"), Ae = () => h.createElement("span", { className: "text-4xl" }, "🦁"), Oe = () => h.createElement("span", { className: "text-4xl" }, "🏎️"), xe = () => h.createElement("span", { className: "text-4xl" }, "🦅"), Ce = () => h.createElement("span", { className: "text-4xl" }, "🚘"), Le = () => h.createElement("span", { className: "text-4xl" }, "🐉"), Be = () => h.createElement("span", { className: "text-4xl" }, "🏰"), Re = () => h.createElement("span", { className: "text-4xl" }, "🌌"), Ie = () => h.createElement("span", { className: "text-4xl" }, "🚁"), Ne = () => h.createElement("span", { className: "text-4xl" }, "🪐"), Ve = () => h.createElement("span", { className: "text-4xl" }, "🛥️"), Fe = () => h.createElement("span", { className: "text-4xl" }, "🌠"), De = () => h.createElement("span", { className: "text-4xl" }, "👑"), qe = () => h.createElement("span", { className: "text-4xl" }, "💎"), Ge = () => h.createElement("span", { className: "text-4xl" }, "🏝️"), $e = () => h.createElement("span", { className: "text-4xl" }, "🚔"), Ue = () => h.createElement("span", { className: "text-4xl" }, "🔥"), Me = () => h.createElement("span", { className: "text-4xl" }, "🐲");
h.createElement(be), h.createElement(ke), h.createElement(Se), h.createElement(Ae), h.createElement(Oe), h.createElement(xe), h.createElement(Ce), h.createElement(Le), h.createElement(Be), h.createElement(Re), h.createElement(Ie), h.createElement(Ne), h.createElement(Ve), h.createElement(Fe), h.createElement(De), h.createElement(qe), h.createElement(Ge), h.createElement($e), h.createElement(Ue), h.createElement(Me);
const He = {
  coverUrl: "https://picsum.photos/seed/default/800/1200",
  diamonds: 0,
  level: 1,
  xp: 0,
  isLive: !1,
  earnings: 0,
  earnings_withdrawn: 0,
  following: 0,
  fans: 0,
  gender: "not_specified",
  age: 18,
  location: "Brasil",
  obras: [],
  curtidas: [],
  ownedFrames: [],
  receptores: 0,
  enviados: 0,
  topFansAvatars: []
};
({ ...He }, (/* @__PURE__ */ new Date()).toISOString());
const _ = /* @__PURE__ */ Object.create(null);
_.open = "0";
_.close = "1";
_.ping = "2";
_.pong = "3";
_.message = "4";
_.upgrade = "5";
_.noop = "6";
const x = /* @__PURE__ */ Object.create(null);
Object.keys(_).forEach((t) => {
  x[_[t]] = t;
});
const $ = { type: "error", data: "parser error" }, re = typeof Blob == "function" || typeof Blob < "u" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]", ne = typeof ArrayBuffer == "function", se = (t) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(t) : t && t.buffer instanceof ArrayBuffer, W = ({ type: t, data: e }, i, r) => re && e instanceof Blob ? i ? r(e) : Z(e, r) : ne && (e instanceof ArrayBuffer || se(e)) ? i ? r(e) : Z(new Blob([e]), r) : r(_[t] + (e || "")), Z = (t, e) => {
  const i = new FileReader();
  return i.onload = function() {
    const r = i.result.split(",")[1];
    e("b" + (r || ""));
  }, i.readAsDataURL(t);
};
function ee(t) {
  return t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : new Uint8Array(t.buffer, t.byteOffset, t.byteLength);
}
let N;
function ze(t, e) {
  if (re && t.data instanceof Blob)
    return t.data.arrayBuffer().then(ee).then(e);
  if (ne && (t.data instanceof ArrayBuffer || se(t.data)))
    return e(ee(t.data));
  W(t, !1, (i) => {
    N || (N = new TextEncoder()), e(N.encode(i));
  });
}
const te = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", k = typeof Uint8Array > "u" ? [] : new Uint8Array(256);
for (let t = 0; t < te.length; t++)
  k[te.charCodeAt(t)] = t;
const Ke = (t) => {
  let e = t.length * 0.75, i = t.length, r, n = 0, o, a, c, u;
  t[t.length - 1] === "=" && (e--, t[t.length - 2] === "=" && e--);
  const p = new ArrayBuffer(e), d = new Uint8Array(p);
  for (r = 0; r < i; r += 4)
    o = k[t.charCodeAt(r)], a = k[t.charCodeAt(r + 1)], c = k[t.charCodeAt(r + 2)], u = k[t.charCodeAt(r + 3)], d[n++] = o << 2 | a >> 4, d[n++] = (a & 15) << 4 | c >> 2, d[n++] = (c & 3) << 6 | u & 63;
  return p;
}, We = typeof ArrayBuffer == "function", J = (t, e) => {
  if (typeof t != "string")
    return {
      type: "message",
      data: oe(t, e)
    };
  const i = t.charAt(0);
  return i === "b" ? {
    type: "message",
    data: Je(t.substring(1), e)
  } : x[i] ? t.length > 1 ? {
    type: x[i],
    data: t.substring(1)
  } : {
    type: x[i]
  } : $;
}, Je = (t, e) => {
  if (We) {
    const i = Ke(t);
    return oe(i, e);
  } else
    return { base64: !0, data: t };
}, oe = (t, e) => {
  switch (e) {
    case "blob":
      return t instanceof Blob ? t : new Blob([t]);
    case "arraybuffer":
    default:
      return t instanceof ArrayBuffer ? t : t.buffer;
  }
}, ae = "", Ye = (t, e) => {
  const i = t.length, r = new Array(i);
  let n = 0;
  t.forEach((o, a) => {
    W(o, !1, (c) => {
      r[a] = c, ++n === i && e(r.join(ae));
    });
  });
}, Qe = (t, e) => {
  const i = t.split(ae), r = [];
  for (let n = 0; n < i.length; n++) {
    const o = J(i[n], e);
    if (r.push(o), o.type === "error")
      break;
  }
  return r;
};
function Xe() {
  return new TransformStream({
    transform(t, e) {
      ze(t, (i) => {
        const r = i.length;
        let n;
        if (r < 126)
          n = new Uint8Array(1), new DataView(n.buffer).setUint8(0, r);
        else if (r < 65536) {
          n = new Uint8Array(3);
          const o = new DataView(n.buffer);
          o.setUint8(0, 126), o.setUint16(1, r);
        } else {
          n = new Uint8Array(9);
          const o = new DataView(n.buffer);
          o.setUint8(0, 127), o.setBigUint64(1, BigInt(r));
        }
        t.data && typeof t.data != "string" && (n[0] |= 128), e.enqueue(n), e.enqueue(i);
      });
    }
  });
}
let V;
function A(t) {
  return t.reduce((e, i) => e + i.length, 0);
}
function O(t, e) {
  if (t[0].length === e)
    return t.shift();
  const i = new Uint8Array(e);
  let r = 0;
  for (let n = 0; n < e; n++)
    i[n] = t[0][r++], r === t[0].length && (t.shift(), r = 0);
  return t.length && r < t[0].length && (t[0] = t[0].slice(r)), i;
}
function je(t, e) {
  V || (V = new TextDecoder());
  const i = [];
  let r = 0, n = -1, o = !1;
  return new TransformStream({
    transform(a, c) {
      for (i.push(a); ; ) {
        if (r === 0) {
          if (A(i) < 1)
            break;
          const u = O(i, 1);
          o = (u[0] & 128) === 128, n = u[0] & 127, n < 126 ? r = 3 : n === 126 ? r = 1 : r = 2;
        } else if (r === 1) {
          if (A(i) < 2)
            break;
          const u = O(i, 2);
          n = new DataView(u.buffer, u.byteOffset, u.length).getUint16(0), r = 3;
        } else if (r === 2) {
          if (A(i) < 8)
            break;
          const u = O(i, 8), p = new DataView(u.buffer, u.byteOffset, u.length), d = p.getUint32(0);
          if (d > Math.pow(2, 21) - 1) {
            c.enqueue($);
            break;
          }
          n = d * Math.pow(2, 32) + p.getUint32(4), r = 3;
        } else {
          if (A(i) < n)
            break;
          const u = O(i, n);
          c.enqueue(J(o ? u : V.decode(u), e)), r = 0;
        }
        if (n === 0 || n > t) {
          c.enqueue($);
          break;
        }
      }
    }
  });
}
const ce = 4;
function f(t) {
  if (t) return Ze(t);
}
function Ze(t) {
  for (var e in f.prototype)
    t[e] = f.prototype[e];
  return t;
}
f.prototype.on = f.prototype.addEventListener = function(t, e) {
  return this._callbacks = this._callbacks || {}, (this._callbacks["$" + t] = this._callbacks["$" + t] || []).push(e), this;
};
f.prototype.once = function(t, e) {
  function i() {
    this.off(t, i), e.apply(this, arguments);
  }
  return i.fn = e, this.on(t, i), this;
};
f.prototype.off = f.prototype.removeListener = f.prototype.removeAllListeners = f.prototype.removeEventListener = function(t, e) {
  if (this._callbacks = this._callbacks || {}, arguments.length == 0)
    return this._callbacks = {}, this;
  var i = this._callbacks["$" + t];
  if (!i) return this;
  if (arguments.length == 1)
    return delete this._callbacks["$" + t], this;
  for (var r, n = 0; n < i.length; n++)
    if (r = i[n], r === e || r.fn === e) {
      i.splice(n, 1);
      break;
    }
  return i.length === 0 && delete this._callbacks["$" + t], this;
};
f.prototype.emit = function(t) {
  this._callbacks = this._callbacks || {};
  for (var e = new Array(arguments.length - 1), i = this._callbacks["$" + t], r = 1; r < arguments.length; r++)
    e[r - 1] = arguments[r];
  if (i) {
    i = i.slice(0);
    for (var r = 0, n = i.length; r < n; ++r)
      i[r].apply(this, e);
  }
  return this;
};
f.prototype.emitReserved = f.prototype.emit;
f.prototype.listeners = function(t) {
  return this._callbacks = this._callbacks || {}, this._callbacks["$" + t] || [];
};
f.prototype.hasListeners = function(t) {
  return !!this.listeners(t).length;
};
const R = typeof Promise == "function" && typeof Promise.resolve == "function" ? (e) => Promise.resolve().then(e) : (e, i) => i(e, 0), g = typeof self < "u" ? self : typeof window < "u" ? window : Function("return this")(), et = "arraybuffer";
function he(t, ...e) {
  return e.reduce((i, r) => (t.hasOwnProperty(r) && (i[r] = t[r]), i), {});
}
const tt = g.setTimeout, it = g.clearTimeout;
function I(t, e) {
  e.useNativeTimers ? (t.setTimeoutFn = tt.bind(g), t.clearTimeoutFn = it.bind(g)) : (t.setTimeoutFn = g.setTimeout.bind(g), t.clearTimeoutFn = g.clearTimeout.bind(g));
}
const rt = 1.33;
function nt(t) {
  return typeof t == "string" ? st(t) : Math.ceil((t.byteLength || t.size) * rt);
}
function st(t) {
  let e = 0, i = 0;
  for (let r = 0, n = t.length; r < n; r++)
    e = t.charCodeAt(r), e < 128 ? i += 1 : e < 2048 ? i += 2 : e < 55296 || e >= 57344 ? i += 3 : (r++, i += 4);
  return i;
}
function le() {
  return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
}
function ot(t) {
  let e = "";
  for (let i in t)
    t.hasOwnProperty(i) && (e.length && (e += "&"), e += encodeURIComponent(i) + "=" + encodeURIComponent(t[i]));
  return e;
}
function at(t) {
  let e = {}, i = t.split("&");
  for (let r = 0, n = i.length; r < n; r++) {
    let o = i[r].split("=");
    e[decodeURIComponent(o[0])] = decodeURIComponent(o[1]);
  }
  return e;
}
class ct extends Error {
  constructor(e, i, r) {
    super(e), this.description = i, this.context = r, this.type = "TransportError";
  }
}
class Y extends f {
  /**
   * Transport abstract constructor.
   *
   * @param {Object} opts - options
   * @protected
   */
  constructor(e) {
    super(), this.writable = !1, I(this, e), this.opts = e, this.query = e.query, this.socket = e.socket, this.supportsBinary = !e.forceBase64;
  }
  /**
   * Emits an error.
   *
   * @param {String} reason
   * @param description
   * @param context - the error context
   * @return {Transport} for chaining
   * @protected
   */
  onError(e, i, r) {
    return super.emitReserved("error", new ct(e, i, r)), this;
  }
  /**
   * Opens the transport.
   */
  open() {
    return this.readyState = "opening", this.doOpen(), this;
  }
  /**
   * Closes the transport.
   */
  close() {
    return (this.readyState === "opening" || this.readyState === "open") && (this.doClose(), this.onClose()), this;
  }
  /**
   * Sends multiple packets.
   *
   * @param {Array} packets
   */
  send(e) {
    this.readyState === "open" && this.write(e);
  }
  /**
   * Called upon open
   *
   * @protected
   */
  onOpen() {
    this.readyState = "open", this.writable = !0, super.emitReserved("open");
  }
  /**
   * Called with data.
   *
   * @param {String} data
   * @protected
   */
  onData(e) {
    const i = J(e, this.socket.binaryType);
    this.onPacket(i);
  }
  /**
   * Called with a decoded packet.
   *
   * @protected
   */
  onPacket(e) {
    super.emitReserved("packet", e);
  }
  /**
   * Called upon close.
   *
   * @protected
   */
  onClose(e) {
    this.readyState = "closed", super.emitReserved("close", e);
  }
  /**
   * Pauses the transport, in order not to lose packets during an upgrade.
   *
   * @param onPause
   */
  pause(e) {
  }
  createUri(e, i = {}) {
    return e + "://" + this._hostname() + this._port() + this.opts.path + this._query(i);
  }
  _hostname() {
    const e = this.opts.hostname;
    return e.indexOf(":") === -1 ? e : "[" + e + "]";
  }
  _port() {
    return this.opts.port && (this.opts.secure && Number(this.opts.port) !== 443 || !this.opts.secure && Number(this.opts.port) !== 80) ? ":" + this.opts.port : "";
  }
  _query(e) {
    const i = ot(e);
    return i.length ? "?" + i : "";
  }
}
class ht extends Y {
  constructor() {
    super(...arguments), this._polling = !1;
  }
  get name() {
    return "polling";
  }
  /**
   * Opens the socket (triggers polling). We write a PING message to determine
   * when the transport is open.
   *
   * @protected
   */
  doOpen() {
    this._poll();
  }
  /**
   * Pauses polling.
   *
   * @param {Function} onPause - callback upon buffers are flushed and transport is paused
   * @package
   */
  pause(e) {
    this.readyState = "pausing";
    const i = () => {
      this.readyState = "paused", e();
    };
    if (this._polling || !this.writable) {
      let r = 0;
      this._polling && (r++, this.once("pollComplete", function() {
        --r || i();
      })), this.writable || (r++, this.once("drain", function() {
        --r || i();
      }));
    } else
      i();
  }
  /**
   * Starts polling cycle.
   *
   * @private
   */
  _poll() {
    this._polling = !0, this.doPoll(), this.emitReserved("poll");
  }
  /**
   * Overloads onData to detect payloads.
   *
   * @protected
   */
  onData(e) {
    const i = (r) => {
      if (this.readyState === "opening" && r.type === "open" && this.onOpen(), r.type === "close")
        return this.onClose({ description: "transport closed by the server" }), !1;
      this.onPacket(r);
    };
    Qe(e, this.socket.binaryType).forEach(i), this.readyState !== "closed" && (this._polling = !1, this.emitReserved("pollComplete"), this.readyState === "open" && this._poll());
  }
  /**
   * For polling, send a close packet.
   *
   * @protected
   */
  doClose() {
    const e = () => {
      this.write([{ type: "close" }]);
    };
    this.readyState === "open" ? e() : this.once("open", e);
  }
  /**
   * Writes a packets payload.
   *
   * @param {Array} packets - data packets
   * @protected
   */
  write(e) {
    this.writable = !1, Ye(e, (i) => {
      this.doWrite(i, () => {
        this.writable = !0, this.emitReserved("drain");
      });
    });
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const e = this.opts.secure ? "https" : "http", i = this.query || {};
    return this.opts.timestampRequests !== !1 && (i[this.opts.timestampParam] = le()), !this.supportsBinary && !i.sid && (i.b64 = 1), this.createUri(e, i);
  }
}
let ue = !1;
try {
  ue = typeof XMLHttpRequest < "u" && "withCredentials" in new XMLHttpRequest();
} catch {
}
const lt = ue;
function ut() {
}
class ft extends ht {
  /**
   * XHR Polling constructor.
   *
   * @param {Object} opts
   * @package
   */
  constructor(e) {
    if (super(e), typeof location < "u") {
      const i = location.protocol === "https:";
      let r = location.port;
      r || (r = i ? "443" : "80"), this.xd = typeof location < "u" && e.hostname !== location.hostname || r !== e.port;
    }
  }
  /**
   * Sends data.
   *
   * @param {String} data to send.
   * @param {Function} called upon flush.
   * @private
   */
  doWrite(e, i) {
    const r = this.request({
      method: "POST",
      data: e
    });
    r.on("success", i), r.on("error", (n, o) => {
      this.onError("xhr post error", n, o);
    });
  }
  /**
   * Starts a poll cycle.
   *
   * @private
   */
  doPoll() {
    const e = this.request();
    e.on("data", this.onData.bind(this)), e.on("error", (i, r) => {
      this.onError("xhr poll error", i, r);
    }), this.pollXhr = e;
  }
}
class v extends f {
  /**
   * Request constructor
   *
   * @param {Object} options
   * @package
   */
  constructor(e, i, r) {
    super(), this.createRequest = e, I(this, r), this._opts = r, this._method = r.method || "GET", this._uri = i, this._data = r.data !== void 0 ? r.data : null, this._create();
  }
  /**
   * Creates the XHR object and sends the request.
   *
   * @private
   */
  _create() {
    var e;
    const i = he(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
    i.xdomain = !!this._opts.xd;
    const r = this._xhr = this.createRequest(i);
    try {
      r.open(this._method, this._uri, !0);
      try {
        if (this._opts.extraHeaders) {
          r.setDisableHeaderCheck && r.setDisableHeaderCheck(!0);
          for (let n in this._opts.extraHeaders)
            this._opts.extraHeaders.hasOwnProperty(n) && r.setRequestHeader(n, this._opts.extraHeaders[n]);
        }
      } catch {
      }
      if (this._method === "POST")
        try {
          r.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
        } catch {
        }
      try {
        r.setRequestHeader("Accept", "*/*");
      } catch {
      }
      (e = this._opts.cookieJar) === null || e === void 0 || e.addCookies(r), "withCredentials" in r && (r.withCredentials = this._opts.withCredentials), this._opts.requestTimeout && (r.timeout = this._opts.requestTimeout), r.onreadystatechange = () => {
        var n;
        r.readyState === 3 && ((n = this._opts.cookieJar) === null || n === void 0 || n.parseCookies(
          // @ts-ignore
          r.getResponseHeader("set-cookie")
        )), r.readyState === 4 && (r.status === 200 || r.status === 1223 ? this._onLoad() : this.setTimeoutFn(() => {
          this._onError(typeof r.status == "number" ? r.status : 0);
        }, 0));
      }, r.send(this._data);
    } catch (n) {
      this.setTimeoutFn(() => {
        this._onError(n);
      }, 0);
      return;
    }
    typeof document < "u" && (this._index = v.requestsCount++, v.requests[this._index] = this);
  }
  /**
   * Called upon error.
   *
   * @private
   */
  _onError(e) {
    this.emitReserved("error", e, this._xhr), this._cleanup(!0);
  }
  /**
   * Cleans up house.
   *
   * @private
   */
  _cleanup(e) {
    if (!(typeof this._xhr > "u" || this._xhr === null)) {
      if (this._xhr.onreadystatechange = ut, e)
        try {
          this._xhr.abort();
        } catch {
        }
      typeof document < "u" && delete v.requests[this._index], this._xhr = null;
    }
  }
  /**
   * Called upon load.
   *
   * @private
   */
  _onLoad() {
    const e = this._xhr.responseText;
    e !== null && (this.emitReserved("data", e), this.emitReserved("success"), this._cleanup());
  }
  /**
   * Aborts the request.
   *
   * @package
   */
  abort() {
    this._cleanup();
  }
}
v.requestsCount = 0;
v.requests = {};
if (typeof document < "u") {
  if (typeof attachEvent == "function")
    attachEvent("onunload", ie);
  else if (typeof addEventListener == "function") {
    const t = "onpagehide" in g ? "pagehide" : "unload";
    addEventListener(t, ie, !1);
  }
}
function ie() {
  for (let t in v.requests)
    v.requests.hasOwnProperty(t) && v.requests[t].abort();
}
const dt = (function() {
  const t = fe({
    xdomain: !1
  });
  return t && t.responseType !== null;
})();
class pt extends ft {
  constructor(e) {
    super(e);
    const i = e && e.forceBase64;
    this.supportsBinary = dt && !i;
  }
  request(e = {}) {
    return Object.assign(e, { xd: this.xd }, this.opts), new v(fe, this.uri(), e);
  }
}
function fe(t) {
  const e = t.xdomain;
  try {
    if (typeof XMLHttpRequest < "u" && (!e || lt))
      return new XMLHttpRequest();
  } catch {
  }
  if (!e)
    try {
      return new g[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch {
    }
}
const de = typeof navigator < "u" && typeof navigator.product == "string" && navigator.product.toLowerCase() === "reactnative";
class gt extends Y {
  get name() {
    return "websocket";
  }
  doOpen() {
    const e = this.uri(), i = this.opts.protocols, r = de ? {} : he(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
    this.opts.extraHeaders && (r.headers = this.opts.extraHeaders);
    try {
      this.ws = this.createSocket(e, i, r);
    } catch (n) {
      return this.emitReserved("error", n);
    }
    this.ws.binaryType = this.socket.binaryType, this.addEventListeners();
  }
  /**
   * Adds event listeners to the socket
   *
   * @private
   */
  addEventListeners() {
    this.ws.onopen = () => {
      this.opts.autoUnref && this.ws._socket.unref(), this.onOpen();
    }, this.ws.onclose = (e) => this.onClose({
      description: "websocket connection closed",
      context: e
    }), this.ws.onmessage = (e) => this.onData(e.data), this.ws.onerror = (e) => this.onError("websocket error", e);
  }
  write(e) {
    this.writable = !1;
    for (let i = 0; i < e.length; i++) {
      const r = e[i], n = i === e.length - 1;
      W(r, this.supportsBinary, (o) => {
        try {
          this.doWrite(r, o);
        } catch {
        }
        n && R(() => {
          this.writable = !0, this.emitReserved("drain");
        }, this.setTimeoutFn);
      });
    }
  }
  doClose() {
    typeof this.ws < "u" && (this.ws.onerror = () => {
    }, this.ws.close(), this.ws = null);
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const e = this.opts.secure ? "wss" : "ws", i = this.query || {};
    return this.opts.timestampRequests && (i[this.opts.timestampParam] = le()), this.supportsBinary || (i.b64 = 1), this.createUri(e, i);
  }
}
const F = g.WebSocket || g.MozWebSocket;
class mt extends gt {
  createSocket(e, i, r) {
    return de ? new F(e, i, r) : i ? new F(e, i) : new F(e);
  }
  doWrite(e, i) {
    this.ws.send(i);
  }
}
class yt extends Y {
  get name() {
    return "webtransport";
  }
  doOpen() {
    try {
      this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
    } catch (e) {
      return this.emitReserved("error", e);
    }
    this._transport.closed.then(() => {
      this.onClose();
    }).catch((e) => {
      this.onError("webtransport error", e);
    }), this._transport.ready.then(() => {
      this._transport.createBidirectionalStream().then((e) => {
        const i = je(Number.MAX_SAFE_INTEGER, this.socket.binaryType), r = e.readable.pipeThrough(i).getReader(), n = Xe();
        n.readable.pipeTo(e.writable), this._writer = n.writable.getWriter();
        const o = () => {
          r.read().then(({ done: c, value: u }) => {
            c || (this.onPacket(u), o());
          }).catch((c) => {
          });
        };
        o();
        const a = { type: "open" };
        this.query.sid && (a.data = `{"sid":"${this.query.sid}"}`), this._writer.write(a).then(() => this.onOpen());
      });
    });
  }
  write(e) {
    this.writable = !1;
    for (let i = 0; i < e.length; i++) {
      const r = e[i], n = i === e.length - 1;
      this._writer.write(r).then(() => {
        n && R(() => {
          this.writable = !0, this.emitReserved("drain");
        }, this.setTimeoutFn);
      });
    }
  }
  doClose() {
    var e;
    (e = this._transport) === null || e === void 0 || e.close();
  }
}
const Et = {
  websocket: mt,
  webtransport: yt,
  polling: pt
}, vt = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, _t = [
  "source",
  "protocol",
  "authority",
  "userInfo",
  "user",
  "password",
  "host",
  "port",
  "relative",
  "path",
  "directory",
  "file",
  "query",
  "anchor"
];
function U(t) {
  if (t.length > 8e3)
    throw "URI too long";
  const e = t, i = t.indexOf("["), r = t.indexOf("]");
  i != -1 && r != -1 && (t = t.substring(0, i) + t.substring(i, r).replace(/:/g, ";") + t.substring(r, t.length));
  let n = vt.exec(t || ""), o = {}, a = 14;
  for (; a--; )
    o[_t[a]] = n[a] || "";
  return i != -1 && r != -1 && (o.source = e, o.host = o.host.substring(1, o.host.length - 1).replace(/;/g, ":"), o.authority = o.authority.replace("[", "").replace("]", "").replace(/;/g, ":"), o.ipv6uri = !0), o.pathNames = Tt(o, o.path), o.queryKey = Pt(o, o.query), o;
}
function Tt(t, e) {
  const i = /\/{2,9}/g, r = e.replace(i, "/").split("/");
  return (e.slice(0, 1) == "/" || e.length === 0) && r.splice(0, 1), e.slice(-1) == "/" && r.splice(r.length - 1, 1), r;
}
function Pt(t, e) {
  const i = {};
  return e.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function(r, n, o) {
    n && (i[n] = o);
  }), i;
}
const M = typeof addEventListener == "function" && typeof removeEventListener == "function", C = [];
M && addEventListener("offline", () => {
  C.forEach((t) => t());
}, !1);
class T extends f {
  /**
   * Socket constructor.
   *
   * @param {String|Object} uri - uri or options
   * @param {Object} opts - options
   */
  constructor(e, i) {
    if (super(), this.binaryType = et, this.writeBuffer = [], this._prevBufferLen = 0, this._pingInterval = -1, this._pingTimeout = -1, this._maxPayload = -1, this._pingTimeoutTime = 1 / 0, e && typeof e == "object" && (i = e, e = null), e) {
      const r = U(e);
      i.hostname = r.host, i.secure = r.protocol === "https" || r.protocol === "wss", i.port = r.port, r.query && (i.query = r.query);
    } else i.host && (i.hostname = U(i.host).host);
    I(this, i), this.secure = i.secure != null ? i.secure : typeof location < "u" && location.protocol === "https:", i.hostname && !i.port && (i.port = this.secure ? "443" : "80"), this.hostname = i.hostname || (typeof location < "u" ? location.hostname : "localhost"), this.port = i.port || (typeof location < "u" && location.port ? location.port : this.secure ? "443" : "80"), this.transports = [], this._transportsByName = {}, i.transports.forEach((r) => {
      const n = r.prototype.name;
      this.transports.push(n), this._transportsByName[n] = r;
    }), this.opts = Object.assign({
      path: "/engine.io",
      agent: !1,
      withCredentials: !1,
      upgrade: !0,
      timestampParam: "t",
      rememberUpgrade: !1,
      addTrailingSlash: !0,
      rejectUnauthorized: !0,
      perMessageDeflate: {
        threshold: 1024
      },
      transportOptions: {},
      closeOnBeforeunload: !1
    }, i), this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : ""), typeof this.opts.query == "string" && (this.opts.query = at(this.opts.query)), M && (this.opts.closeOnBeforeunload && (this._beforeunloadEventListener = () => {
      this.transport && (this.transport.removeAllListeners(), this.transport.close());
    }, addEventListener("beforeunload", this._beforeunloadEventListener, !1)), this.hostname !== "localhost" && (this._offlineEventListener = () => {
      this._onClose("transport close", {
        description: "network connection lost"
      });
    }, C.push(this._offlineEventListener))), this.opts.withCredentials && (this._cookieJar = void 0), this._open();
  }
  /**
   * Creates transport of the given type.
   *
   * @param {String} name - transport name
   * @return {Transport}
   * @private
   */
  createTransport(e) {
    const i = Object.assign({}, this.opts.query);
    i.EIO = ce, i.transport = e, this.id && (i.sid = this.id);
    const r = Object.assign({}, this.opts, {
      query: i,
      socket: this,
      hostname: this.hostname,
      secure: this.secure,
      port: this.port
    }, this.opts.transportOptions[e]);
    return new this._transportsByName[e](r);
  }
  /**
   * Initializes transport to use and starts probe.
   *
   * @private
   */
  _open() {
    if (this.transports.length === 0) {
      this.setTimeoutFn(() => {
        this.emitReserved("error", "No transports available");
      }, 0);
      return;
    }
    const e = this.opts.rememberUpgrade && T.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
    this.readyState = "opening";
    const i = this.createTransport(e);
    i.open(), this.setTransport(i);
  }
  /**
   * Sets the current transport. Disables the existing one (if any).
   *
   * @private
   */
  setTransport(e) {
    this.transport && this.transport.removeAllListeners(), this.transport = e, e.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", (i) => this._onClose("transport close", i));
  }
  /**
   * Called when connection is deemed open.
   *
   * @private
   */
  onOpen() {
    this.readyState = "open", T.priorWebsocketSuccess = this.transport.name === "websocket", this.emitReserved("open"), this.flush();
  }
  /**
   * Handles a packet.
   *
   * @private
   */
  _onPacket(e) {
    if (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing")
      switch (this.emitReserved("packet", e), this.emitReserved("heartbeat"), e.type) {
        case "open":
          this.onHandshake(JSON.parse(e.data));
          break;
        case "ping":
          this._sendPacket("pong"), this.emitReserved("ping"), this.emitReserved("pong"), this._resetPingTimeout();
          break;
        case "error":
          const i = new Error("server error");
          i.code = e.data, this._onError(i);
          break;
        case "message":
          this.emitReserved("data", e.data), this.emitReserved("message", e.data);
          break;
      }
  }
  /**
   * Called upon handshake completion.
   *
   * @param {Object} data - handshake obj
   * @private
   */
  onHandshake(e) {
    this.emitReserved("handshake", e), this.id = e.sid, this.transport.query.sid = e.sid, this._pingInterval = e.pingInterval, this._pingTimeout = e.pingTimeout, this._maxPayload = e.maxPayload, this.onOpen(), this.readyState !== "closed" && this._resetPingTimeout();
  }
  /**
   * Sets and resets ping timeout timer based on server pings.
   *
   * @private
   */
  _resetPingTimeout() {
    this.clearTimeoutFn(this._pingTimeoutTimer);
    const e = this._pingInterval + this._pingTimeout;
    this._pingTimeoutTime = Date.now() + e, this._pingTimeoutTimer = this.setTimeoutFn(() => {
      this._onClose("ping timeout");
    }, e), this.opts.autoUnref && this._pingTimeoutTimer.unref();
  }
  /**
   * Called on `drain` event
   *
   * @private
   */
  _onDrain() {
    this.writeBuffer.splice(0, this._prevBufferLen), this._prevBufferLen = 0, this.writeBuffer.length === 0 ? this.emitReserved("drain") : this.flush();
  }
  /**
   * Flush write buffers.
   *
   * @private
   */
  flush() {
    if (this.readyState !== "closed" && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
      const e = this._getWritablePackets();
      this.transport.send(e), this._prevBufferLen = e.length, this.emitReserved("flush");
    }
  }
  /**
   * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
   * long-polling)
   *
   * @private
   */
  _getWritablePackets() {
    if (!(this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1))
      return this.writeBuffer;
    let i = 1;
    for (let r = 0; r < this.writeBuffer.length; r++) {
      const n = this.writeBuffer[r].data;
      if (n && (i += nt(n)), r > 0 && i > this._maxPayload)
        return this.writeBuffer.slice(0, r);
      i += 2;
    }
    return this.writeBuffer;
  }
  /**
   * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
   *
   * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
   * `write()` method then the message would not be buffered by the Socket.IO client.
   *
   * @return {boolean}
   * @private
   */
  /* private */
  _hasPingExpired() {
    if (!this._pingTimeoutTime)
      return !0;
    const e = Date.now() > this._pingTimeoutTime;
    return e && (this._pingTimeoutTime = 0, R(() => {
      this._onClose("ping timeout");
    }, this.setTimeoutFn)), e;
  }
  /**
   * Sends a message.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  write(e, i, r) {
    return this._sendPacket("message", e, i, r), this;
  }
  /**
   * Sends a message. Alias of {@link Socket#write}.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  send(e, i, r) {
    return this._sendPacket("message", e, i, r), this;
  }
  /**
   * Sends a packet.
   *
   * @param {String} type: packet type.
   * @param {String} data.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @private
   */
  _sendPacket(e, i, r, n) {
    if (typeof i == "function" && (n = i, i = void 0), typeof r == "function" && (n = r, r = null), this.readyState === "closing" || this.readyState === "closed")
      return;
    r = r || {}, r.compress = r.compress !== !1;
    const o = {
      type: e,
      data: i,
      options: r
    };
    this.emitReserved("packetCreate", o), this.writeBuffer.push(o), n && this.once("flush", n), this.flush();
  }
  /**
   * Closes the connection.
   */
  close() {
    const e = () => {
      this._onClose("forced close"), this.transport.close();
    }, i = () => {
      this.off("upgrade", i), this.off("upgradeError", i), e();
    }, r = () => {
      this.once("upgrade", i), this.once("upgradeError", i);
    };
    return (this.readyState === "opening" || this.readyState === "open") && (this.readyState = "closing", this.writeBuffer.length ? this.once("drain", () => {
      this.upgrading ? r() : e();
    }) : this.upgrading ? r() : e()), this;
  }
  /**
   * Called upon transport error
   *
   * @private
   */
  _onError(e) {
    if (T.priorWebsocketSuccess = !1, this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening")
      return this.transports.shift(), this._open();
    this.emitReserved("error", e), this._onClose("transport error", e);
  }
  /**
   * Called upon transport close.
   *
   * @private
   */
  _onClose(e, i) {
    if (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing") {
      if (this.clearTimeoutFn(this._pingTimeoutTimer), this.transport.removeAllListeners("close"), this.transport.close(), this.transport.removeAllListeners(), M && (this._beforeunloadEventListener && removeEventListener("beforeunload", this._beforeunloadEventListener, !1), this._offlineEventListener)) {
        const r = C.indexOf(this._offlineEventListener);
        r !== -1 && C.splice(r, 1);
      }
      this.readyState = "closed", this.id = null, this.emitReserved("close", e, i), this.writeBuffer = [], this._prevBufferLen = 0;
    }
  }
}
T.protocol = ce;
class wt extends T {
  constructor() {
    super(...arguments), this._upgrades = [];
  }
  onOpen() {
    if (super.onOpen(), this.readyState === "open" && this.opts.upgrade)
      for (let e = 0; e < this._upgrades.length; e++)
        this._probe(this._upgrades[e]);
  }
  /**
   * Probes a transport.
   *
   * @param {String} name - transport name
   * @private
   */
  _probe(e) {
    let i = this.createTransport(e), r = !1;
    T.priorWebsocketSuccess = !1;
    const n = () => {
      r || (i.send([{ type: "ping", data: "probe" }]), i.once("packet", (m) => {
        if (!r)
          if (m.type === "pong" && m.data === "probe") {
            if (this.upgrading = !0, this.emitReserved("upgrading", i), !i)
              return;
            T.priorWebsocketSuccess = i.name === "websocket", this.transport.pause(() => {
              r || this.readyState !== "closed" && (d(), this.setTransport(i), i.send([{ type: "upgrade" }]), this.emitReserved("upgrade", i), i = null, this.upgrading = !1, this.flush());
            });
          } else {
            const E = new Error("probe error");
            E.transport = i.name, this.emitReserved("upgradeError", E);
          }
      }));
    };
    function o() {
      r || (r = !0, d(), i.close(), i = null);
    }
    const a = (m) => {
      const E = new Error("probe error: " + m);
      E.transport = i.name, o(), this.emitReserved("upgradeError", E);
    };
    function c() {
      a("transport closed");
    }
    function u() {
      a("socket closed");
    }
    function p(m) {
      i && m.name !== i.name && o();
    }
    const d = () => {
      i.removeListener("open", n), i.removeListener("error", a), i.removeListener("close", c), this.off("close", u), this.off("upgrading", p);
    };
    i.once("open", n), i.once("error", a), i.once("close", c), this.once("close", u), this.once("upgrading", p), this._upgrades.indexOf("webtransport") !== -1 && e !== "webtransport" ? this.setTimeoutFn(() => {
      r || i.open();
    }, 200) : i.open();
  }
  onHandshake(e) {
    this._upgrades = this._filterUpgrades(e.upgrades), super.onHandshake(e);
  }
  /**
   * Filters upgrades, returning only those matching client transports.
   *
   * @param {Array} upgrades - server upgrades
   * @private
   */
  _filterUpgrades(e) {
    const i = [];
    for (let r = 0; r < e.length; r++)
      ~this.transports.indexOf(e[r]) && i.push(e[r]);
    return i;
  }
}
let bt = class extends wt {
  constructor(e, i = {}) {
    const r = typeof e == "object" ? e : i;
    (!r.transports || r.transports && typeof r.transports[0] == "string") && (r.transports = (r.transports || ["polling", "websocket", "webtransport"]).map((n) => Et[n]).filter((n) => !!n)), super(e, r);
  }
};
function kt(t, e = "", i) {
  let r = t;
  i = i || typeof location < "u" && location, t == null && (t = i.protocol + "//" + i.host), typeof t == "string" && (t.charAt(0) === "/" && (t.charAt(1) === "/" ? t = i.protocol + t : t = i.host + t), /^(https?|wss?):\/\//.test(t) || (typeof i < "u" ? t = i.protocol + "//" + t : t = "https://" + t), r = U(t)), r.port || (/^(http|ws)$/.test(r.protocol) ? r.port = "80" : /^(http|ws)s$/.test(r.protocol) && (r.port = "443")), r.path = r.path || "/";
  const o = r.host.indexOf(":") !== -1 ? "[" + r.host + "]" : r.host;
  return r.id = r.protocol + "://" + o + ":" + r.port + e, r.href = r.protocol + "://" + o + (i && i.port === r.port ? "" : ":" + r.port), r;
}
const St = typeof ArrayBuffer == "function", At = (t) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(t) : t.buffer instanceof ArrayBuffer, pe = Object.prototype.toString, Ot = typeof Blob == "function" || typeof Blob < "u" && pe.call(Blob) === "[object BlobConstructor]", xt = typeof File == "function" || typeof File < "u" && pe.call(File) === "[object FileConstructor]";
function Q(t) {
  return St && (t instanceof ArrayBuffer || At(t)) || Ot && t instanceof Blob || xt && t instanceof File;
}
function L(t, e) {
  if (!t || typeof t != "object")
    return !1;
  if (Array.isArray(t)) {
    for (let i = 0, r = t.length; i < r; i++)
      if (L(t[i]))
        return !0;
    return !1;
  }
  if (Q(t))
    return !0;
  if (t.toJSON && typeof t.toJSON == "function" && arguments.length === 1)
    return L(t.toJSON(), !0);
  for (const i in t)
    if (Object.prototype.hasOwnProperty.call(t, i) && L(t[i]))
      return !0;
  return !1;
}
function Ct(t) {
  const e = [], i = t.data, r = t;
  return r.data = H(i, e), r.attachments = e.length, { packet: r, buffers: e };
}
function H(t, e) {
  if (!t)
    return t;
  if (Q(t)) {
    const i = { _placeholder: !0, num: e.length };
    return e.push(t), i;
  } else if (Array.isArray(t)) {
    const i = new Array(t.length);
    for (let r = 0; r < t.length; r++)
      i[r] = H(t[r], e);
    return i;
  } else if (typeof t == "object" && !(t instanceof Date)) {
    const i = {};
    for (const r in t)
      Object.prototype.hasOwnProperty.call(t, r) && (i[r] = H(t[r], e));
    return i;
  }
  return t;
}
function Lt(t, e) {
  return t.data = z(t.data, e), delete t.attachments, t;
}
function z(t, e) {
  if (!t)
    return t;
  if (t && t._placeholder === !0) {
    if (typeof t.num == "number" && t.num >= 0 && t.num < e.length)
      return e[t.num];
    throw new Error("illegal attachments");
  } else if (Array.isArray(t))
    for (let i = 0; i < t.length; i++)
      t[i] = z(t[i], e);
  else if (typeof t == "object")
    for (const i in t)
      Object.prototype.hasOwnProperty.call(t, i) && (t[i] = z(t[i], e));
  return t;
}
const ge = [
  "connect",
  // used on the client side
  "connect_error",
  // used on the client side
  "disconnect",
  // used on both sides
  "disconnecting",
  // used on the server side
  "newListener",
  // used by the Node.js EventEmitter
  "removeListener"
  // used by the Node.js EventEmitter
], Bt = 5;
var l;
(function(t) {
  t[t.CONNECT = 0] = "CONNECT", t[t.DISCONNECT = 1] = "DISCONNECT", t[t.EVENT = 2] = "EVENT", t[t.ACK = 3] = "ACK", t[t.CONNECT_ERROR = 4] = "CONNECT_ERROR", t[t.BINARY_EVENT = 5] = "BINARY_EVENT", t[t.BINARY_ACK = 6] = "BINARY_ACK";
})(l || (l = {}));
class Rt {
  /**
   * Encoder constructor
   *
   * @param {function} replacer - custom replacer to pass down to JSON.parse
   */
  constructor(e) {
    this.replacer = e;
  }
  /**
   * Encode a packet as a single string if non-binary, or as a
   * buffer sequence, depending on packet type.
   *
   * @param {Object} obj - packet object
   */
  encode(e) {
    return (e.type === l.EVENT || e.type === l.ACK) && L(e) ? this.encodeAsBinary({
      type: e.type === l.EVENT ? l.BINARY_EVENT : l.BINARY_ACK,
      nsp: e.nsp,
      data: e.data,
      id: e.id
    }) : [this.encodeAsString(e)];
  }
  /**
   * Encode packet as string.
   */
  encodeAsString(e) {
    let i = "" + e.type;
    return (e.type === l.BINARY_EVENT || e.type === l.BINARY_ACK) && (i += e.attachments + "-"), e.nsp && e.nsp !== "/" && (i += e.nsp + ","), e.id != null && (i += e.id), e.data != null && (i += JSON.stringify(e.data, this.replacer)), i;
  }
  /**
   * Encode packet as 'buffer sequence' by removing blobs, and
   * deconstructing packet into object with placeholders and
   * a list of buffers.
   */
  encodeAsBinary(e) {
    const i = Ct(e), r = this.encodeAsString(i.packet), n = i.buffers;
    return n.unshift(r), n;
  }
}
class X extends f {
  /**
   * Decoder constructor
   *
   * @param {function} reviver - custom reviver to pass down to JSON.stringify
   */
  constructor(e) {
    super(), this.reviver = e;
  }
  /**
   * Decodes an encoded packet string into packet JSON.
   *
   * @param {String} obj - encoded packet
   */
  add(e) {
    let i;
    if (typeof e == "string") {
      if (this.reconstructor)
        throw new Error("got plaintext data when reconstructing a packet");
      i = this.decodeString(e);
      const r = i.type === l.BINARY_EVENT;
      r || i.type === l.BINARY_ACK ? (i.type = r ? l.EVENT : l.ACK, this.reconstructor = new It(i), i.attachments === 0 && super.emitReserved("decoded", i)) : super.emitReserved("decoded", i);
    } else if (Q(e) || e.base64)
      if (this.reconstructor)
        i = this.reconstructor.takeBinaryData(e), i && (this.reconstructor = null, super.emitReserved("decoded", i));
      else
        throw new Error("got binary data when not reconstructing a packet");
    else
      throw new Error("Unknown type: " + e);
  }
  /**
   * Decode a packet String (JSON data)
   *
   * @param {String} str
   * @return {Object} packet
   */
  decodeString(e) {
    let i = 0;
    const r = {
      type: Number(e.charAt(0))
    };
    if (l[r.type] === void 0)
      throw new Error("unknown packet type " + r.type);
    if (r.type === l.BINARY_EVENT || r.type === l.BINARY_ACK) {
      const o = i + 1;
      for (; e.charAt(++i) !== "-" && i != e.length; )
        ;
      const a = e.substring(o, i);
      if (a != Number(a) || e.charAt(i) !== "-")
        throw new Error("Illegal attachments");
      r.attachments = Number(a);
    }
    if (e.charAt(i + 1) === "/") {
      const o = i + 1;
      for (; ++i && !(e.charAt(i) === "," || i === e.length); )
        ;
      r.nsp = e.substring(o, i);
    } else
      r.nsp = "/";
    const n = e.charAt(i + 1);
    if (n !== "" && Number(n) == n) {
      const o = i + 1;
      for (; ++i; ) {
        const a = e.charAt(i);
        if (a == null || Number(a) != a) {
          --i;
          break;
        }
        if (i === e.length)
          break;
      }
      r.id = Number(e.substring(o, i + 1));
    }
    if (e.charAt(++i)) {
      const o = this.tryParse(e.substr(i));
      if (X.isPayloadValid(r.type, o))
        r.data = o;
      else
        throw new Error("invalid payload");
    }
    return r;
  }
  tryParse(e) {
    try {
      return JSON.parse(e, this.reviver);
    } catch {
      return !1;
    }
  }
  static isPayloadValid(e, i) {
    switch (e) {
      case l.CONNECT:
        return B(i);
      case l.DISCONNECT:
        return i === void 0;
      case l.CONNECT_ERROR:
        return typeof i == "string" || B(i);
      case l.EVENT:
      case l.BINARY_EVENT:
        return Array.isArray(i) && (typeof i[0] == "number" || typeof i[0] == "string" && ge.indexOf(i[0]) === -1);
      case l.ACK:
      case l.BINARY_ACK:
        return Array.isArray(i);
    }
  }
  /**
   * Deallocates a parser's resources
   */
  destroy() {
    this.reconstructor && (this.reconstructor.finishedReconstruction(), this.reconstructor = null);
  }
}
class It {
  constructor(e) {
    this.packet = e, this.buffers = [], this.reconPack = e;
  }
  /**
   * Method to be called when binary data received from connection
   * after a BINARY_EVENT packet.
   *
   * @param {Buffer | ArrayBuffer} binData - the raw binary data received
   * @return {null | Object} returns null if more binary data is expected or
   *   a reconstructed packet object if all buffers have been received.
   */
  takeBinaryData(e) {
    if (this.buffers.push(e), this.buffers.length === this.reconPack.attachments) {
      const i = Lt(this.reconPack, this.buffers);
      return this.finishedReconstruction(), i;
    }
    return null;
  }
  /**
   * Cleans up binary packet reconstruction variables.
   */
  finishedReconstruction() {
    this.reconPack = null, this.buffers = [];
  }
}
function Nt(t) {
  return typeof t == "string";
}
const Vt = Number.isInteger || function(t) {
  return typeof t == "number" && isFinite(t) && Math.floor(t) === t;
};
function Ft(t) {
  return t === void 0 || Vt(t);
}
function B(t) {
  return Object.prototype.toString.call(t) === "[object Object]";
}
function Dt(t, e) {
  switch (t) {
    case l.CONNECT:
      return e === void 0 || B(e);
    case l.DISCONNECT:
      return e === void 0;
    case l.EVENT:
      return Array.isArray(e) && (typeof e[0] == "number" || typeof e[0] == "string" && ge.indexOf(e[0]) === -1);
    case l.ACK:
      return Array.isArray(e);
    case l.CONNECT_ERROR:
      return typeof e == "string" || B(e);
    default:
      return !1;
  }
}
function qt(t) {
  return Nt(t.nsp) && Ft(t.id) && Dt(t.type, t.data);
}
const Gt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Decoder: X,
  Encoder: Rt,
  get PacketType() {
    return l;
  },
  isPacketValid: qt,
  protocol: Bt
}, Symbol.toStringTag, { value: "Module" }));
function y(t, e, i) {
  return t.on(e, i), function() {
    t.off(e, i);
  };
}
const $t = Object.freeze({
  connect: 1,
  connect_error: 1,
  disconnect: 1,
  disconnecting: 1,
  // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
  newListener: 1,
  removeListener: 1
});
class me extends f {
  /**
   * `Socket` constructor.
   */
  constructor(e, i, r) {
    super(), this.connected = !1, this.recovered = !1, this.receiveBuffer = [], this.sendBuffer = [], this._queue = [], this._queueSeq = 0, this.ids = 0, this.acks = {}, this.flags = {}, this.io = e, this.nsp = i, r && r.auth && (this.auth = r.auth), this._opts = Object.assign({}, r), this.io._autoConnect && this.open();
  }
  /**
   * Whether the socket is currently disconnected
   *
   * @example
   * const socket = io();
   *
   * socket.on("connect", () => {
   *   console.log(socket.disconnected); // false
   * });
   *
   * socket.on("disconnect", () => {
   *   console.log(socket.disconnected); // true
   * });
   */
  get disconnected() {
    return !this.connected;
  }
  /**
   * Subscribe to open, close and packet events
   *
   * @private
   */
  subEvents() {
    if (this.subs)
      return;
    const e = this.io;
    this.subs = [
      y(e, "open", this.onopen.bind(this)),
      y(e, "packet", this.onpacket.bind(this)),
      y(e, "error", this.onerror.bind(this)),
      y(e, "close", this.onclose.bind(this))
    ];
  }
  /**
   * Whether the Socket will try to reconnect when its Manager connects or reconnects.
   *
   * @example
   * const socket = io();
   *
   * console.log(socket.active); // true
   *
   * socket.on("disconnect", (reason) => {
   *   if (reason === "io server disconnect") {
   *     // the disconnection was initiated by the server, you need to manually reconnect
   *     console.log(socket.active); // false
   *   }
   *   // else the socket will automatically try to reconnect
   *   console.log(socket.active); // true
   * });
   */
  get active() {
    return !!this.subs;
  }
  /**
   * "Opens" the socket.
   *
   * @example
   * const socket = io({
   *   autoConnect: false
   * });
   *
   * socket.connect();
   */
  connect() {
    return this.connected ? this : (this.subEvents(), this.io._reconnecting || this.io.open(), this.io._readyState === "open" && this.onopen(), this);
  }
  /**
   * Alias for {@link connect()}.
   */
  open() {
    return this.connect();
  }
  /**
   * Sends a `message` event.
   *
   * This method mimics the WebSocket.send() method.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
   *
   * @example
   * socket.send("hello");
   *
   * // this is equivalent to
   * socket.emit("message", "hello");
   *
   * @return self
   */
  send(...e) {
    return e.unshift("message"), this.emit.apply(this, e), this;
  }
  /**
   * Override `emit`.
   * If the event is in `events`, it's emitted normally.
   *
   * @example
   * socket.emit("hello", "world");
   *
   * // all serializable datastructures are supported (no need to call JSON.stringify)
   * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
   *
   * // with an acknowledgement from the server
   * socket.emit("hello", "world", (val) => {
   *   // ...
   * });
   *
   * @return self
   */
  emit(e, ...i) {
    var r, n, o;
    if ($t.hasOwnProperty(e))
      throw new Error('"' + e.toString() + '" is a reserved event name');
    if (i.unshift(e), this._opts.retries && !this.flags.fromQueue && !this.flags.volatile)
      return this._addToQueue(i), this;
    const a = {
      type: l.EVENT,
      data: i
    };
    if (a.options = {}, a.options.compress = this.flags.compress !== !1, typeof i[i.length - 1] == "function") {
      const d = this.ids++, m = i.pop();
      this._registerAckCallback(d, m), a.id = d;
    }
    const c = (n = (r = this.io.engine) === null || r === void 0 ? void 0 : r.transport) === null || n === void 0 ? void 0 : n.writable, u = this.connected && !(!((o = this.io.engine) === null || o === void 0) && o._hasPingExpired());
    return this.flags.volatile && !c || (u ? (this.notifyOutgoingListeners(a), this.packet(a)) : this.sendBuffer.push(a)), this.flags = {}, this;
  }
  /**
   * @private
   */
  _registerAckCallback(e, i) {
    var r;
    const n = (r = this.flags.timeout) !== null && r !== void 0 ? r : this._opts.ackTimeout;
    if (n === void 0) {
      this.acks[e] = i;
      return;
    }
    const o = this.io.setTimeoutFn(() => {
      delete this.acks[e];
      for (let c = 0; c < this.sendBuffer.length; c++)
        this.sendBuffer[c].id === e && this.sendBuffer.splice(c, 1);
      i.call(this, new Error("operation has timed out"));
    }, n), a = (...c) => {
      this.io.clearTimeoutFn(o), i.apply(this, c);
    };
    a.withError = !0, this.acks[e] = a;
  }
  /**
   * Emits an event and waits for an acknowledgement
   *
   * @example
   * // without timeout
   * const response = await socket.emitWithAck("hello", "world");
   *
   * // with a specific timeout
   * try {
   *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
   * } catch (err) {
   *   // the server did not acknowledge the event in the given delay
   * }
   *
   * @return a Promise that will be fulfilled when the server acknowledges the event
   */
  emitWithAck(e, ...i) {
    return new Promise((r, n) => {
      const o = (a, c) => a ? n(a) : r(c);
      o.withError = !0, i.push(o), this.emit(e, ...i);
    });
  }
  /**
   * Add the packet to the queue.
   * @param args
   * @private
   */
  _addToQueue(e) {
    let i;
    typeof e[e.length - 1] == "function" && (i = e.pop());
    const r = {
      id: this._queueSeq++,
      tryCount: 0,
      pending: !1,
      args: e,
      flags: Object.assign({ fromQueue: !0 }, this.flags)
    };
    e.push((n, ...o) => (this._queue[0], n !== null ? r.tryCount > this._opts.retries && (this._queue.shift(), i && i(n)) : (this._queue.shift(), i && i(null, ...o)), r.pending = !1, this._drainQueue())), this._queue.push(r), this._drainQueue();
  }
  /**
   * Send the first packet of the queue, and wait for an acknowledgement from the server.
   * @param force - whether to resend a packet that has not been acknowledged yet
   *
   * @private
   */
  _drainQueue(e = !1) {
    if (!this.connected || this._queue.length === 0)
      return;
    const i = this._queue[0];
    i.pending && !e || (i.pending = !0, i.tryCount++, this.flags = i.flags, this.emit.apply(this, i.args));
  }
  /**
   * Sends a packet.
   *
   * @param packet
   * @private
   */
  packet(e) {
    e.nsp = this.nsp, this.io._packet(e);
  }
  /**
   * Called upon engine `open`.
   *
   * @private
   */
  onopen() {
    typeof this.auth == "function" ? this.auth((e) => {
      this._sendConnectPacket(e);
    }) : this._sendConnectPacket(this.auth);
  }
  /**
   * Sends a CONNECT packet to initiate the Socket.IO session.
   *
   * @param data
   * @private
   */
  _sendConnectPacket(e) {
    this.packet({
      type: l.CONNECT,
      data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, e) : e
    });
  }
  /**
   * Called upon engine or manager `error`.
   *
   * @param err
   * @private
   */
  onerror(e) {
    this.connected || this.emitReserved("connect_error", e);
  }
  /**
   * Called upon engine `close`.
   *
   * @param reason
   * @param description
   * @private
   */
  onclose(e, i) {
    this.connected = !1, delete this.id, this.emitReserved("disconnect", e, i), this._clearAcks();
  }
  /**
   * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
   * the server.
   *
   * @private
   */
  _clearAcks() {
    Object.keys(this.acks).forEach((e) => {
      if (!this.sendBuffer.some((r) => String(r.id) === e)) {
        const r = this.acks[e];
        delete this.acks[e], r.withError && r.call(this, new Error("socket has been disconnected"));
      }
    });
  }
  /**
   * Called with socket packet.
   *
   * @param packet
   * @private
   */
  onpacket(e) {
    if (e.nsp === this.nsp)
      switch (e.type) {
        case l.CONNECT:
          e.data && e.data.sid ? this.onconnect(e.data.sid, e.data.pid) : this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
          break;
        case l.EVENT:
        case l.BINARY_EVENT:
          this.onevent(e);
          break;
        case l.ACK:
        case l.BINARY_ACK:
          this.onack(e);
          break;
        case l.DISCONNECT:
          this.ondisconnect();
          break;
        case l.CONNECT_ERROR:
          this.destroy();
          const r = new Error(e.data.message);
          r.data = e.data.data, this.emitReserved("connect_error", r);
          break;
      }
  }
  /**
   * Called upon a server event.
   *
   * @param packet
   * @private
   */
  onevent(e) {
    const i = e.data || [];
    e.id != null && i.push(this.ack(e.id)), this.connected ? this.emitEvent(i) : this.receiveBuffer.push(Object.freeze(i));
  }
  emitEvent(e) {
    if (this._anyListeners && this._anyListeners.length) {
      const i = this._anyListeners.slice();
      for (const r of i)
        r.apply(this, e);
    }
    super.emit.apply(this, e), this._pid && e.length && typeof e[e.length - 1] == "string" && (this._lastOffset = e[e.length - 1]);
  }
  /**
   * Produces an ack callback to emit with an event.
   *
   * @private
   */
  ack(e) {
    const i = this;
    let r = !1;
    return function(...n) {
      r || (r = !0, i.packet({
        type: l.ACK,
        id: e,
        data: n
      }));
    };
  }
  /**
   * Called upon a server acknowledgement.
   *
   * @param packet
   * @private
   */
  onack(e) {
    const i = this.acks[e.id];
    typeof i == "function" && (delete this.acks[e.id], i.withError && e.data.unshift(null), i.apply(this, e.data));
  }
  /**
   * Called upon server connect.
   *
   * @private
   */
  onconnect(e, i) {
    this.id = e, this.recovered = i && this._pid === i, this._pid = i, this.connected = !0, this.emitBuffered(), this._drainQueue(!0), this.emitReserved("connect");
  }
  /**
   * Emit buffered events (received and emitted).
   *
   * @private
   */
  emitBuffered() {
    this.receiveBuffer.forEach((e) => this.emitEvent(e)), this.receiveBuffer = [], this.sendBuffer.forEach((e) => {
      this.notifyOutgoingListeners(e), this.packet(e);
    }), this.sendBuffer = [];
  }
  /**
   * Called upon server disconnect.
   *
   * @private
   */
  ondisconnect() {
    this.destroy(), this.onclose("io server disconnect");
  }
  /**
   * Called upon forced client/server side disconnections,
   * this method ensures the manager stops tracking us and
   * that reconnections don't get triggered for this.
   *
   * @private
   */
  destroy() {
    this.subs && (this.subs.forEach((e) => e()), this.subs = void 0), this.io._destroy(this);
  }
  /**
   * Disconnects the socket manually. In that case, the socket will not try to reconnect.
   *
   * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
   *
   * @example
   * const socket = io();
   *
   * socket.on("disconnect", (reason) => {
   *   // console.log(reason); prints "io client disconnect"
   * });
   *
   * socket.disconnect();
   *
   * @return self
   */
  disconnect() {
    return this.connected && this.packet({ type: l.DISCONNECT }), this.destroy(), this.connected && this.onclose("io client disconnect"), this;
  }
  /**
   * Alias for {@link disconnect()}.
   *
   * @return self
   */
  close() {
    return this.disconnect();
  }
  /**
   * Sets the compress flag.
   *
   * @example
   * socket.compress(false).emit("hello");
   *
   * @param compress - if `true`, compresses the sending data
   * @return self
   */
  compress(e) {
    return this.flags.compress = e, this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
   * ready to send messages.
   *
   * @example
   * socket.volatile.emit("hello"); // the server may or may not receive it
   *
   * @returns self
   */
  get volatile() {
    return this.flags.volatile = !0, this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
   * given number of milliseconds have elapsed without an acknowledgement from the server:
   *
   * @example
   * socket.timeout(5000).emit("my-event", (err) => {
   *   if (err) {
   *     // the server did not acknowledge the event in the given delay
   *   }
   * });
   *
   * @returns self
   */
  timeout(e) {
    return this.flags.timeout = e, this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * @example
   * socket.onAny((event, ...args) => {
   *   console.log(`got ${event}`);
   * });
   *
   * @param listener
   */
  onAny(e) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.push(e), this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * @example
   * socket.prependAny((event, ...args) => {
   *   console.log(`got event ${event}`);
   * });
   *
   * @param listener
   */
  prependAny(e) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.unshift(e), this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`got event ${event}`);
   * }
   *
   * socket.onAny(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAny(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAny();
   *
   * @param listener
   */
  offAny(e) {
    if (!this._anyListeners)
      return this;
    if (e) {
      const i = this._anyListeners;
      for (let r = 0; r < i.length; r++)
        if (e === i[r])
          return i.splice(r, 1), this;
    } else
      this._anyListeners = [];
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAny() {
    return this._anyListeners || [];
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.onAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  onAnyOutgoing(e) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.push(e), this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.prependAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  prependAnyOutgoing(e) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.unshift(e), this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`sent event ${event}`);
   * }
   *
   * socket.onAnyOutgoing(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAnyOutgoing(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAnyOutgoing();
   *
   * @param [listener] - the catch-all listener (optional)
   */
  offAnyOutgoing(e) {
    if (!this._anyOutgoingListeners)
      return this;
    if (e) {
      const i = this._anyOutgoingListeners;
      for (let r = 0; r < i.length; r++)
        if (e === i[r])
          return i.splice(r, 1), this;
    } else
      this._anyOutgoingListeners = [];
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAnyOutgoing() {
    return this._anyOutgoingListeners || [];
  }
  /**
   * Notify the listeners for each packet sent
   *
   * @param packet
   *
   * @private
   */
  notifyOutgoingListeners(e) {
    if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
      const i = this._anyOutgoingListeners.slice();
      for (const r of i)
        r.apply(this, e.data);
    }
  }
}
function w(t) {
  t = t || {}, this.ms = t.min || 100, this.max = t.max || 1e4, this.factor = t.factor || 2, this.jitter = t.jitter > 0 && t.jitter <= 1 ? t.jitter : 0, this.attempts = 0;
}
w.prototype.duration = function() {
  var t = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var e = Math.random(), i = Math.floor(e * this.jitter * t);
    t = (Math.floor(e * 10) & 1) == 0 ? t - i : t + i;
  }
  return Math.min(t, this.max) | 0;
};
w.prototype.reset = function() {
  this.attempts = 0;
};
w.prototype.setMin = function(t) {
  this.ms = t;
};
w.prototype.setMax = function(t) {
  this.max = t;
};
w.prototype.setJitter = function(t) {
  this.jitter = t;
};
class K extends f {
  constructor(e, i) {
    var r;
    super(), this.nsps = {}, this.subs = [], e && typeof e == "object" && (i = e, e = void 0), i = i || {}, i.path = i.path || "/socket.io", this.opts = i, I(this, i), this.reconnection(i.reconnection !== !1), this.reconnectionAttempts(i.reconnectionAttempts || 1 / 0), this.reconnectionDelay(i.reconnectionDelay || 1e3), this.reconnectionDelayMax(i.reconnectionDelayMax || 5e3), this.randomizationFactor((r = i.randomizationFactor) !== null && r !== void 0 ? r : 0.5), this.backoff = new w({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    }), this.timeout(i.timeout == null ? 2e4 : i.timeout), this._readyState = "closed", this.uri = e;
    const n = i.parser || Gt;
    this.encoder = new n.Encoder(), this.decoder = new n.Decoder(), this._autoConnect = i.autoConnect !== !1, this._autoConnect && this.open();
  }
  reconnection(e) {
    return arguments.length ? (this._reconnection = !!e, e || (this.skipReconnect = !0), this) : this._reconnection;
  }
  reconnectionAttempts(e) {
    return e === void 0 ? this._reconnectionAttempts : (this._reconnectionAttempts = e, this);
  }
  reconnectionDelay(e) {
    var i;
    return e === void 0 ? this._reconnectionDelay : (this._reconnectionDelay = e, (i = this.backoff) === null || i === void 0 || i.setMin(e), this);
  }
  randomizationFactor(e) {
    var i;
    return e === void 0 ? this._randomizationFactor : (this._randomizationFactor = e, (i = this.backoff) === null || i === void 0 || i.setJitter(e), this);
  }
  reconnectionDelayMax(e) {
    var i;
    return e === void 0 ? this._reconnectionDelayMax : (this._reconnectionDelayMax = e, (i = this.backoff) === null || i === void 0 || i.setMax(e), this);
  }
  timeout(e) {
    return arguments.length ? (this._timeout = e, this) : this._timeout;
  }
  /**
   * Starts trying to reconnect if reconnection is enabled and we have not
   * started reconnecting yet
   *
   * @private
   */
  maybeReconnectOnOpen() {
    !this._reconnecting && this._reconnection && this.backoff.attempts === 0 && this.reconnect();
  }
  /**
   * Sets the current transport `socket`.
   *
   * @param {Function} fn - optional, callback
   * @return self
   * @public
   */
  open(e) {
    if (~this._readyState.indexOf("open"))
      return this;
    this.engine = new bt(this.uri, this.opts);
    const i = this.engine, r = this;
    this._readyState = "opening", this.skipReconnect = !1;
    const n = y(i, "open", function() {
      r.onopen(), e && e();
    }), o = (c) => {
      this.cleanup(), this._readyState = "closed", this.emitReserved("error", c), e ? e(c) : this.maybeReconnectOnOpen();
    }, a = y(i, "error", o);
    if (this._timeout !== !1) {
      const c = this._timeout, u = this.setTimeoutFn(() => {
        n(), o(new Error("timeout")), i.close();
      }, c);
      this.opts.autoUnref && u.unref(), this.subs.push(() => {
        this.clearTimeoutFn(u);
      });
    }
    return this.subs.push(n), this.subs.push(a), this;
  }
  /**
   * Alias for open()
   *
   * @return self
   * @public
   */
  connect(e) {
    return this.open(e);
  }
  /**
   * Called upon transport open.
   *
   * @private
   */
  onopen() {
    this.cleanup(), this._readyState = "open", this.emitReserved("open");
    const e = this.engine;
    this.subs.push(
      y(e, "ping", this.onping.bind(this)),
      y(e, "data", this.ondata.bind(this)),
      y(e, "error", this.onerror.bind(this)),
      y(e, "close", this.onclose.bind(this)),
      // @ts-ignore
      y(this.decoder, "decoded", this.ondecoded.bind(this))
    );
  }
  /**
   * Called upon a ping.
   *
   * @private
   */
  onping() {
    this.emitReserved("ping");
  }
  /**
   * Called with data.
   *
   * @private
   */
  ondata(e) {
    try {
      this.decoder.add(e);
    } catch (i) {
      this.onclose("parse error", i);
    }
  }
  /**
   * Called when parser fully decodes a packet.
   *
   * @private
   */
  ondecoded(e) {
    R(() => {
      this.emitReserved("packet", e);
    }, this.setTimeoutFn);
  }
  /**
   * Called upon socket error.
   *
   * @private
   */
  onerror(e) {
    this.emitReserved("error", e);
  }
  /**
   * Creates a new socket for the given `nsp`.
   *
   * @return {Socket}
   * @public
   */
  socket(e, i) {
    let r = this.nsps[e];
    return r ? this._autoConnect && !r.active && r.connect() : (r = new me(this, e, i), this.nsps[e] = r), r;
  }
  /**
   * Called upon a socket close.
   *
   * @param socket
   * @private
   */
  _destroy(e) {
    const i = Object.keys(this.nsps);
    for (const r of i)
      if (this.nsps[r].active)
        return;
    this._close();
  }
  /**
   * Writes a packet.
   *
   * @param packet
   * @private
   */
  _packet(e) {
    const i = this.encoder.encode(e);
    for (let r = 0; r < i.length; r++)
      this.engine.write(i[r], e.options);
  }
  /**
   * Clean up transport subscriptions and packet buffer.
   *
   * @private
   */
  cleanup() {
    this.subs.forEach((e) => e()), this.subs.length = 0, this.decoder.destroy();
  }
  /**
   * Close the current socket.
   *
   * @private
   */
  _close() {
    this.skipReconnect = !0, this._reconnecting = !1, this.onclose("forced close");
  }
  /**
   * Alias for close()
   *
   * @private
   */
  disconnect() {
    return this._close();
  }
  /**
   * Called when:
   *
   * - the low-level engine is closed
   * - the parser encountered a badly formatted packet
   * - all sockets are disconnected
   *
   * @private
   */
  onclose(e, i) {
    var r;
    this.cleanup(), (r = this.engine) === null || r === void 0 || r.close(), this.backoff.reset(), this._readyState = "closed", this.emitReserved("close", e, i), this._reconnection && !this.skipReconnect && this.reconnect();
  }
  /**
   * Attempt a reconnection.
   *
   * @private
   */
  reconnect() {
    if (this._reconnecting || this.skipReconnect)
      return this;
    const e = this;
    if (this.backoff.attempts >= this._reconnectionAttempts)
      this.backoff.reset(), this.emitReserved("reconnect_failed"), this._reconnecting = !1;
    else {
      const i = this.backoff.duration();
      this._reconnecting = !0;
      const r = this.setTimeoutFn(() => {
        e.skipReconnect || (this.emitReserved("reconnect_attempt", e.backoff.attempts), !e.skipReconnect && e.open((n) => {
          n ? (e._reconnecting = !1, e.reconnect(), this.emitReserved("reconnect_error", n)) : e.onreconnect();
        }));
      }, i);
      this.opts.autoUnref && r.unref(), this.subs.push(() => {
        this.clearTimeoutFn(r);
      });
    }
  }
  /**
   * Called upon successful reconnect.
   *
   * @private
   */
  onreconnect() {
    const e = this.backoff.attempts;
    this._reconnecting = !1, this.backoff.reset(), this.emitReserved("reconnect", e);
  }
}
const b = {};
function D(t, e) {
  typeof t == "object" && (e = t, t = void 0), e = e || {};
  const i = kt(t, e.path || "/socket.io"), r = i.source, n = i.id, o = i.path, a = b[n] && o in b[n].nsps, c = e.forceNew || e["force new connection"] || e.multiplex === !1 || a;
  let u;
  return c ? u = new K(r, e) : (b[n] || (b[n] = new K(r, e)), u = b[n]), i.query && !e.query && (e.query = i.queryKey), u.socket(i.path, e);
}
Object.assign(D, {
  Manager: K,
  Socket: me,
  io: D,
  connect: D
});
const q = "@LiveGo:token", G = "@LiveGo:user", Ut = 1e4, Mt = {
  getToken: () => localStorage.getItem(q),
  setToken: (t) => localStorage.setItem(q, t),
  getUser: () => {
    const t = localStorage.getItem(G);
    try {
      return t ? JSON.parse(t) : null;
    } catch (e) {
      return console.error("Failed to parse user from storage", e), null;
    }
  },
  setUser: (t) => {
    t && localStorage.setItem(G, JSON.stringify(t));
  },
  clear: () => {
    localStorage.removeItem(q), localStorage.removeItem(G);
  }
}, s = async (t, e, i) => {
  const r = `${Pe.BASE_URL}${e}`, n = S.addLog(t, e), o = new AbortController(), a = setTimeout(() => {
    o.abort(), S.updateLog(n, { status: "Timeout" });
  }, Ut);
  try {
    const c = Mt.getToken(), u = {
      "Content-Type": "application/json"
    };
    c && (u.Authorization = `Bearer ${c}`);
    const p = {
      method: t,
      headers: u,
      signal: o.signal
    };
    i && (t === "POST" || t === "PUT" || t === "PATCH" || t === "DELETE") && (p.body = JSON.stringify(i));
    const d = await fetch(r, p);
    clearTimeout(a);
    const m = await d.text(), E = m ? JSON.parse(m) : {};
    if (S.updateLog(n, { status: d.ok ? "Success" : "Error", statusCode: d.status }), !d.ok) {
      const j = new Error(E.error || `Request failed with status ${d.status}`);
      throw j.status = d.status, j;
    }
    return E.data !== void 0 ? E.data : E;
  } catch (c) {
    throw clearTimeout(a), c.name !== "AbortError" && S.updateLog(n, { status: "Error", error: c.message }), c;
  }
}, Ht = {
  auth: {
    login: (t) => s("POST", "/auth/login", t),
    register: (t) => s("POST", "/auth/register", t),
    logout: () => s("POST", "/auth/logout"),
    getLastEmail: () => s("GET", "/auth/last-email"),
    saveLastEmail: (t) => s("POST", "/auth/save-last-email", { email: t })
  },
  users: {
    me: () => s("GET", "/users/me"),
    get: (t) => s("GET", `/users/${t}`),
    update: (t, e) => s("POST", "/users/me", e),
    getOnlineUsers: (t) => s("GET", `/users/online?roomId=${t}`),
    getFansUsers: (t) => s("GET", `/users/${t}/fans`),
    getFriends: (t) => s("GET", `/users/${t}/friends`),
    search: (t) => s("GET", `/users/search?q=${t}`),
    setLanguage: (t) => s("POST", "/users/me/language", { code: t }),
    toggleFollow: (t) => s("POST", `/users/${t}/follow`),
    getWithdrawalHistory: (t) => s("GET", `/users/me/withdrawal-history?status=${t}`),
    blockUser: (t) => s("POST", `/users/me/blocklist/${t}`),
    updateBillingAddress: (t) => s("POST", "/users/me/billing-address", t),
    updateCreditCard: (t) => s("POST", "/users/me/credit-card", t),
    updateUiSettings: (t) => Ht.users.update("me", { uiSettings: t })
  },
  chats: {
    listConversations: () => s("GET", "/chats/conversations"),
    start: (t) => s("POST", "/chats/start", { userId: t }),
    sendMessage: (t, e) => s("POST", `/chats/stream/${t}/message`, e)
  },
  gifts: {
    list: (t) => s("GET", `/gifts${t ? `?category=${t}` : ""}`),
    getGallery: () => s("GET", "/gifts/gallery"),
    recharge: () => Promise.resolve({ success: !0 })
  },
  mercadopago: {
    createPreference: (t) => s("POST", "/mercadopago/create_preference", { details: t })
  },
  diamonds: {
    getBalance: (t) => s("GET", `/wallet/balance?userId=${t}`),
    purchase: (t, e, i) => s("POST", `/users/${t}/purchase`, { diamonds: e, price: i })
  },
  earnings: {
    withdraw: {
      calculate: (t) => s("POST", "/earnings/withdraw/calculate", { amount: t }),
      request: (t, e) => s("POST", "/earnings/withdraw/request", { amount: t, method: e }),
      methods: {
        update: (t, e) => s("POST", "/earnings/withdraw/methods", { method: t, details: e })
      }
    }
  },
  admin: {
    getAdminWithdrawalHistory: () => s("GET", "/admin/withdrawals"),
    withdraw: {
      request: (t) => s("POST", "/admin/withdrawals/request", { amount: t })
    },
    saveAdminWithdrawalMethod: (t) => s("POST", "/admin/withdrawals/method", t)
  },
  streams: {
    listByCategory: (t, e) => s("GET", `/live/${t}?region=${e}`),
    create: (t) => s("POST", "/streams", t),
    update: (t, e) => s("PATCH", `/streams/${t}`, e),
    updateVideoQuality: (t, e) => s("PATCH", `/streams/${t}/quality`, { quality: e }),
    getGiftDonors: (t) => s("GET", `/streams/${t}/donors`),
    search: (t) => s("GET", `/streams/search?q=${t}`),
    inviteToPrivateRoom: (t, e) => s("POST", `/streams/${t}/invite`, { userId: e }),
    getCategories: () => s("GET", "/streams/categories"),
    getBeautySettings: () => s("GET", "/streams/beauty-settings"),
    saveBeautySettings: (t) => s("POST", "/streams/beauty-settings", t),
    resetBeautySettings: () => s("POST", "/streams/beauty-settings/reset"),
    applyBeautyEffect: (t) => s("POST", "/streams/beauty-settings/apply", t),
    logBeautyTabClick: (t) => s("POST", "/streams/beauty-settings/log-tab", t),
    deleteById: (t) => s("DELETE", `/streams/${t}`)
  },
  srs: {
    getVersions: () => s("GET", "/v1/versions"),
    getSummaries: () => s("GET", "/v1/summaries"),
    getFeatures: () => s("GET", "/v1/features"),
    getClients: () => s("GET", "/v1/clients"),
    getClientById: (t) => s("GET", `/v1/clients/${t}`),
    getStreams: () => s("GET", "/v1/streams"),
    getStreamById: (t) => s("GET", `/v1/streams/${t}`),
    deleteStreamById: (t) => s("DELETE", `/v1/streams/${t}`),
    getConnections: () => s("GET", "/v1/connections"),
    getConnectionById: (t) => s("GET", `/v1/connections/${t}`),
    deleteConnectionById: (t) => s("DELETE", `/v1/connections/${t}`),
    getConfigs: () => s("GET", "/v1/configs"),
    updateConfigs: (t) => s("PUT", "/v1/configs", t),
    getMetrics: () => s("GET", "/v1/metrics"),
    rtcPublish: (t, e) => s("POST", "/v1/rtc/publish", { sdp: t, streamUrl: e }),
    trickleIce: (t, e) => s("POST", `/v1/rtc/trickle/${t}`, e)
  },
  livekit: {
    token: {
      generate: (t, e) => s("POST", "/livekit/token/generate", { userId: t, userName: e })
    },
    room: {
      list: () => s("GET", "/livekit/rooms"),
      create: (t) => s("POST", "/livekit/room/create", { roomId: t }),
      get: (t) => s("GET", `/livekit/room/${t}`),
      delete: (t) => s("DELETE", `/livekit/room/${t}`),
      join: (t) => Promise.resolve({ simulated: !0 }),
      // Ação de cliente
      leave: (t) => Promise.resolve({ simulated: !0 })
      // Ação de cliente
    },
    participants: {
      list: (t) => s("GET", `/livekit/room/${t}/participants`),
      get: (t, e) => s("GET", `/livekit/room/${t}/participants/${e}`),
      remove: (t, e) => s("POST", `/livekit/room/${t}/participants/${e}/remove`),
      mute: (t, e) => s("POST", `/livekit/room/${t}/participants/${e}/mute`),
      unmute: (t, e) => s("POST", `/livekit/room/${t}/participants/${e}/unmute`)
    },
    tracks: {
      list: (t) => s("GET", `/livekit/tracks/${t}`),
      mute: (t, e) => s("POST", `/livekit/tracks/${t}/${e}/mute`),
      unmute: (t, e) => s("POST", `/livekit/tracks/${t}/${e}/unmute`),
      remove: (t, e) => s("DELETE", `/livekit/tracks/${t}/${e}`)
    },
    record: {
      start: (t) => s("POST", `/livekit/record/${t}/start`),
      stop: (t) => s("POST", `/livekit/record/${t}/stop`)
    },
    ingest: (t) => s("POST", `/livekit/ingest/${t}`),
    monitoring: {
      health: () => s("GET", "/livekit/system/health"),
      info: () => s("GET", "/livekit/system/info"),
      stats: (t) => s("GET", `/livekit/system/stats?roomId=${t}`),
      logs: () => s("GET", "/livekit/system/logs"),
      getConfig: () => s("GET", "/livekit/system/config"),
      updateConfig: (t) => s("PUT", "/livekit/system/config", t)
    },
    webhook: {
      register: (t) => s("POST", "/livekit/webhook/register", { url: t }),
      delete: (t) => s("DELETE", `/livekit/webhook/${t}`)
    }
  },
  db: {
    checkCollections: () => s("GET", "/db/collections"),
    getRequiredCollections: () => s("GET", "/db/required-collections"),
    setupDatabase: () => s("POST", "/db/setup")
  },
  getFollowingUsers: (t) => s("GET", `/users/${t}/following`),
  getVisitors: (t) => s("GET", `/users/${t}/visitors`),
  getBlocklist: () => s("GET", "/users/me/blocklist"),
  unblockUser: (t) => s("POST", `/users/me/blocklist/${t}/unblock`),
  getStreamHistory: () => s("GET", "/users/me/history"),
  clearStreamHistory: () => s("DELETE", "/users/me/history"),
  getReminders: () => s("GET", "/users/me/reminders"),
  removeReminder: (t) => s("DELETE", `/users/me/reminders/${t}`),
  getDailyRanking: () => s("GET", "/ranking/daily"),
  getWeeklyRanking: () => s("GET", "/ranking/weekly"),
  getMonthlyRanking: () => s("GET", "/ranking/monthly"),
  getTopFans: () => s("GET", "/ranking/top-fans"),
  getQuickCompleteFriends: () => s("GET", "/tasks/quick-friends"),
  completeQuickFriendTask: (t) => s("POST", `/tasks/quick-friends/${t}/complete`),
  getMusicLibrary: () => s("GET", "/assets/music"),
  getAvatarFrames: () => s("GET", "/assets/frames"),
  setActiveFrame: (t, e) => s("POST", `/users/${t}/active-frame`, { frameId: e }),
  createFeedPost: (t) => s("POST", "/posts", t),
  getFeedVideos: () => s("GET", "/feed/videos"),
  likePost: (t) => s("POST", `/posts/${t}/like`),
  addComment: (t, e) => s("POST", `/posts/${t}/comment`, { text: e }),
  sendGift: (t, e, i, r, n) => s("POST", `/streams/${e}/gift`, { from: t, giftName: i, amount: r, toUserId: n }),
  sendBackpackGift: (t, e, i, r, n) => s("POST", `/streams/${e}/backpack-gift`, { from: t, giftId: i, amount: r, toUserId: n }),
  confirmPurchaseTransaction: (t, e) => s("POST", "/wallet/confirm-purchase", { details: t, method: e }),
  cancelPurchaseTransaction: () => s("POST", "/wallet/cancel-purchase"),
  kickUser: (t, e) => s("POST", `/streams/${t}/kick`, { userId: e }),
  makeModerator: (t, e) => s("POST", `/streams/${t}/moderator`, { userId: e }),
  toggleMicrophone: () => s("POST", "/live/toggle-mic"),
  toggleStreamSound: () => s("POST", "/live/toggle-sound"),
  toggleAutoFollow: () => s("POST", "/live/toggle-autofollow"),
  toggleAutoPrivateInvite: () => s("POST", "/live/toggle-autoinvite"),
  inviteFriendForCoHost: (t, e) => s("POST", `/streams/${t}/cohost/invite`, { friendId: e }),
  translate: (t) => s("POST", "/translate", { text: t })
};
export {
  Ht as api,
  Mt as storage
};
