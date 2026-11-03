import QRCode from 'qrcode';

/**
 * Generates an SVG string representation of a QR code.
 */
export async function generateQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });
}

/**
 * Generates a Data URL (PNG image) of a QR code.
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 260,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });
}
