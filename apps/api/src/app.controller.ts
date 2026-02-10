import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from '@contexta/shared';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ping')
  ping() {
    return new Response({
      message: 'pong',
      ts: new Date().toISOString(),
    });
  }

  @Get('health')
  health() {
    return new Response({
      message: 'healthy',
      ts: new Date().toISOString(),
    });
  }
}
