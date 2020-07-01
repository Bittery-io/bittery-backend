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

export const registerUser = async (req: Request, res: Response) => {
    try {
        const registerUserDto: RegisterUserDto = req.body;
        await registerNewUser(registerUserDto);
        console.log(`User ${registerUserDto.email} registered successfully`);
        return res.sendStatus(204);
    } catch (err) {
        if (err instanceof UserRegisterException) {
            return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
        }
        console.log('Registration failed. ', err);
        return res.status(500).send(new ErrorDto('Unexpected server error'));
    }
};

export const confirmRegistrationApi = async (req: Request, res: Response) => {
    try {
        const confirmRegistrationDto: ConfirmRegistrationDto = req.body;
        await confirmUserRegistration(confirmRegistrationDto);
        console.log(`User ${confirmRegistrationDto.email} confirmed account successfully`);
        return res.sendStatus(204);
    } catch (err) {
        console.log('Confirm registration failed.', err);
        if (err instanceof UserRegisterException) {
            return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
        }
        return res.status(500).send(new ErrorDto('Unexpected server error'));
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const loginUserDto: LoginUserDto = req.body;
        const accessToken: string = await loginUser(loginUserDto);
        console.log(`ECMR user ${loginUserDto.email} logged successfully`);
        return res.send(new AccessTokenDto(accessToken));
    } catch (err) {
        console.log('Login failed. ', err);
        if (err instanceof UserLoginException) {
            return res.status(401).send(new ErrorDto(err.message, err.clientErrorCode));
        }
        return res.status(500).send(new ErrorDto('Unexpected server error'));
    }
};
