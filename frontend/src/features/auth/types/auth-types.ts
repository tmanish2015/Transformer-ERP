export interface AuthRole {
  id: string
  key: string
  name: string
  description: string | null
}

export interface AuthProfile {
  id: string
  companyId: string | null
  fullName: string | null
  avatarUrl: string | null
  phone: string | null
  status: string
  role: AuthRole
  permissions: string[]
}

export interface TeamMember {
  id: string
  fullName: string | null
  avatarUrl: string | null
  status: string
  role: {
    id: string
    key: string
    name: string
  }
}
