import { InMemoryDatabase } from '../../application/db/in-memory-database';
import { JwtToken } from '../model/jwt-token';

const IN_MEMORY_DATABASE: InMemoryDatabase<string, JwtToken> = new InMemoryDatabase<string, JwtToken>();

export const storeJWTOauthInDatabase = (accessToken: string, jwtToken: JwtToken) => {
    IN_MEMORY_DATABASE.setEntry(accessToken, jwtToken);
};

export const getJWTOauthFromDatabase = (accessToken: string): JwtToken => {
    return IN_MEMORY_DATABASE.getValue(accessToken);
};
