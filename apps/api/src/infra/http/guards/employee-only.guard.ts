import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common'
import { HttpUserResponse } from '../presenters/http-user-presenter'
@Injectable()
export class EmployeeOnlyGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest()
		const user: HttpUserResponse = request.user

		if (user?.type !== 'EMPLOYEE') {
			throw new ForbiddenException('Only employees can access this')
		}

		return true
	}
}
