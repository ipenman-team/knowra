"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMeProfile, type MeProfile } from "@/stores";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const UserProfilePanel = memo(function UserProfilePanel(
    props: { profile?: MeProfile | null } = {},
) {
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pointerDownOutsideRef = useRef(false);

    const cachedProfile = useMeProfile();
    const profile = props.profile === undefined ? cachedProfile : props.profile;

    useEffect(() => {
        setMounted(true);
    }, []);

    const nickname = mounted ? profile?.nickname?.trim() || "" : "";
    const avatarUrl = mounted ? profile?.avatarUrl || undefined : undefined;
    const fallbackText = nickname ? nickname.slice(0, 1) : "CN";

    const handleLogout = useCallback(async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } finally {
            setLoggingOut(false);
            router.replace("/login");
            router.refresh();
        }
    }, [loggingOut, router]);

    if (!mounted) {
        return (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={undefined} />
                </Avatar>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                >
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback>{fallbackText}</AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-56"
                align="start"
                onPointerDownOutside={() => {
                    pointerDownOutsideRef.current = true;
                }}
                onCloseAutoFocus={(e) => {
                    if (pointerDownOutsideRef.current) {
                        e.preventDefault();
                        pointerDownOutsideRef.current = false;
                    }
                }}
            >
                <DropdownMenuGroup>
                    <DropdownMenuItem disabled>
                        {nickname || "未设置昵称"}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onSelect={(e) => {
                            e.preventDefault();
                            router.push("/settings");
                        }}
                    >
                        设置
                        <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                        邀请成员
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    disabled={loggingOut}
                    onSelect={(e) => {
                        e.preventDefault();
                        void handleLogout();
                    }}
                >
                    退出登录
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
