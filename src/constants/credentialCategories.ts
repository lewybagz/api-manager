export const CREDENTIAL_CATEGORIES = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "database", label: "Database" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "devops", label: "DevOps" },
  { value: "mobile", label: "Mobile" },
  { value: "analytics", label: "Analytics" },
  { value: "other", label: "Other" },
  { value: "none", label: "None" },
] as const

export type CredentialCategoryValue =
  (typeof CREDENTIAL_CATEGORIES)[number]["value"]

export const normalizeCredentialCategory = (category?: string): string =>
  (category?.trim() || "none").toLowerCase()

export const credentialCategoryLabel = (value: string): string => {
  const normalized = value.toLowerCase()
  const known = CREDENTIAL_CATEGORIES.find((c) => c.value === normalized)
  if (known) return known.label
  if (normalized === "all") return "All"
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export type ExportCategoryOption = {
  count: number
  label: string
  value: string
}

export const buildExportCategoryOptions = (
  credentialCountsByCategory: Map<string, number>
): ExportCategoryOption[] => {
  const options: ExportCategoryOption[] = []
  const seen = new Set<string>()

  for (const { value, label } of CREDENTIAL_CATEGORIES) {
    const count = credentialCountsByCategory.get(value)
    if (!count) continue
    options.push({ value, label, count })
    seen.add(value)
  }

  for (const [value, count] of credentialCountsByCategory) {
    if (seen.has(value)) continue
    options.push({
      value,
      label: credentialCategoryLabel(value),
      count,
    })
  }

  return options
}
