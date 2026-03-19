export async function waitFor(
	assertions: () => void | Promise<void>,
	maxDuration = 5000, // Increase to 5 seconds
): Promise<void> {
	return new Promise((resolve, reject) => {
		let elapsedTime = 0

		const interval = setInterval(async () => {
			elapsedTime += 50 // Increase interval to 50ms to avoid excessive looping

			try {
				await assertions() // Ensure async assertions are awaited
				clearInterval(interval)
				resolve()
			} catch (err) {
				if (elapsedTime >= maxDuration) {
					clearInterval(interval)
					reject(err) // Stop and reject if maxDuration is exceeded
				}
			}
		}, 50) // Adjust polling interval
	})
}
