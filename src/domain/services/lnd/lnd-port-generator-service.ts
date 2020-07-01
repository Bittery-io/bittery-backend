import { findCurrentHighestLndPort } from '../../repository/user-lnds-repository';

const excludedPorts: number[] = [8080, 8000, 9000, 5432];

export const generateNextLndPortToUse = async (): Promise<number> => {
    const currentHighestLndPort: number | undefined = await findCurrentHighestLndPort();
    if (currentHighestLndPort) {
        if (currentHighestLndPort === 65535) {
            throw new Error('Fuck me. No more ports to use for LND all are used!');
        } else {
            let nextLndPortToUse: number = currentHighestLndPort + 1;
            let isPortNotOk: boolean = true;
            while (isPortNotOk) {
                isPortNotOk = excludedPorts.filter(port => port === currentHighestLndPort).length > 0;
                nextLndPortToUse = currentHighestLndPort + 1;
            }
            return nextLndPortToUse;
        }
    } else {
        // Just not taking first 1024 addresses
        return 1025;
    }
};
