import { ValueObject } from '@/core/entities/value-object'

export type OnboardingStatusType =
	| 'NEW'
	| 'EMAIL_VERIFIED'
	| 'PHONE_VERIFIED'
	| 'PASSWORD_SET'
	| 'ONBOARDED'

interface OnboardingStatusProps {
	value: OnboardingStatusType
}

export class OnboardingStatus extends ValueObject<OnboardingStatusProps> {
	// biome-ignore lint/style/useNamingConvention: <We want upper case for this constant>
	private static ALLOWED_STATUSES: OnboardingStatusType[] = [
		'NEW',
		'EMAIL_VERIFIED',
		'PHONE_VERIFIED',
		'PASSWORD_SET',
		'ONBOARDED',
	]

	private constructor(props: OnboardingStatusProps) {
		super(props)
	}

	static create(status: string): OnboardingStatus {
		if (
			!OnboardingStatus.ALLOWED_STATUSES.includes(
				status as OnboardingStatusType,
			)
		) {
			throw new Error(`Invalid onboarding status: ${status}`)
		}
		return new OnboardingStatus({ value: status as OnboardingStatusType })
	}

	get value(): OnboardingStatusType {
		return this.props.value
	}

	static values(): OnboardingStatusType[] {
		return OnboardingStatus.ALLOWED_STATUSES
	}

	static isValidStatus(status: string): boolean {
		return OnboardingStatus.ALLOWED_STATUSES.includes(
			status as OnboardingStatusType,
		)
	}
}
