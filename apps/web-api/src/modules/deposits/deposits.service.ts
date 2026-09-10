import crypto from 'node:crypto'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { eq, gte, lte, type SQL } from '@umbreon/db'
import {
  BalanceMutationRefType,
  BalanceMutationType,
  DepositStatus,
  PaymentMethodFeeType,
  PaymentStatus,
  tb,
} from '@umbreon/db/types'
import type { TUser } from 'src/common/types/meta.type'
import { SendResponse } from 'src/common/utils/response'
import { DatabaseService } from 'src/core/database/database.service'
import { QueueService } from 'src/core/queue/queue.service'
import { StorageService } from 'src/core/storage/storage.service'
import { BalanceService } from 'src/integrations/payment-gateway/balance/balance.service'
import { calculatePaymentFee } from 'src/integrations/payment-gateway/payment-fee'
import { PaymentGatewayService } from 'src/integrations/payment-gateway/payment-gateway.service'
import { DepositsRepository } from './deposits.repository'
import type { CreateDeposit, DepositHistoryQuery } from './dto/deposits.dto'

@Injectable()
export class DepositsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly paymentGatewayService: PaymentGatewayService,
    private readonly queueService: QueueService,
    private readonly depositRepository: DepositsRepository,
    private readonly balanceService: BalanceService,
    private readonly storageService: StorageService,
  ) {}

  async getDepositMethods() {
    const payments = await this.depositRepository.findPaymentMethod()
    return SendResponse.success(
      payments.map((category) => ({
        ...category,
        payment_methods: category.payment_methods.map((method) => ({
          ...method,
          image_url: this.storageService.getFileUrl(method.image_url),
        })),
      })),
    )
  }

  async getDespositHistory(query: DepositHistoryQuery, userId: string) {
    const { page, limit, deposit_id, start_date, end_date } = query

    const where: SQL[] = [eq(tb.deposits.user_id, userId)]

    if (deposit_id) {
      where.push(eq(tb.deposits.deposit_id, deposit_id))
    }

    if (start_date) {
      where.push(gte(tb.deposits.created_at, new Date(start_date)))
    }

    if (end_date) {
      where.push(lte(tb.deposits.created_at, new Date(end_date)))
    }

    const deposits = await this.depositRepository.findAllDepositHistory(query, userId)

    const total = await this.depositRepository.countDepositHistory(query, userId)

    return SendResponse.success<any>(
      deposits.map((depo) => ({
        ...depo,
        payment_method: {
          ...depo.payment_method,
          image_url: this.storageService.getFileUrl(depo.payment_method.image_url),
        },
      })),
      'Deposit history retrieved successfully',
      {
        meta: {
          pagination: {
            total: total,
            page: page,
            limit: limit,
            total_pages: Math.ceil(total / limit),
          },
        },
      },
    )
  }

  async getDepositDetail(deposit_id: string, userId: string) {
    const deposit = await this.depositRepository.findDepositByIdWithRelation(deposit_id)

    if (!deposit) {
      throw new NotFoundException('Deposit not found')
    }

    if (deposit.user_id !== userId) {
      throw new BadRequestException('You are not authorized to view this deposit')
    }

    deposit.payment_method.image_url = this.storageService.getFileUrl(
      deposit.payment_method.image_url,
    )

    return SendResponse.success(
      {
        deposit_id: deposit.deposit_id,
        payment_method_id: deposit.payment_method_id,
        amount_pay: deposit.amount_pay,
        amount_received: deposit.amount_received,
        amount_fee: deposit.amount_fee,
        phone_number: deposit.phone_number,
        email: deposit.email,
        status: deposit.status,
        pay_code: deposit.pay_code,
        pay_url: deposit.pay_url,
        qr_code: deposit.qr_code,
        expired_at: deposit.expired_at,
        created_at: deposit.created_at,
        updated_at: deposit.updated_at,
        payment_method: deposit.payment_method,
      },
      'Deposit detail retrieved successfully',
    )
  }

  async createDeposit(data: CreateDeposit, user: TUser) {
    const paymentMethod = await this.depositRepository.findPaymentMethodById(data.payment_method_id)

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found or not available')
    }

    if (paymentMethod.is_need_phone_number && !data.phone_number) {
      throw new BadRequestException('Phone number is required for this payment method')
    }

    if (data.amount < paymentMethod.min_amount || data.amount >= paymentMethod.max_amount)
      throw new BadRequestException(
        `Amount must be between ${paymentMethod.min_amount} and ${paymentMethod.max_amount}`,
      )

    let totalFee = 0

    if (paymentMethod.fee_type !== PaymentMethodFeeType.BUYER) {
      totalFee = calculatePaymentFee(
        data.amount,
        paymentMethod.fee_percentage / 100,
        paymentMethod.fee_static,
      )
    }

    const [, deposit] = await this.databaseService.db.transaction(async (tx) => {
      const depositId = this.generateDepositId(user.id)

      const paymentResult = await this.paymentGatewayService.createPayment({
        user_id: user.id,
        amount: data.amount,
        provider_code: paymentMethod.provider_code,
        provider_name: paymentMethod.provider_name,
        customer_email: user.email,
        customer_name: user.name,
        customer_phone: data.phone_number ?? '',
        order_items: [
          {
            name: `Deposit ${depositId}`,
            price: data.amount + totalFee,
            quantity: 1,
            product_id: depositId,
          },
        ],
        fee_type: paymentMethod.fee_type,
        merchant_ref: depositId,
        expires_in_seconds: paymentMethod.expired_in,
        fee_static: paymentMethod.fee_static,
        fee_percentage: paymentMethod.fee_percentage,
      })

      const deposit = await this.depositRepository.createDeposit(
        {
          ref_id: paymentResult.ref_id,
          deposit_id: depositId,
          payment_method_id: paymentMethod.id,
          status: DepositStatus.PENDING,
          user_id: user.id,
          amount_pay: paymentResult.pay_amount,
          expired_at: paymentResult.expired_at,
          amount_received: paymentResult.settlement_amount,
          amount_fee: paymentResult.fee_amount,
          email: paymentResult.customer_email,
          phone_number: data.phone_number,
          pay_code: paymentResult.pay_code,
          pay_url: paymentResult.pay_url,
          qr_code: paymentResult.qr_code,
        },
        tx,
      )

      return [paymentResult, deposit]
    })

    const delay = new Date(deposit?.expired_at).getTime() - Date.now()
    await this.queueService.addExpiredDepositJob(deposit.deposit_id, delay)

    return SendResponse.success({
      deposit_id: deposit.deposit_id,
    })
  }

  async cancelDeposit(depositId: string, userId: string) {
    const deposit = await this.depositRepository.findDepositById(depositId)

    if (!deposit) {
      throw new NotFoundException('Deposit not found or not cancellable')
    }

    if (deposit.user_id !== userId) {
      throw new BadRequestException('You are not authorized to cancel this deposit')
    }

    if (deposit.status !== DepositStatus.PENDING) {
      throw new BadRequestException('Only pending deposits can be cancelled')
    }

    await this.depositRepository.updateDepositStatus(depositId, DepositStatus.CANCELED)

    return SendResponse.success(null, 'Deposit cancelled successfully')
  }

  async handlePaymentCallback(depositId: string, paymentStatus: PaymentStatus) {
    const deposit = await this.depositRepository.findDepositById(depositId)
    if (!deposit) {
      throw new NotFoundException('Deposit not found')
    }

    if (deposit.status !== DepositStatus.PENDING) {
      throw new BadRequestException('Deposit already processed')
    }

    await this.databaseService.db.transaction(async (tx) => {
      const depositStatus: DepositStatus =
        paymentStatus === PaymentStatus.SUCCESS ? DepositStatus.COMPLETED : DepositStatus.FAILED

      await this.depositRepository.updateDepositStatus(depositId, depositStatus, tx)

      if (paymentStatus === PaymentStatus.SUCCESS) {
        await this.balanceService.addBalance(
          {
            userId: deposit.user_id,
            amount: deposit.amount_received,
            name: 'DEPOSIT',
            ref_type: BalanceMutationRefType.DEPOSIT,
            ref_id: deposit.deposit_id,
            type: BalanceMutationType.CREDIT,
            notes: `Deposit successful: ${deposit.deposit_id}`,
          },
          tx,
        )
      }
    })

    return { deposit_id: depositId, status: paymentStatus }
  }

  private generateDepositId(userId: string): string {
    const prefix = 'DEPO'
    const userPart = userId.slice(0, 4).toUpperCase()
    const timestamp = Date.now().toString(36).toUpperCase()
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase()

    return `${prefix}${userPart}${timestamp}${randomPart}`
  }
}
