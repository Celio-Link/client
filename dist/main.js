import { CommandType, LinkDevice, LinkStatus, Mode } from './linkDevice.js';
import { Client } from './client.js';
let client = new Client('wss://server-production-e17f.up.railway.app');
let queue = [];
let linkDevice;
function handleData(data) {
    if (queue.length > 0) {
        let data = queue.shift();
        linkDevice.sendData(data);
        console.log("Sending data to device " + data.toString());
    }
    console.log("Device has send Data " + data.toString());
    if (data[0] == 0x00)
        return;
    if ((data[0] == 0xCAFE) && (data[1] == 0x11))
        return;
    client.sendBinary(data);
    const textFiled = document.querySelector('#output');
    if (textFiled) {
        data.forEach((number) => {
            textFiled.value += '0x' + number.toString(16) + ', ';
        });
        textFiled.value += '\r\n';
    }
}
function handleStatus(status) {
    const textFiled = document.querySelector('#input');
    console.log('Device notified state: ' + LinkStatus[status]);
    if (textFiled) {
        textFiled.value = '';
        textFiled.value += LinkStatus[status];
    }
    const message = { type: 'status', statusType: status };
    client.send(JSON.stringify({ message }));
}
client.bind('join', (message) => {
    const labelField = document.querySelector('#id');
    if (labelField) {
        labelField.textContent = message.id;
    }
});
client.bind('sessionCreate', (message) => {
    const labelField = document.querySelector('#sessionStatus');
    if (labelField) {
        labelField.textContent += ' Joinded by ' + message.otherId;
    }
});
client.bind('command', (message) => {
    linkDevice.sendCommand(message.commandType);
    console.log('Command send: ' + CommandType[message.commandType]);
});
client.bind('data', (data) => {
    data.arrayBuffer().then(buffer => {
        const array = new Uint16Array(buffer, 0, 8);
        const dataArray = Array.from(array);
        queue.push(dataArray);
    });
});
window.onload = function () {
    const connectButton = document.querySelector('#connect');
    if (connectButton) {
        connectButton.onclick = () => {
            const options = {
                filters: [
                    { vendorId: 0x2fe3, productId: 0x0100 },
                    { vendorId: 0x2fe3, productId: 0x00a },
                    { vendorId: 0x8086, productId: 0xf8a1 },
                ],
            };
            navigator.usb.requestDevice(options).then((device) => {
                linkDevice = new LinkDevice(device, handleData, handleStatus);
            });
        };
    }
    const linkButton = document.querySelector('#linkMode');
    if (linkButton) {
        linkButton.onclick = () => {
            if (linkDevice == null)
                return;
            let args = new Uint8Array(1);
            args[0] = Mode.onlineLink;
            linkDevice.sendCommand(CommandType.SetMode, args);
        };
    }
    // const emuButton = document.querySelector<HTMLButtonElement>('#emuMode');
    // if (emuButton) {
    //   emuButton.onclick = () => {
    //     if (linkDevice == null) return;
    //     let args: Uint8Array = new Uint8Array(1);
    //     args[0] = Mode.tradeEmu;
    //     linkDevice.sendCommand(CommandType.SetMode, args);
    //   };
    // }
    const joinButton = document.querySelector('#createSession');
    if (joinButton) {
        joinButton.onclick = () => {
            if (client == null)
                return;
            let sessionId = document
                .querySelector('#otherId')
                .value.trim();
            const message = {
                type: 'sessionCreate',
                otherId: sessionId,
            };
            client.send(JSON.stringify(message));
        };
    }
    client.connect();
};
//# sourceMappingURL=main.js.map