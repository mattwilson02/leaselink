import { SelectCompound, type SelectViewportProps } from '@/design-system/components/SelectCompound'

export const ItemList = (props: SelectViewportProps) => {
	return (
		<SelectCompound.Content>
			<SelectCompound.Viewport {...props} />
		</SelectCompound.Content>
	)
}
