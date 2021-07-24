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
import { findLndMacaroonHex, findUserLndTls } from '../domain/repository/lnd/lnds-repository';
import { SaveEncryptedAdminMacaroonDto } from './dto/lnd/save-encrypted-admin-macaroon-dto';
import {
    findAdminMacaroonHexEncryptedArtefact,
    findLnPasswordEncryptedArtefact,
    findLnSeedMnemonicEncryptedArtefact, findUserEncryptedLnArtefacts,
    updateAdminMacaroonHexEncryptedArtefact,
} from '../domain/repository/encrypted/user-encrypted-ln-artefacts-repository';
import { EncryptedArtefactDto } from './dto/encrypted-artefact-dto';

@JsonController('/lnd/external')
@Authorized()
export class LndController {

    @Post('/')
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

    @Get('/:lndId/files/macaroon')
    async getCustomMacaroonHexApi(
            @Param('lndId') lndId: string,
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            const bitteryBakedMacaroonHex: string | undefined = await findLndMacaroonHex(lndId, userEmail);
            if (bitteryBakedMacaroonHex) {
                logInfo(`Successfully returned custom macaroon provided for external LN node for email ${userEmail} and lnd id ${lndId}`);
                // EncryptedArtefactDto is only used to utilize DTO - it is not encrypted
                return res.status(200).send(new EncryptedArtefactDto(bitteryBakedMacaroonHex));
            } else {
                logError(`Failed to return custom macaroon provided for external LN node for email ${userEmail} and lnd id ${lndId} because LND not found`);
                return res.sendStatus(400);
            }
        } catch (err) {
            logError(`Returning custom macaroon provided for external LN node for email ${userEmail} and lnd id ${lndId} failed with err:`, err);
            return res.sendStatus(500);
        }
    }

}
