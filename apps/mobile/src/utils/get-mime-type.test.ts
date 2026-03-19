import { getMimeType } from './get-mime-type'

describe('getMimeType', () => {
	it('should return correct MIME type for PDF files', () => {
		expect(getMimeType('pdf')).toBe('application/pdf')
		expect(getMimeType('PDF')).toBe('application/pdf')
	})

	it('should return correct MIME type for image files', () => {
		expect(getMimeType('jpg')).toBe('image/jpeg')
		expect(getMimeType('jpeg')).toBe('image/jpeg')
		expect(getMimeType('png')).toBe('image/png')
		expect(getMimeType('gif')).toBe('image/gif')
	})

	it('should return correct MIME type for document files', () => {
		expect(getMimeType('doc')).toBe('application/msword')
		expect(getMimeType('docx')).toBe(
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		)
	})

	it('should return correct MIME type for text files', () => {
		expect(getMimeType('txt')).toBe('text/plain')
	})

	it('should handle case insensitive extensions', () => {
		expect(getMimeType('PDF')).toBe('application/pdf')
		expect(getMimeType('JPG')).toBe('image/jpeg')
		expect(getMimeType('JPEG')).toBe('image/jpeg')
		expect(getMimeType('PNG')).toBe('image/png')
		expect(getMimeType('GIF')).toBe('image/gif')
		expect(getMimeType('DOC')).toBe('application/msword')
		expect(getMimeType('DOCX')).toBe(
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		)
		expect(getMimeType('TXT')).toBe('text/plain')
	})

	it('should handle mixed case extensions', () => {
		expect(getMimeType('Pdf')).toBe('application/pdf')
		expect(getMimeType('JpG')).toBe('image/jpeg')
		expect(getMimeType('PnG')).toBe('image/png')
		expect(getMimeType('DoC')).toBe('application/msword')
		expect(getMimeType('TxT')).toBe('text/plain')
	})

	it('should return default MIME type for unknown extensions', () => {
		expect(getMimeType('unknown')).toBe('application/octet-stream')
		expect(getMimeType('xyz')).toBe('application/octet-stream')
		expect(getMimeType('randomext')).toBe('application/octet-stream')
		expect(getMimeType('document-without-extension')).toBe(
			'application/octet-stream',
		)
	})

	it('should handle empty string', () => {
		expect(getMimeType('')).toBe('application/octet-stream')
	})

	it('should handle extensions with special characters', () => {
		expect(getMimeType('file.ext')).toBe('application/octet-stream')
		expect(getMimeType('123')).toBe('application/octet-stream')
		expect(getMimeType('ext-with-dash')).toBe('application/octet-stream')
	})

	it('should handle extensions with whitespace (returns default)', () => {
		// The function doesn't trim whitespace, so these should return default
		expect(getMimeType(' pdf ')).toBe('application/octet-stream')
		expect(getMimeType('pdf ')).toBe('application/octet-stream')
		expect(getMimeType(' pdf')).toBe('application/octet-stream')
	})

	it('should validate all supported extensions', () => {
		const supportedExtensions = [
			{ ext: 'pdf', mime: 'application/pdf' },
			{ ext: 'jpg', mime: 'image/jpeg' },
			{ ext: 'jpeg', mime: 'image/jpeg' },
			{ ext: 'png', mime: 'image/png' },
			{ ext: 'gif', mime: 'image/gif' },
			{ ext: 'doc', mime: 'application/msword' },
			{
				ext: 'docx',
				mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			},
			{ ext: 'txt', mime: 'text/plain' },
		]

		for (const { ext, mime } of supportedExtensions) {
			expect(getMimeType(ext)).toBe(mime)
		}
	})
})
