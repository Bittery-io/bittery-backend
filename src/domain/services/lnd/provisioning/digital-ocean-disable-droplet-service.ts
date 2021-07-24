import axios from 'axios';
import { DIGITAL_OCEAN_TOKEN } from './lnd-droplet-digital-ocean-provision-service';
import { logError, logInfo } from '../../../../application/logging-service';

export const deleteDigitalOceanDroplet = async (dropletId: number): Promise<void> => {
    try {
        await axios.delete(`https://api.digitalocean.com/v2/droplets/${dropletId}`,
            {
                headers: {
                    Authorization: `Bearer ${DIGITAL_OCEAN_TOKEN}`,
                },
            });
        logInfo(`Successfully deleted droplet with id: ${dropletId}`);
    } catch (err) {
        logError(`Deleting droplet with id ${dropletId} failed:`, err);
    }
};
