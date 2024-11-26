/*
 * websocket.ts
 * Script for establishing WS connection
 */

class ErrorNotConnected extends Error {
    constructor(message?: string) {
        super(message);
        this.name = "ErrorNotConnected";
    }
}

export default class WebSocketConnection {
    #ws_onopen: (ev: Event) => any;
    #ws_onclose: (ev: CloseEvent) => any;
    #ws_onmessage: (ev: MessageEvent) => any;
    #ws_onerror: (ev: Event) => any;

    set onopen(func: (ev: Event) => any) {
        this.#ws_onopen = func;
        if (this.#connection) this.#connection.onopen = func;
    }
    set onclose(func: (ev: CloseEvent) => any) {
        this.#ws_onclose = func;
        if (this.#connection) this.#connection.onclose = func;
    }
    set onmessage(func: (ev: MessageEvent) => any) {
        this.#ws_onmessage = func;
        if (this.#connection) this.#connection.onmessage = func;
    }
    set onerror(func: (ev: Event) => any) {
        this.#ws_onerror = func;
        if (this.#connection) this.#connection.onerror = func;
    }

    get onopen(): (ev: Event) => any {
        return this.#ws_onopen;
    }
    get onclose(): (ev: CloseEvent) => any {
        return this.#ws_onclose;
    }
    get onmessage(): (ev: MessageEvent) => any {
        return this.#ws_onmessage;
    }
    get onerror(): (ev: Event) => any {
        return this.#ws_onerror;
    }

    #eventListeners: {
        type: keyof WebSocketEventMap,
        listener: (ev: Event | CloseEvent | MessageEvent<any>) => any,
        options?: boolean | AddEventListenerOptions,
    }[] = [];

    addEventListener(type: keyof WebSocketEventMap, listener: (ev: Event | CloseEvent | MessageEvent<any>) => any, options?: boolean | AddEventListenerOptions): void | undefined {
        this.#connection?.addEventListener(type, listener, options);
        this.#eventListeners.push({
            type: type,
            listener: listener,
            options: options,
        });
    }

    // Hidden properties
    #timeoutId: number = -1;
    #reconnects: number = 0;
    #doReconnect: boolean = true;

    // Get-only properties
    #url: string = "";
    #connectionTimeout: number = 0;
    #reconnectInterval: number = 0;
    #maxReconnects: number = 0;
    #connection: WebSocket | null = null;

    get url() { return this.#url }
    get reconnectInterval() { return this.#reconnectInterval }
    get maxReconnects() { return this.#maxReconnects }
    get connection() { return this.#connection }

    // Hidden methods
    #connect(): void {
        // Stop reconnecting when max reconnects count reached
        if (this.#reconnects >= this.#maxReconnects) {
            this.#clearConnectionTimeout();
            return;
        }

        // Open new connection
        this.#connection = new WebSocket(this.#url);

        this.#connection.addEventListener("open", (e) => {
            this.#onConnect();
        });
        
        this.#connection.addEventListener("close", (e) => {
            this.#onDisconnect();
        });

        for (const listener of this.#eventListeners) {
            this.#connection.addEventListener(listener.type, listener.listener, listener.options);
        }

        this.#connection.onopen = this.#ws_onopen;
        this.#connection.onmessage = this.#ws_onmessage;
        this.#connection.onclose = this.#ws_onclose;
        this.#connection.onerror = this.#ws_onerror;

        this.#scheduleReconnect(); // reset connection timeout handler

        this.#reconnects++;
    }

    #clearConnectionTimeout(): void {
        // Remove connection timeout
        clearTimeout(this.#timeoutId);
    }

    #setConnectionTimeout(): void {
        // Set or reset connection timeout
        this.#clearConnectionTimeout();
        this.#timeoutId = setTimeout(this.#onTimeout, this.#connectionTimeout);
    }

    #scheduleReconnect(): void {
        // Schedule reconnect process
        this.#clearConnectionTimeout();
        this.#timeoutId = setTimeout(this.#connect, this.#reconnectInterval);
    }

    #onTimeout(): void {
        // Reconnect when timeout reached
        this.#connect();
    }

    #onConnect(): void {
        // Reset reconnect state when WebSocket connected
        this.#clearConnectionTimeout();
        this.#reconnects = 0;
    }

    #onDisconnect(): void {
        if (!this.#doReconnect) return;
        this.#setConnectionTimeout();
    }

    constructor(url: string, connectionTimeout: number = 10000, reconnectInterval: number = 2, maxReconnects: number = 5) {
        this.#url = url;
        this.#reconnectInterval = reconnectInterval;
        this.#maxReconnects = maxReconnects;
        this.#connectionTimeout = connectionTimeout;
    }

    start(): void {
        this.#doReconnect = true;
        this.#reconnects = 0;
        this.#connect();
    }

    close(): void {
        this.#doReconnect = false;
        this.#connection?.close();
        this.#connection = null;
    }

    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
        if (this.#connection === null) throw new ErrorNotConnected("Connection is not opened");
        this.#connection.send(data);
    }

}