import { Module } from '@nestjs/common'
import { EnvModule } from '../env/env.module'
import { StripeService as AbstractStripeService } from '@/domain/payment/application/stripe/stripe-service'
import { StripeServiceImpl } from './stripe.service'

@Module({
	imports: [EnvModule],
	providers: [
		{
			provide: AbstractStripeService,
			useClass: StripeServiceImpl,
		},
		StripeServiceImpl,
	],
	exports: [AbstractStripeService, StripeServiceImpl],
})
export class StripeModule {}
