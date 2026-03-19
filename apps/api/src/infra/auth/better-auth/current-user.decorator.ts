import { ExecutionContext, createParamDecorator } from '@nestjs/common'

export const CurrentUser = createParamDecorator(
	(_data: never, context: ExecutionContext) => {
		const request = context.switchToHttp().getRequest()
		return request.user
	},
)
