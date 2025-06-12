export type RolePermissions = Record<string, string[]>

const STORAGE_KEY = 'tarl-permissions'

export function getPermissions(): RolePermissions {
  if (typeof window === 'undefined') return {}
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return {}
  try {
    return JSON.parse(stored) as RolePermissions
  } catch {
    return {}
  }
}

export function savePermissions(perms: RolePermissions) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(perms))
}
