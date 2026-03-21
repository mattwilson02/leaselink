import { useSessions, useRevokeSession } from '@/hooks/useSessions'
import { Heading, Text } from '@/design-system/components/Typography'
import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Badge } from '@/design-system/components/Badge'
import { colors } from '@/design-system/theme'
import { useRouter } from 'expo-router'
import { ChevronLeft, Monitor, Smartphone } from 'lucide-react-native'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Alert,
	ActivityIndicator,
	FlatList,
	Pressable,
	RefreshControl,
	StyleSheet,
	View,
} from 'react-native'
import dayjs from 'dayjs'

/**
 * Parse a userAgent string to extract a human-readable device/browser label.
 * Returns the most recognisable part of the UA string.
 */
function parseUserAgent(userAgent: string | null): string {
	if (!userAgent) return ''

	// Check for mobile devices first
	if (/iPhone/i.test(userAgent)) return 'iPhone'
	if (/iPad/i.test(userAgent)) return 'iPad'
	if (/Android/i.test(userAgent)) return 'Android'

	// Desktop browsers
	if (/Edg\//i.test(userAgent)) return 'Microsoft Edge'
	if (/OPR\//i.test(userAgent) || /Opera/i.test(userAgent)) return 'Opera'
	if (/Firefox/i.test(userAgent)) return 'Firefox'
	if (/Chrome/i.test(userAgent)) return 'Chrome'
	if (/Safari/i.test(userAgent)) return 'Safari'

	// OS fallbacks
	if (/Windows/i.test(userAgent)) return 'Windows'
	if (/Macintosh/i.test(userAgent)) return 'macOS'
	if (/Linux/i.test(userAgent)) return 'Linux'

	return userAgent.slice(0, 40)
}

function isMobileUserAgent(userAgent: string | null): boolean {
	if (!userAgent) return false
	return /iPhone|iPad|Android|Mobile/i.test(userAgent)
}

const ActiveSessions = () => {
	const { t } = useTranslation('active_sessions')
	const router = useRouter()
	const { sessions, isLoading, isError, refetch } = useSessions()
	const { mutateAsync: revokeSession, isPending: isRevoking } =
		useRevokeSession()

	const handleBack = useCallback(() => {
		router.back()
	}, [router])

	const handleRevoke = useCallback(
		(sessionId: string) => {
			Alert.alert(t('revoke_confirm_title'), t('revoke_confirm_message'), [
				{
					text: t('revoke_cancel'),
					style: 'cancel',
				},
				{
					text: t('revoke_confirm'),
					style: 'destructive',
					onPress: async () => {
						try {
							await revokeSession(sessionId)
						} catch {
							// session already gone or error — refetch to sync
							refetch()
						}
					},
				},
			])
		},
		[t, revokeSession, refetch],
	)

	return (
		<View style={styles.root}>
			<Pressable
				style={styles.backButton}
				onPress={handleBack}
				testID='back-button'
			>
				<ChevronLeft size={24} color={colors.neutral['700']} />
			</Pressable>

			<View style={styles.header}>
				<Heading size='h3' fontWeight='bold' style={{ color: colors.neutral['700'] }}>
					{t('title')}
				</Heading>
				<Text size='sm' style={{ color: colors.neutral['500'] }}>
					{t('description')}
				</Text>
			</View>

			<View style={{ height: 1, backgroundColor: colors.neutral['30'], marginHorizontal: 16 }} />

			{isLoading ? (
				<View style={styles.centerContent}>
					<ActivityIndicator color={colors.neutral['500']} />
					<Text size='sm' style={{ color: colors.neutral['400'], marginTop: 8 }}>
						{t('loading')}
					</Text>
				</View>
			) : isError ? (
				<View style={styles.centerContent}>
					<Text size='sm' style={{ color: colors.error[500] }}>
						{t('error')}
					</Text>
				</View>
			) : (
				<FlatList
					data={sessions}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={isLoading}
							onRefresh={refetch}
							tintColor={colors.neutral['400']}
						/>
					}
					renderItem={({ item }) => {
						const deviceLabel = parseUserAgent(item.userAgent) || t('unknown_device')
						const isMobile = isMobileUserAgent(item.userAgent)
						const ipLabel = item.ipAddress || t('unknown_ip')
						const dateLabel = dayjs(item.createdAt).format('DD MMM YYYY, HH:mm')

						return (
							<View style={styles.sessionCard}>
								<View style={styles.sessionRow}>
									<View style={styles.deviceIcon}>
										{isMobile ? (
											<Smartphone size={20} color={colors.neutral['500']} />
										) : (
											<Monitor size={20} color={colors.neutral['500']} />
										)}
									</View>

									<View style={styles.sessionInfo}>
										<View style={styles.sessionTitleRow}>
											<Text
												size='sm'
												fontWeight='bold'
												style={{ color: colors.neutral['700'], flex: 1 }}
											>
												{deviceLabel}
											</Text>
											{item.isCurrent && (
												<Badge variant='success'>{t('current_session')}</Badge>
											)}
										</View>

										<Text size='xs' style={{ color: colors.neutral['400'] }}>
											{ipLabel}
										</Text>
										<Text size='xs' style={{ color: colors.neutral['400'] }}>
											{t('signed_in')}: {dateLabel}
										</Text>
									</View>
								</View>

								{!item.isCurrent && (
									<Button.Root
										variant='secondary'
										size='sm'
										onPress={() => handleRevoke(item.id)}
										disabled={isRevoking}
										testID={`revoke-session-${item.id}`}
									>
										<Button.Text>{t('revoke')}</Button.Text>
									</Button.Root>
								)}
							</View>
						)
					}}
				/>
			)}
		</View>
	)
}

export default ActiveSessions

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: 'white',
		gap: 20,
	},
	backButton: {
		alignSelf: 'flex-start',
		padding: 8,
	},
	header: {
		gap: 4,
		paddingHorizontal: 16,
	},
	centerContent: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	listContent: {
		gap: 12,
		paddingHorizontal: 16,
		paddingBottom: 32,
	},
	sessionCard: {
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.neutral['30'],
		padding: 14,
		gap: 12,
	},
	sessionRow: {
		flexDirection: 'row',
		gap: 12,
		alignItems: 'flex-start',
	},
	deviceIcon: {
		width: 36,
		height: 36,
		borderRadius: 8,
		backgroundColor: colors.neutral['20'],
		alignItems: 'center',
		justifyContent: 'center',
	},
	sessionInfo: {
		flex: 1,
		gap: 4,
	},
	sessionTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
})
