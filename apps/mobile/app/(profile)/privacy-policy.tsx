import { Heading, Text } from '@/design-system/components/Typography'
import { colors } from '@/design-system/theme'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useCallback } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

const PrivacyPolicy = () => {
	const router = useRouter()

	const handleBack = useCallback(() => {
		router.back()
	}, [router])

	return (
		<View style={{ flex: 1, backgroundColor: 'white', gap: 32 }}>
			{/** TODO: translations when text is ready */}
			<Pressable style={styles.backButton} onPress={handleBack}>
				<ChevronLeft size={24} color={colors.neutral['700']} />
			</Pressable>

			<ScrollView
				style={styles.container}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.contentContainer}
			>
				<View style={{ gap: 16, alignItems: 'center' }}>
					<View style={{ gap: 12 }}>
						<Text size='sm' style={{ color: colors.primary }}>
							Current as of 20 Jan 2025
						</Text>
						<Heading
							size='h3'
							fontWeight='bold'
							style={{ color: colors.neutral['700'] }}
						>
							Privacy Policy
						</Heading>
					</View>
					<Text
						size='lg'
						style={{ color: colors.neutral['600'], textAlign: 'center' }}
					>
						Your privacy is important to us at Untitled. We respect your privacy
						regarding any information we may collect from you across our
						website.
					</Text>
				</View>
				<View style={{ gap: 16 }}>
					<Text style={{ color: colors.neutral['500'] }}>
						Mi tincidunt elit, id quisque ligula ac diam, amet. Vel etiam
						suspendisse morbi eleifend faucibus eget vestibulum felis. Dictum
						quis montes, sit sit. Tellus aliquam enim urna, etiam. Mauris
						posuere vulputate arcu amet, vitae nisi, tellus tincidunt. At
						feugiat sapien varius id.
					</Text>
					<Text style={{ color: colors.neutral['500'] }}>
						Eget quis mi enim, leo lacinia pharetra, semper. Eget in volutpat
						mollis at volutpat lectus velit, sed auctor. Porttitor fames arcu
						quis fusce augue enim. Quis at habitant diam at. Suscipit tristique
						risus, at donec. In turpis vel et quam imperdiet. Ipsum molestie
						aliquet sodales id est ac volutpat.
					</Text>
				</View>
				<View style={{ gap: 16 }}>
					<Heading
						size='h6'
						fontWeight='bold'
						style={{ color: colors.neutral['700'] }}
					>
						What information do we collect?
					</Heading>
					<Text style={{ color: colors.neutral['500'] }}>
						Dolor enim eu tortor urna sed duis nulla. Aliquam vestibulum, nulla
						odio nisl vitae. In aliquet pellentesque aenean hac vestibulum
						turpis mi bibendum diam. Tempor integer aliquam in vitae malesuada
						fringilla.
					</Text>
					<Text style={{ color: colors.neutral['500'] }}>
						Elit nisi in eleifend sed nisi. Pulvinar at orci, proin imperdiet
						commodo consectetur convallis risus. Sed condimentum enim dignissim
						adipiscing faucibus consequat, urna. Viverra purus et erat auctor
						aliquam. Risus, volutpat vulputate posuere purus sit congue
						convallis aliquet. Arcu id augue ut feugiat donec porttitor neque.
						Mauris, neque ultricies eu vestibulum, bibendum quam lorem id. Dolor
						lacus, eget nunc lectus in tellus, pharetra, porttitor.
					</Text>
					<Text style={{ color: colors.neutral['500'] }}>
						Ipsum sit mattis nulla quam nulla. Gravida id gravida ac enim mauris
						id. Non pellentesque congue eget consectetur turpis. Sapien, dictum
						molestie sem tempor. Diam elit, orci, tincidunt aenean tempus. Quis
						velit eget ut tortor tellus. Sed vel, congue felis elit erat nam
						nibh orci.
					</Text>
				</View>
				<View style={{ gap: 16 }}>
					<Heading
						size='h6'
						fontWeight='bold'
						style={{ color: colors.neutral['700'] }}
					>
						How do we use your information?
					</Heading>
					<Text style={{ color: colors.neutral['500'] }}>
						Dolor enim eu tortor urna sed duis nulla. Aliquam vestibulum, nulla
						odio nisl vitae. In aliquet pellentesque aenean hac vestibulum
						turpis mi bibendum diam. Tempor integer aliquam in vitae malesuada
						fringilla.
					</Text>
					<Text style={{ color: colors.neutral['500'] }}>
						Elit nisi in eleifend sed nisi. Pulvinar at orci, proin imperdiet
						commodo consectetur convallis risus. Sed condimentum enim dignissim
						adipiscing faucibus consequat, urna. Viverra purus et erat auctor
						aliquam. Risus, volutpat vulputate posuere purus sit congue
						convallis aliquet. Arcu id augue ut feugiat donec porttitor neque.
						Mauris, neque ultricies eu vestibulum, bibendum quam lorem id. Dolor
						lacus, eget nunc lectus in tellus, pharetra, porttitor.
					</Text>
					<Text style={{ color: colors.neutral['500'] }}>
						Ipsum sit mattis nulla quam nulla. Gravida id gravida ac enim mauris
						id. Non pellentesque congue eget consectetur turpis. Sapien, dictum
						molestie sem tempor. Diam elit, orci, tincidunt aenean tempus. Quis
						velit eget ut tortor tellus. Sed vel, congue felis elit erat nam
						nibh orci.
					</Text>
				</View>
				<View style={{ gap: 16 }}>
					<Heading
						size='h6'
						fontWeight='bold'
						style={{ color: colors.neutral['700'] }}
					>
						Do we use cookies and other tracking technologies?
					</Heading>
					<Text style={{ color: colors.neutral['500'] }}>
						Pharetra morbi libero id aliquam elit massa integer tellus. Quis
						felis aliquam ullamcorper porttitor. Pulvinar ullamcorper sit
						dictumst ut eget a, elementum eu. Maecenas est morbi mattis id in ac
						pellentesque ac.
					</Text>
				</View>
				<View style={{ gap: 16 }}>
					<Heading
						size='h6'
						fontWeight='bold'
						style={{ color: colors.neutral['700'] }}
					>
						How do we keep your information safe?
					</Heading>
					<Text style={{ color: colors.neutral['500'] }}>
						Pharetra morbi libero id aliquam elit massa integer tellus. Quis
						felis aliquam ullamcorper porttitor. Pulvinar ullamcorper sit
						dictumst ut eget a, elementum eu. Maecenas est morbi mattis id in ac
						pellentesque ac.
					</Text>
				</View>
				<View style={{ gap: 16 }}>
					<Heading
						size='h6'
						fontWeight='bold'
						style={{ color: colors.neutral['700'] }}
					>
						What are your privacy rights?
					</Heading>
					<Text style={{ color: colors.neutral['500'] }}>
						Pharetra morbi libero id aliquam elit massa integer tellus. Quis
						felis aliquam ullamcorper porttitor. Pulvinar ullamcorper sit
						dictumst ut eget a, elementum eu. Maecenas est morbi mattis id in ac
						pellentesque ac.
					</Text>
				</View>
				<View style={{ gap: 16 }}>
					<Heading
						size='h6'
						fontWeight='bold'
						style={{ color: colors.neutral['700'] }}
					>
						How can you contact us about this policy?
					</Heading>
					<Text style={{ color: colors.neutral['500'] }}>
						Sagittis et eu at elementum, quis in. Proin praesent volutpat
						egestas sociis sit lorem nunc nunc sit. Eget diam curabitur mi ac.
						Auctor rutrum lacus malesuada massa ornare et. Vulputate consectetur
						ac ultrices at diam dui eget fringilla tincidunt. Arcu sit dignissim
						massa erat cursus vulputate gravida id. Sed quis auctor vulputate
						hac elementum gravida cursus dis.
					</Text>
					<Text style={{ color: colors.neutral['500'] }}>
						1. Lectus id duis vitae porttitor enim gravida morbi. 2. Eu turpis
						posuere semper feugiat volutpat elit, ultrices suspendisse. Auctor
						vel in vitae placerat. 3. Suspendisse maecenas ac donec scelerisque
						diam sed est duis purus.
					</Text>
				</View>
			</ScrollView>
		</View>
	)
}

export default PrivacyPolicy

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'white',
	},
	backButton: {
		alignSelf: 'flex-start',
		padding: 8,
	},
	contentContainer: {
		gap: 32,
		paddingBottom: 12,
		paddingHorizontal: 16,
	},
})
