import { CheckCircle2, FileSpreadsheet } from "lucide-react"

const rows = [
  {
    tender: "Facilities maintenance framework",
    owner: "Amelia",
    deadline: "24 May",
    status: "At risk",
  },
  {
    tender: "Local authority cleaning services",
    owner: "Marcus",
    deadline: "28 May",
    status: "On track",
  },
  {
    tender: "Healthcare supply tender",
    owner: "Sarah",
    deadline: "03 Jun",
    status: "Review",
  },
]

export function ProductPreview() {
  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 p-3 shadow-2xl before:pointer-events-none before:absolute before:-inset-5 before:border-y before:[border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1] after:pointer-events-none after:absolute after:-inset-5 after:-z-10 after:border-x after:[border-image:linear-gradient(to_bottom,transparent,--theme(--color-slate-300/.8),transparent)1] sm:p-4 lg:aspect-[16/10]">
        <div className="mb-4 flex flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-white">
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-200">
              <FileSpreadsheet className="size-4" aria-hidden="true" />
            </span>
            <span className="truncate">TenderFlow command centre</span>
          </div>
          <span className="w-fit rounded-full bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-200">
            6 deadlines in view
          </span>
        </div>
        <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs font-medium text-gray-400">
              Spreadsheet replaced
            </p>
            <p className="mt-2 text-3xl font-bold text-white">GBP2.4M</p>
            <p className="mt-1 text-sm text-gray-400">Active bid pipeline</p>
            <div className="mt-4 grid gap-2">
              {["At risk / blocked", "Due this week", "Awaiting result"].map(
                (item, index) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-lg bg-white/[0.05] px-3 py-2 text-sm"
                  >
                    <span className="text-gray-300">{item}</span>
                    <span className="font-semibold text-white">
                      {[3, 6, 4][index]}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
          <div className="hidden overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] lg:block">
            <div className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr] border-b border-white/10 px-3 py-2 text-xs font-medium text-gray-400">
              <span>Tender</span>
              <span>Owner</span>
              <span>Deadline</span>
              <span>Status</span>
            </div>
            {rows.map((row) => (
              <div
                key={row.tender}
                className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr] items-center gap-2 border-b border-white/5 px-3 py-3 text-xs last:border-b-0"
              >
                <span className="truncate font-medium text-white">
                  {row.tender}
                </span>
                <span className="text-gray-400">{row.owner}</span>
                <span className="text-gray-300">{row.deadline}</span>
                <span className="inline-flex items-center gap-1 text-blue-200">
                  <CheckCircle2 className="size-3" aria-hidden="true" />
                  {row.status}
                </span>
              </div>
            ))}
          </div>
          <div className="grid gap-2 lg:hidden">
            {rows.map((row) => (
              <div
                key={row.tender}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 font-medium text-white">{row.tender}</p>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs text-blue-200">
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    {row.status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                  <span>{row.owner}</span>
                  <span>{row.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
