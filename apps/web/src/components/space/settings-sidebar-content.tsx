import {
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useSpaceStore } from '@/stores';

export function SettingsSidebarContent({ spaceId, pathname }: { spaceId: string, pathname: string }) {
    const isActive = (path: string) => pathname.includes(path);
    const space = useSpaceStore((s) => s.spaces.find((sp) => sp.id === spaceId));

    return (
        <>
            <SidebarHeader className="h-14 flex justify-center px-4 border-b">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={`/spaces/${spaceId}`}>
                                    {space?.name}
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <BreadcrumbPage>空间管理</BreadcrumbPage>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>设置</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive('/page-share')}>
                                    <Link href={`/spaces/${spaceId}/page-share`}>
                                        <FileText className="w-4 h-4" />
                                        <span>页面分享</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </>
    );
}
