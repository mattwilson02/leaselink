import {
	Modal as RNModal,
	View,
	Pressable,
	TouchableOpacity,
	StyleSheet,
} from 'react-native'
import { CompoundButton as Button } from '@/design-system/components/CompoundButton'
import { Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { useDateRangePickerContext } from '../../context'
import type { DateRangePickerModalProps } from '../../types'

const Modal = ({
	children,
	title,
	cancelText,
	confirmText,
	testID,
}: DateRangePickerModalProps) => {
	const { t } = useTranslation('general')
	const { t: docFiltersT } = useTranslation('document_filters')
	const { isOpen, cancel, confirm, tempValue, activeMode, setActiveMode } =
		useDateRangePickerContext()

	const formatDate = (date: Date | null) => {
		return date ? dayjs(date).format('DD MMM, YYYY') : t('select')
	}

	const canConfirm = tempValue.startDate && tempValue.endDate

	return (
		<RNModal
			visible={isOpen}
			transparent={true}
			animationType='slide'
			onRequestClose={cancel}
		>
			<View style={styles.modalOverlay}>
				<Pressable style={styles.modalBackdrop} onPress={cancel} />
				<View style={styles.modalContent} testID={testID}>
					<View style={styles.modalHeader}>
						<TouchableOpacity onPress={cancel}>
							<Text style={{ color: colors.neutral['500'] }}>
								{cancelText || t('cancel')}
							</Text>
						</TouchableOpacity>
						<Text
							fontWeight='bold'
							style={{ fontSize: 16, color: colors.neutral['700'] }}
						>
							{title || docFiltersT('select_date_range')}
						</Text>
						<TouchableOpacity onPress={confirm} disabled={!canConfirm}>
							<Text
								style={{
									color: canConfirm
										? colors.primary
										: colors.neutral['300'],
									fontWeight: '600',
								}}
							>
								{confirmText || t('done')}
							</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.dateToggleContainer}>
						<Button.Root
							onPress={() => setActiveMode('start')}
							variant='secondary'
							color='neutral'
							style={[
								{ flex: 1 },
								activeMode === 'start' && styles.activeDateButton,
							]}
						>
							<Button.Text>{formatDate(tempValue.startDate)}</Button.Text>
						</Button.Root>
						<Button.Root
							onPress={() => setActiveMode('end')}
							variant='secondary'
							color='neutral'
							style={[
								{ flex: 1 },
								activeMode === 'end' && styles.activeDateButton,
							]}
							disabled={!tempValue.startDate}
						>
							<Button.Text>{formatDate(tempValue.endDate)}</Button.Text>
						</Button.Root>
					</View>

					<View style={styles.wheelPickerRow}>{children}</View>
				</View>
			</View>
		</RNModal>
	)
}

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	modalBackdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalContent: {
		backgroundColor: 'white',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		paddingBottom: 34,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: colors.neutral['40'],
	},
	dateToggleContainer: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingVertical: 12,
		gap: 12,
	},
	activeDateButton: {
		shadowColor: colors.neutral['200'],
		borderColor: colors.neutral['300'],
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 1,
		shadowRadius: 4,
		elevation: 4,
	},
	wheelPickerRow: {
		flexDirection: 'row',
		gap: 16,
		paddingHorizontal: 24,
		paddingVertical: 16,
	},
})

export default Modal
