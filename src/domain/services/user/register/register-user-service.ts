import { validateEmailAddress } from '../../validation/email-validation-service';
import { encodePassword } from '../password-service';
import {
    insertUser,
    setUserActiveFlag,
    userExists,
    userWithGivenEmailExists,
} from '../../../repository/user-repository';
import { User } from '../../../model/user/user';
import { RegisterUserDto } from '../../../../interfaces/dto/register-uset-dto';
import { UserRegistrationErrorType } from '../../../model/user/user-registration-error-type';
import { generateUuid } from '../../utils/id-generator-service';
import { UserRegisterException } from '../../../model/user/user-register-exception';
import { validateAndThrowExceptionInCaseOfErrorWithCode } from '../../utils/validate-and-throw-exception-service';
import {
    confirmUserIfSignUpKeyValid,
    insertUserConfirmation,
    unconfirmedUserConfirmationExists,
    userConfirmationExists,
} from '../../../repository/users-confirmations-repository';
import { UserConfirmation } from '../../../model/user/user-confirmation';
import { ConfirmRegistrationDto } from '../../../../interfaces/dto/confirm-registration-dto';
import { sendRegistrationEmail } from '../../../../application/mail-service';
import { verifyCaptcha } from '../../../../application/recaptcha-service';
import { validatePlainPassword, validatePlainPasswords } from '../../validation/password-validation-service';
import { insertNotification } from '../../../repository/notifications-repository';
import { Notification } from '../../../model/notification/notification';
import { NotificationTypeEnum } from '../../../model/notification/notification-type-enum';
import { NotificationReasonEnum } from '../../../model/notification/notification-reason-enum';
import { runInTransaction } from '../../../../application/db/db-transaction';
import { PoolClient } from 'pg';
import { logError, logInfo } from '../../../../application/logging-service';

export const registerNewUser = async (registerUserDto: RegisterUserDto): Promise<void> => {
    if (await verifyCaptcha(registerUserDto.captchaCode)) {
        await validateAndThrowExceptionInCaseOfErrorWithCode(
            () => validatePlainPassword(registerUserDto.password),
            UserRegisterException,
            UserRegistrationErrorType.PASSWORD_INCORRECT,
        );
        await validateAndThrowExceptionInCaseOfErrorWithCode(
            () => validatePlainPassword(registerUserDto.repeatPassword),
            UserRegisterException,
            UserRegistrationErrorType.PASSWORD_INCORRECT,
        );
        await validateAndThrowExceptionInCaseOfErrorWithCode(
            () => validatePlainPasswords(registerUserDto.password, registerUserDto.repeatPassword),
            UserRegisterException,
            UserRegistrationErrorType.PASSWORDS_NOT_MATCH,
        );
        await validateAndThrowExceptionInCaseOfErrorWithCode(
            () => validateEmailAddress(registerUserDto.email),
            UserRegisterException,
            UserRegistrationErrorType.EMAIL_INCORRECT,
        );
        await checkIfUserNotExistsAndRegister(registerUserDto);
    } else {
        throw new UserRegisterException(`Captcha validation for user ${registerUserDto.email} failed!`,
            UserRegistrationErrorType.CAPTCHA_VALIDATION_FAILED);
    }
};

const checkIfUserNotExistsAndRegister = async (registerUserDto: RegisterUserDto): Promise<void> => {
    const isUserExist: boolean = await userExists(registerUserDto.email);
    let errorMessage: string;
    if (isUserExist) {
        // If user exists and confirmation exists means the account is used
        if (await userConfirmationExists(registerUserDto.email)) {
            errorMessage = `Register user failed because user '${registerUserDto.email}' already exists.`;
            logError(errorMessage);
            throw new UserRegisterException(errorMessage, UserRegistrationErrorType.USERNAME_ALREADY_TAKEN);
        } else {
            // User could register but email failed to send so check this situation and resend email only
            await sendConfirmationEmailAndSaveInDb(registerUserDto);
            logInfo(`User ${registerUserDto.email} was registered but registration email resent.`);
            return;
        }
    }
    const emailIsUsedByOtherEcmrUser: boolean = await userWithGivenEmailExists(registerUserDto.email);
    if (emailIsUsedByOtherEcmrUser) {
        errorMessage = `Register user failed because email '${registerUserDto.email}' is already taken.`;
        throw new UserRegisterException(errorMessage, UserRegistrationErrorType.EMAIL_ALREADY_TAKEN);
    }
    await saveNewEcmrUser(registerUserDto);
    await sendConfirmationEmailAndSaveInDb(registerUserDto);
    logInfo(`User ${registerUserDto.email} registered.`);
};

const sendConfirmationEmailAndSaveInDb = async (registerUserDto: RegisterUserDto): Promise<void> => {
    const signUpKey: string = generateUuid();
    const messageId: string | undefined = await sendRegistrationEmail(registerUserDto.email, signUpKey);
    if (messageId) {
        const sendDate: string = new Date().toUTCString();
        await runInTransaction(async (client: PoolClient) => {
            await insertUserConfirmation(client, new UserConfirmation(
                registerUserDto.email,
                signUpKey,
                false,
                messageId,
                sendDate,
            ));
            await insertNotification(client, new Notification(
                registerUserDto.email,
                messageId,
                NotificationTypeEnum.EMAIL,
                NotificationReasonEnum.REGISTRATION,
                sendDate,
            ));
        });
    } else {
        throw new UserRegisterException('Failed to register because email sending failed!',
            UserRegistrationErrorType.CONFIRMATION_EMAIL_SENT_FAILED);
    }
};

const saveNewEcmrUser = async (registerUserDto: RegisterUserDto): Promise<void> => {
    const encodedPassword: string = encodePassword(registerUserDto.password);
    const userId: string = generateUuid();
    await insertUser(registerUserDtoToUser(userId, registerUserDto, encodedPassword));
};

const registerUserDtoToUser = (userId: string, registerUserDto: RegisterUserDto, encodedPassword: string): User => {
    return new User(
        registerUserDto.email,
        encodedPassword,
        false,
        new Date().toUTCString(),
    );
};

export const confirmUserRegistration = async (confirmRegistrationDto: ConfirmRegistrationDto): Promise<void> => {
    const validConfirmationExists: boolean = await unconfirmedUserConfirmationExists(confirmRegistrationDto.email, confirmRegistrationDto.signUpKey);
    if (validConfirmationExists) {
        await confirmUserIfSignUpKeyValid(confirmRegistrationDto.email, confirmRegistrationDto.signUpKey);
        await setUserActiveFlag(confirmRegistrationDto.email, true);
    } else {
        throw new UserRegisterException(`There is unconfirmed user confirmation for email ${confirmRegistrationDto.email}
        and sign up key ${confirmRegistrationDto.signUpKey}`, UserRegistrationErrorType.NO_CONFIRMATION_ENTRY_EXIST);
    }
};
