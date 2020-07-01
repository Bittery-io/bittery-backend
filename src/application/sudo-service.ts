import { getProperty } from './property-service';

const sudo = require('sudo-js');
sudo.setPassword(getProperty('SUDO_PASS'));

export const runAsSudo = (command: string[], callback: Function) => {
    sudo.exec(command, (err: any, pid: any, result: any) => {
        console.log('Run as sudo result: ', result);
        callback();
    });
};
