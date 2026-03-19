import { ApiProperty } from '@nestjs/swagger'

export class CreateTestJWTResponseDTO {
	@ApiProperty({
		example: 'e3b0c442-98fc-1c14-9af2-d474c5ed654a',
		description: 'Session ID generated for the test user',
	})
	sessionId: string

	@ApiProperty({
		example: 'e3b0c442-98fc-1c14-9af2-d474c5ed654a',
		description: 'auth token issued for the test user',
	})
	token: string
}
