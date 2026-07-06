import type { Database } from "@/lib/supabase/database.types"

export type OrganisationRole =
  Database["public"]["Enums"]["organisation_member_role"]

export const roles = [
  "admin",
  "editor",
  "viewer",
] as const satisfies readonly OrganisationRole[]

export const rolePermissions = [
  { label: "View tenders", admin: true, editor: true, viewer: true },
  { label: "Create tenders", admin: true, editor: true, viewer: false },
  { label: "Edit tenders", admin: true, editor: true, viewer: false },
  { label: "Delete tenders", admin: true, editor: false, viewer: false },
  { label: "Manage deadlines", admin: true, editor: true, viewer: false },
  { label: "Manage renewals", admin: true, editor: true, viewer: false },
  { label: "View insights", admin: true, editor: true, viewer: true },
  { label: "Export reports", admin: true, editor: false, viewer: false },
  { label: "Manage users", admin: true, editor: false, viewer: false },
  {
    label: "Manage organisation settings",
    admin: true,
    editor: false,
    viewer: false,
  },
] as const

export const notificationTypes = [
  { key: "submission_deadline", label: "Tender submission deadline reminders" },
  { key: "clarification_deadline", label: "Clarification deadline reminders" },
  {
    key: "internal_review_deadline",
    label: "Internal review deadline reminders",
  },
  { key: "renewal_window", label: "Renewal window reminders" },
  { key: "contract_expiry", label: "Contract expiry reminders" },
  { key: "tender_assignment", label: "Tender assignment notifications" },
  { key: "status_change", label: "Status change notifications" },
] as const

export const reminderLeadTimes = [
  { days: 30, label: "Send reminder 30 days before" },
  { days: 14, label: "Send reminder 14 days before" },
  { days: 7, label: "Send reminder 7 days before" },
  { days: 2, label: "Send reminder 48 hours before" },
  { days: 0, label: "Send reminder on deadline day" },
] as const

export const currencies = ["GBP", "EUR", "USD"] as const

export const timezones = [
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "America/New_York",
  "UTC",
] as const
