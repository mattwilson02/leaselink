import { Icon } from '@/components/Icon'
import { Heading, Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { useRouter } from 'expo-router'
import { ChevronLeft, Phone } from 'lucide-react-native'
import { useCallback } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'

const ContactUs = () => {
	const router = useRouter()
	const { t } = useTranslation('contact_us')

	const handleBack = useCallback(() => {
		router.back()
	}, [router])

	return (
		<View style={{ flex: 1, backgroundColor: 'white', gap: 32 }}>
			<Pressable style={styles.backButton} onPress={handleBack}>
				<ChevronLeft size={24} color={colors.neutral['700']} />
			</Pressable>

			<ScrollView
				style={styles.container}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.contentContainer}
			>
				<View style={{ gap: 4 }}>
					<Heading
						size='h3'
						fontWeight='bold'
						style={{ color: colors.neutral['700'] }}
					>
						{t('title')}
					</Heading>
					<Text style={{ color: colors.neutral['500'] }}>{t('subtitle')}</Text>
				</View>

				<View style={{ gap: 24 }}>
					<View
						style={{
							gap: 48,
							backgroundColor: colors.neutral['10'],
							borderRadius: 8,
							padding: 24,
							alignItems: 'flex-start',
							borderWidth: 1,
							borderColor: colors.neutral['30'],
						}}
					>
						<Icon.Root>
							<Icon.IconContainer
								style={{
									width: 48,
									height: 48,
									borderRadius: 10,
									backgroundColor: colors.primary,
									borderWidth: 0,
									justifyContent: 'center',
									alignItems: 'center',
								}}
							>
								<Icon.Icon
									name='message-chat-circle'
									stroke='white'
									fill='transparent'
									strokeWidth={2}
									size={24}
									color='white'
								/>
							</Icon.IconContainer>
						</Icon.Root>

						<View style={{ gap: 16 }}>
							<View style={{ gap: 4 }}>
								<Text
									size='lg'
									fontWeight='bold'
									style={{ color: colors.neutral['600'] }}
								>
									{t('chat_to_support')}
								</Text>
								<Text style={{ color: colors.neutral['500'] }}>
									{t('we_are_here_to_help')}
								</Text>
							</View>
							<Text fontWeight='bold' style={{ color: colors.primary }}>
								{t('support_email')}
							</Text>
						</View>
					</View>
					<View
						style={{
							gap: 48,
							backgroundColor: colors.neutral['10'],
							borderRadius: 8,
							padding: 24,
							alignItems: 'flex-start',
							borderWidth: 1,
							borderColor: colors.neutral['30'],
						}}
					>
						<Icon.Root>
							<Icon.IconContainer
								style={{
									width: 48,
									height: 48,
									borderRadius: 10,
									backgroundColor: colors.primary,
									borderWidth: 0,
									justifyContent: 'center',
									alignItems: 'center',
								}}
							>
								<Phone size={24} color='white' />
							</Icon.IconContainer>
						</Icon.Root>

						<View style={{ gap: 16 }}>
							<View style={{ gap: 4 }}>
								<Text
									size='lg'
									fontWeight='bold'
									style={{ color: colors.neutral['600'] }}
								>
									{t('call_us')}
								</Text>
								<Text style={{ color: colors.neutral['500'] }}>
									{t('hours')}
								</Text>
							</View>
							<Text fontWeight='bold' style={{ color: colors.primary }}>
								{t('phone_number')}
							</Text>
						</View>
					</View>
				</View>
			</ScrollView>
		</View>
	)
}

export default ContactUs

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'white',
	},
	backButton: {
		alignSelf: 'flex-start',
		padding: 8,
	},
	contentContainer: {
		gap: 32,
		paddingBottom: 12,
		paddingHorizontal: 16,
	},
})
