import {
  BarChart3,
  CalendarClock,
  ClipboardList,
  FileSpreadsheet,
  History,
  Layers3,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  UsersRound,
} from "lucide-react"

export const marketingNavItems = [
  { label: "Workflow", href: "/apps" },
  { label: "Customers", href: "/customers" },
  { label: "Pricing", href: "/pricing" },
  { label: "Support", href: "/support" },
]

export const workflowSteps = [
  {
    title: "Capture",
    description:
      "Log every opportunity once, with buyer, value, owner, stage, and submission date ready for the team.",
  },
  {
    title: "Qualify",
    description:
      "Separate live bids from no-bid decisions before a spreadsheet row quietly becomes stale.",
  },
  {
    title: "Assign",
    description:
      "Give each tender an owner and make handovers visible without chasing comments across files.",
  },
  {
    title: "Track",
    description:
      "See deadlines, risks, blockers, and renewal watch in one workspace built for bid teams.",
  },
  {
    title: "Submit",
    description:
      "Keep final reviews moving with a clear view of what is due, who owns it, and what changed.",
  },
]

export const featureBlocks = [
  {
    title: "Tender register",
    description:
      "Replace static spreadsheet tabs with a searchable register for stages, authorities, owners, values, and status.",
    icon: ClipboardList,
  },
  {
    title: "Deadline watch",
    description:
      "Surface upcoming, overdue, and high-risk submission dates before they get buried in a shared workbook.",
    icon: CalendarClock,
  },
  {
    title: "Pipeline health",
    description:
      "Track active value, win rate, risk, and due-this-week signals without manual spreadsheet formulas.",
    icon: BarChart3,
  },
  {
    title: "Renewal visibility",
    description:
      "Bring renewal watch into the same operating rhythm as tenders so contracts do not sit in a separate file.",
    icon: RefreshCcw,
  },
  {
    title: "Activity history",
    description:
      "Keep updates attached to the tender instead of buried in chat threads, comments, and old file versions.",
    icon: History,
  },
  {
    title: "Team permissions",
    description:
      "Give admins, editors, and viewers the right access while keeping bid data inside a shared workspace.",
    icon: LockKeyhole,
  },
]

export const moduleCards = [
  {
    title: "Tender register",
    description:
      "A live table for bid managers who need filters, owners, stages, value bands, and current deadline state.",
    icon: FileSpreadsheet,
  },
  {
    title: "Command centre",
    description:
      "Dashboard signals show active pipeline, at-risk tenders, deadlines this week, and renewal watch.",
    icon: Layers3,
  },
  {
    title: "Team workflow",
    description:
      "Assign owners, review tender details, and keep activity visible without emailing spreadsheet copies.",
    icon: UsersRound,
  },
  {
    title: "Risk control",
    description:
      "Highlight blockers and urgent submissions so bid leaders can intervene before a deadline slips.",
    icon: ShieldCheck,
  },
]

export const testimonials = [
  {
    quote:
      "TenderFlow gives our bid meetings a single source of truth. We no longer spend the first ten minutes asking which spreadsheet is current.",
    name: "Sarah K.",
    role: "Bid Manager",
    image: "/images/testimonial-01.jpg",
  },
  {
    quote:
      "The deadline view is the bit that changes behavior. Owners can see what is coming up without waiting for someone to refresh a tracker.",
    name: "Marcus L.",
    role: "Procurement Lead",
    image: "/images/testimonial-05.jpg",
  },
  {
    quote:
      "Handovers are calmer now. Tender context, owner, stage, value, and risk live together instead of being split across files and inboxes.",
    name: "Amelia R.",
    role: "Commercial Director",
    image: "/images/testimonial-08.jpg",
  },
]

export const pricingPlans = [
  {
    name: "Standard",
    price: "30",
    description: "For small teams replacing one tender spreadsheet.",
    limit: "Up to 15 active tenders",
    seats: "6 team members included",
    bestFit: "SME bid teams getting started with structured tender tracking.",
    features: [
      "Tender register",
      "Deadline watch",
      "Basic pipeline dashboard",
      "Guided spreadsheet template",
      "Email deadline reminders",
      "Owner visibility",
      "Role permissions",
    ],
  },
  {
    name: "Pro",
    price: "50",
    description: "For SMEs managing tender work as a recurring team process.",
    limit: "Up to 30 active tenders",
    seats: "10 team members included",
    bestFit: "The main workspace for bid teams that need shared ownership.",
    features: [
      "Everything in Standard",
      "Kanban pipeline",
      "Risk and blocker tracking",
      "Activity history",
      "Renewal watch",
      "Advanced insights",
      "CSV export",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For larger organisations or procurement-governed teams.",
    limit: "Custom active tender limits",
    seats: "Custom seats",
    bestFit:
      "Larger rollouts that need procurement, security, or success support.",
    features: [
      "Everything in Pro",
      "Dedicated onboarding",
      "Security and procurement review",
      "Custom success support",
      "Optional migration assistance",
      "Advanced controls when available",
    ],
  },
]

export const faqs = [
  {
    question: "Is TenderFlow meant to replace our bid spreadsheet?",
    answer:
      "Yes. The first draft is built around moving tender tracking into a live workspace while keeping the familiar structure bid teams expect: owner, buyer, stage, value, deadline, status, and activity.",
  },
  {
    question: "Can we start with our existing spreadsheet data?",
    answer:
      "Yes. TenderFlow should offer a guided spreadsheet template and import-prep process so teams can move from an existing tracker without promising fully automated migration before that workflow exists.",
  },
  {
    question: "Who is TenderFlow for?",
    answer:
      "TenderFlow is for bid managers, procurement teams, commercial leads, and operations teams who coordinate multiple tenders and need better visibility than a shared workbook provides.",
  },
  {
    question: "Does it handle deadlines and renewals?",
    answer:
      "Yes. The app already models tender deadlines and renewal watch so teams can see immediate submissions and future contract dates in one place.",
  },
  {
    question: "Is pricing per user?",
    answer:
      "No. TenderFlow is priced by workspace tier with included team members, so SMEs can invite the people involved in bids without feeling like they are buying another expensive CRM seat bundle.",
  },
]
