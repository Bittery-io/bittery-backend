import { findCurrentHighestLndPort } from '../../repository/user-lnds-repository';
import { isPortFreeToUse } from '../../../application/infrastructure-invoke-service-client-service';

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
        while (isPortFree) {
            isPortFree = await isPortFreeToUse(nextLndPortToUse);
            if (isPortFree) {
                console.log(`Next generated LND port ${nextLndPortToUse} is free to use!`);
                break;
            } else {
                nextLndPortToUse = currentHighestLndPort + 1;
                console.log(`Next generated LND port ${nextLndPortToUse - 1} is busy, trying next one: ${nextLndPortToUse}`);
            }
        }
        return nextLndPortToUse;
    }
};
