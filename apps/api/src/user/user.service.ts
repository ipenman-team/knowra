import { normalizeTrim, pickActorId } from "@contexta/utils";
import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UserService {

    constructor(private readonly prisma: PrismaService) { }

    async me(input: { userId: string; tenantId: string }) {
        const userId = input.userId?.trim();
        const tenantId = input.tenantId?.trim();
        if (!userId) throw new BadRequestException('userId is required');
        if (!tenantId) throw new BadRequestException('tenantId is required');

        const profile = await this.prisma.userProfile.findFirst({
            where: { userId, isDeleted: false },
            select: {
                nickname: true,
                avatarUrl: true,
                bio: true,
                phone: true,
            },
        });

        const tenant = await this.prisma.tenant.findFirst({
            where: { id: tenantId, isDeleted: false },
            select: { id: true, type: true, key: true, name: true },
        });
        if (!tenant)
            throw new HttpException('tenant 不存在', HttpStatus.UNAUTHORIZED);

        const memberships = await this.prisma.tenantMembership.findMany({
            where: {
                userId,
                isDeleted: false,
                tenant: { isDeleted: false },
            },
            orderBy: { createdAt: 'asc' },
            select: {
                role: true,
                tenant: { select: { id: true, type: true, key: true, name: true } },
            },
        });

        const identities = await this.prisma.userIdentity.findMany({
            where: {
                userId,
                isDeleted: false,
                provider: { in: ['email', 'phone'] },
            },
            select: {
                provider: true,
                identifier: true,
                isVerified: true,
                secretHash: true,
            },
        });

        const emailIdentity = identities.find((item) => item.provider === 'email');
        const phoneIdentity = identities.find((item) => item.provider === 'phone');
        const passwordSet = identities.some(
            (item) => typeof item.secretHash === 'string' && item.secretHash.trim().length > 0,
        );

        return {
            ok: true,
            user: { id: userId },
            profile,
            tenant,
            memberships,
            verification: {
                email: {
                    bound: Boolean(emailIdentity?.identifier),
                    verified: Boolean(emailIdentity?.isVerified),
                    identifier: emailIdentity?.identifier ?? null,
                },
                phone: {
                    bound: Boolean(phoneIdentity?.identifier),
                    verified: Boolean(phoneIdentity?.isVerified),
                    identifier: phoneIdentity?.identifier ?? null,
                },
                password: {
                    set: passwordSet,
                },
            },
        };
    }

    async updateProfile(input: {
        userId: string;
        nickname?: string | null;
        avatarUrl?: string | null;
        bio?: string | null;
    }) {
        const userId = input.userId?.trim();
        if (!userId) throw new BadRequestException('userId is required');

        const nicknameRaw = input.nickname;
        const avatarUrlRaw = input.avatarUrl;
        const bioRaw = input.bio;

        const nickname =
            typeof nicknameRaw === 'string'
                ? normalizeTrim(nicknameRaw)
                : nicknameRaw === null
                    ? null
                    : undefined;
        if (nickname !== undefined && nickname !== null && nickname.length === 0) {
            throw new BadRequestException('昵称不能为空');
        }

        const avatarUrl =
            typeof avatarUrlRaw === 'string'
                ? normalizeTrim(avatarUrlRaw)
                : avatarUrlRaw === null
                    ? null
                    : undefined;
        if (avatarUrl !== undefined && avatarUrl !== null && avatarUrl.length === 0) {
            throw new BadRequestException('avatarUrl 不能为空字符串');
        }

        const bio =
            typeof bioRaw === 'string'
                ? normalizeTrim(bioRaw)
                : bioRaw === null
                    ? null
                    : undefined;
        if (bio !== undefined && bio !== null && bio.length === 0) {
            throw new BadRequestException('bio 不能为空字符串');
        }

        const actorId = pickActorId(userId);
        const maxNicknameLen = 80;
        const maxBioLen = 200;
        const maxAvatarUrlLen = 4096;

        const trimmedNickname =
            typeof nickname === 'string' && nickname.length > maxNicknameLen
                ? nickname.slice(0, maxNicknameLen)
                : nickname;
        const trimmedBio =
            typeof bio === 'string' && bio.length > maxBioLen ? bio.slice(0, maxBioLen) : bio;
        const trimmedAvatarUrl =
            typeof avatarUrl === 'string' && avatarUrl.length > maxAvatarUrlLen
                ? avatarUrl.slice(0, maxAvatarUrlLen)
                : avatarUrl;

        const profile = await this.prisma.userProfile.findFirst({
            where: { userId, isDeleted: false },
            select: {
                id: true,
                nickname: true,
                avatarUrl: true,
                bio: true,
                phone: true,
            },
        });

        if (!profile) {
            throw new Error('User no exist!');
        }

        const next: {
            nickname?: string | null;
            avatarUrl?: string | null;
            bio?: string | null;
            updatedBy: string;
        } = {
            updatedBy: actorId,
        };

        if (trimmedNickname !== undefined) {
            next.nickname = trimmedNickname;
        }
        if (trimmedAvatarUrl !== undefined) {
            next.avatarUrl = trimmedAvatarUrl;
        }
        if (trimmedBio !== undefined) {
            next.bio = trimmedBio;
        }

        const hasUpdates = Object.keys(next).length > 1;
        if (!hasUpdates) {
            const current = await this.prisma.userProfile.findFirst({
                where: { id: profile.id, isDeleted: false },
                select: {
                    nickname: true,
                    avatarUrl: true,
                    bio: true,
                    phone: true,
                },
            });
            return { ok: true, profile: current };
        }

        const updated = await this.prisma.userProfile.update({
            where: { id: profile.id },
            data: next,
            select: {
                nickname: true,
                avatarUrl: true,
                bio: true,
                phone: true,
            },
        });

        return { ok: true, profile: updated };
    }
}
