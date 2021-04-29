import { Get, HeaderParam, JsonController, Res } from 'routing-controllers';
import { Response } from 'express-serve-static-core';
import { getNumberProperty, getProperty } from '../application/property-service';
import { LnBuyValuesDto } from './dto/utils/ln-buy-values-dto';

@JsonController('/utils')
export class WalletController {

    @Get('/ln-buy-values')
    async getCurrentLnNodeVersion(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        return res.send(new LnBuyValuesDto(getProperty('LND_HOSTED_VERSION'), getNumberProperty('LND_SUBSCRIPTION_PRICE_USD')));
    }
}
