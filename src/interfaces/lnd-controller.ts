import { Response } from 'express-serve-static-core';
import { getUserEmailFromAccessTokenInAuthorizationHeader } from '../domain/services/auth/token-extractor-service';
import { LndCreateException } from '../domain/model/lnd/lnd-create-exception';
import { ErrorDto } from './dto/error-dto';
import { UserLndDto } from './dto/user-lnd-dto';
import { LndCreationErrorType } from '../domain/model/lnd/lnd-creation-error-type';
import {
    addExternalLnd,
    createLnd,
    getUserLnd, getUserLndConnectUriDetails,
} from '../domain/services/lnd/create-user-lnd-service';
import { SaveExternalLndDto } from './dto/save-external-lnd-dto';
import { logError, logInfo } from '../application/logging-service';
import { Authorized, Body, Get, HeaderParam, JsonController, Post, QueryParam, Res } from 'routing-controllers/index';
import { CreateLndDto } from './dto/lnd/create-lnd-dto';
import { Param } from 'routing-controllers';
import { generateLndSeed, initLndWallet, unlockLnd } from '../domain/services/lnd/lnd-service';
import { LndInitWalletDto } from './dto/lnd/lnd-init-wallet-dto';
import { LndInitWalletResponseDto } from './dto/lnd/lnd-init-wallet-response-dto';
import { UnlockLndDto } from './dto/lnd/unlock-lnd-dto';
import { restartLnd } from '../domain/services/lnd/restart-lnd-service';
import { findUserLndTls } from '../domain/repository/lnd/lnds-repository';
import { SaveEncryptedAdminMacaroonDto } from './dto/lnd/save-encrypted-admin-macaroon-dto';
import {
    findAdminMacaroonHexEncryptedArtefact,
    findLnPasswordEncryptedArtefact,
    findLnSeedMnemonicEncryptedArtefact, findUserEncryptedLnArtefacts,
    updateAdminMacaroonHexEncryptedArtefact,
} from '../domain/repository/encrypted/user-encrypted-ln-artefacts-repository';
import { EncryptedArtefactDto } from './dto/encrypted-artefact-dto';
import { getLndStaticChannelBackupClientReadViews } from '../domain/repository/lnd/static-channel-backup/lnd-static-channek-backup-repository';
import { LndStaticChannelBackupClientReadView } from '../domain/model/lnd/static-channel-backup/lnd-static-channel-backup-client-read-view';
import { StaticChannelBackupDto } from './dto/lnd/static-channel-backup/static-channel-backup-dto';
import { SingleStaticChannelBackupDto } from './dto/lnd/static-channel-backup/single-static-channel-backup-dto';
import { getMillisecondsToNextStaticChannekBackup } from '../domain/services/lnd/static-channel-backup/static-channel-backup-scheduler-service';
import { getLnFullBackup } from '../domain/services/lnd/backup/ln-backup-service';
import { LndFullBackupDto } from './dto/lnd/backup/lnd-full-backup-dto';
import { LndConnectUriDto } from './dto/lnd/lnd-connect-uri-dto';

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
            @Body({ required: true }) saveUserLndDto: SaveExternalLndDto): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            await addExternalLnd(userEmail, saveUserLndDto);
            return res.status(200).send();
        } catch (err) {
            if (err instanceof LndCreateException) {
                return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
            }
            logError(`Failed to add external LND for user ${userEmail}`, err);
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

    @Post('/:lndId/adminmacaroon')
    async saveEncryptedMacaroonApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Param('lndId') lndId: string,
            @Body({ required: true }) saveEncryptedAdminMacaroonDto: SaveEncryptedAdminMacaroonDto,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        await updateAdminMacaroonHexEncryptedArtefact(userEmail, lndId, saveEncryptedAdminMacaroonDto.encryptedAdminMacaroonHex);
        logInfo(`Successfully updated admin macaroon for user ${userEmail} and lnd id ${lndId}`);
        return res.sendStatus(200);
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

    @Get('/:lndId/files/tls')
    async getTlsCertificateFileApi(
            @Param('lndId') lndId: string,
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            const tlsCert: string | undefined = await findUserLndTls(userEmail, lndId);
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

    @Get('/:lndId/files/macaroon')
    async getAdminMacaroonHexApi(
            @Param('lndId') lndId: string,
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            const encryptedAdminMacaroonHex: string | undefined = await findAdminMacaroonHexEncryptedArtefact(userEmail, lndId);
            if (encryptedAdminMacaroonHex) {
                logInfo(`Successfully returned encrypted admin macaroon for email ${userEmail} and lnd id ${lndId}`);
                return res.status(200).send(new EncryptedArtefactDto(encryptedAdminMacaroonHex));
            } else {
                logError(`Failed to return encrypted admin macaroon for email ${userEmail} and lnd id ${lndId} because LND not found`);
                return res.sendStatus(400);
            }
        } catch (err) {
            logError(`Returning encrypted admin macaroon for email ${userEmail} and lnd id ${lndId} failed with err:`, err);
            return res.sendStatus(400);
        }
    }

    @Get('/:lndId/password')
    async getLnNodeEncryptedPassword(
            @Param('lndId') lndId: string,
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            const encryptedAdminMacaroon: string | undefined = await findLnPasswordEncryptedArtefact(userEmail, lndId);
            if (encryptedAdminMacaroon) {
                logInfo(`Successfully returned encrypted LN node password for email ${userEmail} and lnd id ${lndId}`);
                return res.status(200).send(new EncryptedArtefactDto(encryptedAdminMacaroon));
            } else {
                logInfo(`Failed to return encrypted LN node password for email ${userEmail} and lnd id ${lndId} because LND not found`);
                return res.sendStatus(400);
            }
        } catch (err) {
            logError(`Returning encrypted LN node password for email ${userEmail} and lnd id ${lndId} failed with err:`, err);
            return res.sendStatus(400);
        }
    }

    @Get('/seed')
    async getLnNodeWalletSeed(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            const encryptedLnNodeWalletSeed: string | undefined = await findLnSeedMnemonicEncryptedArtefact(userEmail);
            if (encryptedLnNodeWalletSeed) {
                logInfo(`Successfully returned default encrypted LN node wallet seed for email ${userEmail}`);
                return res.status(200).send(new EncryptedArtefactDto(encryptedLnNodeWalletSeed));
            } else {
                logInfo(`Failed to return default encrypted LN node wallet seed for email ${userEmail} because LND not found`);
                return res.sendStatus(400);
            }
        } catch (err) {
            logError(`Returning defualt encrypted LN node wallet seed for email ${userEmail} failed with err:`, err);
            return res.sendStatus(400);
        }
    }

    @Get('/:lndId/backup')
    async getLndStaticChannelBackups(
            @Param('lndId') lndId: string,
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            const lndStaticChannelBackupClientReadViews: LndStaticChannelBackupClientReadView[]
                = await getLndStaticChannelBackupClientReadViews(userEmail, lndId, 5);
            logInfo(`Successfully returned ${lndStaticChannelBackupClientReadViews.length } static channel backups for ${userEmail} and lnd id ${lndId}`);
            const scbs: SingleStaticChannelBackupDto[] = lndStaticChannelBackupClientReadViews
                .map(_ => new SingleStaticChannelBackupDto(
                    _.id,
                    _.creationDate,
                    _.type,
                    _.status,
                ));
            const millisecondsToNextBackup: number = getMillisecondsToNextStaticChannekBackup();
            return res.status(200).send(new StaticChannelBackupDto(
                scbs,
                millisecondsToNextBackup,
            ));
        } catch (err) {
            logError(`Returning static channel backups for email ${userEmail} and lnd id ${lndId} failed with err:`, err);
            return res.sendStatus(400);
        }
    }

    @Get('/:lndId/full-backup')
    async getLndFullBackup(
            @Param('lndId') lndId: string,
            @QueryParam('seed') seed: boolean,
            @QueryParam('macaroon') macaroon: boolean,
            @QueryParam('password') password: boolean,
            @QueryParam('scb') scb: boolean,
            @QueryParam('tls') tls: boolean,
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        const lndFullBackupDto: LndFullBackupDto | undefined = await getLnFullBackup(
            userEmail, lndId, seed, macaroon, password, scb, tls);
        if (lndFullBackupDto) {
            return res.status(200).send(lndFullBackupDto);
        } else {
            logError(`Returning full backup for user ${userEmail} and lndId ${lndId} failed`);
            return res.sendStatus(400);
        }
    }

    // todo it is only for hosted lnds
    @Get('/:lndId/connecturi')
    async getLndConnectUriDetails(
            @Param('lndId') lndId: string,
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        const lndConnectUriDto: LndConnectUriDto | undefined = await getUserLndConnectUriDetails(userEmail);
        if (lndConnectUriDto) {
            return res.status(200).send(lndConnectUriDto);
        } else {
            logError(`Returning LN connect uri details for user ${userEmail} and lndId ${lndId} failed`);
            return res.sendStatus(400);
        }
    }
}
