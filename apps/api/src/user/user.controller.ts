
import {
    Body,
    Controller,
    Get,
    Put,
} from '@nestjs/common';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { UserService } from './user.service';
import { Response } from '@contexta/shared';

@Controller('users')
export class UserController {

    constructor(private userService: UserService) { }

    @Get('me')
    async me(@UserId() userId: string | undefined, @TenantId() tenantId: string) {
        return new Response(await this.userService.me({ userId: userId ?? '', tenantId }));
    }

    @Put('profile')
    async updateProfile(
        @UserId() userId: string | undefined,
        @Body() body: UpdateProfileBody,
    ) {
        return new Response(await this.userService.updateProfile({
            userId: userId ?? '',
            nickname: body.nickname,
            avatarUrl: body.avatarUrl,
            bio: body.bio,
        }));
    }
}