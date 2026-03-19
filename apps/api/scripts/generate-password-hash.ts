/**
 * Utility script to generate Better Auth password hashes
 *
 * Usage: npx tsx scripts/generate-password-hash.ts
 *
 * This script creates a temporary user with Better Auth to generate
 * a properly formatted password hash. The hash can then be used in
 * seed files or tests.
 *
 * Change the 'password' constant below to generate a hash for a different password.
 */

import { PrismaClient } from '@prisma/client'
import { auth } from '../auth'

const prisma = new PrismaClient()

async function generatePasswordHash() {
	const testEmail = `test-hash-${Date.now()}@example.com`
	const password = 'Password123!' // Change this to generate a different password hash

	try {
		// Use Better Auth to create a user with the password
		await auth.api.signUpEmail({
			body: {
				email: testEmail,
				name: 'Hash Generator',
				password: password,
			},
		})

		// Query the account to get the hashed password
		const account = await prisma.account.findFirst({
			where: {
				user: {
					email: testEmail,
				},
			},
		})

		if (account?.password) {
			console.log('\n✅ Password hash generated successfully!')
			console.log('\nPassword:', password)
			console.log('Hash:', account.password)
			console.log(
				"\nYou can use this hash in your seed file for the 'authUserPassword' constant.\n",
			)
		} else {
			console.error('❌ Failed to retrieve password hash')
		}

		// Clean up the test user
		await prisma.account.deleteMany({
			where: {
				user: {
					email: testEmail,
				},
			},
		})
		await prisma.user.deleteMany({
			where: {
				email: testEmail,
			},
		})
	} catch (error) {
		console.error('❌ Error generating password hash:', error)
	} finally {
		await prisma.$disconnect()
	}
}

generatePasswordHash()
