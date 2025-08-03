export var LinkStatus;
(function (LinkStatus) {
    LinkStatus[LinkStatus["GameboyConnected"] = 65280] = "GameboyConnected";
    LinkStatus[LinkStatus["GameboyDisconnected"] = 65281] = "GameboyDisconnected";
    LinkStatus[LinkStatus["HandshakeWaiting"] = 65282] = "HandshakeWaiting";
    LinkStatus[LinkStatus["HandshakeReceived"] = 65283] = "HandshakeReceived";
    LinkStatus[LinkStatus["HandshakeFinished"] = 65284] = "HandshakeFinished";
    LinkStatus[LinkStatus["LinkConnected"] = 65285] = "LinkConnected";
    LinkStatus[LinkStatus["LinkReconnecting"] = 65286] = "LinkReconnecting";
    LinkStatus[LinkStatus["LinkClosed"] = 65287] = "LinkClosed";
    LinkStatus[LinkStatus["StatusDebug"] = 65535] = "StatusDebug";
})(LinkStatus || (LinkStatus = {}));
export var CommandType;
(function (CommandType) {
    CommandType[CommandType["SetMode"] = 0] = "SetMode";
    CommandType[CommandType["SetModeMaster"] = 16] = "SetModeMaster";
    CommandType[CommandType["SetModeSlave"] = 17] = "SetModeSlave";
    CommandType[CommandType["StartHandshake"] = 18] = "StartHandshake";
    CommandType[CommandType["ConnectLink"] = 19] = "ConnectLink";
})(CommandType || (CommandType = {}));
export var Mode;
(function (Mode) {
    Mode[Mode["tradeEmu"] = 0] = "tradeEmu";
    Mode[Mode["onlineLink"] = 1] = "onlineLink";
})(Mode || (Mode = {}));
export class LinkDevice {
    constructor(device, dataHandler, statusHandler) {
        Object.defineProperty(this, "device", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "dataHandler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "statusHandler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "statusEndpoint", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "dataEndpoint", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 2
        });
        Object.defineProperty(this, "endPointBufferSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 64
        });
        this.device = device;
        this.dataHandler = dataHandler;
        this.statusHandler = statusHandler;
        this.device.open().then(() => { return this.device.selectConfiguration(1); })
            .then(() => this.device.claimInterface(0))
            .then(() => {
            this.readStatus();
            this.readData();
        });
    }
    readData() {
        this.device.transferIn(this.dataEndpoint, this.endPointBufferSize).then((result) => {
            if (result.data?.byteLength == 16) {
                const uint16Array = new Uint16Array(result.data.buffer, result.data.byteOffset, 8);
                const dataArray = Array.from(uint16Array);
                this.dataHandler(dataArray);
                this.readData();
            }
        }, (err) => { console.log(err); });
    }
    readStatus() {
        this.device.transferIn(this.statusEndpoint, this.endPointBufferSize).then((result) => {
            if (result.data?.byteLength == 2) {
                const uint8View = new Uint16Array(result.data.buffer);
                this.statusHandler(uint8View[0]);
                this.readStatus();
            }
        }, (err) => { console.log(err); });
    }
    sendData(data) {
        const uint16Array = new Uint16Array(data);
        this.device.transferOut(this.dataEndpoint, uint16Array).then((result) => { console.log(result); }, (err) => { console.log(err); });
        console.log("Transferring data to device: ", +uint16Array.toString());
    }
    sendCommand(command, args = new Uint8Array(0)) {
        let message = new Uint8Array(1 + args.length);
        message[0] = command;
        message.set(args, 1);
        this.device.transferOut(this.statusEndpoint, message).then((result) => { console.log(result); }, (err) => { console.log(err); });
    }
}
//# sourceMappingURL=linkDevice.js.map