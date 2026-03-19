import { Select, type SelectViewportProps } from '@sf-digital-ui/react-native'

export const ItemList = (props: SelectViewportProps) => {
	return (
		<Select.Content>
			<Select.Viewport {...props} />
		</Select.Content>
	)
}
