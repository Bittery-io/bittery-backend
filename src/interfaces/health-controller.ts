import { Response } from 'express-serve-static-core';
import { Authorized, Get, JsonController, Res } from 'routing-controllers/index';

@JsonController('/health')
export class HealthController {

    @Get('/')
    async getHealthStatus(@Res() res: Response): Promise<Response> {
        return res.sendStatus(200);
    }

}
