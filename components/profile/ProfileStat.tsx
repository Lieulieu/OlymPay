export function ProfileStat({
  title,
  value,
  desc,
  icon,
  tone = "primary",
}: {
  title: string;
  value: string;
  desc?: string;
  icon: React.ReactNode;
  tone?: "primary" | "secondary" | "accent";
}) {
  const toneCls =
    tone === "primary"
      ? "from-primary/10 to-primary/0 text-primary"
      : tone === "secondary"
      ? "from-secondary/10 to-secondary/0 text-secondary"
      : "from-accent/10 to-accent/0 text-accent";
  return (
    <article className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div
        className={`rounded-xl bg-gradient-to-b ${toneCls} p-3 inline-flex`}
        aria-hidden
      >
        {icon}
      </div>
      <p className="mt-3 text-sm text-base-content/70">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {desc ? (
        <p className="text-xs text-base-content/60 mt-1">{desc}</p>
      ) : null}
    </article>
  );
}
