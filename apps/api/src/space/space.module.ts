import { Module } from '@nestjs/common';
import { PageModule } from '../page/page.module';
import { SpaceController } from './space.controller';
import { SpaceService } from './space.service';

@Module({
    imports: [PageModule],
    controllers: [SpaceController],
    providers: [SpaceService],
})
export class SpaceModule {}