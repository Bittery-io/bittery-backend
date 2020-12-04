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
    lndHostedType: HostedLndType;

    constructor(lnAlias: string, wumboChannels: boolean, lndHostedType: HostedLndType) {
        this.lnAlias = lnAlias;
        this.wumboChannels = wumboChannels;
        this.lndHostedType = lndHostedType;
    }
}
