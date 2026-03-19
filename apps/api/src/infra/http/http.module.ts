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

@Module({
	imports: [
		BetterAuthModule,
		PushNotificationsModule,
		DatabaseModule,
		EnvModule,
		BlobStorageModule,
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
	],
})
export class HttpModule {}
