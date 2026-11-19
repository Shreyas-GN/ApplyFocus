export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ui-canvas">
      <div className="flex flex-col items-center gap-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ui-teal-ink text-sm font-semibold text-white">
          AP
        </span>
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-ui-teal border-t-transparent" />
      </div>
    </div>
  );
}
