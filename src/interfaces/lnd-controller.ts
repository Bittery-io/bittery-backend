import { Response } from 'express-serve-static-core';
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
import { logError } from '../application/logging-service';
import { Authorized, Body, Get, HeaderParam, JsonController, Post, Res } from 'routing-controllers/index';
import { getMacaroon } from '../application/lnd-connect-service';

@JsonController('/lnd')
@Authorized()
export class LndController {

    @Post('/')
    async createLndApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            await createUserLnd(userEmail);
            return res.status(200).send();
        } catch (err) {
            if (err instanceof LndCreateException) {
                return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
            }
            logError('Failed to add user LND services', err);
            return res.status(500).send(new ErrorDto('LND services creation failed',
                LndCreationErrorType.LND_CREATION_FAILED_SERVER_ERROR));
        }
    }

    @Post('/existing')
    async saveExistingLndApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response,
            @Body({ required: true }) saveUserLndDto: SaveUserLndDto): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            await addExistingUserLnd(userEmail, saveUserLndDto);
            return res.status(200).send();
        } catch (err) {
            if (err instanceof LndCreateException) {
                return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
            }
            logError('Failed to add user LND services', err);
            return res.status(500).send(new ErrorDto('LND services creation failed',
                LndCreationErrorType.LND_CREATION_FAILED_SERVER_ERROR));
        }
    }

    @Get('/user')
    async getUserLndApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        const userLndDto: UserLndDto | undefined = await getUserLnd(userEmail);
        if (userLndDto) {
            return res.send(userLndDto);
        } else {
            return res.status(404).send();
        }
    }

    @Get('/custom')
    async getCustomLndApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        const customLndDto: CustomLndDto | undefined = await getCustomUserLnd(userEmail);
        if (customLndDto) {
            return res.send(customLndDto);
        } else {
            return res.status(404).send();
        }
    }

    async getLndFileApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response, fileName: string) {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            const tlsCertificateFile: Buffer = Buffer.from(await getDomainLndFile(userEmail, ''), 'binary');
            res.contentType('application/x-binary');
            return res.status(200).send(tlsCertificateFile);
            // Spróbuj to
            // res.download()
        } catch (err) {
            logError(`Getting lnd ${fileName} certificate for user ${userEmail} failed with error: `, err);
            return res.sendStatus(400);
        }
    }

    @Get('/files/tls/custom')
    async getCustomTlsFile(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        const customTlsCertText: string | undefined = await findCustomLndTlsCert(userEmail);
        if (customTlsCertText) {
            const tlsCertificateFile: Buffer = Buffer.from(customTlsCertText, 'utf-8');
            res.contentType('text/plain');
            return res.status(200).send(tlsCertificateFile);
        } else {
            return res.sendStatus(404);
        }
    }

    @Get('/files/tls')
    async getTlsCertificateFileApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        return await this.getLndFileApi(authorizationHeader, res, 'tls.cert');
    }

    @Get('/files/macaroon')
    async getAdminMacaroonFileApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        return await this.getLndFileApi(authorizationHeader, res, 'admin.macaroon');
    }
}
