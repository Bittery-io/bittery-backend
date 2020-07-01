import jwt from 'jsonwebtoken';
import { getProperty } from '../../../application/property-service';
import { JwtToken } from '../../model/jwt-token';

export class UsersAuthorizationService {

    private jwtToken: JwtToken;

    constructor(jwtToken: JwtToken) {
        this.jwtToken = jwtToken;
    }

    async hasUserAccess(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            jwt.verify(this.jwtToken.accessToken, getProperty('OAUTH2_TOKEN_CLIENT_SECRET'), (err:any) => {
                if (err) {
                    return resolve(false);
                } else {
                    return resolve(true);
                }
            });
        });
    }

}
