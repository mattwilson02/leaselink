import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import {
	BlobServiceClient,
	StorageSharedKeyCredential,
	ContainerClient,
} from '@azure/storage-blob'
import { EnvService } from '../env/env.service'

@Injectable()
export class BlobStorageService implements OnModuleInit {
	private readonly logger = new Logger(BlobStorageService.name)
	private blobServiceClient: BlobServiceClient
	private sharedKeyCredential: StorageSharedKeyCredential
	private containerClient: ContainerClient

	private readonly accountName: string
	private readonly accountKey: string
	private readonly containerName: string
	private readonly connectionString: string
	private readonly blobStorageEndpoint: string

	constructor(private readonly envService: EnvService) {
		this.accountName = this.envService.get('BLOB_STORAGE_ACCOUNT_NAME')
		this.accountKey = this.envService.get('BLOB_STORAGE_ACCOUNT_KEY')
		this.containerName = this.envService.get('BLOB_STORAGE_CONTAINER_NAME')
		this.blobStorageEndpoint = this.envService.get('BLOB_STORAGE_ENDPOINT')
		this.connectionString = this.envService.get(
			'BLOB_STORAGE_CONNECTION_STRING',
		)
	}

	async onModuleInit() {
		await this.initializeAzure()
	}

	private async initializeAzure(): Promise<void> {
		try {
			this.blobServiceClient = BlobServiceClient.fromConnectionString(
				this.connectionString,
			)
			this.sharedKeyCredential = new StorageSharedKeyCredential(
				this.accountName,
				this.accountKey,
			)

			this.containerClient = this.blobServiceClient.getContainerClient(
				this.containerName,
			)
			await this.containerClient.createIfNotExists()

			this.logger.log('✅ Connected to Azurite and container ready')
		} catch (error) {
			this.logger.error('❌ Failed to connect to Azurite:', error.message)
			throw error
		}
	}

	private async ensureInitialized(): Promise<void> {
		if (!this.blobServiceClient) {
			await this.initializeAzure()
		}
	}

	// Getter methods to expose clients to repository
	async getContainerClient(): Promise<ContainerClient> {
		await this.ensureInitialized()
		return this.containerClient
	}

	async getSharedKeyCredential(): Promise<StorageSharedKeyCredential> {
		await this.ensureInitialized()
		return this.sharedKeyCredential
	}

	getAccountName(): string {
		return this.accountName
	}

	getContainerName(): string {
		return this.containerName
	}

	getBlobStorageEndpoint(): string {
		return this.blobStorageEndpoint
	}
}
