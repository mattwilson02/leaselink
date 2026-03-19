import { Component, type ErrorInfo, type ReactNode } from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, Button } from '@sf-digital-ui/react-native'
import { colors } from '@sf-digital-ui/tokens'
import { withTranslation, type WithTranslation } from 'react-i18next'

type Props = {
	children: ReactNode
} & WithTranslation

type State = {
	hasError: boolean
	error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props)
		this.state = { hasError: false, error: null }
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error }
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Log error to your error reporting service
		console.error('ErrorBoundary caught an error:', error, errorInfo)

		// You can integrate with services like Sentry here:
		// Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
	}

	handleReload = async () => {
		this.setState({ hasError: false, error: null })
	}

	render() {
		const { t } = this.props

		if (this.state.hasError) {
			return (
				<View style={styles.container}>
					<View style={styles.content}>
						<Text
							size='lg'
							fontWeight='bold'
							style={styles.title}
							testID='error-boundary-title'
						>
							{t('error_boundary:title')}
						</Text>
						<Text style={styles.message} testID='error-boundary-message'>
							{t('error_boundary:message')}
						</Text>
						{__DEV__ && this.state.error && (
							<View style={styles.errorDetails}>
								<Text size='sm' style={styles.errorText}>
									{this.state.error.toString()}
								</Text>
							</View>
						)}
						<Button.Root
							onPress={this.handleReload}
							variant='link'
							color='neutral'
							size='lg'
							style={styles.button}
							testID='error-boundary-reload-button'
						>
							<Button.Text>{t('error_boundary:try_again')}</Button.Text>
						</Button.Root>
					</View>
				</View>
			)
		}

		return this.props.children
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.neutral['10'],
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	content: {
		maxWidth: 400,
		alignItems: 'center',
		gap: 20,
	},
	title: {
		color: colors.neutral['900'],
		textAlign: 'center',
	},
	message: {
		color: colors.neutral['600'],
		textAlign: 'center',
		lineHeight: 24,
	},
	errorDetails: {
		backgroundColor: colors.error['50'],
		borderColor: colors.error['200'],
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		width: '100%',
		marginTop: 8,
	},
	errorText: {
		color: colors.error['700'],
		fontFamily: 'monospace',
	},
	button: {
		marginTop: 12,
		minWidth: 200,
	},
})

export default withTranslation()(ErrorBoundary)
