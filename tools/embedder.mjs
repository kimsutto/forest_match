// 이 파일이 하는 일:
// 도감 벡터 생성 도구(tools/)에서 쓰는 AI 로더입니다.
// 이 도구는 빌드 없이 브라우저에서 바로 열기 때문에, 앱(src/lib/model/engines.js)과 달리
// Transformers.js를 npm 패키지가 아니라 CDN 주소에서 불러옵니다.
// 모델·버전·전처리는 앱과 반드시 같아야 하므로 src의 상수와 전처리 함수를 그대로 가져옵니다.
import { MODEL, REVISION, IMAGE_TOKENS } from "../src/lib/matching/match.js";
import { prepareImage } from "../src/lib/matching/image.js";

export async function loadEmbedder(report) {
  if (!navigator.gpu || !(await navigator.gpu.requestAdapter())) {
    throw new Error(
      "WebGPU를 사용할 수 없어요. 최신 Chrome 또는 Edge에서 하드웨어 가속을 켜고 다시 열어 주세요.",
    );
  }
  report("status", { message: "이미지를 이해하는 AI를 불러오고 있어요…" });
  const lib =
    await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/+esm");
  lib.env.allowLocalModels = false;
  const progress_callback = (progress) => {
    if (progress.status === "progress") {
      const { file, loaded, total } = progress;
      report("download", { file, loaded, total, progress: progress.progress });
    }
    if (progress.status === "done") {
      report("status", { message: "다운로드한 파일을 준비하는 중…" });
    }
  };
  const config = await lib.AutoConfig.from_pretrained(MODEL, {
    revision: REVISION,
  });
  config.audio_config = null;
  const processor = await lib.AutoProcessor.from_pretrained(MODEL, {
    revision: REVISION,
    progress_callback,
  });
  processor.image_processor.max_soft_tokens = IMAGE_TOKENS;
  const model = await lib.AutoModel.from_pretrained(MODEL, {
    config,
    revision: REVISION,
    dtype: "q4",
    device: "webgpu",
    progress_callback,
  });

  return async function embed(blob) {
    const image = await lib.RawImage.fromBlob(await prepareImage(blob));
    const inputs = await processor(null, image);
    const output = await model(inputs);
    try {
      return output.sentence_embedding.tolist()[0];
    } finally {
      for (const tensor of Object.values(output)) tensor?.dispose?.();
    }
  };
}
