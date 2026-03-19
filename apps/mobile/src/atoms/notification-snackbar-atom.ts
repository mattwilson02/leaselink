import { atom } from 'jotai'

type NotificationSnackbarItem = {
	isVisible: boolean
	message: string
	type: 'archived' | 'unarchived' | 'error' | null
	notificationId?: string
	wasArchived?: boolean
}

export const notificationSnackbarAtom = atom<NotificationSnackbarItem>({
	isVisible: false,
	message: '',
	type: null,
	notificationId: undefined,
	wasArchived: undefined,
})
