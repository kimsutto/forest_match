// 이 파일이 하는 일:
// 사용자가 고른 사진 파일을 검사하고, AI에 넣기 좋은 형태로 다듬습니다.
// 다듬기 = 흰 배경 위에 그리기 + 가로·세로 최대 512px로 줄이기.
// 도감 이미지도 똑같은 방식으로 다듬어 벡터를 만들었기 때문에,
// 여기를 바꾸면 비교 결과가 틀어집니다.

// 받을 수 있는 사진 형식과 크기 제한
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 12 * 1024 * 1024; // 12MB
const MAX_PIXELS = 40_000_000; // 4,000만 픽셀
const MAX_SIDE = 512; // 줄인 뒤 가로·세로의 최대 길이(px)

/**
 * 파일이 분석 가능한 사진인지 검사합니다. 문제가 있으면
 * 사용자에게 보여줄 한국어 메시지로 오류를 냅니다.
 */
export function validateFile(file) {
  const isAllowedType = file && ALLOWED_TYPES.includes(file.type);
  if (!isAllowedType) {
    throw new Error(
      "JPG, PNG, WebP 사진을 선택해 주세요. HEIC 사진은 JPG로 바꿔 주세요.",
    );
  }
  if (!file.size || file.size > MAX_FILE_BYTES) {
    throw new Error("사진은 12MB 이하로 선택해 주세요.");
  }
}

/**
 * 사진을 AI에 넣을 수 있는 형태로 다듬어 PNG로 돌려줍니다.
 * 1) 파일 검사 → 2) 픽셀 수 검사 → 3) 흰 배경에 축소해서 그리기
 */
export async function prepareImage(blob) {
  validateFile(blob);

  // 파일을 실제 그림(비트맵)으로 읽어 봅니다. 깨진 파일이면 여기서 실패합니다.
  let bitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    throw new Error(
      "사진을 읽지 못했어요. 다른 JPG, PNG, WebP 파일을 선택해 주세요.",
    );
  }

  try {
    if (bitmap.width * bitmap.height > MAX_PIXELS) {
      throw new Error(
        "사진 해상도가 너무 커요. 4,000만 픽셀 이하로 줄여 주세요.",
      );
    }

    // 긴 쪽이 512px이 되도록 줄입니다. 이미 작으면(배율 1) 그대로 둡니다.
    const scale = Math.min(
      MAX_SIDE / bitmap.width,
      MAX_SIDE / bitmap.height,
      1,
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    // 흰색으로 먼저 칠한 다음 사진을 그립니다.
    // 투명 배경 PNG도 이렇게 하면 흰 배경 사진이 됩니다.
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    return await canvas.convertToBlob({ type: "image/png" });
  } finally {
    // 비트맵은 메모리를 많이 쓰므로 다 쓰면 바로 닫아 줍니다.
    bitmap.close();
  }
}
