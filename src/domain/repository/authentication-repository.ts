import { InMemoryDatabase } from '../../application/db/in-memory-database';

const IN_MEMORY_DATABASE: InMemoryDatabase<string, string> = new InMemoryDatabase<string, string>();

export const storeJWTOauthInDatabase = (userEmail: string, jwtToken: string) => {
    IN_MEMORY_DATABASE.setEntry(userEmail, jwtToken);
};

export const getJWTOauthFromDatabase = (userEmail: string): string | undefined => {
    try {
        return IN_MEMORY_DATABASE.getValue(userEmail);
    } catch (err) {
        return undefined;
    }
};
