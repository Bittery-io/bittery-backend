import { verifyPassword } from './password-service';
import { User } from '../../model/user/user';
import { findUser } from '../../repository/user-repository';
import { UserLoginErrorType } from './user-login-error-type';
import { LoginUserDto } from '../../../interfaces/dto/login-user-dto';
import { UserLoginException } from './user-login-exception';
import { findUserPasswordProof } from '../../repository/user-password-proofs-repository';
import { UserPasswordProof } from '../../model/artefacts/user-password-proof';
import { AccessTokenDto } from '../../../interfaces/dto/access-token-dto';
import { getNumberProperty } from '../../../application/property-service';
import { generateJwtToken, generateRefreshToken } from '../jwt/session-token-service';

export const loginUser = async (loginUserDto: LoginUserDto): Promise<AccessTokenDto> => {
    const user: User = await getUser(loginUserDto.email);
    if (user.active) {
        await validateUserPassword(user.encodedPassword, loginUserDto.password);
        const userPasswordProof: UserPasswordProof | undefined = await findUserPasswordProof(loginUserDto.email);
        const sha256PasswordProof: string | undefined = userPasswordProof ? userPasswordProof.sha256PasswordProof : undefined;
        const jwtToken: string = generateJwtToken(user.email, sha256PasswordProof);
        const refreshToken: string = generateRefreshToken(user.email, sha256PasswordProof);
        return new AccessTokenDto(
            jwtToken,
            refreshToken,
            getNumberProperty('SESSION_EXPIRES_IN_HOURS') * 60 * 60,
        );
    } else {
        throw new UserLoginException(`Login failed. User ${loginUserDto.email} registered but is not active!`,
            UserLoginErrorType.USER_NOT_ACTIVE);
    }
};

const validateUserPassword = async (encodePassword: string, plainPassword: string) => {
    try {
        await verifyPassword(encodePassword, plainPassword);
    } catch (err) {
        throw new UserLoginException(err.message, UserLoginErrorType.INCORRECT_PASSWORD);
    }
};

const getUser = async (userEmail: string): Promise<User> => {
    const user: User | undefined = await findUser(userEmail);
    if (!user) {
        throw new UserLoginException(`User with email: ${userEmail}, does not exist.`, UserLoginErrorType.USER_NOT_EXISTS);
    }
    return user;
};
