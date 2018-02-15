import { Component, NgZone } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { BLE } from '@ionic-native/ble';

import { DetailPage } from '../detail/detail'

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  
  devices: any[] = [];
  connectedDevices: any[] = [];
  statusMessage: string;
  selectedDevices: string[];

  constructor(
    public navCtrl: NavController, 
    private toastCtrl: ToastController,
    private ble: BLE,
    private ngZone: NgZone
  ) { }

  ionViewDidEnter() {
    console.log('ionViewDidEnter');
    this.scan();
  }

  scan() {
    this.setStatus('Scanning for Bluetooth LE Devices');
    this.devices = [];  // clear list
    this.ble.scan([], 5).subscribe(
      device => this.onDeviceDiscovered(device), 
      error => this.scanError(error)
    );

    setTimeout(this.setStatus.bind(this), 5000, 'Scan complete');
  }

  onDeviceDiscovered(device) {
    // console.log('Discovered ' + JSON.stringify(device, null, 2));
    this.ngZone.run(() => {
      this.devices.push(device);
    });
    try {
      this.devices.sort((a, b) => a.rssi > b.rssi ? -1 : 1);
    } catch (error) {
      console.error(error);
    }
  }

  // If location permission is denied, you'll end up here
  scanError(error) {
    this.setStatus('Error ' + error);
    let toast = this.toastCtrl.create({
      message: 'Error scanning for Bluetooth low energy devices',
      position: 'middle',
      duration: 5000
    });
    toast.present();
  }

  setStatus(message) {
    this.ngZone.run(() => {
      this.statusMessage = message;
    });
  }

  connectSelectedDevices() {
    this.devices.filter(d => d.state).forEach(device => {
      this.setStatus('Connecting to ' + device.name || device.id);
      this.ble.connect(device.id).subscribe(
        peripheral => this.onConnected(peripheral),
        peripheral => this.onDeviceDisconnected(peripheral)
      )
    })
  }

  connectDevice(device) {
    this.setStatus('Connecting to ' + device.name || device.id);
    this.ble.connect(device.id).subscribe(
      peripheral => this.onConnected(peripheral),
      peripheral => this.onDeviceDisconnected(peripheral)
    );
  }

  onConnected(peripheral) {
    this.ngZone.run(() => {
      this.setStatus(peripheral.name || peripheral.id + ' connected!');
      this.connectedDevices.push(peripheral);
      this.devices = this.devices.filter(d => d.id != peripheral.id);
    });
  }

  onDeviceDisconnected(peripheral) {
    let toast = this.toastCtrl.create({
      message: 'The peripheral unexpectedly disconnected',
      duration: 3000,
      position: 'middle'
    });
    toast.present();
  }

  sendMessageAll() {
    var hex = 'ea2eb1';
    var data = new Uint8Array(hex.match(/[\da-f]{2}/gi).map((h) => parseInt(h, 16)));
    this.connectedDevices.forEach(peripheral => {
      peripheral['characteristics'].forEach(char => {
        this.ble.write(peripheral.id, char.service, char.characteristic, data.buffer)
        .then(console.log).catch(console.error)
      });
    })
  }

  deviceSelected(device) {
    this.navCtrl.push(DetailPage, {
      device: device
    });
  }

  sendMessage(peripheral) {
    var hex = 'ea2eb1';
    var data = new Uint8Array(hex.match(/[\da-f]{2}/gi).map((h) => parseInt(h, 16)));
    peripheral['characteristics'].forEach(char => {
      this.ble.write(peripheral.id, char.service, char.characteristic, data.buffer)
      .then(console.log).catch(console.error)
    });
  }
}