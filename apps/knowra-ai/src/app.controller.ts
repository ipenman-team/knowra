import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ping')
  ping(): { ok: true; message: string; ts: string } {
    return {
      ok: true,
      message: 'pong',
      ts: new Date().toISOString(),
    };
  }

  @Get('health')
  health(): { ok: true; message: string; ts: string } {
    return {
      ok: true,
      message: 'healthy',
      ts: new Date().toISOString(),
    };
  }
}
