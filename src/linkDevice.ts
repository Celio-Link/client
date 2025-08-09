
export type UInt16 = number & { __uint16: true };
export type DataArray = [UInt16, UInt16, UInt16, UInt16, UInt16, UInt16, UInt16, UInt16];
export type DataHandler = (data: DataArray) => void;

export enum LinkStatus {
  GameboyConnected = 0xFF00,
  GameboyDisconnected = 0xFF01,

  HandshakeWaiting = 0xFF02,
  HandshakeReceived = 0xFF03,
  HandshakeFinished = 0xFF04,

  LinkConnected = 0xFF05,
  LinkReconnecting = 0xFF06,
  LinkClosed = 0xFF07,

  StatusDebug = 0xFFFF
}

export enum CommandType {
  SetMode = 0x00,
  SetModeMaster = 0x10,
  SetModeSlave = 0x11,
  StartHandshake= 0x12,
  ConnectLink = 0x13
}

export enum Mode {
  tradeEmu = 0x00,
  onlineLink = 0x01
}

export type StatusHandler = (status: LinkStatus) => void;

export class LinkDevice
{
  private device: USBDevice;
  readonly dataHandler: DataHandler;
  readonly statusHandler: StatusHandler;

  readonly statusEndpoint: number = 1
  readonly dataEndpoint: number = 2
  readonly endPointBufferSize: number = 64

  constructor(device: USBDevice, dataHandler: DataHandler, statusHandler: StatusHandler) {
    this.device = device;
    this.dataHandler = dataHandler
    this.statusHandler = statusHandler

    this.device.open().then( () => { return this.device.selectConfiguration(1)})
    .then( () => this.device.claimInterface(0))
    .then( () => {
      this.readStatus();
      this.readData();
    });
  }

  readData() {
    this.device.transferIn(this.dataEndpoint, this.endPointBufferSize).then((result: USBInTransferResult) => {
      if (result.data?.byteLength == 16) {
        const uint16Array = new Uint16Array(result.data.buffer, result.data.byteOffset, 8);
        const dataArray = Array.from(uint16Array) as DataArray;
        this.dataHandler(dataArray);
        this.readData()
      }
    }, (err: Error) => {console.log(err)})
  }

  readStatus() {
    this.device.transferIn(this.statusEndpoint, this.endPointBufferSize).then((result: USBInTransferResult) => {
      if (result.data?.byteLength == 2) {
        const uint8View = new Uint16Array(result.data.buffer);
        this.statusHandler(uint8View[0] as LinkStatus);
        this.readStatus()
      }
    }, (err: Error) => {console.log(err)})
  }

  sendData(data: DataArray) {
    const uint16Array = new Uint16Array(data);
    this.device.transferOut(this.dataEndpoint, uint16Array).then(
      (result: USBInTransferResult) => {console.log(result)},
      (err: Error) => {console.log(err)})
  }

  sendCommand(command: CommandType, args: Uint8Array = new Uint8Array(0)) {
    let message: Uint8Array<ArrayBuffer> = new Uint8Array(1 + args.length);
    message[0] = command;
    message.set(args, 1)
    this.device.transferOut(this.statusEndpoint, message).then(
      (result: USBInTransferResult) => {console.log(result)},
      (err: Error) => {console.log(err)})
  }
}