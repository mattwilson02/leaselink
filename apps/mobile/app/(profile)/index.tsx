import { Icon } from '@/components/Icon'
import {
	useAuthControllerHandle,
	useGetClientProfilePhotoControllerHandle,
} from '@/gen/index'
import { authClient } from '@/services/auth'
import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Heading, Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { useRouter } from 'expo-router'
import {
	Bell,
	ChevronLeft,
	Headphones,
	LogOut,
	MessageCircleQuestion,
	Shield,
} from 'lucide-react-native'
import { memo, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from 'expo-image'
import {
	Animated,
	Easing,
	Pressable,
	ScrollView,
	StyleSheet,
	View,
} from 'react-native'

type MenuItemProps = {
	icon: React.ReactNode
	label: string
	onPress?: () => void
	testID?: string
}

const MenuItem = memo<MenuItemProps>(({ icon, label, onPress, testID }) => (
	<Pressable style={styles.menuItem} onPress={onPress} testID={testID}>
		{icon}
		<Text size='lg' fontWeight='bold' style={styles.menuText}>
			{label}
		</Text>
	</Pressable>
))

MenuItem.displayName = 'MenuItem'

type MenuSectionProps = {
	children: React.ReactNode
	testID?: string
}

const MenuSection = memo<MenuSectionProps>(({ children, testID }) => (
	<View style={styles.menuSection} testID={testID}>
		{children}
	</View>
))

MenuSection.displayName = 'MenuSection'

type ProfileHeaderSkeletonProps = {
	shimmerInterpolation: Animated.AnimatedInterpolation<string | number>
}

const ProfileHeaderSkeleton = memo<ProfileHeaderSkeletonProps>(
	({ shimmerInterpolation }) => (
		<>
			<View style={styles.avatarSkeleton}>
				<Animated.View
					style={[
						styles.shimmer,
						{
							transform: [{ translateX: shimmerInterpolation }],
						},
					]}
				/>
			</View>
			<View style={styles.nameSkeleton}>
				<Animated.View
					style={[
						styles.shimmer,
						{
							transform: [{ translateX: shimmerInterpolation }],
						},
					]}
				/>
			</View>
			<View style={styles.emailSkeleton}>
				<Animated.View
					style={[
						styles.shimmer,
						{
							transform: [{ translateX: shimmerInterpolation }],
						},
					]}
				/>
			</View>
		</>
	),
)

ProfileHeaderSkeleton.displayName = 'ProfileHeaderSkeleton'

const Profile = () => {
	const router = useRouter()
	const { data, isFetching } = useAuthControllerHandle()
	const { data: profilePhotoData } = useGetClientProfilePhotoControllerHandle(
		data?.id || '',
		{
			query: {
				enabled: !!data?.id,
			},
		},
	)
	const { t } = useTranslation('profile')

	const shimmerAnimation = useRef(new Animated.Value(0)).current

	useEffect(() => {
		let animation: Animated.CompositeAnimation | null = null

		if (isFetching) {
			const startShimmerAnimation = () => {
				shimmerAnimation.setValue(0)
				animation = Animated.timing(shimmerAnimation, {
					toValue: 1,
					duration: 1500,
					easing: Easing.linear,
					useNativeDriver: false,
				})
				animation.start(({ finished }) => {
					if (finished) {
						startShimmerAnimation()
					}
				})
			}

			startShimmerAnimation()
		}

		return () => {
			if (animation) {
				animation.stop()
			}
		}
	}, [isFetching, shimmerAnimation])

	const shimmerInterpolation = shimmerAnimation.interpolate({
		inputRange: [0, 1],
		outputRange: ['-100%', '100%'],
	})

	const handleBack = useCallback(() => {
		router.back()
	}, [router])

	const profilePhotoUri = profilePhotoData?.profilePhoto
		? `data:image/jpeg;base64,${profilePhotoData.profilePhoto}`
		: undefined

	const nameParts = data?.name?.split(' ') || []
	const initials =
		(nameParts[0]?.charAt(0) + (nameParts[1]?.charAt(0) || '')).toUpperCase() ||
		'?'

	const onSignOut = async () => {
		await authClient.signOut()
		router.replace('/sign-in')
	}

	return (
		<View style={{ flex: 1, backgroundColor: 'white' }}>
			<Pressable
				style={styles.backButton}
				onPress={handleBack}
				testID='back-button'
			>
				<ChevronLeft size={24} color={colors.neutral['700']} />
			</Pressable>

			<ScrollView
				style={styles.container}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.contentContainer}
			>
				<View
					style={styles.profileHeader}
					testID={isFetching ? 'profile-skeleton' : 'profile-header'}
				>
					{isFetching ? (
						<ProfileHeaderSkeleton
							shimmerInterpolation={shimmerInterpolation}
						/>
					) : (
						<>
							{profilePhotoUri ? (
								<Image
									source={{ uri: profilePhotoUri }}
									style={styles.profileImage}
									testID='profile-photo'
								/>
							) : (
								<View style={styles.avatarFallback} testID='profile-avatar'>
									<Heading
										size='h4'
										fontWeight='bold'
										style={{ color: colors.neutral['300'] }}
									>
										{initials}
									</Heading>
								</View>
							)}
							<Heading size='h6' fontWeight='bold' style={styles.profileName}>
								{data?.name}
							</Heading>
							<Text size='lg' style={styles.profileEmail}>
								{data?.email}
							</Text>
						</>
					)}
				</View>

				<MenuSection testID='menu-section-0'>
					<MenuItem
						testID='menu-item-edit-profile'
						onPress={() => router.push('/(profile)/edit-profile')}
						icon={
							<Icon.Icon
								name='file-05'
								size={ICON_SIZE}
								stroke={colors.neutral['600']}
								strokeWidth={ICON_STROKE_WIDTH}
								testID='icon-file-05'
							/>
						}
						label={t('edit_profile')}
					/>
					<MenuItem
						testID='menu-item-notifications'
						onPress={() => router.push('/(profile)/notifications')}
						icon={<Bell size={ICON_SIZE} color={colors.neutral['600']} />}
						label={t('notifications')}
					/>
				</MenuSection>

				<MenuSection testID='menu-section-1'>
					<MenuItem
						testID='menu-item-security'
						onPress={() => router.push('/(profile)/security')}
						icon={
							<Shield
								size={ICON_SIZE}
								strokeWidth={ICON_STROKE_WIDTH}
								color={colors.neutral['600']}
							/>
						}
						label={t('security')}
					/>
					<MenuItem
						onPress={() => router.push('/(profile)/faqs')}
						testID='menu-item-help-and-support'
						icon={
							<MessageCircleQuestion
								size={ICON_SIZE}
								color={colors.neutral['600']}
							/>
						}
						label={t('help_and_support')}
					/>
					<MenuItem
						testID='menu-item-contact-us'
						onPress={() => router.push('/(profile)/contact-us')}
						icon={<Headphones size={ICON_SIZE} color={colors.neutral['600']} />}
						label={t('contact_us')}
					/>
					<MenuItem
						onPress={() => router.push('/(profile)/privacy-policy')}
						testID='menu-item-privacy-policy'
						icon={
							<Icon.Icon
								name='lock-unlocked-02'
								size={ICON_SIZE}
								strokeWidth={ICON_STROKE_WIDTH}
								stroke={colors.neutral['600']}
								testID='icon-lock-unlocked-02'
							/>
						}
						label={t('privacy_policy')}
					/>
				</MenuSection>
				<View style={{ flexDirection: 'row', gap: 8, maxWidth: '45%' }}>
					<Button.Root
						testID='sign-out-button'
						variant='secondary'
						style={{ gap: 4, flex: 1 }}
						onPress={onSignOut}
					>
						<Button.Prefix>
							<LogOut size={20} color={colors.primary} />
						</Button.Prefix>
						<Button.Text style={{ flex: 1 }}>{t('logout')}</Button.Text>
					</Button.Root>
				</View>
			</ScrollView>
		</View>
	)
}

const ICON_SIZE = 20
const ICON_STROKE_WIDTH = 2

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'white',
	},
	contentContainer: {
		gap: 24,
	},
	backButton: {
		alignSelf: 'flex-start',
		padding: 8,
	},
	profileHeader: {
		gap: 12,
		alignItems: 'center',
	},
	profileImage: {
		width: 96,
		height: 96,
		borderRadius: 48,
	},
	avatarFallback: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: colors.neutral['30'],
		justifyContent: 'center',
		alignItems: 'center',
	},
	profileName: {
		color: colors.neutral['600'],
	},
	profileEmail: {
		color: colors.neutral['600'],
	},
	menuSection: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		gap: 12,
		borderRadius: 8,
		borderColor: colors.neutral['30'],
		borderWidth: 1,
	},
	menuItem: {
		padding: 8,
		gap: 12,
		flexDirection: 'row',
		alignItems: 'center',
	},
	menuText: {
		color: colors.neutral['600'],
	},
	avatarSkeleton: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: colors.neutral['40'],
		overflow: 'hidden',
	},
	nameSkeleton: {
		width: 180,
		height: 24,
		borderRadius: 4,
		backgroundColor: colors.neutral['40'],
		overflow: 'hidden',
	},
	emailSkeleton: {
		width: 200,
		height: 20,
		borderRadius: 4,
		backgroundColor: colors.neutral['40'],
		overflow: 'hidden',
	},
	shimmer: {
		width: '100%',
		height: '100%',
		backgroundColor: colors.neutral['50'],
		opacity: 0.5,
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
})

export default Profile
