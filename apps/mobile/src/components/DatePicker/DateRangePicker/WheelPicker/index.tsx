import { ScrollWheelPicker } from '@/components/ScrollWheelPicker'
import { useDateRangePickerContext } from '../../context'
import type { WheelPickerProps } from '../../types'

const WheelPicker = ({ type, label, flex }: WheelPickerProps) => {
	const {
		tempDateValue,
		setTempDay,
		setTempMonth,
		setTempYear,
		dayOptions,
		monthOptions,
		yearOptions,
	} = useDateRangePickerContext()

	const getProps = () => {
		switch (type) {
			case 'day':
				return {
					items: dayOptions,
					selectedValue: String(tempDateValue.day),
					onValueChange: (value: string) => setTempDay(Number(value)),
				}
			case 'month':
				return {
					items: monthOptions,
					selectedValue: String(tempDateValue.month),
					onValueChange: (value: string) => setTempMonth(Number(value)),
				}
			case 'year':
				return {
					items: yearOptions,
					selectedValue: String(tempDateValue.year),
					onValueChange: (value: string) => setTempYear(Number(value)),
				}
		}
	}

	return <ScrollWheelPicker {...getProps()} label={label} flex={flex} />
}

export default WheelPicker
