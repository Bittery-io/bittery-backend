import { Request, Response } from 'express-serve-static-core';
import { getUserEmailFromAccessTokenInAuthorizationHeader } from '../domain/services/auth/token-extractor-service';
import { LndCreateException } from '../domain/model/lnd/lnd-create-exception';
import { ErrorDto } from './dto/error-dto';
import { UserLndDto } from './dto/user-lnd-dto';
import { LndCreationErrorType } from '../domain/model/lnd/lnd-creation-error-type';
import {
    addExistingUserLnd,
    createUserLnd,
    getCustomUserLnd,
    getUserLnd,
} from '../domain/services/lnd/create-user-lnd-service';
import { getDomainLndFile } from '../domain/services/lnd/lnd-files-service';
import { SaveUserLndDto } from './dto/save-user-lnd-dto';
import { CustomLndDto } from './dto/custom-lnd-dto';
import { findCustomLndTlsCert } from '../domain/repository/custom-lnds-repository';

export const createLndApi = async (req: Request, res: Response): Promise<Response> => {
    const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(req);
    try {
        await createUserLnd(userEmail);
        return res.status(200).send();
    } catch (err) {
        if (err instanceof LndCreateException) {
            return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
        }
        console.log('Failed to add user LND services', err);
        return res.status(500).send(new ErrorDto('LND services creation failed',
            LndCreationErrorType.LND_CREATION_FAILED_SERVER_ERROR));
    }
};

export const saveExistingLndApi = async (req: Request, res: Response): Promise<Response> => {
    const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(req);
    try {
        const saveUserLndDto: SaveUserLndDto = req.body;
        await addExistingUserLnd(userEmail, saveUserLndDto);
        return res.status(200).send();
    } catch (err) {
        if (err instanceof LndCreateException) {
            return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
        }
        console.log('Failed to add user LND services', err);
        return res.status(500).send(new ErrorDto('LND services creation failed',
            LndCreationErrorType.LND_CREATION_FAILED_SERVER_ERROR));
    }
};

export const getUserLndApi = async (req: Request, res: Response): Promise<Response> => {
    const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(req);
    const userLndDto: UserLndDto | undefined = await getUserLnd(userEmail);
    if (userLndDto) {
        return res.send(userLndDto);
    } else {
        return res.status(404).send();
    }
};

export const getCustomLndApi = async (req: Request, res: Response): Promise<Response> => {
    const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(req);
    const customLndDto: CustomLndDto | undefined = await getCustomUserLnd(userEmail);
    if (customLndDto) {
        return res.send(customLndDto);
    } else {
        return res.status(404).send();
    }
};

async function getLndFileApi(req: Request, res: Response, fileName: string) {
    const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(req);
    try {
        const tlsCertificateFile: Buffer = await getDomainLndFile(userEmail, fileName);
        res.contentType('text/plain');
        return res.status(200).send(tlsCertificateFile);
        // Spróbuj to
        // res.download()
    } catch (err) {
        console.log(`Getting lnd ${fileName} certificate for user ${userEmail} failed with error: `, err);
        return res.sendStatus(400);
    }
}

export const getCustomTlsFile =  async (req: Request, res: Response) => {
    const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(req);
    const customTlsCertText: string | undefined = await findCustomLndTlsCert(userEmail);
    if (customTlsCertText) {
        const tlsCertificateFile: Buffer = Buffer.from(customTlsCertText, 'utf-8');
        res.contentType('text/plain');
        return res.status(200).send(tlsCertificateFile);
    } else {
        return res.sendStatus(404);
    }
};

export const getTlsCertificateFileApi = async (req: Request, res: Response): Promise<Response> => {
    return await getLndFileApi(req, res, 'tls.cert');
};

export const getAdminMacaroonFileApi = async (req: Request, res: Response): Promise<Response> => {
    return await getLndFileApi(req, res, 'admin.macaroon');
};
