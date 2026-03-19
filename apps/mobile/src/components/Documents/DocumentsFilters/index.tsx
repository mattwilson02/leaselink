import { Icon } from '@/components/Icon'
import { DateRangePicker, type DateRangeValue } from '@/components/DatePicker'
import { Button, Checkbox, Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { X, Calendar } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Modal, View, StyleSheet, Pressable } from 'react-native'
import { useState } from 'react'
import dayjs from 'dayjs'
import { getDocumentsByClientIdControllerFindAllQueryParamsFoldersEnum } from '@/gen/index'

type Props = {
	isVisible: boolean
	setIsVisible: (isVisible: boolean) => void
}

const DocumentsFilters = ({ isVisible = false, setIsVisible }: Props) => {
	const [tempDateRange, setTempDateRange] = useState<DateRangeValue>({
		startDate: null,
		endDate: null,
	})
	const [tempFolders, setTempFolders] = useState<string[]>([])

	const router = useRouter()
	const params = useLocalSearchParams()
	const { t } = useTranslation('document_filters')
	const { t: documentT } = useTranslation('document_details')
	const { t: generalT } = useTranslation('general')

	const startDate = params.startDate
		? new Date(params.startDate as string)
		: null
	const endDate = params.endDate
		? (() => {
				const date = new Date(params.endDate as string)
				date.setHours(23, 59, 59, 999)
				return date
			})()
		: null

	const initializeTempValues = () => {
		setTempDateRange({ startDate, endDate })

		const foldersArray = Array.isArray(params.folders)
			? params.folders
			: params.folders
				? [params.folders as string]
				: []
		setTempFolders(foldersArray)
	}

	const applyFilters = () => {
		if (tempDateRange.startDate && tempDateRange.endDate) {
			const startOfDay = new Date(tempDateRange.startDate)
			startOfDay.setHours(0, 0, 0, 0)
			const endOfDay = new Date(tempDateRange.endDate)
			endOfDay.setHours(23, 59, 59, 999)

			router.setParams({
				startDate: startOfDay.toISOString(),
				endDate: endOfDay.toISOString(),
				folders: tempFolders.length > 0 ? tempFolders : undefined,
			})
		} else {
			router.setParams({
				startDate: undefined,
				endDate: undefined,
				folders: tempFolders.length > 0 ? tempFolders : undefined,
			})
		}

		setIsVisible(false)
	}

	const cancelFilters = () => {
		setIsVisible(false)
		initializeTempValues()
	}

	const clearAllFilters = () => {
		setTempDateRange({ startDate: null, endDate: null })
		setTempFolders([])
	}

	const formatDate = (date: Date) => {
		return dayjs(date).format('DD MMM, YYYY')
	}

	const formatDateRange = () => {
		if (tempDateRange.startDate && tempDateRange.endDate) {
			return `${formatDate(tempDateRange.startDate)} - ${formatDate(tempDateRange.endDate)}`
		}
		if (tempDateRange.startDate) {
			return `${formatDate(tempDateRange.startDate)} - ${t('select_end_date')}`
		}
		return t('select_date_range')
	}

	const handleDateRangeChange = (newValue: DateRangeValue) => {
		setTempDateRange(newValue)
	}

	const setPresetToday = () => {
		const today = new Date()
		setTempDateRange({ startDate: today, endDate: today })
	}

	const setPresetPastWeek = () => {
		const today = new Date()
		const pastWeekStart = new Date()
		pastWeekStart.setDate(today.getDate() - 6)
		setTempDateRange({ startDate: pastWeekStart, endDate: today })
	}

	const setPresetPastMonth = () => {
		const today = new Date()
		const pastMonthStart = new Date()
		pastMonthStart.setDate(today.getDate() - 29)
		setTempDateRange({ startDate: pastMonthStart, endDate: today })
	}

	return (
		<Modal
			visible={isVisible}
			testID='documents-filters-modal'
			onShow={initializeTempValues}
		>
			<View
				style={{
					height: '100%',
					paddingTop: 60,
					gap: 24,
					paddingHorizontal: 16,
				}}
			>
				<View style={{ gap: 24, flex: 1 }}>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							gap: 20,
							justifyContent: 'space-between',
						}}
					>
						<Icon.Root>
							<Icon.IconContainer>
								<Icon.Icon name='settings-04' strokeWidth={2} />
							</Icon.IconContainer>
						</Icon.Root>
						<Pressable
							testID='back-button'
							onPress={() => setIsVisible(false)}
							style={{ padding: 16 }}
						>
							<X size={24} color={colors.neutral['400']} />
						</Pressable>
					</View>
					<View style={{ gap: 4 }}>
						<Text
							size='lg'
							style={{ color: colors.neutral['700'] }}
							fontWeight='bold'
						>
							{t('filter_document_view')}
						</Text>
						<Text size='sm' style={{ color: colors.neutral['500'] }}>
							{t('filter_document_view_description')}
						</Text>
					</View>
					<View style={{ gap: 16, paddingHorizontal: 24 }}>
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							<Text fontWeight='bold' style={{ color: colors.neutral['700'] }}>
								{t('date')}
							</Text>
							<Button.Root
								style={{ padding: 4 }}
								testID='clear-filters-button'
								onPress={clearAllFilters}
								variant='link'
								color='sf-green'
								size='sm'
							>
								<Button.Text>{t('clear_all')}</Button.Text>
							</Button.Root>
						</View>

						<DateRangePicker.Root
							value={tempDateRange}
							onChange={handleDateRangeChange}
							maxDate={new Date()}
						>
							<DateRangePicker.Trigger>
								<View
									testID='date-range-picker-button'
									style={styles.datePickerButton}
								>
									<Calendar size={20} color={colors.neutral['500']} />
									<Text style={styles.dateText} size='sm'>
										{formatDateRange()}
									</Text>
								</View>
							</DateRangePicker.Trigger>

							<DateRangePicker.Modal
								title={t('select_date_range')}
								cancelText={generalT('cancel')}
								confirmText={generalT('done')}
								testID='date-range-picker'
							>
								<DateRangePicker.WheelPicker
									type='day'
									label={t('day')}
									flex={1}
								/>
								<DateRangePicker.WheelPicker
									type='month'
									label={t('month')}
									flex={1.5}
								/>
								<DateRangePicker.WheelPicker
									type='year'
									label={t('year')}
									flex={1}
								/>
							</DateRangePicker.Modal>
						</DateRangePicker.Root>

						<View
							style={{
								flexDirection: 'row',
								justifyContent: 'space-between',
								marginTop: 8,
								gap: 12,
							}}
						>
							<Button.Root
								testID='preset-today-button'
								onPress={setPresetToday}
								variant='secondary'
								color='neutral'
								style={styles.presetButton}
							>
								<Button.Text style={styles.presetButtonText}>
									{t('today')}
								</Button.Text>
							</Button.Root>
							<Button.Root
								testID='preset-this-week-button'
								onPress={setPresetPastWeek}
								variant='secondary'
								color='neutral'
								style={styles.presetButton}
							>
								<Button.Text style={styles.presetButtonText}>
									{t('past_week')}
								</Button.Text>
							</Button.Root>
							<Button.Root
								testID='preset-this-month-button'
								onPress={setPresetPastMonth}
								variant='secondary'
								color='neutral'
								style={styles.presetButton}
							>
								<Button.Text style={styles.presetButtonText}>
									{t('past_month')}
								</Button.Text>
							</Button.Root>
						</View>

						<Text fontWeight='bold' style={{ color: colors.neutral['700'] }}>
							{t('document_type')}
						</Text>
						{Object.keys(
							getDocumentsByClientIdControllerFindAllQueryParamsFoldersEnum,
						).map((folder) => {
							return (
								<View
									key={folder}
									style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
								>
									<Checkbox
										size='sm'
										value={tempFolders.includes(folder) || false}
										onValueChange={(value) => {
											setTempFolders(
												value
													? [...tempFolders, folder]
													: tempFolders.filter((f: string) => f !== folder),
											)
										}}
									/>
									<Text size='sm' style={{ color: colors.neutral['700'] }}>
										{documentT(folder)}
									</Text>
								</View>
							)
						})}
					</View>
				</View>

				<View style={styles.bottomActions}>
					<Button.Root
						testID='cancel-filters-button'
						onPress={cancelFilters}
						variant='secondary'
						color='neutral'
						style={{ flex: 1 }}
					>
						<Button.Text>{generalT('cancel')}</Button.Text>
					</Button.Root>
					<Button.Root
						testID='apply-filters-button'
						onPress={applyFilters}
						variant='primary'
						color='sf-green'
						style={{ flex: 1 }}
					>
						<Button.Text>{generalT('apply')}</Button.Text>
					</Button.Root>
				</View>
			</View>
		</Modal>
	)
}

export default DocumentsFilters

const styles = StyleSheet.create({
	datePickerButton: {
		flexDirection: 'row',
		alignItems: 'center',
		maxWidth: '75%',
		justifyContent: 'space-between',
		borderWidth: 1,
		borderColor: colors.neutral['60'],
		borderRadius: 8,
		paddingHorizontal: 14,
		paddingVertical: 10,
		gap: 4,
	},
	dateText: {
		flex: 1,
		color: colors.neutral['700'],
		marginLeft: 8,
	},
	presetButton: {
		flex: 1,
	},
	presetButtonText: {
		color: colors.neutral['500'],
		fontSize: 14,
		fontWeight: '500',
	},
	bottomActions: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingVertical: 16,
		gap: 12,
		paddingBottom: 32,
		borderTopWidth: 1,
		borderTopColor: colors.neutral['40'],
	},
})
