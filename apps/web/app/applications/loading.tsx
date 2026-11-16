export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-20 animate-pulse rounded-xl bg-ui-linen" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-ui-linen" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-ui-linen" />
      ))}
    </div>
  );
}
