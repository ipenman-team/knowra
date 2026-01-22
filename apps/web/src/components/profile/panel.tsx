"use client";

import { memo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

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
    props: { url?: string; title?: string } = {},
) {
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);

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

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8">
                    <AvatarImage src={props.url} />
                    <AvatarFallback>{props.title || "CN"}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuGroup>
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
