import { RegisterUserDto } from './dto/register-uset-dto';
import { confirmUserRegistration, registerNewUser } from '../domain/services/user/register/register-user-service';
import { UserRegisterException } from '../domain/model/user/user-register-exception';
import { Request, Response } from 'express-serve-static-core';
import { ErrorDto } from './dto/error-dto';
import { LoginUserDto } from './dto/login-user-dto';
import { loginUser } from '../domain/services/user/login-user-service';
import { AccessTokenDto } from './dto/access-token-dto';
import { UserLoginException } from '../domain/services/user/user-login-exception';
import { ConfirmRegistrationDto } from './dto/confirm-registration-dto';
import { confirmResetPassword, resetPassword } from '../domain/services/user/password-service';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm-dto';
import { PasswordResetDto } from './dto/password-reset-dto';
import { getNewJwtToken } from '../domain/services/user/refresh-token-service';
import { getAccessTokenFromAuthorizationHeader } from '../domain/services/auth/token-extractor-service';
import { getBooleanProperty } from '../application/property-service';
import { logError, logInfo } from '../application/logging-service';

export const registerUser = async (req: Request, res: Response) => {
    try {
        if (getBooleanProperty('REGISTRATION_ENABLED')) {
            const registerUserDto: RegisterUserDto = req.body;
            await registerNewUser(registerUserDto);
            logInfo(`User ${registerUserDto.email} registered successfully`);
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
};

export const isLoggedApi = async (req: Request, res: Response) => {
    return res.sendStatus(200);
};

export const confirmRegistrationApi = async (req: Request, res: Response) => {
    try {
        const confirmRegistrationDto: ConfirmRegistrationDto = req.body;
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
};

export const login = async (req: Request, res: Response) => {
    try {
        if (getBooleanProperty('LOGIN_ENABLED')) {
            const loginUserDto: LoginUserDto = req.body;
            const accessToken: string = await loginUser(loginUserDto);
            logInfo(`ECMR user ${loginUserDto.email} logged successfully`);
            return res.send(new AccessTokenDto(accessToken));
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
};

export const refreshTokenApi = async (req: Request, res: Response) => {
    try {
        const accessToken: string = getAccessTokenFromAuthorizationHeader(req.headers.authorization!);
        return res.send(new AccessTokenDto(getNewJwtToken(accessToken)));
    } catch (err) {
        logError('Refreshing token failed.', err);
        return res.status(401).send(new ErrorDto(err.message));
    }
};

export const resetPasswordApi = async (req: Request, res: Response) => {
    const passwordResetDto: PasswordResetDto = req.body;
    try {
        await resetPassword(passwordResetDto);
        return res.sendStatus(200);
    } catch (err) {
        logError(`Reset password e-mail for user failed ${passwordResetDto.email} sent!`, err);
        return res.status(500).send(new ErrorDto('Unexpected server error'));
    }
};

export const confirmResetPasswordApi = async (req: Request, res: Response) => {
    const passwordResetConfirmDto: PasswordResetConfirmDto = req.body;
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
};
