import { Body, Controller, Headers, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { TenantId } from '../common/tenant/tenant-id.decorator';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('answer')
  async answer(
    @TenantId() tenantId: string,
    @Headers('x-user-id') _userId: string | undefined,
    @Body() body: { question?: unknown },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const question = typeof body?.question === 'string' ? body.question : '';

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const controller = new AbortController();
    const onClose = () => controller.abort();
    req.on('close', onClose);
    req.on('aborted', onClose);

    const writeEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      for await (const evt of this.ragService.answerStream(tenantId, question, {
        signal: controller.signal,
      })) {
        if (evt.type === 'delta') writeEvent('delta', { delta: evt.delta });
        if (evt.type === 'meta') writeEvent('meta', { hit: evt.hit, meta: evt.meta });
        if (evt.type === 'done') writeEvent('done', { done: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'stream error';
      writeEvent('error', { message });
    } finally {
      req.off('close', onClose);
      req.off('aborted', onClose);
      res.end();
    }
  }
}
