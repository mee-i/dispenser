/*
 * websocket.ts
 * Script for establishing WS connection
 */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _WebSocketConnection_instances, _WebSocketConnection_ws_onopen, _WebSocketConnection_ws_onclose, _WebSocketConnection_ws_onmessage, _WebSocketConnection_ws_onerror, _WebSocketConnection_eventListeners, _WebSocketConnection_timeoutId, _WebSocketConnection_reconnects, _WebSocketConnection_doReconnect, _WebSocketConnection_url, _WebSocketConnection_connectionTimeout, _WebSocketConnection_reconnectInterval, _WebSocketConnection_maxReconnects, _WebSocketConnection_connection, _WebSocketConnection_log, _WebSocketConnection_connect, _WebSocketConnection_clearConnectionTimeout, _WebSocketConnection_setConnectionTimeout, _WebSocketConnection_scheduleReconnect, _WebSocketConnection_onTimeout, _WebSocketConnection_onConnect, _WebSocketConnection_onDisconnect;
class ErrorNotConnected extends Error {
    constructor(message) {
        super(message);
        this.name = "ErrorNotConnected";
    }
}
class WebSocketConnection {
    set onopen(func) {
        __classPrivateFieldSet(this, _WebSocketConnection_ws_onopen, func, "f");
        if (__classPrivateFieldGet(this, _WebSocketConnection_connection, "f"))
            __classPrivateFieldGet(this, _WebSocketConnection_connection, "f").onopen = func;
    }
    set onclose(func) {
        __classPrivateFieldSet(this, _WebSocketConnection_ws_onclose, func, "f");
        if (__classPrivateFieldGet(this, _WebSocketConnection_connection, "f"))
            __classPrivateFieldGet(this, _WebSocketConnection_connection, "f").onclose = func;
    }
    set onmessage(func) {
        __classPrivateFieldSet(this, _WebSocketConnection_ws_onmessage, func, "f");
        if (__classPrivateFieldGet(this, _WebSocketConnection_connection, "f"))
            __classPrivateFieldGet(this, _WebSocketConnection_connection, "f").onmessage = func;
    }
    set onerror(func) {
        __classPrivateFieldSet(this, _WebSocketConnection_ws_onerror, func, "f");
        if (__classPrivateFieldGet(this, _WebSocketConnection_connection, "f"))
            __classPrivateFieldGet(this, _WebSocketConnection_connection, "f").onerror = func;
    }
    get onopen() {
        return __classPrivateFieldGet(this, _WebSocketConnection_ws_onopen, "f");
    }
    get onclose() {
        return __classPrivateFieldGet(this, _WebSocketConnection_ws_onclose, "f");
    }
    get onmessage() {
        return __classPrivateFieldGet(this, _WebSocketConnection_ws_onmessage, "f");
    }
    get onerror() {
        return __classPrivateFieldGet(this, _WebSocketConnection_ws_onerror, "f");
    }
    addEventListener(type, listener, options) {
        var _a;
        (_a = __classPrivateFieldGet(this, _WebSocketConnection_connection, "f")) === null || _a === void 0 ? void 0 : _a.addEventListener(type, listener, options);
        __classPrivateFieldGet(this, _WebSocketConnection_eventListeners, "f").push({
            type: type,
            listener: listener,
            options: options,
        });
    }
    get url() { return __classPrivateFieldGet(this, _WebSocketConnection_url, "f"); }
    get reconnectInterval() { return __classPrivateFieldGet(this, _WebSocketConnection_reconnectInterval, "f"); }
    get maxReconnects() { return __classPrivateFieldGet(this, _WebSocketConnection_maxReconnects, "f"); }
    get connection() { return __classPrivateFieldGet(this, _WebSocketConnection_connection, "f"); }
    constructor(url, connectionTimeout = 10000, reconnectInterval = 2000, maxReconnects = 5) {
        _WebSocketConnection_instances.add(this);
        _WebSocketConnection_ws_onopen.set(this, void 0);
        _WebSocketConnection_ws_onclose.set(this, void 0);
        _WebSocketConnection_ws_onmessage.set(this, void 0);
        _WebSocketConnection_ws_onerror.set(this, void 0);
        _WebSocketConnection_eventListeners.set(this, []);
        // Public properties
        this.logging = true;
        // Hidden properties
        _WebSocketConnection_timeoutId.set(this, -1);
        _WebSocketConnection_reconnects.set(this, 0);
        _WebSocketConnection_doReconnect.set(this, true);
        // Get-only properties
        _WebSocketConnection_url.set(this, "");
        _WebSocketConnection_connectionTimeout.set(this, 0);
        _WebSocketConnection_reconnectInterval.set(this, 0);
        _WebSocketConnection_maxReconnects.set(this, 0);
        _WebSocketConnection_connection.set(this, null);
        __classPrivateFieldSet(this, _WebSocketConnection_url, url, "f");
        __classPrivateFieldSet(this, _WebSocketConnection_reconnectInterval, reconnectInterval, "f");
        __classPrivateFieldSet(this, _WebSocketConnection_maxReconnects, maxReconnects, "f");
        __classPrivateFieldSet(this, _WebSocketConnection_connectionTimeout, connectionTimeout, "f");
        __classPrivateFieldSet(this, _WebSocketConnection_reconnects, 0, "f");
    }
    start() {
        __classPrivateFieldSet(this, _WebSocketConnection_doReconnect, true, "f");
        __classPrivateFieldSet(this, _WebSocketConnection_reconnects, 0, "f");
        __classPrivateFieldGet(this, _WebSocketConnection_instances, "m", _WebSocketConnection_connect).call(this);
    }
    close() {
        var _a;
        __classPrivateFieldSet(this, _WebSocketConnection_doReconnect, false, "f");
        (_a = __classPrivateFieldGet(this, _WebSocketConnection_connection, "f")) === null || _a === void 0 ? void 0 : _a.close();
        __classPrivateFieldSet(this, _WebSocketConnection_connection, null, "f");
    }
    send(data) {
        if (__classPrivateFieldGet(this, _WebSocketConnection_connection, "f") === null)
            throw new ErrorNotConnected("Connection is not opened");
        __classPrivateFieldGet(this, _WebSocketConnection_connection, "f").send(data);
    }
}
_WebSocketConnection_ws_onopen = new WeakMap(), _WebSocketConnection_ws_onclose = new WeakMap(), _WebSocketConnection_ws_onmessage = new WeakMap(), _WebSocketConnection_ws_onerror = new WeakMap(), _WebSocketConnection_eventListeners = new WeakMap(), _WebSocketConnection_timeoutId = new WeakMap(), _WebSocketConnection_reconnects = new WeakMap(), _WebSocketConnection_doReconnect = new WeakMap(), _WebSocketConnection_url = new WeakMap(), _WebSocketConnection_connectionTimeout = new WeakMap(), _WebSocketConnection_reconnectInterval = new WeakMap(), _WebSocketConnection_maxReconnects = new WeakMap(), _WebSocketConnection_connection = new WeakMap(), _WebSocketConnection_instances = new WeakSet(), _WebSocketConnection_log = function _WebSocketConnection_log(...data) {
    if (!this.logging)
        return;
    console.log("[WebSocket]", ...data);
}, _WebSocketConnection_connect = function _WebSocketConnection_connect() {
    var _a;
    // Stop reconnecting when max reconnects count reached
    if (__classPrivateFieldGet(this, _WebSocketConnection_reconnects, "f") >= __classPrivateFieldGet(this, _WebSocketConnection_maxReconnects, "f")) {
        __classPrivateFieldGet(this, _WebSocketConnection_instances, "m", _WebSocketConnection_clearConnectionTimeout).call(this);
        __classPrivateFieldGet(this, _WebSocketConnection_instances, "m", _WebSocketConnection_log).call(this, "Maximum connection attempt reached");
        return;
    }
    if (__classPrivateFieldGet(this, _WebSocketConnection_connection, "f") != null)
        __classPrivateFieldGet(this, _WebSocketConnection_instances, "m", _WebSocketConnection_log).call(this, "Reconnecting...");
    else
        __classPrivateFieldGet(this, _WebSocketConnection_instances, "m", _WebSocketConnection_log).call(this, "Connecting...");
    // Open new connection
    __classPrivateFieldSet(this, _WebSocketConnection_connection, new WebSocket(__classPrivateFieldGet(this, _WebSocketConnection_url, "f")), "f");
    __classPrivateFieldGet(this, _WebSocketConnection_connection, "f").addEventListener("open", (e) => {
        __classPrivateFieldGet(this, _WebSocketConnection_instances, "m", _WebSocketConnection_onConnect).call(this);
    });
    __classPrivateFieldGet(this, _WebSocketConnection_connection, "f").addEventListener("close", (e) => {
        __classPrivateFieldGet(this, _WebSocketConnection_instances, "m", _WebSocketConnection_onDisconnect).call(this);
    });
    for (const listener of __classPrivateFieldGet(this, _WebSocketConnection_eventListeners, "f")) {
        __classPrivateFieldGet(this, _WebSocketConnection_connection, "f").addEventListener(listener.type, listener.listener, listener.options);
    }
    __classPrivateFieldGet(this, _WebSocketConnection_connection, "f").onopen = __classPrivateFieldGet(this, _WebSocketConnection_ws_onopen, "f");
    __classPrivateFieldGet(this, _WebSocketConnection_connection, "f").onmessage = __classPrivateFieldGet(this, _WebSocketConnection_ws_onmessage, "f");
    __classPrivateFieldGet(this, _WebSocketConnection_connection, "f").onclose = __classPrivateFieldGet(this, _WebSocketConnection_ws_onclose, "f");
    __classPrivateFieldGet(this, _WebSocketConnection_connection, "f").onerror = __classPrivateFieldGet(this, _WebSocketConnection_ws_onerror, "f");
    __classPrivateFieldGet(this, _WebSocketConnection_instances, "m", _WebSocketConnection_setConnectionTimeout).call(this); // reset connection timeout handler
    __classPrivateFieldSet(this, _WebSocketConnection_reconnects, // reset connection timeout handler
    (_a = __classPrivateFieldGet(this, _WebSocketConnection_reconnects, "f"), _a++, _a), "f");
}, _WebSocketConnection_clearConnectionTimeout = function _WebSocketConnection_clearConnectionTimeout() {
    // Remove connection timeout
    clearTimeout(__classPrivateFieldGet(this, _WebSocketConnection_timeoutId, "f"));
}, _WebSocketConnection_setConnectionTimeout = function _WebSocketConnection_setConnectionTimeout() {
    // Set or reset connection timeout
    __classPrivateFieldGet(this, _WebSocketConnection_instances, "m", _WebSocketConnection_clearConnectionTimeout).call(this);
    const thisObj = this;
    __classPrivateFieldSet(this, _WebSocketConnection_timeoutId, setTimeout(() => __classPrivateFieldGet(thisObj, _WebSocketConnection_instances, "m", _WebSocketConnection_onTimeout).call(thisObj), __classPrivateFieldGet(this, _WebSocketConnection_connectionTimeout, "f")), "f");
}, _WebSocketConnection_scheduleReconnect = function _WebSocketConnection_scheduleReconnect() {
    // Schedule reconnect process
    __classPrivateFieldGet(this, _WebSocketConnection_instances, "m", _WebSocketConnection_clearConnectionTimeout).call(this);
    const thisObj = this;
    __classPrivateFieldSet(this, _WebSocketConnection_timeoutId, setTimeout(() => __classPrivateFieldGet(thisObj, _WebSocketConnection_instances, "m", _WebSocketConnection_connect).call(thisObj), __classPrivateFieldGet(this, _WebSocketConnection_reconnectInterval, "f")), "f");
}, _WebSocketConnection_onTimeout = function _WebSocketConnection_onTimeout() {
    // Reconnect when timeout reached
    __classPrivateFieldGet(this, _WebSocketConnection_instances, "m", _WebSocketConnection_log).call(this, "Connection timeout");
    __classPrivateFieldGet(this, _WebSocketConnection_instances, "m", _WebSocketConnection_scheduleReconnect).call(this);
}, _WebSocketConnection_onConnect = function _WebSocketConnection_onConnect() {
    // Reset reconnect state when WebSocket connected
    __classPrivateFieldGet(this, _WebSocketConnection_instances, "m", _WebSocketConnection_clearConnectionTimeout).call(this);
    __classPrivateFieldSet(this, _WebSocketConnection_reconnects, 0, "f");
    __classPrivateFieldGet(this, _WebSocketConnection_instances, "m", _WebSocketConnection_log).call(this, "Connected to " + __classPrivateFieldGet(this, _WebSocketConnection_url, "f"));
}, _WebSocketConnection_onDisconnect = function _WebSocketConnection_onDisconnect() {
    if (!__classPrivateFieldGet(this, _WebSocketConnection_doReconnect, "f"))
        return;
    __classPrivateFieldGet(this, _WebSocketConnection_instances, "m", _WebSocketConnection_scheduleReconnect).call(this);
};
// export default WebSocketConnection;
// export { ErrorNotConnected };
//# sourceMappingURL=websocket.js.map