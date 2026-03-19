import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { DatabaseModule } from '../database/database.module'
import { EnvModule } from '../env/env.module'
import { PushNotificationsModule } from '../push-notifications/push-notifications.module'
import { PaymentSchedulerService } from './payment-scheduler.service'
import { LeaseSchedulerService } from './lease-scheduler.service'
import { RentReminderSchedulerService } from './rent-reminder-scheduler.service'
import { GenerateAllLeasePaymentsUseCase } from '@/domain/payment/application/use-cases/generate-all-lease-payments'
import { GenerateLeasePaymentsUseCase } from '@/domain/payment/application/use-cases/generate-lease-payments'
import { MarkOverduePaymentsUseCase } from '@/domain/payment/application/use-cases/mark-overdue-payments'
import { SendLeaseExpiryNotificationsUseCase } from '@/domain/lease-management/application/use-cases/send-lease-expiry-notifications'
import { SendRentDueRemindersUseCase } from '@/domain/payment/application/use-cases/send-rent-due-reminders'
import { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'

@Module({
	imports: [
		ScheduleModule.forRoot(),
		DatabaseModule,
		EnvModule,
		PushNotificationsModule,
	],
	providers: [
		CreateNotificationUseCase,
		GenerateLeasePaymentsUseCase,
		GenerateAllLeasePaymentsUseCase,
		MarkOverduePaymentsUseCase,
		SendLeaseExpiryNotificationsUseCase,
		SendRentDueRemindersUseCase,
		PaymentSchedulerService,
		LeaseSchedulerService,
		RentReminderSchedulerService,
	],
})
export class SchedulerModule {}
