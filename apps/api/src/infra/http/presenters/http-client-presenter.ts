import { Client } from '@/domain/financial-management/enterprise/entities/client'

export class HttpClientPresenter {
	static toHTTP(client: Client) {
		return {
			id: client.id.toString(),
			email: client.email,
			phoneNumber: client.phoneNumber,
			name: client.name,
			managedBy: client.managedBy || undefined,
			status: client.status,
			onboardingStatus: client.onboardingStatus,
			profilePhoto: client.profilePhoto,
			receivesEmailNotifications: client.receivesEmailNotifications,
			receivesPushNotifications: client.receivesPushNotifications,
			receivesNotificationsForMaintenance:
				client.receivesNotificationsForPortfolio,
			receivesNotificationsForDocuments:
				client.receivesNotificationsForDocuments,
			createdAt: client.createdAt.toISOString(),
			updatedAt: client.updatedAt ? client.updatedAt.toISOString() : null,
		}
	}

	static toHTTPList(clients: Client[]) {
		return clients.map(HttpClientPresenter.toHTTP)
	}
}
