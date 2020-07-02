import bcrypt from 'bcrypt';
import { getProperty } from '../../../application/property-service';
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

export const encodePassword = (password: string): string => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(Number(getProperty('ENCRYPTION_PASSWORD_SALT_ROUNDS'))));
};

export const verifyPassword = async (encodedPassword: string, password: string): Promise<void> => {
    if (!(await bcrypt.compare(password, encodedPassword))) {
        return Promise.reject(new Error('Password validation failed.'));
    }
};

export const resetPassword = async (passwordResetDto: PasswordResetDto): Promise<void> => {
    const isUserExist: boolean = await userExists(passwordResetDto.email);
    if (isUserExist) {
        const resetPasswordKey: string = generateUuid();
        const messageId: string | undefined = await sendResetPasswordEmail(passwordResetDto.email, resetPasswordKey);
        if (messageId) {
            await insertPasswordReset(new PasswordReset(
                passwordResetDto.email,
                resetPasswordKey,
                false,
                messageId,
                new Date().toUTCString(),
            ));
        } else {
            throw new Error(`Failed to reset password for user ${passwordResetDto.email} because of mail sending problem.`);
        }
    } else {
        console.log(`Failed to reset password for email ${passwordResetDto.email} because there is no registered user!!!`);
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
            await updateUserPassword(passwordReset.userEmail, encodedPassword);
            await updateConfirmPasswordResetWithResetDone(passwordReset.userEmail, passwordResetConfirmDto.passwordResetKey);
        } else {
            throw new Error(`Cannot confirm password reset because no active password reset request
                            found for key ${passwordResetConfirmDto.passwordResetKey} and email ${passwordResetConfirmDto.email}`);
        }
    } else {
        throw new Error(`Captcha validation for email ${passwordResetConfirmDto.email} and
                            password reset key ${passwordResetConfirmDto.passwordResetKey} failed!`);
    }
};
