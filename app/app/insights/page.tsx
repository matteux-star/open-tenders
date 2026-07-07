"use client"

import { useState } from "react"
import { Download } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  formatCurrency,
  formatShortCurrency,
  profileName,
  useOpenTendersData,
} from "@/lib/open-tenders-data"
import { downloadTenderReportCsv } from "@/lib/open-tenders-export"
import {
  type InsightPeriod,
  currentPeriodRange,
  insightSummary,
  insightTrend,
  outcomeBreakdown,
  tendersCreatedInPeriod,
} from "@/lib/open-tenders-metrics"

const periodLabels: Record<InsightPeriod, string> = {
  all: "All time",
  month: "Month",
  quarter: "Quarter",
  year: "Year",
}

const trendSeries = [
  {
    key: "created",
    label: "Created",
    valueKey: "createdValue",
    countKey: "createdCount",
    className: "bg-primary/85",
    legendClassName: "bg-primary",
  },
  {
    key: "submitted",
    label: "Submitted",
    valueKey: "submittedValue",
    countKey: "submittedCount",
    className: "bg-foreground/35",
    legendClassName: "bg-foreground/35",
  },
  {
    key: "won",
    label: "Won",
    valueKey: "wonValue",
    countKey: "wonCount",
    className: "bg-primary/35",
    legendClassName: "bg-primary/35",
  },
] as const

export default function InsightsPage() {
  const {
    tenders,
    deadlines,
    contracts,
    profiles,
    organisation,
    currentMember,
    loading,
    error,
  } = useOpenTendersData()
  const [period, setPeriod] = useState<InsightPeriod>("all")
  const range = currentPeriodRange(period)
  const cohort = tendersCreatedInPeriod(tenders, period)
  const summary = insightSummary(cohort, contracts)
  const outcomes = outcomeBreakdown(cohort, contracts)
  const trend = insightTrend(tenders, period, new Date(), contracts)
  const maxTrendValue = Math.max(
    ...trend.flatMap((item) => [
      item.createdValue,
      item.submittedValue,
      item.wonValue,
    ]),
    1
  )
  const barHeight = (value: number) =>
    value ? `${Math.max(3, (value / maxTrendValue) * 100)}%` : "2px"
  const periodScopeText =
    period === "all"
      ? "Every tender in this account."
      : "Cohort based on tender creation date."
  const trendDescription =
    period === "all"
      ? "Yearly account history by tender creation date."
      : `Comparable ${periodLabels[period].toLowerCase()} buckets by tender creation date.`
  const metricCards = [
    {
      label: "Created tenders",
      value: String(summary.createdCount),
      detail: range.label,
    },
    {
      label: "Created pipeline",
      value: formatShortCurrency(summary.createdValue),
      detail: "Total opportunity value",
    },
    {
      label: "Average opportunity",
      value: formatShortCurrency(summary.averageValue),
      detail: "Mean tender value",
    },
    {
      label: "Submitted",
      value: String(summary.submittedCount),
      detail: formatShortCurrency(summary.submittedValue),
    },
    {
      label: "Won",
      value: String(summary.wonCount),
      detail: formatShortCurrency(summary.wonValue),
    },
    {
      label: "Win rate",
      value: `${summary.winRate}%`,
      detail: "Won vs won/lost",
    },
  ]

  return (
    <AppShell
      activePage="Insights"
      title="Pipeline insights"
      showHeader={false}
      workspaceName={organisation?.name ?? null}
      workspaceUserName={profileName(profiles, currentMember?.user_id ?? null)}
      workspaceRole={currentMember?.role ?? null}
      mobileActionSlot={
        <Button
          size="icon-sm"
          aria-label="Export insights"
          onClick={() =>
            downloadTenderReportCsv({ tenders, deadlines, contracts, profiles })
          }
          disabled={loading || Boolean(error) || tenders.length === 0}
        >
          <Download className="size-4" aria-hidden="true" />
        </Button>
      }
    >
      <div className="flex flex-col gap-3 p-3 sm:p-4 lg:gap-6 lg:p-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading insights...</p>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load insights</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-medium">{range.label}</p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {periodScopeText}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Tabs
              value={period}
              onValueChange={(value) => setPeriod(value as InsightPeriod)}
            >
              <TabsList>
                {(Object.keys(periodLabels) as InsightPeriod[]).map((item) => (
                  <TabsTrigger key={item} value={item}>
                    {periodLabels[item]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button
              size="sm"
              className="max-sm:hidden"
              onClick={() =>
                downloadTenderReportCsv({
                  tenders,
                  deadlines,
                  contracts,
                  profiles,
                })
              }
              disabled={loading || Boolean(error) || tenders.length === 0}
            >
              <Download className="size-4" aria-hidden="true" />
              Export insights
            </Button>
          </div>
        </div>

        <section className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-2 xl:grid-cols-6">
          {metricCards.map((metric) => (
            <Card
              key={metric.label}
              size="sm"
              className="tf-stat-tile gap-2 py-3 sm:gap-4 sm:py-4 [&_[data-slot=card-content]]:px-3 sm:[&_[data-slot=card-content]]:px-4 [&_[data-slot=card-header]]:px-3 sm:[&_[data-slot=card-header]]:px-4"
            >
              <CardHeader>
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-xl sm:text-2xl">
                  {metric.value}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{metric.detail}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid items-start gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <Card>
            <CardHeader>
              <CardAction>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {trendSeries.map((series) => (
                    <span
                      key={series.key}
                      className="inline-flex items-center gap-1.5"
                    >
                      <span
                        className={`size-2 rounded-full ${series.legendClassName}`}
                      />
                      {series.label}
                    </span>
                  ))}
                </div>
              </CardAction>
              <CardTitle>Pipeline value trend</CardTitle>
              <CardDescription>{trendDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-72 items-end gap-3 rounded-md border bg-muted/20 p-4">
                {trend.length ? (
                  trend.map((item) => (
                    <div
                      key={item.label}
                      className="flex h-full flex-1 flex-col justify-end gap-2"
                    >
                      <div className="flex flex-1 items-end gap-1">
                        {trendSeries.map((series) => {
                          const value = Number(item[series.valueKey] ?? 0)
                          const count = Number(item[series.countKey] ?? 0)

                          return (
                            <Tooltip key={series.key}>
                              <TooltipTrigger
                                render={
                                  <button
                                    type="button"
                                    data-insight-tooltip={series.key}
                                    className={`w-full rounded-t-sm border-0 p-0 transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${series.className}`}
                                    style={{ height: barHeight(value) }}
                                    aria-label={`${item.label} ${series.label}: ${formatCurrency(
                                      value
                                    )}, ${count} tenders`}
                                  />
                                }
                              />
                              <TooltipContent className="flex-col items-start">
                                <span className="font-medium">
                                  {item.label} {series.label}
                                </span>
                                <span>{formatCurrency(value)}</span>
                                <span>
                                  {count} {count === 1 ? "tender" : "tenders"}
                                </span>
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}
                      </div>
                      <p className="truncate text-center text-xs text-muted-foreground">
                        {item.label}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex h-full flex-1 items-center justify-center text-sm text-muted-foreground">
                    No tender history yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-[25rem]">
            <CardHeader>
              <CardTitle>Won & Lost</CardTitle>
              <CardDescription>
                Historic outcomes for the selected account scope.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {outcomes.map((outcome) => (
                <div key={outcome.outcome} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{outcome.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatShortCurrency(outcome.value)}
                      </p>
                    </div>
                    <Badge variant="outline">{outcome.count}</Badge>
                  </div>
                  <Progress value={outcome.progress} />
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Performance summary</CardTitle>
            <CardDescription>
              Submitted and won value for {range.label.toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <SummaryBlock
              label="Submitted value"
              value={formatCurrency(summary.submittedValue)}
              detail={`${summary.submittedCount} submitted or awaiting result`}
            />
            <SummaryBlock
              label="Won value"
              value={formatCurrency(summary.wonValue)}
              detail={`${summary.wonCount} won tenders`}
            />
            <SummaryBlock
              label="Conversion"
              value={`${summary.winRate}%`}
              detail="Won tenders divided by won/lost outcomes"
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function SummaryBlock({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}
