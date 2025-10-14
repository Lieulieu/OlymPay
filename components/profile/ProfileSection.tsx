export function ProfileSection({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {actions}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}
