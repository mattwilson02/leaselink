import { Module } from '@nestjs/common'
import { StorageRepository } from '@/domain/document/application/repositories/storage-repository'
import { BlobStorageService } from './blob-storage.service'
import { BlobStorageRepository } from './repositories/blob-storage-repository'

import { EnvModule } from '../env/env.module'

@Module({
	imports: [EnvModule],
	providers: [
		BlobStorageService,
		BlobStorageRepository,
		{
			provide: StorageRepository,
			useClass: BlobStorageRepository,
		},
	],
	exports: [BlobStorageService, BlobStorageRepository, StorageRepository],
	controllers: [],
})
export class BlobStorageModule {}
