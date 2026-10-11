import { MODEL, REVISION, IMAGE_TOKENS } from './match.mjs';
import { prepareImage } from './image.mjs';

// Both photo matching and the offline index builder use this exact pipeline.
export async function loadEmbedder(report) {
  if (!navigator.gpu || !(await navigator.gpu.requestAdapter())) {
    throw new Error(
      'WebGPU를 사용할 수 없어요. 최신 Chrome 또는 Edge에서 하드웨어 가속을 켜고 다시 열어 주세요.',
    );
  }
  report('status', { message: '이미지를 이해하는 AI를 불러오고 있어요…' });
  const lib = await import(
    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/+esm'
  );
  lib.env.allowLocalModels = false;
  const progress_callback = (progress) => {
    if (progress.status === 'progress') {
      const { file, loaded, total } = progress;
      report('download', { file, loaded, total, progress: progress.progress });
    }
    if (progress.status === 'done') {
      report('status', { message: '다운로드한 파일을 준비하는 중…' });
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
    dtype: 'q4',
    device: 'webgpu',
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
