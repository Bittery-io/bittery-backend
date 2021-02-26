import { Response } from 'express-serve-static-core';
import { getUserEmailFromAccessTokenInAuthorizationHeader } from '../domain/services/auth/token-extractor-service';
import { Authorized, Body, HeaderParam, JsonController, Post, Res } from 'routing-controllers/index';
import { SetupMasterPasswordDto } from './dto/master-password/setup-master-password-dto';
import { insertUserPasswordProof } from '../domain/repository/user-password-proofs-repository';
import { UserPasswordProof } from '../domain/model/artefacts/user-password-proof';
import { logError, logInfo } from '../application/logging-service';

@JsonController('/masterpassword')
@Authorized()
export class MasterPasswordController {

    @Post('/')
    async saveUserMasterPasswordApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Body({ required: true }) setupMasterPasswordDto: SetupMasterPasswordDto,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            await insertUserPasswordProof(new UserPasswordProof(userEmail, setupMasterPasswordDto.sha256PasswordProof, new Date().toUTCString()));
            logInfo(`Successfully saved password proof for user ${userEmail}`);
            return res.sendStatus(200);
        } catch (err) {
            logError(`Saving password proof for user ${userEmail} failed!`, err);
            return res.sendStatus(400);
        }
    }
}
