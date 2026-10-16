// 이 파일이 하는 일:
// 사진을 벡터로 바꿔 주는 "AI 엔진"들의 목록입니다.
// 각 엔진은 세 가지만 알려주면 됩니다:
//   id          : 엔진 이름
//   isAvailable : 이 브라우저에서 쓸 수 있는가?
//   load        : 엔진을 준비해서 embed(사진 → 벡터) 함수를 돌려준다
//
// 지금은 WebGPU 엔진 하나뿐이고, 나중에 WebGPU가 없는 브라우저를 위한
// 폴백(예비) 엔진을 이 목록에 추가하기만 하면 됩니다.
import {
  env,
  AutoConfig,
  AutoProcessor,
  AutoModel,
  RawImage,
} from "@huggingface/transformers";
import { MODEL, REVISION, IMAGE_TOKENS } from "../matching/match.js";
import { prepareImage } from "../matching/image.js";

// 모델은 Hugging Face에서만 받습니다(로컬 파일 탐색 끔).
env.allowLocalModels = false;

/** WebGPU(그래픽카드)로 EmbeddingGemma 2를 돌리는 기본 엔진 */
const webgpuEngine = {
  id: "webgpu",

  async isAvailable() {
    // navigator.gpu가 있고, 실제로 그래픽카드 어댑터를 받을 수 있어야 합니다.
    if (!navigator.gpu) return false;
    return Boolean(await navigator.gpu.requestAdapter());
  },

  /**
   * 모델을 내려받아 준비하고, embed 함수를 돌려줍니다.
   * report(type, data)로 진행 상황을 바깥(화면)에 알립니다.
   */
  async load(report) {
    report("status", { message: "이미지를 이해하는 AI를 불러오고 있어요…" });

    // 다운로드 진행률을 화면에 전달하는 콜백
    const progress_callback = (progress) => {
      if (progress.status === "progress") {
        const { file, loaded, total } = progress;
        report("download", {
          file,
          loaded,
          total,
          progress: progress.progress,
        });
      }
      if (progress.status === "done") {
        report("status", { message: "다운로드한 파일을 준비하는 중…" });
      }
    };

    const config = await AutoConfig.from_pretrained(MODEL, {
      revision: REVISION,
    });
    config.audio_config = null; // 소리 기능은 안 쓰므로 꺼서 가볍게

    const processor = await AutoProcessor.from_pretrained(MODEL, {
      revision: REVISION,
      progress_callback,
    });
    processor.image_processor.max_soft_tokens = IMAGE_TOKENS;

    const model = await AutoModel.from_pretrained(MODEL, {
      config,
      revision: REVISION,
      dtype: "q4", // 4비트로 압축된 가중치
      device: "webgpu",
      progress_callback,
    });

    // 사진(blob) 한 장을 768개 숫자 벡터로 바꾸는 함수
    return async function embed(blob) {
      const image = await RawImage.fromBlob(await prepareImage(blob));
      const inputs = await processor(null, image);
      const output = await model(inputs);
      try {
        return output.sentence_embedding.tolist()[0];
      } finally {
        // GPU 메모리를 잡고 있는 결과물은 쓰고 나면 바로 돌려줍니다.
        for (const tensor of Object.values(output)) tensor?.dispose?.();
      }
    };
  },
};

// 앞에 있는 엔진부터 차례로 시도합니다.
export const engines = [webgpuEngine];

/**
 * 이 브라우저에서 쓸 수 있는 첫 번째 엔진을 골라 준비합니다.
 * 쓸 수 있는 엔진이 하나도 없으면 안내 메시지와 함께 실패합니다.
 */
export async function loadBestEngine(report) {
  for (const engine of engines) {
    if (await engine.isAvailable()) {
      const embed = await engine.load(report);
      return { id: engine.id, embed };
    }
  }
  throw new Error(
    "WebGPU를 사용할 수 없어요. 최신 Chrome 또는 Edge에서 하드웨어 가속을 켜고 다시 열어 주세요.",
  );
}
