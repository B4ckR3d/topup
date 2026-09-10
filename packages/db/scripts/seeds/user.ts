import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import type { Database } from '@/database'
import { UserRole } from '@/schema'
import { tb } from '@/table'

export const userSeed = async (db: Database) => {
  const hashedPassword = bcrypt.hashSync('B@gusok55', 10)

  // 1. Check or update/insert admin@umbreon.store
  const existingAdmin = await db.query.users.findFirst({
    where: eq(tb.users.email, 'admin@umbreon.store'),
  })

  if (existingAdmin) {
    await db
      .update(tb.users)
      .set({
        password: hashedPassword,
        role: UserRole.ADMIN,
        name: 'Umbreon Admin',
        is_banned: false,
        is_deleted: false,
      })
      .where(eq(tb.users.id, existingAdmin.id))
    console.log('[Seed] Admin user admin@umbreon.store password & role updated.')
  } else {
    await db
      .insert(tb.users)
      .values({
        id: '91319975-2d4a-4704-9963-7d3d66506ae1',
        email: 'admin@umbreon.store',
        password: hashedPassword,
        name: 'Umbreon Admin',
        phone: '08123456789',
        role: UserRole.ADMIN,
      })
      .onConflictDoNothing()
    console.log('[Seed] Admin user admin@umbreon.store created successfully.')
  }

  // 2. Also reset password for okebagus426@gmail.com if it was the earlier admin account
  const oldAdmin = await db.query.users.findFirst({
    where: eq(tb.users.email, 'okebagus426@gmail.com'),
  })
  if (oldAdmin) {
    await db
      .update(tb.users)
      .set({
        password: hashedPassword,
        role: UserRole.ADMIN,
        is_banned: false,
        is_deleted: false,
      })
      .where(eq(tb.users.id, oldAdmin.id))
    console.log('[Seed] Old admin okebagus426@gmail.com updated with password B@gusok55.')
  }

  // 3. Ensure guest user exists
  const existingGuest = await db.query.users.findFirst({
    where: eq(tb.users.email, 'guest@umbreon.store'),
  })
  if (!existingGuest) {
    await db
      .insert(tb.users)
      .values({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'guest@umbreon.store',
        password: hashedPassword,
        name: 'Guest User',
        phone: '08123123123',
        role: UserRole.GUEST,
      })
      .onConflictDoNothing()
  }
}
