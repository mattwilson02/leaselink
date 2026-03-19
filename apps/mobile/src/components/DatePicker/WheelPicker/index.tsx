import { ScrollWheelPicker } from '@/components/ScrollWheelPicker'
import { useDatePickerContext } from '../context'
import type { WheelPickerProps } from '../types'

const WheelPicker = ({ type, label, flex }: WheelPickerProps) => {
	const {
		tempValue,
		setTempDay,
		setTempMonth,
		setTempYear,
		dayOptions,
		monthOptions,
		yearOptions,
	} = useDatePickerContext()

	const getProps = () => {
		switch (type) {
			case 'day':
				return {
					items: dayOptions,
					selectedValue: String(tempValue.day),
					onValueChange: (value: string) => setTempDay(Number(value)),
				}
			case 'month':
				return {
					items: monthOptions,
					selectedValue: String(tempValue.month),
					onValueChange: (value: string) => setTempMonth(Number(value)),
				}
			case 'year':
				return {
					items: yearOptions,
					selectedValue: String(tempValue.year),
					onValueChange: (value: string) => setTempYear(Number(value)),
				}
		}
	}

	return <ScrollWheelPicker {...getProps()} label={label} flex={flex} />
}

export default WheelPicker
