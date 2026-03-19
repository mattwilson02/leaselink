import dayjs from 'dayjs'

type FormatDateResponse = {
	type: 'alias' | 'date'
	value: string
}

export const formatDate = (date: string): FormatDateResponse => {
	const today = new Date()
	const notificationDate = date

	const isJustNow =
		dayjs(notificationDate).isAfter(dayjs().subtract(5, 'minutes')) &&
		!dayjs(notificationDate).isAfter(dayjs())

	if (isJustNow) {
		return { type: 'alias', value: 'just_now' }
	}

	const isToday = dayjs(notificationDate).isSame(today, 'day')

	if (isToday) {
		return { type: 'date', value: dayjs(notificationDate).format('HH:mm') }
	}

	const isYesterday = dayjs(notificationDate).isSame(
		dayjs().subtract(1, 'day').toDate(),
		'day',
	)

	if (isYesterday) {
		return { type: 'alias', value: 'yesterday' }
	}

	return { type: 'date', value: dayjs(notificationDate).format('DD MMM YYYY') }
}
