import {
	Modal as RNModal,
	View,
	Pressable,
	TouchableOpacity,
	StyleSheet,
} from 'react-native'
import { Text } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { useTranslation } from 'react-i18next'
import { useDatePickerContext } from '../context'
import type { DatePickerModalProps } from '../types'

const Modal = ({
	children,
	title,
	cancelText,
	confirmText,
}: DatePickerModalProps) => {
	const { t } = useTranslation('general')
	const { t: docFiltersT } = useTranslation('document_filters')
	const { isOpen, cancel, confirm, mode } = useDatePickerContext()

	const getDefaultTitle = () => {
		switch (mode) {
			case 'date':
				return docFiltersT('select_date_range')
			case 'month-year':
				return docFiltersT('select_month_and_year')
			case 'year':
				return docFiltersT('select_year')
			default:
				return t('select')
		}
	}

	return (
		<RNModal
			visible={isOpen}
			transparent={true}
			animationType='slide'
			onRequestClose={cancel}
		>
			<View style={styles.modalOverlay}>
				<Pressable style={styles.modalBackdrop} onPress={cancel} />
				<View style={styles.modalContent}>
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
							{title ?? getDefaultTitle()}
						</Text>
						<TouchableOpacity onPress={confirm}>
							<Text
								style={{
									color: colors['primary-green']['600'],
									fontWeight: '600',
								}}
							>
								{confirmText || t('done')}
							</Text>
						</TouchableOpacity>
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
	wheelPickerRow: {
		flexDirection: 'row',
		gap: 16,
		paddingHorizontal: 24,
		paddingVertical: 16,
	},
})

export default Modal
