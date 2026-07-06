"use client"

import {
  formatCurrency,
  formatDateTime,
  labelFromValue,
  primaryDeadline,
  profileName,
  type Contract,
  type Profile,
  type Tender,
  type TenderDeadline,
} from "@/lib/tender-flow-data"

function csvCell(value: string | number | null | undefined) {
  const stringValue = String(value ?? "")

  return `"${stringValue.replaceAll('"', '""')}"`
}

export function downloadTenderReportCsv({
  tenders,
  deadlines,
  contracts,
  profiles,
}: {
  tenders: Tender[]
  deadlines: TenderDeadline[]
  contracts: Contract[]
  profiles: Profile[]
}) {
  const rows = tenders.map((tender) => {
    const relatedContract = contracts.find(
      (contract) => contract.tender_id === tender.id
    )

    return [
      tender.id,
      tender.title,
      tender.buyer_name,
      tender.sector ?? "",
      labelFromValue(tender.stage),
      labelFromValue(tender.status),
      formatCurrency(tender.estimated_value),
      profileName(profiles, tender.owner_id),
      formatDateTime(primaryDeadline(tender, deadlines)),
      relatedContract ? labelFromValue(relatedContract.status) : "",
      formatDateTime(tender.updated_at),
    ]
  })

  const csv = [
    [
      "Tender ID",
      "Tender name",
      "Authority",
      "Sector",
      "Stage",
      "Status",
      "Estimated value",
      "Owner",
      "Next deadline",
      "Contract status",
      "Last updated",
    ],
    ...rows,
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  const date = new Date().toISOString().slice(0, 10)

  link.href = url
  link.download = `tender-flow-report-${date}.csv`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
