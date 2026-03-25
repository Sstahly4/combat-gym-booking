const KEY = 'guest_saved_gyms'

export function getGuestSaves(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function isGuestSaved(gymId: string): boolean {
  return getGuestSaves().includes(gymId)
}

export function addGuestSave(gymId: string): void {
  const saves = getGuestSaves()
  if (!saves.includes(gymId)) {
    localStorage.setItem(KEY, JSON.stringify([...saves, gymId]))
  }
}

export function removeGuestSave(gymId: string): void {
  const saves = getGuestSaves()
  localStorage.setItem(KEY, JSON.stringify(saves.filter((id) => id !== gymId)))
}

export function clearGuestSaves(): void {
  localStorage.removeItem(KEY)
}
