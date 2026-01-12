import { HomeScreen } from "@/app/page";

export default async function PageDetailRoute(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <HomeScreen initialSelectedPageId={params.id} />;
}
