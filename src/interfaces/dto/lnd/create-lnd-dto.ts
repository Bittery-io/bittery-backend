import { IsBoolean, IsDefined, IsOptional, IsString } from 'class-validator';
import { LndType } from '../../../domain/model/lnd/lnd-type';

export class CreateLndDto {

    @IsOptional()
    @IsString()
    lnAlias?: string;

    @IsBoolean()
    wumboChannels: boolean;

    @IsDefined()
    lndType: LndType;

    constructor(lnAlias: string, wumboChannels: boolean, lndType: LndType) {
        this.lnAlias = lnAlias;
        this.wumboChannels = wumboChannels;
        this.lndType = lndType;
    }
}
