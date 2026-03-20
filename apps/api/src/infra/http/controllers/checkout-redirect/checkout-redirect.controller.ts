import { Controller, Get, Res } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import type { Response } from 'express'
import { Public } from '@thallesp/nestjs-better-auth'

@ApiExcludeController()
@Controller('/payments/checkout')
export class CheckoutRedirectController {
	@Get('success')
	@Public()
	success(@Res() res: Response) {
		res.setHeader('Content-Type', 'text/html')
		res.send(`
			<!DOCTYPE html>
			<html>
			<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
			<body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:system-ui,sans-serif;background:#f0fdf4">
				<div style="text-align:center;padding:24px">
					<h1 style="color:#16a34a;font-size:24px">Payment Successful</h1>
					<p style="color:#666;font-size:16px">You can close this window and return to the app.</p>
				</div>
			</body>
			</html>
		`)
	}

	@Get('cancel')
	@Public()
	cancel(@Res() res: Response) {
		res.setHeader('Content-Type', 'text/html')
		res.send(`
			<!DOCTYPE html>
			<html>
			<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
			<body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:system-ui,sans-serif;background:#fef2f2">
				<div style="text-align:center;padding:24px">
					<h1 style="color:#dc2626;font-size:24px">Payment Cancelled</h1>
					<p style="color:#666;font-size:16px">You can close this window and return to the app.</p>
				</div>
			</body>
			</html>
		`)
	}
}
