import { colors } from '@/design-system/theme'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Image } from 'expo-image'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { z } from 'zod'
import i18next, {
	changeLanguage,
	languageOptions,
	Languages,
} from '../../src/i18n'
import { useForm } from '@tanstack/react-form'
import { Form } from '@/components/Form'
import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Heading, Text } from '@/design-system/components/Typography'
import { SelectCompound as Select } from '@/design-system/components/SelectCompound'
import { TextInputCompound as TextInput } from '@/design-system/components/TextInputCompound'
import { ModalCompound as Modal } from '@/design-system/components/ModalCompound'
import { Icon } from '@/components/Icon'
import { LanguageOptionsList } from '@/components/LanguageOptionsList'
import { useTranslation } from 'react-i18next'
import CountryFlag from 'react-native-country-flag'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import * as ImageManipulator from 'expo-image-manipulator'
import {
	useAuthControllerHandle,
	useGetClientProfilePhotoControllerHandle,
	useUploadClientProfilePhotoControllerHandle,
} from '@/gen/index'
import { ErrorModal } from '@/components/ErrorModal'
import { CheckCircle } from 'lucide-react-native'
import { useQueryClient } from '@tanstack/react-query'
import { getClientProfilePhotoControllerHandleQueryKey } from '@/gen/api/react-query/useGetClientProfilePhotoControllerHandle'

const chooseLanguageSchema = z.object({
	language: z.enum([Languages.GB, Languages.ES, Languages.FR, Languages.DE], {
		message: 'language_required',
	}),
})

type EditProfileFormValues = {
	language: Languages
}

const EditProfile = () => {
	const router = useRouter()
	const queryClient = useQueryClient()
	const { t } = useTranslation('edit_profile')
	const { t: generalT } = useTranslation('general')
	const { t: alertsT } = useTranslation('alerts')

	const [uploading, setUploading] = useState(false)
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [showSuccessModal, setShowSuccessModal] = useState(false)

	const { data: user } = useAuthControllerHandle()
	const { data: profilePhotoData } = useGetClientProfilePhotoControllerHandle(
		user?.id || '',
		{
			query: {
				enabled: !!user?.id,
			},
		},
	)
	const { mutateAsync: uploadProfilePhoto } =
		useUploadClientProfilePhotoControllerHandle()

	const handleBack = useCallback(() => {
		router.replace('/(profile)')
	}, [router])

	const { handleSubmit, Field } = useForm({
		defaultValues: {
			language: i18next.language,
		} as EditProfileFormValues,
		validators: {
			onChange: chooseLanguageSchema,
		},
		onSubmit: (values) => {
			changeLanguage(values.value.language)
			router.replace('/(profile)')
		},
	})

	const requestPermissions = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
		if (status !== 'granted') {
			Alert.alert(
				alertsT('permission_required'),
				alertsT('permission_camera_roll'),
			)
			return false
		}
		return true
	}

	const pickImage = async () => {
		const hasPermission = await requestPermissions()
		if (!hasPermission) return

		Alert.alert(alertsT('select_source'), alertsT('select_source_photo'), [
			{
				text: alertsT('camera'),
				onPress: () => pickFromCamera(),
			},
			{
				text: alertsT('photo_library'),
				onPress: () => pickFromLibrary(),
			},
			{
				text: generalT('cancel'),
				style: 'cancel',
			},
		])
	}

	const pickFromCamera = async () => {
		try {
			const { status } = await ImagePicker.requestCameraPermissionsAsync()
			if (status !== 'granted') {
				setErrorMessage('Camera permission is needed!')
				setShowErrorModal(true)
				return
			}

			const result = await ImagePicker.launchCameraAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
			})

			if (!result.canceled) {
				await uploadPhoto(result.assets[0].uri)
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unknown error'
			setShowErrorModal(true)
			setErrorMessage(`Failed to take photo: ${errorMsg}`)
		}
	}

	const pickFromLibrary = async () => {
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
			})

			if (!result.canceled) {
				await uploadPhoto(result.assets[0].uri)
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unknown error'
			setShowErrorModal(true)
			setErrorMessage(`Failed to pick from library: ${errorMsg}`)
		}
	}

	const compressImage = async (uri: string): Promise<string> => {
		const manipulatedImage = await ImageManipulator.manipulateAsync(
			uri,
			[{ resize: { width: 200, height: 200 } }],
			{ compress: 0.5, format: ImageManipulator.SaveFormat.JPEG },
		)
		return manipulatedImage.uri
	}

	const nameParts = user?.name?.split(' ') || []
	const firstName = nameParts[0] || ''
	const lastName = nameParts.slice(1).join(' ') || ''

	const initials =
		(firstName.charAt(0) + (nameParts[1]?.charAt(0) || '')).toUpperCase() || '?'

	const uploadPhoto = async (uri: string) => {
		if (!user?.id) return

		setUploading(true)
		try {
			const compressedUri = await compressImage(uri)

			const base64 = await FileSystem.readAsStringAsync(compressedUri, {
				encoding: FileSystem.EncodingType.Base64,
			})

			await uploadProfilePhoto({
				clientId: user.id,
				data: {
					profilePhoto: base64,
				},
			})

			queryClient.invalidateQueries({
				queryKey: getClientProfilePhotoControllerHandleQueryKey(user.id),
			})

			setShowSuccessModal(true)
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : t('photo_upload_failed')
			setShowErrorModal(true)
			setErrorMessage(errorMsg)
		} finally {
			setUploading(false)
		}
	}

	const profilePhotoUri = profilePhotoData?.profilePhoto
		? `data:image/jpeg;base64,${profilePhotoData.profilePhoto}`
		: undefined

	return (
		<>
			<View style={{ flex: 1, backgroundColor: 'white', gap: 32 }}>
				<Pressable style={styles.backButton} onPress={handleBack}>
					<ChevronLeft size={24} color={colors.neutral['700']} />
				</Pressable>
				<ScrollView
					style={styles.container}
					contentContainerStyle={styles.contentContainer}
					showsVerticalScrollIndicator={false}
				>
					<Heading size='h4' fontWeight='bold' style={styles.pageTitle}>
						{t('title')}
					</Heading>

					<View style={styles.sectionHeader}>
						<Text fontWeight='bold' style={{ color: colors.neutral['700'] }}>
							{t('personal_info')}
						</Text>
						<Text size='sm' style={{ color: colors.neutral['500'] }}>
							{t('personal_info_description')}
						</Text>
					</View>

					<View style={styles.divider} />

					<View style={styles.formContainer}>
						<Form.GroupInput style={{ gap: 20 }}>
							<View style={{ gap: 4 }}>
								<Form.Label testID='your-photo-label'>
									{t('your_photo')}
								</Form.Label>
								<Text size='sm' style={{ color: colors.neutral['500'] }}>
									{t('photo_description')}
								</Text>
							</View>

							<View style={styles.photoSection}>
								{profilePhotoUri ? (
									<Image
										source={{ uri: profilePhotoUri }}
										style={styles.profileImage}
										testID='profile-photo-preview'
									/>
								) : (
									<View
										style={styles.avatarFallback}
										testID='profile-photo-avatar'
									>
										<Text
											size='lg'
											fontWeight='bold'
											style={{ color: colors.neutral['300'] }}
										>
											{initials}
										</Text>
									</View>
								)}
							</View>

							<Pressable
								style={styles.uploadContainer}
								testID='upload-photo-pressable'
								disabled={uploading}
								onPress={pickImage}
							>
								<Icon.Root>
									<Icon.IconContainer
										color={colors.neutral['40']}
										style={{ padding: 12, borderRadius: 12 }}
									>
										<Icon.Icon
											strokeWidth={1.66}
											name='upload-cloud-02'
											size={20}
										/>
									</Icon.IconContainer>
								</Icon.Root>
								<Button.Root variant='link' disabled={uploading}>
									<Button.Text style={{ fontWeight: 'bold' }}>
										{uploading ? 'Uploading...' : t('tap_to_upload')}
									</Button.Text>
								</Button.Root>
								<Text size='xs' style={{ color: colors.neutral['300'] }}>
									{t('upload_format_hint')}
								</Text>
							</Pressable>
						</Form.GroupInput>
					</View>

					<View style={styles.userInfoSection}>
						<Form.GroupInput>
							<Form.Label>{t('first_name')}</Form.Label>
							<TextInput.Root disabled style={styles.disabledInput}>
								<TextInput.Control
									value={firstName}
									editable={false}
									testID='first-name-input'
								/>
							</TextInput.Root>
						</Form.GroupInput>

						<Form.GroupInput>
							<Form.Label>{t('last_name')}</Form.Label>
							<TextInput.Root disabled style={styles.disabledInput}>
								<TextInput.Control
									value={lastName}
									editable={false}
									testID='last-name-input'
								/>
							</TextInput.Root>
						</Form.GroupInput>

						<Form.GroupInput>
							<Form.Label>{t('email_address')}</Form.Label>
							<View style={styles.inputWithIcon}>
								<Icon.Icon
									name='mail-01'
									size={20}
									stroke={colors.neutral['700']}
								/>
								<TextInput.Root disabled style={styles.iconInput}>
									<TextInput.Control
										value={user?.email || ''}
										editable={false}
										testID='email-input'
									/>
								</TextInput.Root>
							</View>
						</Form.GroupInput>

						<Form.GroupInput>
							<Form.Label>{t('phone_number')}</Form.Label>
							<View style={styles.inputWithIcon}>
								<Icon.Icon
									name='phone-02'
									size={20}
									stroke={colors.neutral['700']}
								/>
								<TextInput.Root disabled style={styles.iconInput}>
									<TextInput.Control
										value={user?.phoneNumber || ''}
										editable={false}
										testID='phone-input'
									/>
								</TextInput.Root>
							</View>
						</Form.GroupInput>
					</View>

					<View
						style={{
							height: 1,
							backgroundColor: colors.neutral['30'],
						}}
					/>

					<View style={styles.formContainer}>
						<Field
							name='language'
							children={(field) => {
								const activeLanguage = languageOptions.find(
									(option) => option.value === field.state.value,
								)
								return (
									<Form.GroupInput style={{ gap: 20 }}>
										<View style={{ gap: 4 }}>
											<Form.Label testID='choose-language-text'>
												{t('language')}
											</Form.Label>
											<Text size='sm' style={{ color: colors.neutral['500'] }}>
												{t('default_language_description')}
											</Text>
										</View>
										<Select.Root
											onValueChange={(value) => {
												field.handleChange(value as Languages)
											}}
											value={field.state.value as string | null}
										>
											<Select.Trigger
												testID='select-language'
												style={{
													justifyContent: 'space-between',
													alignItems: 'center',
													maxWidth: '50%',
												}}
											>
												<View style={{ flexDirection: 'row', gap: 8 }}>
													{!!activeLanguage && (
														<CountryFlag
															isoCode={field.state.value as string}
															size={20}
														/>
													)}
													<Text
														size='sm'
														style={{ color: colors.neutral['500'] }}
													>
														{activeLanguage
															? t(activeLanguage?.label)
															: t('select_language')}
													</Text>
												</View>
												<Icon.Icon
													name='chevron-down'
													size={20}
													strokeWidth={2}
													stroke={colors.neutral['500']}
												/>
											</Select.Trigger>

											<Select.Content>
												<Select.Viewport testID='language-options-list'>
													<LanguageOptionsList
														languageOptions={languageOptions}
													/>
												</Select.Viewport>
											</Select.Content>
										</Select.Root>
									</Form.GroupInput>
								)
							}}
						/>
					</View>
					<View
						style={{
							height: 1,
							backgroundColor: colors.neutral['30'],
						}}
					/>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'flex-end',
							gap: 12,
							flex: 1,
						}}
					>
						<Button.Root
							style={{ flex: 1, maxWidth: '30%' }}
							variant='secondary'
							onPress={handleBack}
						>
							<Button.Text>{generalT('cancel')}</Button.Text>
						</Button.Root>
						<Button.Root
							style={{ flex: 1, maxWidth: '30%' }}
							testID='save-button'
							onPress={handleSubmit}
						>
							<Button.Text>{generalT('save')}</Button.Text>
						</Button.Root>
					</View>
				</ScrollView>
			</View>

			<ErrorModal
				showModal={showErrorModal}
				setShowModal={setShowErrorModal}
				errorMessage={errorMessage}
			/>

			<Modal.Root open={showSuccessModal} onOpenChange={setShowSuccessModal}>
				<Modal.Header
					style={{ backgroundColor: colors.success['100'] }}
					icon={<CheckCircle size={24} color={colors.success['500']} />}
					circularBackgroundColor={colors.success['50']}
				/>
				<Modal.Body>
					<Modal.Title>{t('photo_updated')}</Modal.Title>
					<Modal.Description>
						{t('photo_updated_description')}
					</Modal.Description>
				</Modal.Body>
				<Modal.Footer>
					<Button.Root
						collapsable={false}
						testID='photo-upload-success-continue-button'
						onPress={() => setShowSuccessModal(false)}
					>
						<Button.Text>{generalT('continue')}</Button.Text>
					</Button.Root>
				</Modal.Footer>
			</Modal.Root>
		</>
	)
}

export default EditProfile

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
	pageTitle: {
		color: colors.neutral['700'],
		marginBottom: 20, // 32px + 12px = 44px from design (24px gap + 20px margin)
	},
	sectionHeader: {
		gap: 4,
	},
	divider: {
		height: 1,
		backgroundColor: colors.neutral['30'],
	},
	formContainer: {
		flex: 1,
	},
	photoSection: {
		alignItems: 'flex-start',
	},
	profileImage: {
		width: 64,
		height: 64,
		borderRadius: 32,
	},
	avatarFallback: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: colors.neutral['30'],
		justifyContent: 'center',
		alignItems: 'center',
	},
	uploadContainer: {
		flex: 1,
		paddingVertical: 16,
		alignItems: 'center',
		paddingHorizontal: 24,
		borderWidth: 1,
		gap: 12,
		borderColor: colors.neutral['40'],
		borderRadius: 12,
	},
	userInfoSection: {
		gap: 16,
	},
	inputWithIcon: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		borderWidth: 1,
		borderColor: colors.neutral['50'],
		borderRadius: 8,
		paddingLeft: 12,
	},
	iconInput: {
		flex: 1,
		borderWidth: 0,
	},
	disabledInput: {
		borderColor: colors.neutral['50'],
	},
})
