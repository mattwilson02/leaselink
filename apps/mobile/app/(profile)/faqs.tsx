import { Icon } from '@/components/Icon'
import { Heading, Text } from '@/design-system/components/Typography'
import { TextInputCompound as TextInput } from '@/design-system/components/TextInputCompound'
import { colors } from '@/design-system/theme'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
	ChevronLeft,
	CreditCard,
	FileText,
	Heart,
	Mail,
	Repeat,
	Search,
	XCircle,
} from 'lucide-react-native'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
} from 'react-native'

type FaqItem = {
	id: string
	icon: React.ReactNode
	question: string
	answer: string
}

const Faqs = () => {
	const router = useRouter()

	const params = useLocalSearchParams<{ search?: string }>()

	const search = params.search

	const { t: generalT } = useTranslation('general')
	const { t: faqsT } = useTranslation('faqs')

	const faqList: FaqItem[] = [
		{
			id: '1',
			icon: <Heart size={20} color={colors.neutral['500']} />,
			question: faqsT('free_trial_question'),
			answer: faqsT('free_trial_answer'),
		},
		{
			id: '2',
			icon: <Repeat size={20} color={colors.neutral['500']} />,
			question: faqsT('change_plan_question'),
			answer: faqsT('change_plan_answer'),
		},
		{
			id: '3',
			icon: <XCircle size={20} color={colors.neutral['500']} />,
			question: faqsT('cancellation_question'),
			answer: faqsT('cancellation_answer'),
		},
		{
			id: '4',
			icon: <FileText size={20} color={colors.neutral['500']} />,
			question: faqsT('invoice_question'),
			answer: faqsT('invoice_answer'),
		},
		{
			id: '5',
			icon: <CreditCard size={20} color={colors.neutral['500']} />,
			question: faqsT('billing_question'),
			answer: faqsT('billing_answer'),
		},
		{
			id: '6',
			icon: <Mail size={20} color={colors.neutral['500']} />,
			question: faqsT('email_question'),
			answer: faqsT('email_answer'),
		},
	]

	const handleBack = useCallback(() => {
		router.back()
	}, [router])

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
		>
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<View style={{ flex: 1, backgroundColor: 'white', gap: 32 }}>
					<Pressable style={styles.backButton} onPress={handleBack}>
						<ChevronLeft size={24} color={colors.neutral['700']} />
					</Pressable>

					<ScrollView
						style={styles.container}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={styles.contentContainer}
						keyboardShouldPersistTaps='handled'
					>
						<View style={{ gap: 16, alignItems: 'center' }}>
							<View style={{ gap: 12 }}>
								<Text
									size='sm'
									style={{
										color: colors.primary,
										textAlign: 'center',
									}}
								>
									{faqsT('title')}
								</Text>
								<Heading
									size='h3'
									fontWeight='bold'
									style={{ color: colors.neutral['700'], textAlign: 'center' }}
								>
									{faqsT('heading')}
								</Heading>
							</View>
							<Text
								size='lg'
								style={{ color: colors.neutral['600'], textAlign: 'center' }}
							>
								{faqsT('subheading')}
							</Text>
						</View>
						<TextInput.Root>
							<Search size={20} color={colors.neutral['500']} />
							<TextInput.Control
								autoCapitalize='none'
								placeholder={generalT('search')}
								testID='search-input'
								value={search}
								autoFocus
								onChangeText={(text) => {
									router.setParams({
										search: text,
									})
								}}
							/>
						</TextInput.Root>

						<View style={{ gap: 48, alignItems: 'center' }}>
							{faqList
								.filter((faq) => {
									if (!search) return true
									return (
										faq.question.toLowerCase().includes(search.toLowerCase()) ||
										faq.answer.toLowerCase().includes(search.toLowerCase())
									)
								})
								.map((faq) => (
									<View key={faq.id} style={{ gap: 20, alignItems: 'center' }}>
										<Icon.IconContainer>{faq.icon}</Icon.IconContainer>

										<View style={{ gap: 8 }}>
											<Text
												size='lg'
												fontWeight='bold'
												style={{
													color: colors.neutral['700'],
													textAlign: 'center',
												}}
											>
												{faq.question}
											</Text>
											<Text
												style={{
													color: colors.neutral['500'],
													textAlign: 'center',
												}}
											>
												{faq.answer}
											</Text>
										</View>
									</View>
								))}
						</View>
					</ScrollView>
				</View>
			</TouchableWithoutFeedback>
		</KeyboardAvoidingView>
	)
}

export default Faqs

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
