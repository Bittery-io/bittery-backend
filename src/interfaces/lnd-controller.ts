import { Response } from 'express-serve-static-core';
import { getUserEmailFromAccessTokenInAuthorizationHeader } from '../domain/services/auth/token-extractor-service';
import { LndCreateException } from '../domain/model/lnd/lnd-create-exception';
import { ErrorDto } from './dto/error-dto';
import { UserLndDto } from './dto/user-lnd-dto';
import { LndCreationErrorType } from '../domain/model/lnd/lnd-creation-error-type';
import {
    addExternalLnd,
    createLnd,
    getCustomUserLnd,
    getUserLnd,
} from '../domain/services/lnd/create-user-lnd-service';
import { readAdminMacaroonBase64FromLnd } from '../domain/services/lnd/lnd-files-service';
import { SaveUserLndDto } from './dto/save-user-lnd-dto';
import { CustomLndDto } from './dto/custom-lnd-dto';
import { logError } from '../application/logging-service';
import { Authorized, Body, Controller, Get, HeaderParam, JsonController, Post, Res } from 'routing-controllers/index';
import { CreateLndDto } from './dto/lnd/create-lnd-dto';
import { Param } from 'routing-controllers';
import { generateLndSeed, initLndWallet, unlockLnd } from '../domain/services/lnd/lnd-service';
import { LndInitWalletDto } from './dto/lnd/lnd-init-wallet-dto';
import { LndInitWalletResponseDto } from './dto/lnd/lnd-init-wallet-response-dto';
import { UnlockLndDto } from './dto/lnd/unlock-lnd-dto';
import { restartLnd } from '../domain/services/lnd/restart-lnd-service';
import { findUserLndTls } from '../domain/repository/lnd/lnds-repository';

@JsonController('/lnd')
@Authorized()
export class LndController {

    @Post('/')
    async createLndApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Body({ required: true }) createLndDto: CreateLndDto,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            await createLnd(userEmail, createLndDto);
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

    @Post('/external')
    async saveExternalLndApi(
        @HeaderParam('authorization', { required: true }) authorizationHeader: string,
        @Res() res: Response,
        @Body({ required: true }) saveUserLndDto: SaveUserLndDto): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            await addExternalLnd(userEmail, saveUserLndDto);
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

    @Get('/:lndId/seed')
    async generateSeedMnemonic(
        @HeaderParam('authorization', { required: true }) authorizationHeader: string,
        @Param('lndId') lndId: string,
        @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        const seed: string[] | undefined = await generateLndSeed(userEmail, lndId);
        if (seed) {
            return res.send(seed);
        } else {
            return res.status(400).send();
        }
    }

    @Post('/:lndId/initwallet')
    async initLndWalletApi(
        @HeaderParam('authorization', { required: true }) authorizationHeader: string,
        @Param('lndId') lndId: string,
        @Body({ required: true }) initWalletDto: LndInitWalletDto,
        @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        const lndInitWalletResponseDto: LndInitWalletResponseDto | undefined = await initLndWallet(userEmail, lndId,
            initWalletDto);
        if (lndInitWalletResponseDto) {
            return res.send(lndInitWalletResponseDto);
        } else {
            return res.status(400).send();
        }
    }

    @Post('/:lndId/unlock')
    async unlockLndApi(
        @HeaderParam('authorization', { required: true }) authorizationHeader: string,
        @Param('lndId') lndId: string,
        @Body({ required: true }) unlockLndDto: UnlockLndDto,
        @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        const unlocked: boolean = await unlockLnd(userEmail, lndId, unlockLndDto.password);
        if (unlocked) {
            return res.sendStatus(200);
        } else {
            return res.status(400).send();
        }
    }

    @Get('/:lndId/restart')
    async restartLndApi(
        @HeaderParam('authorization', { required: true }) authorizationHeader: string,
        @Param('lndId') lndId: string,
        @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            await restartLnd(lndId, userEmail);
            return res.sendStatus(200);
        } catch (err) {
            logError(`Restarting LND with id ${lndId} for user ${userEmail} failed!`, err);
            return res.status(400).send();
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

    @Get('/files/tls/custom')
    async getCustomTlsFile(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        // todo zrobic
        // const customTlsCertText: string | undefined = await findCustomLndTlsCert(userEmail);
        const customTlsCertText: string | undefined = undefined;
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
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            const tlsCert: string | undefined = await findUserLndTls(userEmail);
            if (tlsCert) {
                const tlsCertificateFile: Buffer = Buffer.from(tlsCert, 'utf-8');
                res.contentType('text/plain');
                return res.status(200).send(tlsCertificateFile);
            } else {
                return res.sendStatus(404);
            }
        } catch (err) {
            logError(`Getting lnd tls.cert file for user ${userEmail} failed with error: `, err);
            return res.sendStatus(400);
        }
    }

    @Get('/files/macaroon')
    async getAdminMacaroonFileApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            // const macaroonBase64: string = await readAdminMacaroonBase64FromLnd(userEmail);
            // return res.status(200).send({
            //     fileBase64: macaroonBase64,
            // });
            return res.status(200).send();
        } catch (err) {
            logError(`Getting lnd admin.cert file for user ${userEmail} failed with error: `, err);
            return res.sendStatus(400);
        }
    }
}
