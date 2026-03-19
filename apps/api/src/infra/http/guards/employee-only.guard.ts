import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common'
import { HttpUserResponse } from '../presenters/http-user-presenter'
@Injectable()
export class EmployeeOnlyGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest()
		const user: HttpUserResponse = request.user

		if (user?.type !== 'EMPLOYEE') {
			throw new UnauthorizedException('Only employees can access this')
		}

		return true
	}
}
