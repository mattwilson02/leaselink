import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'

// Types and Interfaces, and Zod Schemas

const ComponentName = () => {
	// Hooks
	const router = useRouter()

	// Variables

	// Functions and logic

	return (
		<View style={styles.container}>
			{/* Content inside this page / template can be in here */}
		</View>
	)
}

// Styles
const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
})

export default ComponentName
