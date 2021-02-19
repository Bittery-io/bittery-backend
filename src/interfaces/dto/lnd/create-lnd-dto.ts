import { IsBoolean, IsDefined, IsOptional, IsString, MaxLength } from 'class-validator';
import { HostedLndType } from '../../../domain/model/lnd/hosted/hosted-lnd-type';

export class CreateLndDto {

    @IsOptional()
    @IsString()
    @MaxLength(32)
    lnAlias?: string;

    @IsDefined()
    hostedLndType: HostedLndType;

    constructor(hostedLndType: HostedLndType, lnAlias?: string) {
        this.lnAlias = lnAlias;
        this.hostedLndType = hostedLndType;
    }
}
