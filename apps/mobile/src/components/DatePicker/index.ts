import Modal from './Modal'
import Root from './Root'
import Trigger from './Trigger'
import WheelPicker from './WheelPicker'

export type { DatePickerMode, DatePickerValue, DateRangeValue } from './types'
export { useDatePickerContext, useDateRangePickerContext } from './context'
export { DateRangePicker } from './DateRangePicker'

export const DatePicker = {
	Root,
	Modal,
	Trigger,
	WheelPicker,
}
