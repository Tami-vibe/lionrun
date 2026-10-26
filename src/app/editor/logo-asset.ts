import {deliverySize} from './logo-model';

export async function logoDeliveryBlob(blob: Blob, mime: string): Promise<Blob> {
  if (mime === 'image/svg+xml' || typeof createImageBitmap !== 'function') return blob;
  const bitmap = await createImageBitmap(blob);
  const size = deliverySize(bitmap.width, bitmap.height);
  if (!size) {
    bitmap.close();
    return blob;
  }
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return blob;
  }
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  const type = mime === 'image/jpeg' ? 'image/jpeg' : mime === 'image/webp' ? 'image/webp' : 'image/png';
  const next = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type));
  return next ?? blob;
}
