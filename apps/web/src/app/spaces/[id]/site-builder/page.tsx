import { redirect } from 'next/navigation';

export default async function SpaceSiteBuilderRedirectPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id } = (await params) as { id: string };
  redirect(`/spaces/${id}/space-share`);
}
