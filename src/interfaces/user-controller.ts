import { RegisterUserDto } from './dto/register-uset-dto';
import { confirmUserRegistration, registerNewUser } from '../domain/services/user/register/register-user-service';
import { UserRegisterException } from '../domain/model/user/user-register-exception';
import { Response } from 'express-serve-static-core';
import { ErrorDto } from './dto/error-dto';
import { LoginUserDto } from './dto/login-user-dto';
import { loginUser } from '../domain/services/user/login-user-service';
import { AccessTokenDto } from './dto/access-token-dto';
import { UserLoginException } from '../domain/services/user/user-login-exception';
import { ConfirmRegistrationDto } from './dto/confirm-registration-dto';
import { confirmResetPassword, resetPassword } from '../domain/services/user/password-service';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm-dto';
import { PasswordResetDto } from './dto/password-reset-dto';
import { refreshToken } from '../domain/services/user/refresh-token-service';
import { getAccessTokenFromAuthorizationHeader } from '../domain/services/auth/token-extractor-service';
import { getBooleanProperty, getNumberProperty } from '../application/property-service';
import { logError, logInfo } from '../application/logging-service';
import { Body, Get, HeaderParam, JsonController, Post, Res } from 'routing-controllers/index';
import { countUsers } from '../domain/repository/user-repository';
import { sendUserRegisterMail } from '../application/mail-service';
import { RefreshTokenDto } from './dto/refresh-token-dto';

@JsonController('/user')
export class UserController {

    @Post('/register')
    async registerUser(
            @Body({ required: true }) registerUserDto: RegisterUserDto,
            @Res() res: Response) {
        try {
            if (getBooleanProperty('REGISTRATION_ENABLED')) {
                await registerNewUser(registerUserDto);
                logInfo(`User ${registerUserDto.email} registered successfully`);
                // ### OPTIONAL
                try {
                    const usersCounter: number = await countUsers();
                    await sendUserRegisterMail(usersCounter);
                } catch (err) {
                    logError('Ups dont know why but sending user registered mail to me failed!', err);
                }
                // ###
                return res.sendStatus(204);
            } else {
                return res.status(500).send(new ErrorDto('Maintenance: Registration currently disabled'));
            }
        } catch (err) {
            if (err instanceof UserRegisterException) {
                return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
            }
            logError('Registration failed. ', err);
            return res.status(500).send(new ErrorDto('Unexpected server error'));
        }
    }

    @Get('/isLogged')
    async isLoggedApi(@Res() res: Response) {
        return res.sendStatus(200);
    }

    @Post('/register/confirm')
    async confirmRegistrationApi(
            @Body({ required: true }) confirmRegistrationDto: ConfirmRegistrationDto,
            @Res() res: Response) {
        try {
            await confirmUserRegistration(confirmRegistrationDto);
            logInfo(`User ${confirmRegistrationDto.email} confirmed account successfully`);
            return res.sendStatus(204);
        } catch (err) {
            logError('Confirm registration failed.', err);
            if (err instanceof UserRegisterException) {
                return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
            }
            return res.status(500).send(new ErrorDto('Unexpected server error'));
        }
    }

    @Post('/login')
    async login(
            @Body({ required: true }) loginUserDto: LoginUserDto,
            @Res() res: Response) {
        try {
            if (getBooleanProperty('LOGIN_ENABLED')) {
                const accessTokenDto: AccessTokenDto = await loginUser(loginUserDto);
                logInfo(`ECMR user ${loginUserDto.email} logged successfully`);
                return res.send(accessTokenDto);
            } else {
                return res.status(500).send(new ErrorDto('Maintenance: Login possibility currently disabled'));
            }
        } catch (err) {
            logError('Login failed. ', err);
            if (err instanceof UserLoginException) {
                return res.status(401).send(new ErrorDto(err.message, err.clientErrorCode));
            }
            return res.status(500).send(new ErrorDto('Unexpected server error'));
        }
    }

    @Post('/refreshToken')
    async refreshTokenApi(
            @Body({ required: true }) refreshTokenDto: RefreshTokenDto,
            @Res() res: Response) {
        try {
            const newAccessToken: string = await refreshToken(refreshTokenDto.refreshToken);
            logInfo(`Successfully refreshed token ${refreshTokenDto.refreshToken}`);
            return res.send(new AccessTokenDto(
                newAccessToken,
                refreshTokenDto.refreshToken,
                getNumberProperty('SESSION_EXPIRES_IN_HOURS') * 60 * 60));
        } catch (err) {
            logError('Refreshing token failed.', err);
            return res.status(401).send(new ErrorDto(err.message));
        }
    }

    @Post('/password/reset')
    async resetPasswordApi(
            @Body({ required: true }) passwordResetDto: PasswordResetDto,
            @Res() res: Response) {
        try {
            await resetPassword(passwordResetDto);
            return res.sendStatus(200);
        } catch (err) {
            logError(`Reset password e-mail for user failed ${passwordResetDto.email} sent!`, err);
            return res.status(500).send(new ErrorDto('Unexpected server error'));
        }
    }

    @Post('/password/reset/confirm')
    async confirmResetPasswordApi(
            @Body({ required: true }) passwordResetConfirmDto: PasswordResetConfirmDto,
            @Res() res: Response) {
        try {
            await confirmResetPassword(passwordResetConfirmDto);
            logInfo(`Successfully confirmed password reset for user ${passwordResetConfirmDto.email}
                    and password reset key ${passwordResetConfirmDto.passwordResetKey}`);
            return res.sendStatus(200);
        } catch (err) {
            logError(`Password reset confirmation failed for user ${passwordResetConfirmDto.email}
                        and password reset key ${passwordResetConfirmDto.passwordResetKey}`, err);
            return res.status(500).send(new ErrorDto('Unexpected server error'));
        }
    }
}
