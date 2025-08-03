import { CommandType, DataArray, LinkDevice, LinkStatus, Mode} from './linkDevice.js';
import { Client } from './client.js';
import { CommandMessage, JoinMessage, SessionCreationMessage, StatusMessage, } from './messages';

let client = new Client('ws://localhost:8080');
let queue: DataArray[] = [];
let linkDevice: LinkDevice;

function handleData(data: DataArray) {
  if (queue.length > 0) {
    linkDevice.sendData(queue.shift()!)
  }
  console.log("Device has send Data" + data.toString())
  if (data[0] == 0x00) return;
  if ((data[0] == 0xCAFE) && (data[1] == 0x11)) return;

  client.sendBinary(data);

  const textFiled: HTMLTextAreaElement | null = document.querySelector<HTMLTextAreaElement>('#output');
  if (textFiled) {
    data.forEach((number) => {
      textFiled.value += '0x' + number.toString(16) + ', ';
    });
    textFiled.value += '\r\n';
  }
}

function handleStatus(status: LinkStatus) {
  if (
    status === LinkStatus.GameboyConnected ||
    status === LinkStatus.GameboyDisconnected
  ) {
    const textFiled: HTMLTextAreaElement | null = document.querySelector<HTMLTextAreaElement>('#input');
    console.log('Device notified state: ' + LinkStatus[status]);
    if (textFiled) {
      textFiled.value = '';
      textFiled.value += LinkStatus[status];
    }
  } else if (status === LinkStatus.StatusDebug) {
    console.log('Debug State: ' + LinkStatus[status]);
  } else {
    const message: StatusMessage = { type: 'status', statusType: status };
    client.send(JSON.stringify({ message }));
  }
}

client.bind('join', (message: JoinMessage) => {
  const labelField: HTMLLabelElement | null = document.querySelector<HTMLLabelElement>('#id');
  if (labelField) {
    labelField.textContent = message.id;
  }
});

client.bind('sessionCreate', (message: SessionCreationMessage) => {
  const labelField: HTMLLabelElement | null = document.querySelector<HTMLLabelElement>('#sessionStatus');
  if (labelField) {
    labelField.textContent += ' Joinded by ' + message.otherId;
  }
});

client.bind('command', (message: CommandMessage) => {
  linkDevice.sendCommand(message.commandType);
  console.log('Command send: ' + CommandType[message.commandType]);
});

client.bind('data', (data: Blob) => {
  data.arrayBuffer().then(buffer => {
    const array = new Uint16Array(buffer, 0, 8);
    const dataArray = Array.from(array) as DataArray;
    queue.push(dataArray)
    console.log('Data received: ' + data.toString());
  })
});

window.onload = function () {
  const connectButton = document.querySelector<HTMLButtonElement>('#connect');
  if (connectButton) {
    connectButton.onclick = () => {
      const options: USBDeviceRequestOptions = {
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

  const linkButton = document.querySelector<HTMLButtonElement>('#linkMode');
  if (linkButton) {
    linkButton.onclick = () => {
      if (linkDevice == null) return;
      let args: Uint8Array = new Uint8Array(1);
      args[0] = Mode.onlineLink;
      linkDevice.sendCommand(CommandType.SetMode, args);
    };
  }

  const emuButton = document.querySelector<HTMLButtonElement>('#emuMode');
  if (emuButton) {
    emuButton.onclick = () => {
      if (linkDevice == null) return;
      let args: Uint8Array = new Uint8Array(1);
      args[0] = Mode.tradeEmu;
      linkDevice.sendCommand(CommandType.SetMode, args);
    };
  }

  const joinButton =
    document.querySelector<HTMLButtonElement>('#createSession');
  if (joinButton) {
    joinButton.onclick = () => {
      if (client == null) return;
      let sessionId: string | null = document
        .querySelector<HTMLInputElement>('#otherId')!
        .value.trim();
      const message: SessionCreationMessage = {
        type: 'sessionCreate',
        otherId: sessionId,
      };
      client.send(JSON.stringify(message));
    };
  }

  const masterButton = document.querySelector<HTMLButtonElement>('#master');
  if (masterButton) {
    masterButton.onclick = () => {
      if (linkDevice == null) return;
      let args: Uint8Array = new Uint8Array(1);
      args[0] = Mode.onlineLink;
      linkDevice.sendCommand(CommandType.SetModeMaster);
    };
  }

  const slaveButton = document.querySelector<HTMLButtonElement>('#slave');
  if (slaveButton) {
    slaveButton.onclick = () => {
      if (linkDevice == null) return;
      let args: Uint8Array = new Uint8Array(1);
      args[0] = Mode.tradeEmu;
      linkDevice.sendCommand(CommandType.SetModeSlave);
    };
  }

  client.connect();
};