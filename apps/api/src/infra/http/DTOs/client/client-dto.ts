import { ClientStatusType } from '@/domain/financial-management/enterprise/entities/value-objects/client-status'
import { OnboardingStatusType } from '@/domain/financial-management/enterprise/entities/value-objects/onboarding-status'
import { ApiProperty } from '@nestjs/swagger'

export class ClientDTO {
	@ApiProperty({
		example: 'e3b0c442-98fc-1c14-9af2-d474c5ed654a',
		description: 'Unique identifier of the client',
	})
	id: string

	@ApiProperty({
		example: 'John Doe',
		description: 'Full name of the client',
	})
	name: string

	@ApiProperty({
		example: 'john.doe@example.com',
		description: 'Email address of the client',
	})
	email: string

	@ApiProperty({
		example: '+440216212836',
		description: 'Phone number of the client',
	})
	phoneNumber: string

	@ApiProperty({
		example: 'INVITED',
		description: 'Current status of the client',
		enum: ['ACTIVE', 'INACTIVE', 'INVITED'],
	})
	status: ClientStatusType

	@ApiProperty({
		example: 'NEW',
		description: 'Current onboarding status of the client',
		enum: [
			'NEW',
			'EMAIL_VERIFIED',
			'PHONE_VERIFIED',
			'PASSWORD_SET',
			'ONBOARDED',
		],
	})
	onboardingStatus: OnboardingStatusType

	@ApiProperty({
		example: ['e3b0c442-98fc-1c14-9af2-d474c5ed654a'],
		description: 'IDs of users managing this client',
		required: false,
		nullable: true,
		type: [String],
	})
	managedBy: string[] | undefined
}
