interface VerificationOTPEmailParams {
	otp: string
	type: string
}

interface PasswordResetEmailParams {
	url: string
}

export function getVerificationOTPEmailTemplate({
	otp,
	type,
}: VerificationOTPEmailParams) {
	const subject =
		type === 'sign-in'
			? 'Your Sign-In Verification Code'
			: 'Email Verification Code'

	const htmlContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #000000; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.code-box { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; color: #000000; }
				.footer { margin-top: 30px; font-size: 12px; color: #666; }
				h2 { color: #000000; }
				p { color: #000000; }
			</style>
		</head>
		<body>
			<div class="container">
				<h2>${subject}</h2>
				<p>Your verification code is:</p>
				<div class="code-box">${otp}</div>
				<p>This code will expire in 5 minutes.</p>
				<p>If you didn't request this code, please ignore this email.</p>
				<div class="footer">
					<p>This is an automated message, please do not reply.</p>
				</div>
			</div>
		</body>
		</html>
	`

	const textContent = `Your verification code is: ${otp}. This code will expire in 5 minutes.`

	return { subject, htmlContent, textContent }
}

export function getPasswordResetEmailTemplate({
	url,
}: PasswordResetEmailParams) {
	const subject = 'Reset Your Password'

	const htmlContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #000000; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.button { display: inline-block; padding: 12px 30px; background-color: #006237; color: #ffffff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
				.footer { margin-top: 30px; font-size: 12px; color: #666; }
				.warning { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; color: #000000; }
				h2 { color: #000000; }
				p { color: #000000; }
			</style>
		</head>
		<body>
			<div class="container">
				<h2>Reset Your Password</h2>
				<p>Hello,</p>
				<p>We received a request to reset your password. Click the button below to create a new password:</p>
				<div style="text-align: center;">
					<a href="${url}" class="button" style="color: #ffffff;">Reset Password</a>
				</div>
				<p>Or copy and paste this link into your browser:</p>
				<p style="word-break: break-all; color: #000000;">${url}</p>
				<div class="warning">
					<p><strong>⚠️ Security Notice:</strong></p>
					<p>This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
				</div>
				<div class="footer">
					<p>This is an automated message, please do not reply.</p>
					<p>&copy; ${new Date().getFullYear()} Stonehage Fleming. All rights reserved.</p>
				</div>
			</div>
		</body>
		</html>
	`

	const textContent = `Click the link to reset your password: ${url}. This link will expire in 1 hour.`

	return { subject, htmlContent, textContent }
}

export function getPasswordResetConfirmationEmailTemplate() {
	const subject = 'Password Successfully Reset'

	const htmlContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #000000; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.success-box { background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; color: #000000; }
				.footer { margin-top: 30px; font-size: 12px; color: #666; }
				.warning { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; color: #000000; }
				h2 { color: #000000; }
				p { color: #000000; }
			</style>
		</head>
		<body>
			<div class="container">
				<h2>Password Successfully Reset</h2>
				<div class="success-box">
					<p><strong>✓ Success!</strong></p>
					<p>Your password has been successfully reset.</p>
				</div>
				<p>You can now use your new password to sign in to your account.</p>
				<div class="warning">
					<p><strong>⚠️ Security Notice:</strong></p>
					<p>If you did not make this change, please contact our support team immediately.</p>
				</div>
				<div class="footer">
					<p>This is an automated message, please do not reply.</p>
					<p>&copy; ${new Date().getFullYear()} Stonehage Fleming. All rights reserved.</p>
				</div>
			</div>
		</body>
		</html>
	`

	const textContent =
		'Your password has been successfully reset. If you did not make this change, please contact our support team immediately.'

	return { subject, htmlContent, textContent }
}
