"use client";

import { useParams } from "next/navigation";

import { PageVersionsScreen } from "@/features/page-versions/page-versions-screen";

export default function PageVersionsRoute() {
  const params = useParams<{ id: string }>();
  const pageId = params?.id;

  if (!pageId) return null;
  return <PageVersionsScreen pageId={pageId} />;
}
