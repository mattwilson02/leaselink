import { CreateClientUseCase } from '@/domain/financial-management/application/use-cases/create-client'
import { DeleteClientUseCase } from '@/domain/financial-management/application/use-cases/delete-client'
import { EditClientUseCase } from '@/domain/financial-management/application/use-cases/edit-client'
import { GetClientProfilePhotoUseCase } from '@/domain/financial-management/application/use-cases/get-client-profile-photo'
import { OnboardingSetPasswordUseCase } from '@/domain/financial-management/application/use-cases/onboarding-set-password'
import { SetNotificationPreferencesUseCase } from '@/domain/financial-management/application/use-cases/set-notification-preferences'
import { SendClientPhoneOtpUseCase } from '@/domain/authentication/application/use-cases/send-client-phone-otp'
import { VerifyPhoneNumberOtpUseCase } from '@/domain/authentication/application/use-cases/verify-phone-number-otp'
import { UploadClientProfilePhotoUseCase } from '@/domain/financial-management/application/use-cases/upload-client-profile-photo'
import { GetNotificationsUseCase } from '@/domain/notification/application/use-cases/get-notifications'
import { CreateNotificationUseCase } from '@/domain/notification/application/use-cases/create-notification'
import { UpdateNotificationUseCase } from '@/domain/notification/application/use-cases/update-notification'
import { GetManyDocumentsByClientIdUseCase } from '@/domain/document/application/use-cases/get-many-documents-by-client-id.ts'
import { CreateDocumentRequestUseCase } from '@/domain/document/application/use-cases/create-document-request'
import { GetDocumentRequestByIdUseCase } from '@/domain/document/application/use-cases/get-document-request-by-id'
import { GetDocumentRequestsByClientIdUseCase } from '@/domain/document/application/use-cases/get-document-requests-by-client-id'
import { GetDocumentFolderSummaryUseCase } from '@/domain/document/application/use-cases/get-document-folder-summary'
import { GetDocumentByIdUseCase } from '@/domain/document/application/use-cases/get-document-by-id'
import { CreateClientController } from './controllers/create-client/create-client.controller'
import { DeleteClientController } from './controllers/delete-client/delete-client.controller'
import { EditClientController } from './controllers/edit-client-status/edit-client.controller'
import { OnboardingSetPasswordController } from './controllers/onboarding-set-password/onboarding-set-password.controller'
import { SetNotificationPreferencesController } from './controllers/set-notification-preferences/set-notification-preferences.controller'
import { GetSwaggerJsonController } from './controllers/get-swagger-json/get-swagger-json.controller'
import { CreateNotificationController } from './controllers/create-notification/create-notification.controller'
import { GetNotificationsController } from './controllers/get-notifications/get-notifications.controller'
import { UpdateNotificationController } from './controllers/update-notification/update-notification.controller'
import { GetDocumentsByClientIdController } from './controllers/get-documents/get-documents.controller'
import { PushNotificationsModule } from '../push-notifications/push-notifications.module'
import { CreateDocumentRequestController } from './controllers/create-document-request/create-document-request.controller'
import { GetDocumentRequestByIdController } from './controllers/get-document-request-by-id/get-document-request-by-id.controller'
import { GetDocumentRequestsByClientIdController } from './controllers/get-document-requests/get-document-requests.controller'
import { GetFolderSummaryController } from './controllers/get-folder-summary/get-folder-summary.controller'
import { GetDocumentByIdController } from './controllers/get-document-by-id/get-document-by-id.controller'
import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { EnvModule } from '../env/env.module'
import { UploadDocumentUseCase } from '@/domain/document/application/use-cases/upload-document'
import { UploadDocumentController } from './controllers/upload-document/upload-document.controller'
import { BlobStorageModule } from '../blob-storage/blob-storage.module'
import { ConfirmUploadDocumentUseCase } from '@/domain/document/application/use-cases/confirm-upload-document'
import { ConfirmUploadDocumentController } from './controllers/confirm-upload-document/confirm-upload-document.controller'
import { DownloadDocumentController } from './controllers/download-document/download-document.controller'
import { DownloadDocumentUseCase } from '@/domain/document/application/use-cases/download-document'
import { GetHasUnreadNotificationsUseCase } from '@/domain/notification/application/use-cases/get-has-unread-notifications'
import { GetHasUnreadNotificationsController } from './controllers/get-has-unread-notifications/get-has-unread-notifications.controller'
import { MarkAllNotificationsAsReadController } from './controllers/mark-all-notifications-as-read/mark-all-notifications-as-read.controller'
import { MarkAllNotificationsAsReadUseCase } from '@/domain/notification/application/use-cases/mark-all-notifications-as-read'
import { BetterAuthModule } from '../auth/better-auth/better-auth.module'
import { CreateSession } from '@/domain/authentication/application/use-cases/create-session'
import { GetTestJWTController } from './controllers/create-test-jwt/get-test-jwt.controller'
import { AuthController } from './controllers/me/auth.controller'
import { GetRecentlyViewedDocumentsController } from './controllers/get-recently-viewed-documents/get-recently-viewed-documents.controller'
import { GetRecentlyViewedDocumentsUseCase } from '@/domain/document/application/use-cases/get-recently-viewed-documents'
import { ViewDocumentByIdController } from './controllers/view-document-by-id/view-document-by-id.controller'
import { ViewDocumentByIdUseCase } from '@/domain/document/application/use-cases/view-document-by-id'
import { UploadClientProfilePhotoController } from './controllers/upload-client-profile-photo/upload-client-profile-photo.controller'
import { GetClientProfilePhotoController } from './controllers/get-client-profile-photo/get-client-profile-photo.controller'
import { SendClientPhoneOtpController } from './controllers/send-client-phone-otp/send-client-phone-otp.controller'
import { VerifyPhoneNumberOtpController } from './controllers/verify-phone-number-otp/verify-phone-number-otp.controller'
import { VerifyPasswordUseCase } from '@/domain/authentication/application/use-cases/verify-password'
import { VerifyPasswordController } from './controllers/verify-password/verify-password.controller'
import { CreatePropertyController } from './controllers/create-property/create-property.controller'
import { GetPropertiesController } from './controllers/get-properties/get-properties.controller'
import { GetPropertyByIdController } from './controllers/get-property-by-id/get-property-by-id.controller'
import { UpdatePropertyController } from './controllers/update-property/update-property.controller'
import { UpdatePropertyStatusController } from './controllers/update-property-status/update-property-status.controller'
import { DeletePropertyController } from './controllers/delete-property/delete-property.controller'
import { UploadPropertyPhotosController } from './controllers/upload-property-photos/upload-property-photos.controller'
import { CreatePropertyUseCase } from '@/domain/property-management/application/use-cases/create-property'
import { GetPropertyByIdUseCase } from '@/domain/property-management/application/use-cases/get-property-by-id'
import { GetPropertiesByManagerUseCase } from '@/domain/property-management/application/use-cases/get-properties-by-manager'
import { UpdatePropertyUseCase } from '@/domain/property-management/application/use-cases/update-property'
import { UpdatePropertyStatusUseCase } from '@/domain/property-management/application/use-cases/update-property-status'
import { DeletePropertyUseCase } from '@/domain/property-management/application/use-cases/delete-property'
import { UploadPropertyPhotosUseCase } from '@/domain/property-management/application/use-cases/upload-property-photos'
import { GetClientsController } from './controllers/get-clients/get-clients.controller'
import { GetClientByIdController } from './controllers/get-client-by-id/get-client-by-id.controller'
import { GetClientsUseCase } from '@/domain/financial-management/application/use-cases/get-clients'
import { GetClientByIdUseCase } from '@/domain/financial-management/application/use-cases/get-client-by-id'
import { CreateLeaseController } from './controllers/create-lease/create-lease.controller'
import { GetLeasesController } from './controllers/get-leases/get-leases.controller'
import { GetLeasesByTenantController } from './controllers/get-leases-by-tenant/get-leases-by-tenant.controller'
import { GetLeaseByIdController } from './controllers/get-lease-by-id/get-lease-by-id.controller'
import { UpdateLeaseStatusController } from './controllers/update-lease-status/update-lease-status.controller'
import { RenewLeaseController } from './controllers/renew-lease/renew-lease.controller'
import { GetLeaseByPropertyController } from './controllers/get-lease-by-property/get-lease-by-property.controller'
import { CreateLeaseUseCase } from '@/domain/lease-management/application/use-cases/create-lease'
import { GetLeasesUseCase } from '@/domain/lease-management/application/use-cases/get-leases'
import { GetLeaseByIdUseCase } from '@/domain/lease-management/application/use-cases/get-lease-by-id'
import { UpdateLeaseStatusUseCase } from '@/domain/lease-management/application/use-cases/update-lease-status'
import { RenewLeaseUseCase } from '@/domain/lease-management/application/use-cases/renew-lease'
import { GetLeaseByPropertyUseCase } from '@/domain/lease-management/application/use-cases/get-lease-by-property'
import { CreateMaintenanceRequestUseCase } from '@/domain/maintenance/application/use-cases/create-maintenance-request'
import { GetMaintenanceRequestsUseCase } from '@/domain/maintenance/application/use-cases/get-maintenance-requests'
import { GetMaintenanceRequestByIdUseCase } from '@/domain/maintenance/application/use-cases/get-maintenance-request-by-id'
import { GetMaintenanceRequestsByPropertyUseCase } from '@/domain/maintenance/application/use-cases/get-maintenance-requests-by-property'
import { GetMaintenanceRequestsByTenantUseCase } from '@/domain/maintenance/application/use-cases/get-maintenance-requests-by-tenant'
import { UpdateMaintenanceRequestStatusUseCase } from '@/domain/maintenance/application/use-cases/update-maintenance-request-status'
import { UploadMaintenancePhotosUseCase } from '@/domain/maintenance/application/use-cases/upload-maintenance-photos'
import { ConfirmMaintenancePhotosUseCase } from '@/domain/maintenance/application/use-cases/confirm-maintenance-photos'
import { CreateMaintenanceRequestController } from './controllers/create-maintenance-request/create-maintenance-request.controller'
import { GetMaintenanceRequestsController } from './controllers/get-maintenance-requests/get-maintenance-requests.controller'
import { GetMaintenanceRequestByIdController } from './controllers/get-maintenance-request-by-id/get-maintenance-request-by-id.controller'
import { GetMaintenanceRequestsByPropertyController } from './controllers/get-maintenance-requests-by-property/get-maintenance-requests-by-property.controller'
import { GetMaintenanceRequestsByTenantController } from './controllers/get-maintenance-requests-by-tenant/get-maintenance-requests-by-tenant.controller'
import { UpdateMaintenanceRequestStatusController } from './controllers/update-maintenance-request-status/update-maintenance-request-status.controller'
import { UploadMaintenancePhotosController } from './controllers/upload-maintenance-photos/upload-maintenance-photos.controller'
import { ConfirmMaintenancePhotosController } from './controllers/confirm-maintenance-photos/confirm-maintenance-photos.controller'
import { GenerateLeasePaymentsUseCase } from '@/domain/payment/application/use-cases/generate-lease-payments'
import { GetPaymentsUseCase } from '@/domain/payment/application/use-cases/get-payments'
import { GetPaymentsByTenantUseCase } from '@/domain/payment/application/use-cases/get-payments-by-tenant'
import { GetPaymentByIdUseCase } from '@/domain/payment/application/use-cases/get-payment-by-id'
import { CreateCheckoutSessionUseCase } from '@/domain/payment/application/use-cases/create-checkout-session'
import { HandleCheckoutCompletedUseCase } from '@/domain/payment/application/use-cases/handle-checkout-completed'
import { MarkOverduePaymentsUseCase } from '@/domain/payment/application/use-cases/mark-overdue-payments'
import { StripeWebhookController } from './controllers/stripe-webhook/stripe-webhook.controller'
import { GeneratePaymentsController } from './controllers/generate-payments/generate-payments.controller'
import { MarkOverduePaymentsController } from './controllers/mark-overdue-payments/mark-overdue-payments.controller'
import { GetPaymentsByTenantController } from './controllers/get-payments-by-tenant/get-payments-by-tenant.controller'
import { GetPaymentsController } from './controllers/get-payments/get-payments.controller'
import { GetPaymentByIdController } from './controllers/get-payment-by-id/get-payment-by-id.controller'
import { CreateCheckoutSessionController } from './controllers/create-checkout-session/create-checkout-session.controller'
import { StripeModule } from '../stripe/stripe.module'
import { StripeServiceImpl } from '../stripe/stripe.service'
import { GetDashboardSummaryController } from './controllers/get-dashboard-summary/get-dashboard-summary.controller'
import { GetSchedulerStatusController } from './controllers/get-scheduler-status/get-scheduler-status.controller'
import { VerifyPaymentController } from './controllers/verify-payment/verify-payment.controller'
import { CheckoutRedirectController } from './controllers/checkout-redirect/checkout-redirect.controller'

@Module({
	imports: [
		BetterAuthModule,
		PushNotificationsModule,
		DatabaseModule,
		EnvModule,
		BlobStorageModule,
		StripeModule,
	],
	controllers: [
		CreateClientController,
		GetTestJWTController,
		AuthController,
		EditClientController,
		DeleteClientController,
		OnboardingSetPasswordController,
		GetSwaggerJsonController,
		CreateNotificationController,
		GetNotificationsController,
		UpdateNotificationController,
		GetDocumentsByClientIdController,
		CreateDocumentRequestController,
		GetDocumentRequestByIdController,
		GetDocumentRequestsByClientIdController,
		GetFolderSummaryController,
		GetDocumentByIdController,
		UploadDocumentController,
		ConfirmUploadDocumentController,
		DownloadDocumentController,
		GetHasUnreadNotificationsController,
		MarkAllNotificationsAsReadController,
		GetRecentlyViewedDocumentsController,
		ViewDocumentByIdController,
		SendClientPhoneOtpController,
		VerifyPhoneNumberOtpController,
		VerifyPasswordController,
		UploadClientProfilePhotoController,
		GetClientProfilePhotoController,
		SetNotificationPreferencesController,
		CreatePropertyController,
		GetPropertiesController,
		GetPropertyByIdController,
		UpdatePropertyController,
		UpdatePropertyStatusController,
		DeletePropertyController,
		UploadPropertyPhotosController,
		GetClientsController,
		GetClientByIdController,
		CreateLeaseController,
		GetLeasesController,
		GetLeaseByPropertyController,
		// Leases — tenant endpoint before :id to avoid route conflict
		GetLeasesByTenantController,
		GetLeaseByIdController,
		UpdateLeaseStatusController,
		RenewLeaseController,
		// Maintenance — tenant endpoint before :id to avoid route conflict
		GetMaintenanceRequestsByTenantController,
		CreateMaintenanceRequestController,
		GetMaintenanceRequestsController,
		GetMaintenanceRequestByIdController,
		GetMaintenanceRequestsByPropertyController,
		UpdateMaintenanceRequestStatusController,
		UploadMaintenancePhotosController,
		ConfirmMaintenancePhotosController,
		// Dashboard
		GetDashboardSummaryController,
		// Scheduler
		GetSchedulerStatusController,
		// Payments — static routes before :id to avoid route conflicts
		CheckoutRedirectController,
		StripeWebhookController,
		GeneratePaymentsController,
		MarkOverduePaymentsController,
		GetPaymentsByTenantController,
		GetPaymentsController,
		GetPaymentByIdController,
		CreateCheckoutSessionController,
		VerifyPaymentController,
	],
	providers: [
		CreateClientUseCase,
		CreateSession,
		EditClientUseCase,
		DeleteClientUseCase,
		OnboardingSetPasswordUseCase,
		CreateNotificationUseCase,
		GetNotificationsUseCase,
		UpdateNotificationUseCase,
		GetManyDocumentsByClientIdUseCase,
		CreateDocumentRequestUseCase,
		GetDocumentRequestByIdUseCase,
		GetDocumentRequestsByClientIdUseCase,
		GetDocumentFolderSummaryUseCase,
		GetDocumentByIdUseCase,
		UploadDocumentUseCase,
		ConfirmUploadDocumentUseCase,
		DownloadDocumentUseCase,
		GetHasUnreadNotificationsUseCase,
		MarkAllNotificationsAsReadUseCase,
		SendClientPhoneOtpUseCase,
		VerifyPhoneNumberOtpUseCase,
		VerifyPasswordUseCase,
		GetRecentlyViewedDocumentsUseCase,
		ViewDocumentByIdUseCase,
		UploadClientProfilePhotoUseCase,
		GetClientProfilePhotoUseCase,
		SetNotificationPreferencesUseCase,
		CreatePropertyUseCase,
		GetPropertyByIdUseCase,
		GetPropertiesByManagerUseCase,
		UpdatePropertyUseCase,
		UpdatePropertyStatusUseCase,
		DeletePropertyUseCase,
		UploadPropertyPhotosUseCase,
		GetClientsUseCase,
		GetClientByIdUseCase,
		CreateLeaseUseCase,
		GetLeasesUseCase,
		GetLeaseByIdUseCase,
		UpdateLeaseStatusUseCase,
		RenewLeaseUseCase,
		GetLeaseByPropertyUseCase,
		CreateMaintenanceRequestUseCase,
		GetMaintenanceRequestsUseCase,
		GetMaintenanceRequestByIdUseCase,
		GetMaintenanceRequestsByPropertyUseCase,
		GetMaintenanceRequestsByTenantUseCase,
		UpdateMaintenanceRequestStatusUseCase,
		UploadMaintenancePhotosUseCase,
		ConfirmMaintenancePhotosUseCase,
		GenerateLeasePaymentsUseCase,
		GetPaymentsUseCase,
		GetPaymentsByTenantUseCase,
		GetPaymentByIdUseCase,
		CreateCheckoutSessionUseCase,
		HandleCheckoutCompletedUseCase,
		MarkOverduePaymentsUseCase,
		StripeServiceImpl,
	],
})
export class HttpModule {}
