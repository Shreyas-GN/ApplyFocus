export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-6 w-40 animate-pulse rounded bg-ui-linen" />
      <div className="h-44 animate-pulse rounded-xl bg-ui-linen" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="h-80 animate-pulse rounded-xl bg-ui-linen lg:col-span-5" />
        <div className="flex flex-col gap-6 lg:col-span-7">
          <div className="h-36 animate-pulse rounded-xl bg-ui-linen" />
          <div className="h-56 animate-pulse rounded-xl bg-ui-linen" />
        </div>
      </div>
    </div>
  );
}
