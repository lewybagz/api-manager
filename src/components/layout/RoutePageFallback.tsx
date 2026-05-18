export default function RoutePageFallback() {
  return (
    <div className="flex min-h-[40vh] flex-1 items-center justify-center font-zk-sans text-zk-text">
      <div className="flex flex-col items-center gap-4">
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-zk-border">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-zk-indigo/80" />
        </div>
        <p className="text-sm text-zk-muted">Loading…</p>
      </div>
    </div>
  );
}
