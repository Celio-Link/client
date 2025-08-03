import { client } from 'websocket';
import { JoinMessage } from './messages';
import { DataArray } from './linkDevice';

export type ClientHandler = (message: any) => void;

export class Client {
  callbackMap = new Map<String, ClientHandler>();
  socket: WebSocket | undefined;

  constructor(private url: string) {}

  private dispatch(event: MessageEvent) {
    console.log(`Received event: ${JSON.stringify(event)}`);
    if (typeof event.data === 'string') {
      const message = JSON.parse(event.data);
      let clientHandler: ClientHandler | undefined = this.callbackMap.get(
        message.type,
      );
      if (clientHandler === undefined) {
        console.log('No client handler found for ' + message.type);
        return;
      }
      clientHandler(message);
    }
    else if (event.data instanceof Blob) {
      let handler: ClientHandler | undefined = this.callbackMap.get('data')
      if (handler === undefined) {
        console.log('No data handler in client');
        return;
      }
      handler(event.data);
    }

  }

  bind(eventName: String, callback: ClientHandler) {
    this.callbackMap.set(eventName, callback);
  }

  connect() {
    if (this.socket) return;

    this.socket = new WebSocket(this.url);
    if (this.socket) {
      this.socket.addEventListener('open', () => {
        console.log('Connected to server');
        this.socket!.addEventListener('message', this.dispatch.bind(this));
      });
    }
  }

  send(message: string) {
    this.socket?.send(message);
  }

  sendBinary(data: DataArray) {
    this.socket?.send(new Uint16Array(data))
  }
}