"use client"

import {
  Bell,
  Building2,
  Check,
  CreditCard,
  Info,
  Lock,
  Mail,
  Send,
  ShieldCheck,
  UserRound,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { useRef, useState, type ReactNode } from "react"

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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  createBillingPortalSession,
  createCheckoutSession,
  createSettingsAccessRequest,
  createTelegramLink,
  formatDateTime,
  inviteMember,
  labelFromValue,
  profileName,
  removeOrganisationMember,
  resolveSettingsAccessRequest,
  unlinkTelegramAccount,
  updateInvitationStatus,
  updateMemberNotificationPreference,
  updateMemberRole,
  updateOrganisationNotificationSettings,
  updateOrganisationSettings,
  updateProfileName,
  useTenderFlowData,
  type OrganisationMember,
} from "@/lib/tender-flow-data"
import {
  currencies,
  notificationTypes,
  reminderLeadTimes,
  rolePermissions,
  roles,
  timezones,
  type OrganisationRole,
} from "@/lib/settings-policy"
import { cn } from "@/lib/utils"

type SettingsSection =
  | "profile"
  | "organisation"
  | "team"
  | "permissions"
  | "notifications"
  | "billing"

const settingsSectionLabels: Record<SettingsSection, string> = {
  profile: "Profile",
  organisation: "Organisation",
  team: "Team & seats",
  permissions: "Permissions",
  notifications: "Notifications",
  billing: "Billing",
}

const settingsSections = Object.keys(settingsSectionLabels) as SettingsSection[]

function isSettingsSection(value: string | null): value is SettingsSection {
  if (!value) return false
  return settingsSections.includes(value as SettingsSection)
}

function roleVariant(role: string) {
  if (role === "admin") return "default"
  if (role === "editor") return "secondary"
  return "outline"
}

function PermissionMarker({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <Badge variant="secondary" className="gap-1">
      <Check className="size-3" aria-hidden="true" />
      Yes
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <X className="size-3" aria-hidden="true" />
      No
    </Badge>
  )
}

function ChannelStatusCard({
  icon: Icon,
  label,
  status,
  detail,
  tone = "neutral",
}: {
  icon: LucideIcon
  label: string
  status: string
  detail: string
  tone?: "ready" | "warning" | "neutral"
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        tone === "ready" && "border-primary/20 bg-primary/5",
        tone === "warning" && "border-amber-600/25 bg-amber-50/70",
        tone === "neutral" && "bg-muted/15"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md",
            tone === "ready" && "bg-primary/10 text-primary",
            tone === "warning" && "bg-amber-100 text-amber-800",
            tone === "neutral" && "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-0.5 text-sm font-semibold">{status}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {detail}
          </p>
        </div>
      </div>
    </div>
  )
}

function ProfileSettingsCard({
  className,
  fullName,
  email,
  error,
  saving,
  onNameChange,
  onSave,
}: {
  className?: string
  fullName: string
  email: string
  error?: string
  saving: boolean
  onNameChange: (value: string) => void
  onSave: () => void
}) {
  return (
    <Card className={cn("tf-settings-card", className)}>
      <CardHeader>
        <CardAction>
          <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <UserRound className="size-4" aria-hidden="true" />
          </div>
        </CardAction>
        <CardTitle>Your profile</CardTitle>
        <CardDescription>
          This name is visible across your organisation wherever your user
          appears.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
          <Field id="profile-full-name" label="Full name" error={error}>
            <Input
              id="profile-full-name"
              value={fullName}
              onChange={(event) => onNameChange(event.target.value)}
              autoComplete="name"
            />
          </Field>
          <div className="grid gap-2">
            <Label>Email</Label>
            <p className="min-h-9 rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              {email}
            </p>
          </div>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save name"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function MobileMemberCard({
  member,
  name,
  email,
  canManageUsers,
  currentUserId,
  workingKey,
  emailEnabled,
  onRoleChange,
  onNotificationChange,
  onRemove,
}: {
  member: OrganisationMember
  name: string
  email: string
  canManageUsers: boolean
  currentUserId: string | null
  workingKey: string | null
  emailEnabled: boolean
  onRoleChange: (role: OrganisationRole) => void
  onNotificationChange: (enabled: boolean) => void
  onRemove: () => void
}) {
  const canManageNotifications =
    canManageUsers || member.user_id === currentUserId

  return (
    <article className="tf-settings-card rounded-md border bg-background p-3 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium">{name}</h3>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <Badge variant="outline">Active</Badge>
      </div>
      <div className="mt-3 grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`mobile-role-${member.id}`}>Role</Label>
          {canManageUsers ? (
            <Select
              value={member.role}
              onValueChange={(value) => onRoleChange(value as OrganisationRole)}
            >
              <SelectTrigger
                id={`mobile-role-${member.id}`}
                className="w-full"
                disabled={workingKey === `role-${member.id}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {labelFromValue(role)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={roleVariant(member.role)} className="w-fit">
              {labelFromValue(member.role)}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md bg-muted/20 p-2">
          <div>
            <p className="text-sm font-medium">Email notifications</p>
            <p className="text-xs text-muted-foreground">
              Joined {formatDateTime(member.created_at)}
            </p>
          </div>
          <Switch
            checked={emailEnabled}
            onChange={(event) => onNotificationChange(event.target.checked)}
            disabled={
              workingKey === `member-pref-${member.user_id}` ||
              !canManageNotifications
            }
            aria-label={`Email notifications for ${name}`}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRemove}
          disabled={!canManageUsers || workingKey === `remove-${member.id}`}
        >
          Remove
        </Button>
      </div>
    </article>
  )
}

function Field({
  id,
  label,
  children,
  error,
}: {
  id: string
  label: string
  children: ReactNode
  error?: string
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isDuplicateSlugError(error: unknown) {
  return (
    error instanceof Error && error.message.toLowerCase().includes("duplicate")
  )
}

export default function SettingsPage() {
  const {
    organisation,
    currentMember,
    profiles,
    members,
    invitations,
    accessRequests,
    notificationSettings,
    notificationPreferences,
    telegramLink,
    billingProfile,
    loading,
    error,
    reload,
  } = useTenderFlowData()

  const currentRole = currentMember?.role ?? "viewer"
  const hasFullSettingsAccess = currentRole === "admin"
  const canViewSettings = currentRole === "admin" || currentRole === "editor"
  const canManageUsers = currentRole === "admin"
  const pendingInvitations = invitations.filter(
    (item) => item.status === "pending"
  )
  const pendingAccessRequests = accessRequests.filter(
    (item) => item.status === "pending"
  )
  const activeSeats = members.length
  const seatLimit =
    billingProfile?.seat_quantity ??
    billingProfile?.seat_allowance ??
    organisation?.seat_limit ??
    10
  const occupiedSeats = activeSeats + pendingInvitations.length
  const adminCount = members.filter((member) => member.role === "admin").length
  const hasStripeCustomer = Boolean(billingProfile?.provider_customer_id)
  const currentProfile =
    profiles.find((item) => item.id === currentMember?.user_id) ?? null
  const currentProfileName = currentProfile?.full_name ?? ""

  const organisationNameRef = useRef<HTMLInputElement>(null)
  const organisationSlugRef = useRef<HTMLInputElement>(null)
  const seatLimitRef = useRef<HTMLInputElement>(null)

  const [profileFullNameOverride, setProfileFullNameOverride] = useState<
    string | null
  >(null)
  const [currency, setCurrency] = useState<string | null>(null)
  const [timezone, setTimezone] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [submittingInvite, setSubmittingInvite] = useState(false)
  const [workingKey, setWorkingKey] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<OrganisationRole>("viewer")
  const [inviteMessage, setInviteMessage] = useState("")
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(
    hasFullSettingsAccess ? "organisation" : "team"
  )
  const profileFullName = profileFullNameOverride ?? currentProfileName
  const defaultSettingsSection = hasFullSettingsAccess ? "organisation" : "team"
  const visibleSettingsSection =
    isSettingsSection(settingsSection) &&
    (hasFullSettingsAccess ||
      (settingsSection !== "organisation" && settingsSection !== "billing"))
      ? settingsSection
      : defaultSettingsSection
  const currentNotificationPreference = notificationPreferences.find(
    (item) => item.user_id === currentMember?.user_id
  )
  const currentEmailEnabled =
    currentNotificationPreference?.email_enabled ?? true
  const currentTelegramEnabled =
    currentNotificationPreference?.telegram_enabled ?? false
  const enabledNotificationTypes =
    notificationSettings?.enabled_types ??
    notificationTypes.map((item) => item.key)
  const enabledReminderDays =
    notificationSettings?.reminder_days ?? [14, 7, 2, 0]

  function handleSettingsSectionChange(value: string | null) {
    if (
      isSettingsSection(value) &&
      (hasFullSettingsAccess ||
        (value !== "organisation" && value !== "billing"))
    ) {
      setSettingsSection(value)
      return
    }

    setSettingsSection(defaultSettingsSection)
  }

  function clearStatus() {
    setNotice(null)
    setActionError(null)
    setFieldErrors({})
  }

  async function runAction(key: string, action: () => Promise<void>) {
    setWorkingKey(key)
    clearStatus()
    try {
      await action()
      reload()
    } catch (actionError) {
      setActionError(
        actionError instanceof Error ? actionError.message : "Action failed."
      )
    } finally {
      setWorkingKey(null)
    }
  }

  async function handleSaveProfile() {
    if (!currentMember?.user_id) {
      setActionError("Could not find your signed-in profile.")
      return
    }

    const fullName = profileFullName.trim()

    if (fullName.length < 2) {
      setFieldErrors({ profileName: "Enter your name." })
      setActionError("Fix the highlighted settings before saving.")
      return
    }

    setWorkingKey("profile")
    clearStatus()

    try {
      await updateProfileName(currentMember.user_id, fullName)
      setProfileFullNameOverride(fullName)
      setNotice("Profile name saved.")
      reload()
    } catch (profileError) {
      setActionError(
        profileError instanceof Error
          ? profileError.message
          : "Could not save your profile."
      )
    } finally {
      setWorkingKey(null)
    }
  }

  async function handleSaveWorkspace() {
    if (!organisation?.id || !hasFullSettingsAccess) {
      setActionError("Only admins can save organisation settings.")
      return
    }

    const name = organisationNameRef.current?.value.trim() ?? ""
    const slug = organisationSlugRef.current?.value.trim() ?? ""
    const nextSeatLimit = Number(seatLimitRef.current?.value ?? seatLimit)
    const errors: Record<string, string> = {}

    if (name.length < 2) errors.name = "Enter an organisation name."
    if (!/^[a-z0-9-]{3,}$/.test(slug)) {
      errors.slug = "Use at least 3 lowercase letters, numbers, or hyphens."
    }
    if (!Number.isInteger(nextSeatLimit) || nextSeatLimit < activeSeats) {
      errors.seatLimit = "Seat limit must be at least the active member count."
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setActionError("Fix the highlighted settings before saving.")
      return
    }

    setSaving(true)
    clearStatus()

    try {
      await updateOrganisationSettings(organisation.id, {
        name,
        slug,
        default_currency: currency ?? organisation.default_currency ?? "GBP",
        timezone: timezone ?? organisation.timezone ?? "Europe/London",
        seat_limit: nextSeatLimit,
      })
      setNotice("Workspace settings saved.")
      reload()
    } catch (saveError) {
      if (isDuplicateSlugError(saveError)) {
        setFieldErrors({ slug: "This slug is already in use." })
      }
      setActionError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save workspace."
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleRequestAccess() {
    if (!organisation?.id || !currentMember?.user_id) return

    setRequesting(true)
    clearStatus()

    try {
      await createSettingsAccessRequest({
        organisation_id: organisation.id,
        requester_id: currentMember.user_id,
        requested_role: "editor",
      })
      setNotice("Access request sent to workspace admins.")
      reload()
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Could not send access request."
      )
    } finally {
      setRequesting(false)
    }
  }

  async function handleCreateInvite() {
    if (!organisation?.id || !currentMember?.user_id) return

    const email = inviteEmail.trim().toLowerCase()
    if (!validateEmail(email)) {
      setFieldErrors({ inviteEmail: "Enter a valid email address." })
      return
    }
    if (occupiedSeats >= seatLimit) {
      setActionError("Seat limit reached. Revoke an invite or increase seats.")
      return
    }

    setSubmittingInvite(true)
    clearStatus()

    try {
      await inviteMember({
        organisationId: organisation.id,
        email,
        role: inviteRole,
        message: inviteMessage.trim() || null,
      })
      setInviteEmail("")
      setInviteMessage("")
      setInviteRole("viewer")
      setNotice("Invite created and delivery queued.")
      reload()
    } catch (inviteError) {
      setActionError(
        inviteError instanceof Error
          ? inviteError.message
          : "Could not create invite."
      )
    } finally {
      setSubmittingInvite(false)
    }
  }

  function assertCanChangeMember(
    member: OrganisationMember,
    nextRole?: OrganisationRole
  ) {
    if (member.role === "admin" && adminCount <= 1 && nextRole !== "admin") {
      throw new Error("At least one admin must remain in the organisation.")
    }
  }

  async function handleRoleChange(
    member: OrganisationMember,
    nextRole: OrganisationRole
  ) {
    await runAction(`role-${member.id}`, async () => {
      assertCanChangeMember(member, nextRole)
      await updateMemberRole(member.id, { role: nextRole })
      setNotice("Member role updated.")
    })
  }

  async function handleRemoveMember(member: OrganisationMember) {
    if (!window.confirm("Remove this member from the organisation?")) return

    await runAction(`remove-${member.id}`, async () => {
      assertCanChangeMember(member)
      await removeOrganisationMember(member.id)
      setNotice("Member removed from the organisation.")
    })
  }

  async function handleResolveRequest(
    requestId: string,
    requesterId: string,
    approve: boolean
  ) {
    if (!currentMember?.user_id) return

    await runAction(`request-${requestId}`, async () => {
      if (approve) {
        const member = members.find((item) => item.user_id === requesterId)
        if (member) {
          await updateMemberRole(member.id, { role: "editor" })
        }
      }

      await resolveSettingsAccessRequest(requestId, {
        status: approve ? "approved" : "rejected",
        resolved_by: currentMember.user_id,
        resolved_at: new Date().toISOString(),
      })

      setNotice(
        approve ? "Access request approved." : "Access request rejected."
      )
    })
  }

  async function handleToggleNotificationType(key: string, enabled: boolean) {
    if (!organisation?.id || !currentMember?.user_id || !hasFullSettingsAccess)
      return

    const currentTypes =
      notificationSettings?.enabled_types ??
      notificationTypes.map((item) => item.key)
    const nextTypes = enabled
      ? Array.from(new Set([...currentTypes, key]))
      : currentTypes.filter((item) => item !== key)

    await runAction(`notification-type-${key}`, async () => {
      await updateOrganisationNotificationSettings({
        organisation_id: organisation.id,
        enabled_types: nextTypes,
        reminder_days: notificationSettings?.reminder_days ?? [14, 7, 2, 0],
        updated_by: currentMember.user_id,
      })
      setNotice("Notification defaults updated.")
    })
  }

  async function handleToggleReminder(days: number, enabled: boolean) {
    if (!organisation?.id || !currentMember?.user_id || !hasFullSettingsAccess)
      return

    const currentDays = notificationSettings?.reminder_days ?? [14, 7, 2, 0]
    const nextDays = enabled
      ? Array.from(new Set([...currentDays, days])).sort((a, b) => b - a)
      : currentDays.filter((item) => item !== days)

    await runAction(`reminder-${days}`, async () => {
      await updateOrganisationNotificationSettings({
        organisation_id: organisation.id,
        enabled_types:
          notificationSettings?.enabled_types ??
          notificationTypes.map((item) => item.key),
        reminder_days: nextDays,
        updated_by: currentMember.user_id,
      })
      setNotice("Reminder schedule updated.")
    })
  }

  async function handleToggleMemberPreference(
    member: OrganisationMember,
    enabled: boolean
  ) {
    if (!organisation?.id || !currentMember?.user_id) return
    const preference = notificationPreferences.find(
      (item) => item.user_id === member.user_id
    )

    await runAction(`member-pref-${member.user_id}`, async () => {
      await updateMemberNotificationPreference({
        organisation_id: organisation.id,
        user_id: member.user_id,
        email_enabled: enabled,
        telegram_enabled: preference?.telegram_enabled ?? false,
        updated_by: currentMember.user_id,
      })
      setNotice("Notification preference updated.")
    })
  }

  async function handleToggleMemberTelegramPreference(
    member: OrganisationMember,
    enabled: boolean
  ) {
    if (!organisation?.id || !currentMember?.user_id) return
    const preference = notificationPreferences.find(
      (item) => item.user_id === member.user_id
    )

    await runAction(`member-telegram-pref-${member.user_id}`, async () => {
      await updateMemberNotificationPreference({
        organisation_id: organisation.id,
        user_id: member.user_id,
        email_enabled: preference?.email_enabled ?? true,
        telegram_enabled: enabled,
        updated_by: currentMember.user_id,
      })
      setNotice("Telegram reminder preference updated.")
    })
  }

  async function handleCreateTelegramLink() {
    await runAction("telegram-link", async () => {
      const link = await createTelegramLink()
      window.open(link.url, "_blank", "noopener,noreferrer")
      setNotice("Telegram link generated. Complete setup in Telegram.")
    })
  }

  async function handleUnlinkTelegram() {
    if (!currentMember?.user_id || !organisation?.id) return
    const preference = notificationPreferences.find(
      (item) => item.user_id === currentMember.user_id
    )

    await runAction("telegram-unlink", async () => {
      await unlinkTelegramAccount(currentMember.user_id)
      await updateMemberNotificationPreference({
        organisation_id: organisation.id,
        user_id: currentMember.user_id,
        email_enabled: preference?.email_enabled ?? true,
        telegram_enabled: false,
        updated_by: currentMember.user_id,
      })
      setNotice("Telegram reminders unlinked.")
    })
  }

  async function handleBillingAction() {
    if (!organisation?.id) return

    await runAction("billing", async () => {
      const session = hasStripeCustomer
        ? await createBillingPortalSession(organisation.id)
        : await createCheckoutSession(
            organisation.id,
            billingProfile?.plan_key ?? "standard"
          )

      window.location.href = session.url
    })
  }

  if (loading) {
    return (
      <AppShell
        activePage="Settings"
        title="Settings"
        showHeader={false}
        workspaceName={organisation?.name ?? null}
        workspaceUserName={profileName(
          profiles,
          currentMember?.user_id ?? null
        )}
        workspaceRole={currentMember?.role ?? null}
      >
        <div className="p-4 lg:p-6">
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell
        activePage="Settings"
        title="Settings"
        showHeader={false}
        workspaceName={organisation?.name ?? null}
        workspaceUserName={profileName(
          profiles,
          currentMember?.user_id ?? null
        )}
        workspaceRole={currentMember?.role ?? null}
      >
        <div className="p-4 lg:p-6">
          <Alert variant="destructive">
            <AlertTitle>Could not load settings</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </AppShell>
    )
  }

  if (!canViewSettings) {
    const pendingRequest = pendingAccessRequests.find(
      (item) => item.requester_id === currentMember?.user_id
    )

    return (
      <AppShell
        activePage="Settings"
        title="Settings"
        showHeader={false}
        workspaceName={organisation?.name ?? null}
        workspaceUserName={profileName(
          profiles,
          currentMember?.user_id ?? null
        )}
        workspaceRole={currentMember?.role ?? null}
      >
        <div className="flex flex-col gap-4 p-4 lg:p-6">
          {notice ? (
            <Alert className="border-primary/20 bg-primary/5">
              <AlertTitle>Request sent</AlertTitle>
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          ) : null}
          {actionError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not request access</AlertTitle>
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          ) : null}
          <ProfileSettingsCard
            fullName={profileFullName}
            email={currentProfile?.email ?? "-"}
            error={fieldErrors.profileName}
            saving={workingKey === "profile"}
            onNameChange={setProfileFullNameOverride}
            onSave={handleSaveProfile}
          />
          <Alert>
            <Lock className="size-4" aria-hidden="true" />
            <AlertTitle>Settings access is restricted</AlertTitle>
            <AlertDescription>
              <span className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Viewers cannot access organisation or user management. Your
                  request will appear in the admin review queue.
                </span>
                <Button
                  size="sm"
                  onClick={handleRequestAccess}
                  disabled={requesting || Boolean(pendingRequest)}
                >
                  {pendingRequest
                    ? "Request pending"
                    : requesting
                      ? "Requesting..."
                      : "Request access"}
                </Button>
              </span>
            </AlertDescription>
          </Alert>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      activePage="Settings"
      title="Settings"
      showHeader={false}
      workspaceName={organisation?.name ?? null}
      workspaceUserName={profileName(profiles, currentMember?.user_id ?? null)}
      workspaceRole={currentMember?.role ?? null}
    >
      <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        {notice ? (
          <Alert className="border-primary/20 bg-primary/5">
            <AlertTitle>Action complete</AlertTitle>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}
        {actionError ? (
          <Alert variant="destructive">
            <AlertTitle>Action failed</AlertTitle>
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        ) : null}
        <Tabs
          value={visibleSettingsSection}
          onValueChange={handleSettingsSectionChange}
          className="gap-4"
        >
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid gap-1.5 lg:hidden">
              <Label htmlFor="settings-section">Settings section</Label>
              <Select
                value={visibleSettingsSection}
                onValueChange={handleSettingsSectionChange}
              >
                <SelectTrigger id="settings-section" className="w-full">
                  <SelectValue>
                    {settingsSectionLabels[visibleSettingsSection]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="profile">
                      {settingsSectionLabels.profile}
                    </SelectItem>
                    {hasFullSettingsAccess ? (
                      <SelectItem value="organisation">
                        {settingsSectionLabels.organisation}
                      </SelectItem>
                    ) : null}
                    <SelectItem value="team">
                      {settingsSectionLabels.team}
                    </SelectItem>
                    <SelectItem value="permissions">
                      {settingsSectionLabels.permissions}
                    </SelectItem>
                    <SelectItem value="notifications">
                      {settingsSectionLabels.notifications}
                    </SelectItem>
                    {hasFullSettingsAccess ? (
                      <SelectItem value="billing">
                        {settingsSectionLabels.billing}
                      </SelectItem>
                    ) : null}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <TabsList className="hidden max-w-full [scrollbar-width:none] overflow-x-auto lg:inline-flex [&::-webkit-scrollbar]:hidden">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              {hasFullSettingsAccess ? (
                <TabsTrigger value="organisation">Organisation</TabsTrigger>
              ) : null}
              <TabsTrigger value="team">Team & seats</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              {hasFullSettingsAccess ? (
                <TabsTrigger value="billing">Billing</TabsTrigger>
              ) : null}
            </TabsList>
            {hasFullSettingsAccess &&
            visibleSettingsSection === "organisation" ? (
              <Button
                size="sm"
                className="hidden w-full lg:inline-flex lg:w-fit"
                onClick={handleSaveWorkspace}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save workspace"}
              </Button>
            ) : null}
          </div>

          <TabsContent value="profile" className="space-y-4">
            <ProfileSettingsCard
              fullName={profileFullName}
              email={currentProfile?.email ?? "-"}
              error={fieldErrors.profileName}
              saving={workingKey === "profile"}
              onNameChange={setProfileFullNameOverride}
              onSave={handleSaveProfile}
            />
          </TabsContent>

          {hasFullSettingsAccess ? (
            <TabsContent value="organisation" className="space-y-4">
              <Card className="tf-settings-card">
                <CardHeader>
                  <CardAction>
                    <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Building2 className="size-4" aria-hidden="true" />
                    </div>
                  </CardAction>
                  <CardTitle>Organisation settings</CardTitle>
                  <CardDescription>
                    Workspace defaults are persisted to the organisation record.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      id="organisation-name"
                      label="Organisation name"
                      error={fieldErrors.name}
                    >
                      <Input
                        id="organisation-name"
                        ref={organisationNameRef}
                        defaultValue={organisation?.name ?? ""}
                      />
                    </Field>
                    <Field
                      id="organisation-slug"
                      label="Slug"
                      error={fieldErrors.slug}
                    >
                      <Input
                        id="organisation-slug"
                        ref={organisationSlugRef}
                        defaultValue={organisation?.slug ?? ""}
                      />
                    </Field>
                    <Field id="default-currency" label="Default currency">
                      <Select
                        value={
                          currency ?? organisation?.default_currency ?? "GBP"
                        }
                        onValueChange={(value) => {
                          if (value) setCurrency(value)
                        }}
                      >
                        <SelectTrigger id="default-currency" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {currencies.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field id="timezone" label="Timezone">
                      <Select
                        value={
                          timezone ?? organisation?.timezone ?? "Europe/London"
                        }
                        onValueChange={(value) => {
                          if (value) setTimezone(value)
                        }}
                      >
                        <SelectTrigger id="timezone" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {timezones.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field
                      id="seat-limit"
                      label="Seat limit"
                      error={fieldErrors.seatLimit}
                    >
                      <Input
                        id="seat-limit"
                        type="number"
                        min={activeSeats}
                        ref={seatLimitRef}
                        defaultValue={String(seatLimit)}
                      />
                    </Field>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      {occupiedSeats} of {seatLimit} seats are active or
                      pending.
                    </p>
                    <Button onClick={handleSaveWorkspace} disabled={saving}>
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-settings-card">
                <CardHeader>
                  <CardTitle>Access requests</CardTitle>
                  <CardDescription>
                    Viewer requests waiting for admin review.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingAccessRequests.length ? (
                    pendingAccessRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex flex-col gap-3 rounded-md border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {profileName(profiles, request.requester_id)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Requested {labelFromValue(request.requested_role)}{" "}
                            on {formatDateTime(request.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleResolveRequest(
                                request.id,
                                request.requester_id,
                                false
                              )
                            }
                            disabled={workingKey === `request-${request.id}`}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleResolveRequest(
                                request.id,
                                request.requester_id,
                                true
                              )
                            }
                            disabled={workingKey === `request-${request.id}`}
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No pending access requests.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ) : null}

          <TabsContent value="team" className="space-y-4">
            <Card className="tf-settings-card">
              <CardHeader className="border-b">
                <CardAction>
                  <Dialog>
                    <DialogTrigger
                      render={
                        <Button
                          disabled={
                            !canManageUsers || occupiedSeats >= seatLimit
                          }
                        />
                      }
                    >
                      <UserPlus className="size-4" aria-hidden="true" />
                      Invite user
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Invite user</DialogTitle>
                        <DialogDescription>
                          Creates a pending invitation record for this
                          workspace.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4">
                        <Field
                          id="invite-email"
                          label="Email"
                          error={fieldErrors.inviteEmail}
                        >
                          <Input
                            id="invite-email"
                            type="email"
                            value={inviteEmail}
                            onChange={(event) =>
                              setInviteEmail(event.target.value)
                            }
                          />
                        </Field>
                        <Field id="invite-role" label="Role">
                          <Select
                            value={inviteRole}
                            onValueChange={(value) =>
                              setInviteRole(value as OrganisationRole)
                            }
                          >
                            <SelectTrigger id="invite-role" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {roles.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {labelFromValue(role)}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field id="invite-message" label="Message">
                          <Input
                            id="invite-message"
                            value={inviteMessage}
                            onChange={(event) =>
                              setInviteMessage(event.target.value)
                            }
                          />
                        </Field>
                      </div>
                      <DialogFooter showCloseButton>
                        <Button
                          onClick={handleCreateInvite}
                          disabled={submittingInvite}
                        >
                          {submittingInvite ? "Creating..." : "Create invite"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardAction>
                <CardTitle>Team members and seats</CardTitle>
                <CardDescription>
                  {occupiedSeats} of {seatLimit} seats are active or pending.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid gap-3 p-4 lg:hidden">
                  {members.map((member) => {
                    const profile = profiles.find(
                      (item) => item.id === member.user_id
                    )
                    const preference = notificationPreferences.find(
                      (item) => item.user_id === member.user_id
                    )

                    return (
                      <MobileMemberCard
                        key={member.id}
                        member={member}
                        name={profileName(profiles, member.user_id)}
                        email={profile?.email ?? "-"}
                        canManageUsers={canManageUsers}
                        currentUserId={currentMember?.user_id ?? null}
                        workingKey={workingKey}
                        emailEnabled={preference?.email_enabled ?? true}
                        onRoleChange={(value) =>
                          handleRoleChange(member, value)
                        }
                        onNotificationChange={(enabled) =>
                          handleToggleMemberPreference(member, enabled)
                        }
                        onRemove={() => handleRemoveMember(member)}
                      />
                    )
                  })}
                </div>
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Seat status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Notifications</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => {
                        const profile = profiles.find(
                          (item) => item.id === member.user_id
                        )
                        const preference = notificationPreferences.find(
                          (item) => item.user_id === member.user_id
                        )

                        return (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">
                              {profileName(profiles, member.user_id)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {profile?.email ?? "-"}
                            </TableCell>
                            <TableCell>
                              {canManageUsers ? (
                                <Select
                                  value={member.role}
                                  onValueChange={(value) =>
                                    handleRoleChange(
                                      member,
                                      value as OrganisationRole
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    className="w-32"
                                    disabled={
                                      workingKey === `role-${member.id}`
                                    }
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      {roles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                          {labelFromValue(role)}
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge variant={roleVariant(member.role)}>
                                  {labelFromValue(member.role)}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">Active</Badge>
                            </TableCell>
                            <TableCell>
                              {formatDateTime(member.created_at)}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={preference?.email_enabled ?? true}
                                onChange={(event) =>
                                  handleToggleMemberPreference(
                                    member,
                                    event.target.checked
                                  )
                                }
                                disabled={
                                  workingKey ===
                                    `member-pref-${member.user_id}` ||
                                  (!canManageUsers &&
                                    member.user_id !== currentMember?.user_id)
                                }
                                aria-label={`Email notifications for ${profileName(
                                  profiles,
                                  member.user_id
                                )}`}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveMember(member)}
                                disabled={
                                  !canManageUsers ||
                                  workingKey === `remove-${member.id}`
                                }
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="tf-settings-card">
              <CardHeader>
                <CardTitle>Pending invites</CardTitle>
                <CardDescription>
                  Invitations reserve seats until accepted, revoked, or expired.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingInvitations.length ? (
                  pendingInvitations.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex flex-col gap-3 rounded-md border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{invite.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {labelFromValue(invite.role)} invite expires{" "}
                          {formatDateTime(invite.expires_at)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          runAction(`invite-${invite.id}`, async () => {
                            await updateInvitationStatus(invite.id, {
                              status: "revoked",
                            })
                            setNotice("Invite revoked.")
                          })
                        }
                        disabled={
                          !canManageUsers ||
                          workingKey === `invite-${invite.id}`
                        }
                      >
                        Revoke
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No pending invites.
                  </p>
                )}
              </CardContent>
            </Card>

            <Alert>
              <Info className="size-4" aria-hidden="true" />
              <AlertTitle>Role guardrail</AlertTitle>
              <AlertDescription>
                At least one admin must remain in the organisation. Editors can
                view settings and manage tender workflow data. Viewers are
                read-only.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="permissions">
            <Card className="tf-settings-card">
              <CardHeader>
                <CardAction>
                  <Tooltip>
                    <TooltipTrigger
                      render={<Button variant="outline" size="icon-sm" />}
                    >
                      <ShieldCheck className="size-4" aria-hidden="true" />
                      <span className="sr-only">Permission model details</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      These fixed MVP roles are mirrored by Supabase RLS
                      policies.
                    </TooltipContent>
                  </Tooltip>
                </CardAction>
                <CardTitle>Roles and permissions</CardTitle>
                <CardDescription>
                  Default access model for organisation-scoped tender, renewal,
                  analytics, and settings features.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid gap-3 p-4 lg:hidden">
                  {rolePermissions.map((permission) => (
                    <article
                      key={permission.label}
                      className="tf-settings-card rounded-md border bg-muted/15 p-3"
                    >
                      <h3 className="text-sm font-medium">
                        {permission.label}
                      </h3>
                      <div className="mt-3 grid gap-2">
                        {roles.map((role) => (
                          <div
                            key={`${permission.label}-${role}`}
                            className="flex items-center justify-between gap-3 text-sm"
                          >
                            <span className="text-muted-foreground">
                              {labelFromValue(role)}
                            </span>
                            <PermissionMarker enabled={permission[role]} />
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
                <div className="hidden lg:block">
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-56">Permission</TableHead>
                          {roles.map((role) => (
                            <TableHead key={role}>
                              {labelFromValue(role)}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rolePermissions.map((permission) => (
                          <TableRow key={permission.label}>
                            <TableCell className="font-medium">
                              {permission.label}
                            </TableCell>
                            {roles.map((role) => (
                              <TableCell key={`${permission.label}-${role}`}>
                                <PermissionMarker enabled={permission[role]} />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <section className="grid gap-3 md:grid-cols-3">
              <ChannelStatusCard
                icon={Mail}
                label="Email reminders"
                status={currentEmailEnabled ? "Enabled for you" : "Paused for you"}
                detail={
                  currentEmailEnabled
                    ? "TenderFlow will email you when your organisation reminders are active."
                    : "You will not receive email reminder deliveries until this is enabled."
                }
                tone={currentEmailEnabled ? "ready" : "neutral"}
              />
              <ChannelStatusCard
                icon={Send}
                label="Telegram reminders"
                status={
                  telegramLink
                    ? currentTelegramEnabled
                      ? "Linked and enabled"
                      : "Linked but paused"
                    : "Not linked"
                }
                detail={
                  telegramLink
                    ? currentTelegramEnabled
                      ? "Direct bot reminders are active for your account."
                      : "Your Telegram account is linked, but reminders are switched off."
                    : "Link Telegram to receive direct bot reminders alongside email."
                }
                tone={
                  telegramLink && currentTelegramEnabled
                    ? "ready"
                    : telegramLink
                      ? "neutral"
                      : "warning"
                }
              />
              <ChannelStatusCard
                icon={Bell}
                label="Workspace schedule"
                status={`${enabledReminderDays.length} reminder windows`}
                detail={`${enabledNotificationTypes.length} notification type${
                  enabledNotificationTypes.length === 1 ? "" : "s"
                } active for this organisation.`}
                tone="ready"
              />
            </section>
            <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
              <Card className="tf-settings-card">
                <CardHeader>
                  <CardAction>
                    <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Bell className="size-4" aria-hidden="true" />
                    </div>
                  </CardAction>
                  <CardTitle>Organisation default notifications</CardTitle>
                  <CardDescription>
                    Admin defaults for workspace reminder and event
                    notifications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-2">
                    {notificationTypes.map((item) => {
                      const checked = enabledNotificationTypes.includes(item.key)
                      return (
                        <label
                          key={item.key}
                          className={cn(
                            "flex items-start gap-3 rounded-md border p-3 text-sm transition-colors",
                            checked
                              ? "border-primary/25 bg-primary/5"
                              : "bg-muted/20"
                          )}
                        >
                          <Switch
                            checked={checked}
                            onChange={(event) =>
                              handleToggleNotificationType(
                                item.key,
                                event.target.checked
                              )
                            }
                            disabled={
                              !hasFullSettingsAccess ||
                              workingKey === `notification-type-${item.key}`
                            }
                          />
                          <span className="grid gap-1">
                            <span className="font-medium">{item.label}</span>
                            <span className="text-xs leading-5 text-muted-foreground">
                              {checked ? "Included in reminders" : "Paused"}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Label>Reminder schedule</Label>
                    <div className="grid gap-3 md:grid-cols-2">
                      {reminderLeadTimes.map((item) => {
                        const checked = enabledReminderDays.includes(item.days)
                        return (
                          <label
                            key={item.days}
                            className={cn(
                              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                              checked
                                ? "border-primary/25 bg-primary/5"
                                : "bg-muted/15"
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onChange={(event) =>
                                handleToggleReminder(
                                  item.days,
                                  event.target.checked
                                )
                              }
                              disabled={
                                !hasFullSettingsAccess ||
                                workingKey === `reminder-${item.days}`
                              }
                            />
                            <span>{item.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-settings-card">
                <CardHeader>
                  <CardAction>
                    <Mail className="size-5 text-primary" aria-hidden="true" />
                  </CardAction>
                  <CardTitle>Email</CardTitle>
                  <CardDescription>
                    Users can manage their own preference; admins can manage the
                    team.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {members.map((member) => {
                    const preference = notificationPreferences.find(
                      (item) => item.user_id === member.user_id
                    )
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {profileName(profiles, member.user_id)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {labelFromValue(member.role)} -{" "}
                            {preference?.email_enabled ?? true
                              ? "email enabled"
                              : "email paused"}
                          </p>
                        </div>
                        <Switch
                          checked={preference?.email_enabled ?? true}
                          onChange={(event) =>
                            handleToggleMemberPreference(
                              member,
                              event.target.checked
                            )
                          }
                          disabled={
                            workingKey === `member-pref-${member.user_id}` ||
                            (!canManageUsers &&
                              member.user_id !== currentMember?.user_id)
                          }
                        />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </section>
            <Card className="tf-settings-card">
              <CardHeader>
                <CardAction>
                  <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Send className="size-4" aria-hidden="true" />
                  </div>
                </CardAction>
                <CardTitle>Telegram</CardTitle>
                <CardDescription>
                  Link your Telegram account and choose whether Tender Flow can
                  send deadline reminders there.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {telegramLink
                      ? `Linked${telegramLink.telegram_username ? ` as @${telegramLink.telegram_username}` : ""}`
                      : "Not linked"}
                    {telegramLink ? (
                      <Badge variant="secondary">Ready</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Setup needed
                      </Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Telegram reminders are delivered as direct messages from the
                    Tender Flow bot.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2 text-sm">
                    <span>Telegram reminders</span>
                    <Switch
                      checked={currentTelegramEnabled}
                      onChange={(event) => {
                        if (currentMember) {
                          handleToggleMemberTelegramPreference(
                            currentMember,
                            event.target.checked
                          )
                        }
                      }}
                      disabled={
                        !telegramLink ||
                        workingKey ===
                          `member-telegram-pref-${currentMember?.user_id}`
                      }
                    />
                  </label>
                  {telegramLink ? (
                    <Button
                      variant="outline"
                      onClick={handleUnlinkTelegram}
                      disabled={workingKey === "telegram-unlink"}
                    >
                      {workingKey === "telegram-unlink"
                        ? "Unlinking..."
                        : "Unlink Telegram"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCreateTelegramLink}
                      disabled={workingKey === "telegram-link"}
                    >
                      {workingKey === "telegram-link"
                        ? "Opening..."
                        : "Link Telegram"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {hasFullSettingsAccess ? (
            <TabsContent value="billing">
              <Card className="tf-settings-card">
                <CardHeader>
                  <CardAction>
                    <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <CreditCard className="size-4" aria-hidden="true" />
                    </div>
                  </CardAction>
                  <CardTitle>Billing and seats</CardTitle>
                  <CardDescription>
                    Billing metadata is stored for provider activation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    {[
                      [
                        "Current plan",
                        billingProfile?.plan_name ?? "Standard",
                      ],
                      ["Active seats", String(activeSeats)],
                      ["Pending invites", String(pendingInvitations.length)],
                      ["Seat limit", String(seatLimit)],
                      [
                        "Active tender limit",
                        String(billingProfile?.active_tender_limit ?? 15),
                      ],
                      [
                        "Billing admin",
                        profileName(
                          profiles,
                          billingProfile?.billing_admin_id ??
                            currentMember?.user_id ??
                            null
                        ),
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-md border bg-muted/20 p-3"
                      >
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="mt-1 text-sm font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {billingProfile?.subscription_status
                          ? labelFromValue(billingProfile.subscription_status)
                          : "Not configured"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {hasStripeCustomer
                          ? "Billing portal is available for this organisation."
                          : "Start a Stripe subscription for active and pending seats."}
                      </p>
                    </div>
                    <Button
                      onClick={handleBillingAction}
                      disabled={workingKey === "billing"}
                    >
                      {workingKey === "billing"
                        ? "Opening..."
                        : hasStripeCustomer
                          ? "Manage billing"
                          : "Start subscription"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ) : null}
        </Tabs>

        <Card className="tf-settings-card">
          <CardHeader>
            <CardAction>
              <Users className="size-5 text-primary" aria-hidden="true" />
            </CardAction>
            <CardTitle>Access control summary</CardTitle>
            <CardDescription>
              Current signed-in role: {labelFromValue(currentRole)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {roles.map((role) => (
              <div key={role} className="rounded-md border bg-muted/20 p-3">
                <p className="text-sm font-medium">{labelFromValue(role)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {role === "admin"
                    ? "Full Settings access for organisation and user management."
                    : role === "editor"
                      ? "Can view settings and manage tender workflow data."
                      : "Read-only access to organisation-scoped data."}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
