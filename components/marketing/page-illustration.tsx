export function PageIllustration() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <div className="mx-auto h-96 max-w-6xl">
        <div className="absolute left-1/2 top-0 h-px w-[min(100%,72rem)] -translate-x-1/2 bg-linear-to-r from-transparent via-slate-300 to-transparent" />
        <div className="absolute left-1/2 top-36 h-px w-[min(100%,64rem)] -translate-x-1/2 bg-linear-to-r from-transparent via-blue-500/40 to-transparent" />
        <div className="absolute left-1/2 top-0 h-96 w-px -translate-x-[22rem] bg-linear-to-b from-slate-200 to-transparent max-md:hidden" />
        <div className="absolute left-1/2 top-0 h-96 w-px translate-x-[22rem] bg-linear-to-b from-slate-200 to-transparent max-md:hidden" />
        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full border-[24px] border-blue-500/20 blur-3xl" />
      </div>
    </div>
  )
}
