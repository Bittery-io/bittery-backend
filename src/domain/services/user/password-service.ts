import bcrypt from 'bcrypt';
import { getNumberProperty, getProperty } from '../../../application/property-service';
import { sendResetPasswordEmail } from '../../../application/mail-service';
import { generateUuid } from '../utils/id-generator-service';
import {
    findUnconfirmedValidPasswordReset,
    insertPasswordReset,
    updateConfirmPasswordResetWithResetDone,
} from '../../repository/create-password-repository';
import { PasswordReset } from '../../model/user/password-reset';
import { PasswordResetConfirmDto } from '../../../interfaces/dto/password-reset-confirm-dto';
import { validateAndThrowExceptionInCaseOfErrorWithCode } from '../utils/validate-and-throw-exception-service';
import { validatePlainPassword, validatePlainPasswords } from '../validation/password-validation-service';
import { updateUserPassword, userExists } from '../../repository/user-repository';
import { PasswordResetErrorType } from '../../model/user/password-reset-error-type';
import { PasswordResetDto } from '../../../interfaces/dto/password-reset-dto';
import { verifyCaptcha } from '../../../application/recaptcha-service';
import { insertNotification, notificationsLimitNotExceededForUser } from '../../repository/notifications-repository';
import { Notification } from '../../model/notification/notification';
import { NotificationTypeEnum } from '../../model/notification/notification-type-enum';
import { NotificationReasonEnum } from '../../model/notification/notification-reason-enum';
import { runInTransaction } from '../../../application/db/db-transaction';
import { Pool, PoolClient } from 'pg';

export const encodePassword = (password: string): string => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(Number(getProperty('ENCRYPTION_PASSWORD_SALT_ROUNDS'))));
};

export const verifyPassword = async (encodedPassword: string, password: string): Promise<void> => {
    if (!(await bcrypt.compare(password, encodedPassword))) {
        return Promise.reject(new Error('Password validation failed.'));
    }
};

export const resetPassword = async (passwordResetDto: PasswordResetDto): Promise<void> => {
    if (await verifyCaptcha(passwordResetDto.captchaCode)) {
        const isUserExist: boolean = await userExists(passwordResetDto.email);
        if (isUserExist) {
            const limitNotExceededForUser: boolean = await notificationsLimitNotExceededForUser(
                passwordResetDto.email,
                NotificationTypeEnum.EMAIL,
                getNumberProperty('PASSWORD_RESET_EMAIL_HOURS_MEASURE_PERIOD_HOURS'),
                getNumberProperty('PASSWORD_RESET_EMAIL_MEASURE_PERIOD_LIMIT'));
            if (limitNotExceededForUser) {
                const resetPasswordKey: string = generateUuid();
                const messageId: string | undefined = await sendResetPasswordEmail(passwordResetDto.email, resetPasswordKey);
                if (messageId) {
                    const sendDate: string = new Date().toUTCString();
                    await runInTransaction(async (client: PoolClient) => {
                        await insertPasswordReset(client, new PasswordReset(
                            passwordResetDto.email,
                            resetPasswordKey,
                            false,
                            messageId,
                            sendDate,
                        ));
                        await insertNotification(client, new Notification(
                            passwordResetDto.email,
                            messageId,
                            NotificationTypeEnum.EMAIL,
                            NotificationReasonEnum.REGISTRATION,
                            sendDate,
                        ));
                    });
                } else {
                    throw new Error(`Failed to reset password for user ${passwordResetDto.email} because of mail sending problem.`);
                }
            } else {
                throw new Error(`Failed to reset password for user ${passwordResetDto.email} because of notification limit exceeded 
                    ${getNumberProperty('PASSWORD_RESET_EMAIL_MEASURE_PERIOD_LIMIT')}/${getNumberProperty('PASSWORD_RESET_EMAIL_HOURS_MEASURE_PERIOD_HOURS')} hours`);
            }
        } else {
            console.log(`Failed to reset password for email ${passwordResetDto.email} because there is no registered user!!!`);
        }
    } else {
        throw new Error(`Failed to reset password for user ${passwordResetDto.email} because of captcha verification failed.`);
    }
};

export const confirmResetPassword = async (passwordResetConfirmDto: PasswordResetConfirmDto): Promise<void> => {
    if (await verifyCaptcha(passwordResetConfirmDto.captchaCode)) {
        await validateAndThrowExceptionInCaseOfErrorWithCode(
            () => validatePlainPassword(passwordResetConfirmDto.password),
            Error,
            PasswordResetErrorType.PASSWORD_INCORRECT,
        );
        await validateAndThrowExceptionInCaseOfErrorWithCode(
            () => validatePlainPassword(passwordResetConfirmDto.repeatPassword),
            Error,
            PasswordResetErrorType.PASSWORD_INCORRECT,
        );
        await validateAndThrowExceptionInCaseOfErrorWithCode(
            () => validatePlainPasswords(passwordResetConfirmDto.password,
                passwordResetConfirmDto.repeatPassword),
            Error,
            PasswordResetErrorType.PASSWORDS_NOT_MATCH,
        );
        const passwordReset: PasswordReset | undefined = await findUnconfirmedValidPasswordReset(
            passwordResetConfirmDto.email, passwordResetConfirmDto.passwordResetKey);
        if (passwordReset) {
            const encodedPassword: string = encodePassword(passwordResetConfirmDto.password);
            await runInTransaction(async (client: PoolClient) => {
                await updateUserPassword(client, passwordReset.userEmail, encodedPassword);
                await updateConfirmPasswordResetWithResetDone(client, passwordReset.userEmail, passwordResetConfirmDto.passwordResetKey);
            });
        } else {
            throw new Error(`Cannot confirm password reset because no active password reset request
                            found for key ${passwordResetConfirmDto.passwordResetKey} and email ${passwordResetConfirmDto.email}`);
        }
    } else {
        throw new Error(`Captcha validation for email ${passwordResetConfirmDto.email} and
                            password reset key ${passwordResetConfirmDto.passwordResetKey} failed!`);
    }
};
