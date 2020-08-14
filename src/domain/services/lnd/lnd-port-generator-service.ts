import { findCurrentHighestLndPort } from '../../repository/user-lnds-repository';
import { logInfo } from '../../../application/logging-service';
import { isPortFreeToUse } from './is-port-free-to-use-service';

export const generateNextLndPortToUse = async (): Promise<number> => {
    let currentHighestLndPort: number | undefined = await findCurrentHighestLndPort();
    if (!currentHighestLndPort) {
        // should start from 1025 but later +1 so 1024
        currentHighestLndPort = 1024;
    }
    if (currentHighestLndPort === 65535) {
        throw new Error('Fuck me. No more ports to use for LND all are used!');
    } else {
        let nextLndPortToUse: number = currentHighestLndPort + 1;
        let isPortFree: boolean = true;
        do {
            isPortFree = await isPortFreeToUse(nextLndPortToUse);
            if (isPortFree) {
                logInfo(`Next generated LND port ${nextLndPortToUse} is free to use!`);
                break;
            } else {
                nextLndPortToUse = currentHighestLndPort + 1;
                logInfo(`Next generated LND port ${nextLndPortToUse - 1} is busy, trying next one: ${nextLndPortToUse}`);
            }
        } while (!isPortFree);
        return nextLndPortToUse;
    }
};
