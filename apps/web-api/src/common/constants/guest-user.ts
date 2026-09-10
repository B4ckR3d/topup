import { UserRole } from '@umbreon/db/types'
import type { TUser } from 'src/common/types/meta.type'

export const GUEST_USER: TUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'guest@umbreon.store',
  name: 'Guest User',
  role: UserRole.GUEST,
  balance: 0,
  created_at: new Date(0),
  updated_at: new Date(0),
  image_url: null,
  is_banned: false,
  is_email_verified: false,
  phone: null,
  pin_attempts: 0,
  pin_hash: null,
  pin_locked_until: null,
  pin_set_at: null,
}
