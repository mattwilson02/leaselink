export const getMimeType = (extension: string): string => {
	const mimeTypes: Record<string, string> = {
		pdf: 'application/pdf',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		gif: 'image/gif',
		doc: 'application/msword',
		docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		txt: 'text/plain',
	}
	return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
}
