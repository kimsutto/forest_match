export function validateFile(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error(
      'JPG, PNG, WebP 사진을 선택해 주세요. HEIC 사진은 JPG로 바꿔 주세요.',
    );
  if (!file.size || file.size > 12 * 1024 * 1024)
    throw new Error('사진은 12MB 이하로 선택해 주세요.');
}

export async function prepareImage(blob) {
  validateFile(blob);
  let bitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    throw new Error(
      '사진을 읽지 못했어요. 다른 JPG, PNG, WebP 파일을 선택해 주세요.',
    );
  }
  try {
    if (bitmap.width * bitmap.height > 40_000_000)
      throw new Error(
        '사진 해상도가 너무 커요. 4,000만 픽셀 이하로 줄여 주세요.',
      );
    const scale = Math.min(512 / bitmap.width, 512 / bitmap.height, 1);
    const canvas = new OffscreenCanvas(
      Math.max(1, Math.round(bitmap.width * scale)),
      Math.max(1, Math.round(bitmap.height * scale)),
    );
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await canvas.convertToBlob({ type: 'image/png' });
  } finally {
    bitmap.close();
  }
}
