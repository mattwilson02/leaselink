import { UserAuth } from '@/domain/authentication/enterprise/entities/user-auth'

export class HttpUserAuthPresenter {
	static toHTTP(userAuth: UserAuth) {
		return {
			id: userAuth.id.toString(),
			email: userAuth.email,
			phoneNumber: userAuth.phoneNumber,
		}
	}
}
