import { ApiProperty } from '@nestjs/swagger'

export class UnifiedUserDTO {
	@ApiProperty({
		example: 'bd30b99f-a7e5-4c8f-8858-ae723dec5a4d',
		description: 'User ID',
	})
	id: string

	@ApiProperty({
		example: 'Employee or Client Name',
		description: 'User name',
	})
	name: string

	@ApiProperty({
		example: 'user@mail.com',
		description: 'User email',
	})
	email: string

	@ApiProperty({
		example: '2025-03-17T11:35:15.461Z',
		description: 'User creation date',
		type: String,
		format: 'date-time',
	})
	createdAt: string

	@ApiProperty({
		example: '2025-03-17T11:35:15.461Z',
		description: 'Last update date',
		nullable: true,
		type: String,
		format: 'date-time',
	})
	updatedAt: string | null

	@ApiProperty({
		example: 'user_2tZnQT1BhozN0AvQr18xmR5TjDN',
		description: 'Authenticating user ID',
	})
	authUserId: string

	@ApiProperty({
		example: 'EMPLOYEE',
		description: 'Type of user',
		enum: ['EMPLOYEE', 'CLIENT'],
	})
	type: 'EMPLOYEE' | 'CLIENT'

	@ApiProperty({
		example: 'ADMIN',
		description: 'Employee role (only when type is EMPLOYEE)',
		enum: ['ADMIN', 'STAFF'],
		required: false,
	})
	role?: string

	@ApiProperty({
		example: 'INVITED',
		description: 'Client status (only when type is CLIENT)',
		enum: ['INVITED', 'ACTIVE', 'INACTIVE'],
		required: false,
	})
	status?: string

	@ApiProperty({
		example: 'NEW',
		description: 'Client onboarding status (only when type is CLIENT)',
		enum: [
			'NEW',
			'EMAIL_VERIFIED',
			'PHONE_VERIFIED',
			'PASSWORD_SET',
			'ONBOARDED',
		],
		required: false,
	})
	onboardingStatus?: string

	@ApiProperty({
		example: '123456789',
		description: 'Client phone number (only when type is CLIENT)',
		required: false,
	})
	phoneNumber?: string

	@ApiProperty({
		example: true,
		description:
			'Whether the client phone is verified (only when type is CLIENT)',
		required: false,
	})
	phoneVerified?: boolean

	@ApiProperty({
		example: false,
		description: 'Whether the client or employee device is recognized',
		required: false,
	})
	isDeviceRecognized?: boolean

	@ApiProperty({
		example: true,
		description: 'Whether the client receives email notifications',
		required: false,
	})
	receivesEmailNotifications?: boolean

	@ApiProperty({
		example: true,
		description: 'Whether the client receives push notifications',
		required: false,
	})
	receivesPushNotifications?: boolean

	@ApiProperty({
		example: true,
		description: 'Whether the client receives notifications for portfolio',
		required: false,
	})
	receivesNotificationsForPortfolio?: boolean

	@ApiProperty({
		example: true,
		description: 'Whether the client receives notifications for documents',
		required: false,
	})
	receivesNotificationsForDocuments?: boolean
}
