import { Either, right } from "@/core/either";
import { UniqueEntityId } from "@/core/entities/unique-entity-id";
import {
	BetterAuthUser,
	SessionRepository,
} from "@/domain/authentication/application/repositories/session-repository";
import { AuthError } from "@/domain/authentication/application/use-cases/errors/auth-error";
import { Session } from "@/domain/authentication/enterprise/entities/session";
import { AuthUserType } from "@/domain/financial-management/enterprise/entities/value-objects/auth-user-type";
export class InMemorySessionsRepository implements SessionRepository {
	public users: BetterAuthUser[] = [];
	public items: Session[] = [];

	async create(userType: AuthUserType): Promise<Either<AuthError, Session>> {
		const user: BetterAuthUser = {
			id: new UniqueEntityId().toValue(),
			email: `test_user_${Math.floor(Math.random() * 10000)}@example.com`,
			name: `Test user ${userType.value}`,
			image: null,
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.users.push(user);

		const session = Session.create({
			authUserId: user.id,
			token: new UniqueEntityId().toString(),
		});
		this.items.push(session);

		return right(session);
	}
}
