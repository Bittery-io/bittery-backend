import express = require('express');
import { getArrayProperty, getProperty } from '../../../application/property-service';
import { Request, Response } from 'express-serve-static-core';
import { getAccessTokenFromAuthorizationHeader } from './token-extractor-service';
import { JwtToken } from '../../model/jwt-token';
import { getJWTOauthFromDatabase } from '../../repository/authentication-repository';
import jwt from 'jsonwebtoken';

export const authorizeRequest = async (req: Request, resp: Response, next: express.NextFunction): Promise<Response | void> => {
    return shouldNotAuthorizeRequest(req.path) ?
        next() :
        await validateScopeAccess(req, resp, next);
};

const validateScopeAccess = async (req: Request, resp: Response, next: express.NextFunction): Promise<Response | void> => {
    try {
        const authorizationHeader: string | undefined = req.headers!.authorization;
        return await hasUserAccess(getAccessTokenFromAuthorizationHeader(authorizationHeader)) ?
            next() :
            unauthorizedStatus(req, resp);
    } catch (err) {
        console.log('Error during validating scope access. ', err);
        return resp.status(401).send();
    }
};

const unauthorizedStatus = (req: Request, resp: Response): Response => {
    const authorization: string = req.headers!.authorization!;
    console.log(`Can not authorize selected path ${req.path} with Authorization header: ${authorization}`);
    return resp.status(401).send();
};

const hasUserAccess = async (accessToken: string): Promise<boolean> => {
    try {
        const userJwtToken: JwtToken = await getJWTOauthFromDatabase(accessToken);
        return new Promise((resolve, reject) => {
            jwt.verify(userJwtToken.accessToken, getProperty('OAUTH2_TOKEN_CLIENT_SECRET'), (err, decoded) => {
                if (err) {
                    return resolve(false);
                } else {
                    return resolve(true);
                }
            });
        });
    } catch (err) {
        const errorMessage: string = `Authorization error: ${err}`;
        console.log(errorMessage);
        throw new Error(errorMessage);
    }
};

const shouldNotAuthorizeRequest = (requestPath: string): boolean => {
    return getArrayProperty('AUTH_EXCLUDED_URLS').filter(url => requestPath === url).length > 0;
};
