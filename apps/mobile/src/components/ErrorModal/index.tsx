import { ModalCompound } from '@/design-system/components/ModalCompound'
import { CompoundButton } from '@/design-system/components/CompoundButton'
import { colors } from '@/design-system/theme'
import { TriangleAlert } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'

type Props = {
	showModal: boolean
	setShowModal: (showModal: boolean) => void
	errorMessage: string | null | undefined
}

export const ErrorModal = ({
	showModal,
	setShowModal,
	errorMessage,
}: Props) => {
	const { t: errorT } = useTranslation('error')

	return (
		<ModalCompound.Root open={showModal} onOpenChange={setShowModal}>
			<ModalCompound.Header
				style={{ backgroundColor: colors.error[100] }}
				icon={<TriangleAlert size={24} color={colors.error[500]} />}
				circularBackgroundColor={colors.error[50]}
			/>
			<ModalCompound.Body>
				<ModalCompound.Title>{errorT('error')}</ModalCompound.Title>
				<ModalCompound.Description>{errorMessage}</ModalCompound.Description>
			</ModalCompound.Body>
			<ModalCompound.Footer>
				<CompoundButton.Root
					variant='secondary'
					color='error'
					onPress={() => setShowModal(false)}
					style={{ width: '100%' }}
				>
					<CompoundButton.Text>{errorT('close')}</CompoundButton.Text>
				</CompoundButton.Root>
			</ModalCompound.Footer>
		</ModalCompound.Root>
	)
}
