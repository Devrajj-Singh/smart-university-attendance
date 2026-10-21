import QRCode from 'qrcode';

export async function generateQrSvg(text: string, options: { width?: number; margin?: number } = {}): Promise<string> {
  const { width = 280, margin = 1 } = options;
  return QRCode.toString(text, {
    type: 'svg',
    width,
    margin,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}

export async function generateQrDataUrl(text: string, options: { width?: number; margin?: number } = {}): Promise<string> {
  const { width = 280, margin = 1 } = options;
  return QRCode.toDataURL(text, {
    width,
    margin,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}
