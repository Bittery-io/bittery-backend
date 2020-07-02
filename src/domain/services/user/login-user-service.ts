import { verifyPassword } from './password-service';
import { User } from '../../model/user/user';
import { findUser } from '../../repository/user-repository';
import { UserLoginErrorType } from './user-login-error-type';
import { LoginUserDto } from '../../../interfaces/dto/login-user-dto';
import { UserLoginException } from './user-login-exception';
import { generateAndSaveNewAccessTokenForUser } from '../auth/users-authentication-service';

export const loginUser = async (loginUserDto: LoginUserDto): Promise<string> => {
    const user: User = await getUser(loginUserDto.email);
    if (user.active) {
        await validateUserPassword(user.encodedPassword, loginUserDto.password);
        return generateAndSaveNewAccessTokenForUser(user.email);
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
