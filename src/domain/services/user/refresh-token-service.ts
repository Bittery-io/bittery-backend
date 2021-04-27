import { generateJwtToken, verifyUserTokenAndGetUserEmailAndPasswordProof } from '../jwt/session-token-service';
import { RefreshTokenException } from './refresh-token-exception';

export const refreshToken = async (refreshToken: string): Promise<string> => {
    try {
        const resp: any = await verifyUserTokenAndGetUserEmailAndPasswordProof(refreshToken);
        return generateJwtToken(resp.userId, resp.passwordProof);
    } catch (err) {
        const message: string = `Refresh token failed because - it should not happen but decoding JWT refresh token failed: ${refreshToken}`;
        throw new RefreshTokenException(message);
    }
};
