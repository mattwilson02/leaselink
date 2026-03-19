import {
	KeyboardAvoidingView as RNKeyboardAvoidingView,
	Platform,
	type KeyboardAvoidingViewProps,
} from 'react-native'

export const KeyboardAvoidingView = (props: KeyboardAvoidingViewProps) => (
	<RNKeyboardAvoidingView
		behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		keyboardVerticalOffset={0}
		{...props}
	/>
)
