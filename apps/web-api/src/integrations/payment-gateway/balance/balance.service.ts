import { Injectable, UnprocessableEntityException } from '@nestjs/common'
import { eq, sql } from '@umbreon/db'
import { BalanceMutationRefType, BalanceMutationType, PaymentStatus, tb } from '@umbreon/db/types'
import type { DBInstance } from 'src/common/types/db-instance'
import { SendResponse } from 'src/common/utils/response'
import { DatabaseService } from 'src/core/database/database.service'
import type { PaymentGateway } from '../payment.interface'
import type { CreatePaymentRequest, CreatePaymentResult } from '../payment-gateway.type'

@Injectable()
export class BalanceService implements PaymentGateway {
  constructor(private readonly databaseService: DatabaseService) {}
  handleCallback(_): Promise<any> {
    // console.log(data)
    throw new Error('Method not implemented.')
  }

  async createTransaction(
    data: CreatePaymentRequest,
    tx?: DBInstance,
  ): Promise<CreatePaymentResult> {
    await this.deductBalance(
      {
        amount: data.amount,
        name: `Order #${data.merchant_ref}`,
        ref_type: BalanceMutationRefType.ORDER,
        ref_id: data.merchant_ref,
        type: BalanceMutationType.DEBIT,
        userId: data.user_id,
        notes: `Payment for order ${data.merchant_ref}`,
      },
      tx,
    )

    return {
      base_amount: data.amount,
      settlement_amount: data.amount,
      fee_type: data.fee_type,
      pay_amount: data.amount,
      customer_email: data.customer_email,
      customer_name: data.customer_name,
      expired_at: new Date(Date.now() + 60 * 60 * 1000),
      id: data.merchant_ref,
      order_items: data.order_items,
      provider_code: data.provider_code,
      provider_name: data.provider_name,
      ref_id: data.merchant_ref,
      fee_amount: 0,
      customer_phone: data.customer_phone,
      pay_url: null,
      pay_code: null,
      qr_code: null,
      qr_url: null,
      status: PaymentStatus.SUCCESS,
    }
  }

  calculateFee(amountReceived: number, feeRate: number, fixedFee: number): number {
    throw new Error(`Method not implemented. ${amountReceived}, ${feeRate}, ${fixedFee}`)
  }

  cancelTransaction(data: any): Promise<any> {
    throw new Error(`Method not implemented. ${data}`)
  }

  async addBalance(data: AddBalanceRequest, dbInstance?: DBInstance) {
    const db = dbInstance || this.databaseService.db

    const [, addMutation, updatedUser] = await db.transaction(
      async (tx) => {
        const [user] = await tx
          .select()
          .from(tb.users)
          .where(eq(tb.users.id, data.userId))
          .for('update')

        if (!user) {
          throw new UnprocessableEntityException(`User with ID ${data.userId} not found`)
        }

        const [addMutation] = await tx
          .insert(tb.balanceMutations)
          .values({
            name: data.name,
            user_id: data.userId,
            amount: data.amount,
            ref_type: data.ref_type,
            ref_id: data.ref_id || '',
            type: data.type,
            notes: data.notes || '',
            balance_after: sql`${user.balance}::int + ${data.amount}::int`,
            balance_before: user.balance,
          })
          .returning()

        const [updatedUser] = await tx
          .update(tb.users)
          .set({
            balance: sql`${user.balance}::int + ${data.amount}::int`,
          })
          .where(eq(tb.users.id, data.userId))
          .returning()

        return [user, addMutation, updatedUser]
      },
      {
        isolationLevel: 'read committed',
        accessMode: 'read write',
      },
    )

    return SendResponse.success({
      updatedUser: updatedUser,
      mutation: addMutation,
    })
  }

  async deductBalance(data: AddBalanceRequest, dbInstance?: DBInstance) {
    const db = dbInstance || this.databaseService.db

    const [, deductMutation, updatedUser] = await db.transaction(
      async (tx) => {
        const [user] = await tx
          .select()
          .from(tb.users)
          .where(eq(tb.users.id, data.userId))
          .for('update')

        if (!user) {
          throw new UnprocessableEntityException(`User with ID ${data.userId} not found`)
        }

        if (user.balance < data.amount) {
          throw new UnprocessableEntityException(
            `Insufficient balance for user with ID ${data.userId}`,
          )
        }

        const [deductMutation] = await tx
          .insert(tb.balanceMutations)
          .values({
            name: data.name,
            user_id: data.userId,
            amount: -data.amount,
            ref_type: data.ref_type,
            ref_id: data.ref_id || '',
            type: data.type,
            notes: data.notes || '',
            balance_after: sql`${user.balance}::int - ${data.amount}::int`,
            balance_before: user.balance,
          })
          .returning()

        const [updatedUser] = await tx
          .update(tb.users)
          .set({
            balance: sql`${user.balance}::int - ${data.amount}::int`,
          })
          .where(eq(tb.users.id, data.userId))
          .returning()

        return [user, deductMutation, updatedUser]
      },
      {
        isolationLevel: 'read committed',
        accessMode: 'read write',
      },
    )

    return SendResponse.success({
      updatedUser: updatedUser,
      mutation: deductMutation,
    })
  }
}

type AddBalanceRequest = {
  name: string
  userId: string
  amount: number
  ref_type: BalanceMutationRefType
  ref_id?: string
  type: BalanceMutationType
  notes?: string
}
