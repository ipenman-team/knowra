export function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="text-sm font-semibold text-muted-foreground">{props.title}</div>
      <div>{props.children}</div>
    </section>
  );
}
