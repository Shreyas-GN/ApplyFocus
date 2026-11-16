export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-ui-linen" />
      <div className="h-12 animate-pulse rounded-lg bg-ui-linen" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl bg-ui-linen" />
      ))}
    </div>
  );
}
