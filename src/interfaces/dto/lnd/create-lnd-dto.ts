import { IsBoolean, IsDefined, IsOptional, IsString, MaxLength } from 'class-validator';
import { HostedLndType } from '../../../domain/model/lnd/hosted/hosted-lnd-type';

export class CreateLndDto {

    @IsOptional()
    @IsString()
    @MaxLength(32)
    lnAlias?: string;

    @IsBoolean()
    wumboChannels: boolean;

    @IsDefined()
    hostedLndType: HostedLndType;

    constructor(wumboChannels: boolean, hostedLndType: HostedLndType, lnAlias?: string) {
        this.lnAlias = lnAlias;
        this.wumboChannels = wumboChannels;
        this.hostedLndType = hostedLndType;
    }
}
