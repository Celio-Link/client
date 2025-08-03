export class Client {
    constructor(url) {
        Object.defineProperty(this, "url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: url
        });
        Object.defineProperty(this, "callbackMap", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "socket", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    dispatch(event) {
        console.log(`Received event: ${JSON.stringify(event)}`);
        if (typeof event.data === 'string') {
            const message = JSON.parse(event.data);
            let clientHandler = this.callbackMap.get(message.type);
            if (clientHandler === undefined) {
                console.log('No client handler found for ' + message.type);
                return;
            }
            clientHandler(message);
        }
        else if (event.data instanceof Blob) {
            let handler = this.callbackMap.get('data');
            if (handler === undefined) {
                console.log('No data handler in client');
                return;
            }
            handler(event.data);
        }
    }
    bind(eventName, callback) {
        this.callbackMap.set(eventName, callback);
    }
    connect() {
        if (this.socket)
            return;
        this.socket = new WebSocket(this.url);
        if (this.socket) {
            this.socket.addEventListener('open', () => {
                console.log('Connected to server');
                this.socket.addEventListener('message', this.dispatch.bind(this));
            });
        }
    }
    send(message) {
        this.socket?.send(message);
    }
    sendBinary(data) {
        this.socket?.send(new Uint16Array(data));
    }
}
//# sourceMappingURL=client.js.map