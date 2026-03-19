import { PrismaClient } from '@prisma/client'
import {
	authUserClientIdE2E,
	authUserEmployerIdE2E,
	authUserPassword,
	authUserPasswordHash,
} from '../test/utils/auth-user-id-e2e'
import { randomUUID } from 'node:crypto'

const prisma = new PrismaClient()

async function main() {
	const existingEmployee = await prisma.employee.findFirst()

	if (existingEmployee) {
		// biome-ignore lint/suspicious/noConsole: <This is fine>
		console.log('🔍 Database already seeded, skipping seed operation')
		return
	}

	// biome-ignore lint/suspicious/noConsole: <This is fine>
	console.log('🌱 Seeding fresh database...')

	const employee = await prisma.employee.create({
		data: {
			email: 'employee@mail.com',
			name: 'Employee',
			role: 'ADMIN',
		},
	})

	await prisma.user.create({
		data: {
			email: 'employee@mail.com',
			name: 'Employee',
			id: authUserEmployerIdE2E,
			phoneNumber: null,
		},
	})

	await prisma.account.create({
		data: {
			userId: authUserEmployerIdE2E,
			id: randomUUID(),
			providerId: 'credential',
			accountId: authUserEmployerIdE2E,
			password: authUserPasswordHash,
		},
	})

	const client = await prisma.client.create({
		data: {
			name: 'Client',
			email: 'client@mail.com',
			phoneNumber: '123456789',
		},
	})

	await prisma.user.create({
		data: {
			email: 'client@mail.com',
			name: 'Client',
			id: authUserClientIdE2E,
			phoneNumber: '123456789',
		},
	})

	await prisma.account.create({
		data: {
			userId: authUserClientIdE2E,
			id: randomUUID(),
			providerId: 'credential',
			accountId: authUserClientIdE2E,
			password: authUserPasswordHash,
		},
	})

	// biome-ignore lint/suspicious/noConsole: <This is fine>
	console.log('✅ Employee and Client created')

	await prisma.identityProvider.create({
		data: {
			provider: 'BETTER_AUTH',
			providerUserId: authUserEmployerIdE2E,
			userType: 'EMPLOYEE',
			userId: employee.id,
		},
	})

	await prisma.identityProvider.create({
		data: {
			provider: 'BETTER_AUTH',
			providerUserId: authUserClientIdE2E,
			userType: 'CLIENT',
			userId: client.id,
		},
	})

	// biome-ignore lint/suspicious/noConsole: <This is fine>
	console.log('🔗 IdentityProvider records created')

	// Create standardized test users for e2e testing and development

	// Test User 1: Invited Client (Ready to Onboard)
	// This user has been invited but hasn't started onboarding yet
	const invitedClientUserId = randomUUID()
	const invitedClient = await prisma.client.create({
		data: {
			name: 'Invited Test Client',
			email: 'test+invited@example.com',
			phoneNumber: '+15551111111',
			status: 'INVITED',
			onboardingStatus: 'NEW',
			deviceId: null,
			onboardingToken: authUserPassword,
		},
	})

	// Create Better Auth User and Account with onboardingToken as temporary password
	await prisma.user.create({
		data: {
			email: 'test+invited@example.com',
			name: 'Invited Test Client',
			id: invitedClientUserId,
			phoneNumber: '+15551111111',
		},
	})

	await prisma.account.create({
		data: {
			userId: invitedClientUserId,
			id: randomUUID(),
			providerId: 'credential',
			accountId: invitedClientUserId,
			password: authUserPasswordHash, // Temporary password - will be replaced during onboarding
		},
	})

	await prisma.identityProvider.create({
		data: {
			provider: 'BETTER_AUTH',
			providerUserId: invitedClientUserId,
			userType: 'CLIENT',
			userId: invitedClient.id,
		},
	})

	// biome-ignore lint/suspicious/noConsole: <This is fine>
	console.log(
		'👤 Test User 1: Invited Client created (test+invited@example.com)',
	)

	// Test User 2: Active Client (New Device)
	// This user is fully onboarded but has no device registered yet
	const newDeviceClientUserId = randomUUID()
	const newDeviceClient = await prisma.client.create({
		data: {
			name: 'New Device Test Client',
			email: 'test+newdevice@example.com',
			phoneNumber: '+15552222222',
			status: 'ACTIVE',
			onboardingStatus: 'ONBOARDED',
			deviceId: null,
		},
	})

	await prisma.user.create({
		data: {
			email: 'test+newdevice@example.com',
			name: 'New Device Test Client',
			id: newDeviceClientUserId,
			phoneNumber: '+15552222222',
		},
	})

	await prisma.account.create({
		data: {
			userId: newDeviceClientUserId,
			id: randomUUID(),
			providerId: 'credential',
			accountId: newDeviceClientUserId,
			password: authUserPasswordHash,
		},
	})

	await prisma.identityProvider.create({
		data: {
			provider: 'BETTER_AUTH',
			providerUserId: newDeviceClientUserId,
			userType: 'CLIENT',
			userId: newDeviceClient.id,
		},
	})

	// biome-ignore lint/suspicious/noConsole: <This is fine>
	console.log(
		'👤 Test User 2: Active Client (New Device) created (test+newdevice@example.com)',
	)

	// Test User 3: Active Client (Any Device Override)
	// This user accepts any device in dev mode via deviceId='*' override
	const anyDeviceClientUserId = randomUUID()
	const anyDeviceClient = await prisma.client.create({
		data: {
			name: 'Any Device Test Client',
			email: 'test@example.com',
			phoneNumber: '+15553333333',
			status: 'ACTIVE',
			onboardingStatus: 'ONBOARDED',
			deviceId: '*', // Special override for dev mode
			onboardingToken: authUserPassword,
		},
	})

	await prisma.user.create({
		data: {
			email: 'test@example.com',
			name: 'Any Device Test Client',
			id: anyDeviceClientUserId,
			phoneNumber: '+15553333333',
		},
	})

	await prisma.account.create({
		data: {
			userId: anyDeviceClientUserId,
			id: randomUUID(),
			providerId: 'credential',
			accountId: anyDeviceClientUserId,
			password: authUserPasswordHash,
		},
	})

	await prisma.identityProvider.create({
		data: {
			provider: 'BETTER_AUTH',
			providerUserId: anyDeviceClientUserId,
			userType: 'CLIENT',
			userId: anyDeviceClient.id,
		},
	})

	// biome-ignore lint/suspicious/noConsole: <This is fine>
	console.log(
		'👤 Test User 3: Active Client (Any Device Override) created (test+anydevice@example.com)',
	)

	// Test User 4: Forgot Password Test Client (Any Device Override)
	// This user has the same setup as Test User 3 for testing forgot password flow
	const forgotPasswordClientUserId = randomUUID()
	const forgotPasswordClient = await prisma.client.create({
		data: {
			name: 'Forgot Password Test Client',
			email: 'test+forgotpassword@example.com',
			phoneNumber: '+15554444444',
			status: 'ACTIVE',
			onboardingStatus: 'ONBOARDED',
			deviceId: '*', // Special override for dev mode
			onboardingToken: authUserPassword,
		},
	})

	await prisma.user.create({
		data: {
			email: 'test+forgotpassword@example.com',
			name: 'Forgot Password Test Client',
			id: forgotPasswordClientUserId,
			phoneNumber: '+15554444444',
		},
	})

	await prisma.account.create({
		data: {
			userId: forgotPasswordClientUserId,
			id: randomUUID(),
			providerId: 'credential',
			accountId: forgotPasswordClientUserId,
			password: authUserPasswordHash,
		},
	})

	await prisma.identityProvider.create({
		data: {
			provider: 'BETTER_AUTH',
			providerUserId: forgotPasswordClientUserId,
			userType: 'CLIENT',
			userId: forgotPasswordClient.id,
		},
	})

	// biome-ignore lint/suspicious/noConsole: <This is fine>
	console.log(
		'👤 Test User 4: Forgot Password Test Client created (test+forgotpassword@example.com)',
	)

	// biome-ignore lint/suspicious/noConsole: <This is fine>
	console.log('🚀 Database seeding completed!')

	// Create notifications for the Any Device Test Client (test@example.com)
	// This account is ready to log in and used for e2e testing
	const baseDate = new Date('2024-01-15T10:00:00Z')

	// Unread notifications
	await prisma.notification.create({
		data: {
			personId: anyDeviceClient.id,
			title: 'Please sign the new investment agreement',
			body: '',
			notificationType: 'ACTION',
			actionType: 'SIGN_DOCUMENT',
			isRead: false,
			createdAt: new Date(baseDate.getTime() + 1 * 60 * 60 * 1000), // 1 hour after base
		},
	})

	await prisma.notification.create({
		data: {
			personId: anyDeviceClient.id,
			title: 'We need your updated tax documents',
			body: '',
			notificationType: 'ACTION',
			actionType: 'UPLOAD_DOCUMENT',
			isRead: false,
			createdAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours after base
		},
	})

	await prisma.notification.create({
		data: {
			personId: anyDeviceClient.id,
			title: 'Your quarterly portfolio report is ready',
			body: '',
			notificationType: 'INFO',
			isRead: false,
			createdAt: new Date(baseDate.getTime() + 3 * 60 * 60 * 1000), // 3 hours after base
		},
	})

	await prisma.notification.create({
		data: {
			personId: anyDeviceClient.id,
			title: 'Important: Review your investment strategy',
			body: '',
			notificationType: 'INFO',
			isRead: false,
			createdAt: new Date(baseDate.getTime() + 4 * 60 * 60 * 1000), // 4 hours after base
		},
	})

	await prisma.notification.create({
		data: {
			personId: anyDeviceClient.id,
			title: 'Complete your annual compliance check',
			body: '',
			notificationType: 'ACTION',
			actionType: 'BASIC_COMPLETE',
			isRead: false,
			createdAt: new Date(baseDate.getTime() + 5 * 60 * 60 * 1000), // 5 hours after base
		},
	})

	// Read notifications
	await prisma.notification.create({
		data: {
			personId: anyDeviceClient.id,
			title: 'Welcome to LeaseLink',
			body: '',
			notificationType: 'INFO',
			isRead: true,
			createdAt: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before base
		},
	})

	await prisma.notification.create({
		data: {
			personId: anyDeviceClient.id,
			title: 'Your profile has been updated successfully',
			body: '',
			notificationType: 'INFO',
			isRead: true,
			createdAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days before base
		},
	})

	await prisma.notification.create({
		data: {
			personId: anyDeviceClient.id,
			title: 'Your document has been received and is under review',
			body: '',
			notificationType: 'INFO',
			isRead: true,
			createdAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days before base
		},
	})

	await prisma.notification.create({
		data: {
			personId: anyDeviceClient.id,
			title: 'Your identification document has been verified',
			body: '',
			notificationType: 'ACTION',
			actionType: 'UPLOAD_DOCUMENT',
			isRead: true,
			isActionComplete: true,
			createdAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before base
		},
	})

	// biome-ignore lint/suspicious/noConsole: <This is fine>
	console.log('📬 Notifications created for Any Device Test Client')

	// Create document upload requests for the Any Device Test Client (test@example.com)
	await prisma.documentRequest.create({
		data: {
			clientId: anyDeviceClient.id,
			requestedBy: employee.id,
			requestType: 'PROOF_OF_ADDRESS',
			status: 'PENDING',
			createdAt: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day before base
		},
	})

	await prisma.documentRequest.create({
		data: {
			clientId: anyDeviceClient.id,
			requestedBy: employee.id,
			requestType: 'PROOF_OF_IDENTITY',
			status: 'PENDING',
			createdAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before base
		},
	})

	// biome-ignore lint/suspicious/noConsole: <This is fine>
	console.log('📄 Document requests created for Any Device Test Client')
}

main()
	.catch((e) => {
		console.error('❌ Error seeding database:', e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
		// biome-ignore lint/suspicious/noConsole: <This is fine>
		console.log('🎉 Seeding completed successfully!')
	})
