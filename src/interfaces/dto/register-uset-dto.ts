import { IsDefined, IsEmail, IsString, Matches } from 'class-validator';

export class RegisterUserDto {

    @IsString()
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[\[\]$&+,:;=?@#<>.^*()%!-\\'` ~_-])[A-Za-z\d\[\]$&+,:;=?@#<>.^*()%!-\\'` ~_-]{8,}$/)
    password: string;

    @IsString()
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[\[\]$&+,:;=?@#<>.^*()%!-\\'` ~_-])[A-Za-z\d\[\]$&+,:;=?@#<>.^*()%!-\\'` ~_-]{8,}$/)
    repeatPassword: string;

    @IsEmail()
    @IsDefined()
    email: string;

    @IsString()
    @IsDefined()
    captchaCode: string;

    constructor(password: string, repeatPassword: string, email: string, captchaCode: string) {
        this.password = password;
        this.repeatPassword = repeatPassword;
        this.email = email;
        this.captchaCode = captchaCode;
    }
}
