import { Layout } from '@/components/Layout'
import { Stack } from 'expo-router'

const ProfileLayout = () => {
	return (
		<Layout.SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
			<Stack
				screenOptions={{
					animation: 'none',
					headerShown: false,
				}}
			/>
		</Layout.SafeAreaView>
	)
}

export default ProfileLayout
