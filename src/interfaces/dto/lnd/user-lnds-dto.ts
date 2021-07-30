import { UserLndDto } from './user-lnd-dto';
import { ExpiredUserLndDto } from './expired-user-lnd-dto';

export class UserLndsDto {
    activeUserLndDto?: UserLndDto;
    expiredUserLndDto?: ExpiredUserLndDto;

    constructor(activeUserLndDto?: UserLndDto, expiredUserLndDto?: ExpiredUserLndDto) {
        this.activeUserLndDto = activeUserLndDto;
        this.expiredUserLndDto = expiredUserLndDto;
    }
}
