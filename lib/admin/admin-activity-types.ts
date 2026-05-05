export type AdminActivityItem =
  | {
      kind: 'booking'
      id: string
      created_at: string
      title: string
      subtitle: string | null
      href: string
      gym_name: string | null
      status: string | null
    }
  | {
      kind: 'gym_new'
      id: string
      created_at: string
      title: string
      subtitle: string | null
      href: string
      gym_name: string | null
      status: string | null
    }
  | {
      kind: 'owner_claimed'
      id: string
      created_at: string
      title: string
      subtitle: string | null
      href: string
      gym_name: string | null
      status: string | null
    }
