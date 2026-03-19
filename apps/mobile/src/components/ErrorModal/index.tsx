import { Button, Modal } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
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
		<Modal.Root open={showModal} onOpenChange={setShowModal}>
			<Modal.Header
				style={{ backgroundColor: colors.error['100'] }}
				icon={<TriangleAlert size={24} color={colors.error['500']} />}
				circularBackgroundColor={colors.error['50']}
			/>
			<Modal.Body>
				<Modal.Title>{errorT('error')}</Modal.Title>
				<Modal.Description>{errorMessage}</Modal.Description>
			</Modal.Body>
			<Modal.Footer>
				<Button.Root variant='secondary' color='error'>
					<Button.Text>{errorT('close')}</Button.Text>
				</Button.Root>
			</Modal.Footer>
		</Modal.Root>
	)
}
