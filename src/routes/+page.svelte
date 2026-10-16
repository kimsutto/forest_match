<script>
  // 홈 화면. 화면 조각(컴포넌트)들을 조립하고,
  // "사진 선택 → 분석 → 결과"로 이어지는 전체 흐름의 상태를 관리합니다.
  import { browser } from "$app/environment";
  import Intro from "$lib/components/Intro.svelte";
  import PhotoPicker from "$lib/components/PhotoPicker.svelte";
  import StatusBar from "$lib/components/StatusBar.svelte";
  import ResultList from "$lib/components/ResultList.svelte";
  import CatalogBrowser from "$lib/components/CatalogBrowser.svelte";
  import { prepareImage } from "$lib/matching/image.js";
  import { createMatchWorker } from "$lib/model/createWorker.js";

  // 이 브라우저에서 분석을 돌릴 수 있는지 (안전한 주소 + WebGPU)
  const supported = browser && window.isSecureContext && Boolean(navigator.gpu);

  const scopeLabels = {
    all: "전체 566개",
    villager: "주민 490명",
    nh: "모여봐요 417명",
    special: "특수 76개",
  };

  // ----- 화면 상태 -----
  let busy = $state(false); // 분석/준비 중이면 입력을 잠급니다
  let selected = null; // 선택된 사진 파일 (화면 표시는 previewURL이 담당)
  let previewURL = $state(""); // 미리보기 이미지 주소
  let filename = $state("주인공이 크게 나온 사진이면 더 좋아요.");
  let scope = $state("all"); // 비교 범위
  let matchLabel = $state("닮은 친구 찾기");
  let status = $state({
    message: "사진을 선택하면 시작할 수 있어요.",
    kind: "",
  });
  let progress = $state(null); // 다운로드 진행률 (null이면 숨김)
  let result = $state(null); // 분석 결과 { results, count, ms }
  let catalog = $state([]); // 도감 목록
  let catalogError = $state(false);
  let worker; // AI가 돌아가는 작업 스레드
  let pickerElement; // 도감에서 카드를 누르면 여기로 스크롤

  function setStatus(message, kind = "") {
    status = { message, kind };
  }

  // ----- 사진 선택 -----
  // 파일, 예시 사진(주소), 도감 카드가 모두 이 함수를 거칩니다.
  async function choose(source, name) {
    if (busy) return;
    if (!source) {
      // PhotoPicker가 "사진이 여러 장" 같은 안내만 전달한 경우
      setStatus(name, "error");
      return;
    }
    busy = true;
    try {
      let blob = source;
      if (typeof source === "string") {
        // 예시 사진은 주소이므로 먼저 내려받습니다.
        try {
          const response = await fetch(source);
          if (!response.ok) throw new Error();
          blob = await response.blob();
        } catch {
          throw new Error("예시 사진을 불러오지 못했어요. 다시 시도해 주세요.");
        }
      }
      // 검증 + 다듬기(흰 배경, 512px). 문제가 있으면 여기서 오류가 납니다.
      const preview = await prepareImage(blob);
      if (previewURL) URL.revokeObjectURL(previewURL);
      previewURL = URL.createObjectURL(preview);
      selected = blob;
      filename = name;
      result = null;
      setStatus("사진 준비 완료 · 닮은 친구 찾기를 눌러 주세요.", "ready");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      busy = false;
    }
  }

  function clearPhoto() {
    selected = null;
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = "";
    filename = "주인공이 크게 나온 사진이면 더 좋아요.";
    result = null;
    busy = false;
    setStatus("사진을 선택하면 시작할 수 있어요.");
  }

  // ----- 분석 -----
  function fail(message) {
    worker?.terminate();
    worker = undefined;
    progress = null;
    matchLabel = "다시 찾아보기";
    busy = false;
    setStatus(`실행하지 못했어요. ${message}`, "error");
  }

  // 작업 스레드가 보내는 메시지(진행/다운로드/오류/결과)를 받아 화면에 반영합니다.
  function handleWorkerMessage({ data }) {
    switch (data.type) {
      case "status":
        progress = null;
        setStatus(data.message, "loading");
        break;
      case "download": {
        const percent = Math.max(0, Math.min(100, data.progress || 0));
        progress = percent;
        const size = data.total
          ? ` (${(data.loaded / 1e6).toFixed(0)}/${(data.total / 1e6).toFixed(0)}MB)`
          : "";
        setStatus(
          `AI 다운로드 · ${data.file} · ${percent.toFixed(0)}%${size}`,
          "loading",
        );
        break;
      }
      case "error":
        fail(data.message);
        break;
      case "results":
        progress = null;
        matchLabel = "다시 비교하기";
        result = data;
        busy = false;
        setStatus(
          `WebGPU 분석 완료 · ${(data.ms / 1000).toFixed(2)}초 · 사진은 전송되지 않았어요.`,
          "ready",
        );
        break;
    }
  }

  function match() {
    if (busy || !selected || !supported) return;
    busy = true;
    result = null;
    matchLabel = "닮은꼴을 찾는 중…";
    setStatus("AI를 준비하고 사진을 비교하고 있어요…", "loading");
    try {
      if (!worker) {
        worker = createMatchWorker();
        worker.onerror = (event) =>
          fail(
            event.message ||
              "실행 파일을 불러오지 못했습니다. 네트워크를 확인해 주세요.",
          );
        worker.onmessage = handleWorkerMessage;
      }
      worker.postMessage({ type: "match", blob: selected, scope });
    } catch (error) {
      fail(error.message);
    }
  }

  function scopeChanged() {
    result = null;
    setStatus("비교 범위를 바꿨어요. 찾기를 눌러 다시 비교해 보세요.");
  }

  // 도감 카드를 누르면: 그 캐릭터 이미지로 사진을 바꾸고 위로 스크롤
  async function pickFromCatalog(item) {
    if (busy) return;
    await choose(item.image, `${item.name} · 도감 이미지`);
    pickerElement?.scrollIntoView({
      block: "center",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  // ----- 도감 불러오기 (화면이 뜨면 한 번) -----
  $effect(() => {
    fetch("/characters.json")
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => (catalog = data))
      .catch(() => (catalogError = true));
  });
</script>

<svelte:head>
  <title>숲속 닮은꼴 · Forest Match</title>
  <meta
    name="description"
    content="사진 한 장으로 만나는 동물의 숲 닮은꼴. 시리즈 전체 주민 490명과 특수 캐릭터 76개 항목을 브라우저 AI로 비교해 보세요."
  />
</svelte:head>

<Intro />

<section class="workspace" bind:this={pickerElement}>
  <PhotoPicker
    {busy}
    {supported}
    {previewURL}
    {filename}
    bind:scope
    {matchLabel}
    onchoose={choose}
    onclear={clearPhoto}
    onmatch={match}
    onscopechange={scopeChanged}
  >
    {#snippet statusArea()}
      <StatusBar
        {supported}
        message={status.message}
        kind={status.kind}
        {progress}
      />
    {/snippet}
  </PhotoPicker>

  <ResultList scopeLabel={scopeLabels[scope]} {result} />
</section>

<CatalogBrowser
  {catalog}
  loadError={catalogError}
  {busy}
  onpick={pickFromCatalog}
/>

<section class="explainer">
  <div>
    <span>01 / IMAGE TO IMAGE</span>
    <h3>사진과 캐릭터를 비교해요</h3>
    <p>
      EmbeddingGemma 2가 사진의 특징을 읽고, 도감 속 모든 이미지와 같은 기준으로
      비교합니다.
    </p>
  </div>
  <div>
    <span>02 / YOUR PHOTO STAYS HERE</span>
    <h3>사진은 전송되지 않아요</h3>
    <p>
      선택한 사진을 외부 서버로 보내거나 저장하지 않습니다. 분석은 내 브라우저의
      GPU에서.
    </p>
  </div>
  <div>
    <span>03 / JUST FOR FUN</span>
    <h3>뜻밖의 닮은꼴을 즐겨요</h3>
    <p>
      배경·구도·색과 사물의 특징도 결과에 영향을 줍니다. 얼굴 인식이나 성격
      진단은 하지 않아요.
    </p>
  </div>
</section>

<details>
  <summary>도감 범위와 이미지 출처 <span>+</span></summary>
  <p>
    2026년 10월 11일 확인한 Nookipedia의 시리즈 전체 주민 490명과 특수 캐릭터
    목록을 기준으로 합니다. 일반 주민에는 모여봐요 3.0의 417명, 과거 작품 및
    콜라보 주민을 포함합니다. 특수 캐릭터는 76개 이미지 항목이며 콩돌이·밤돌이는
    한 팀으로, DJ K.K.·도토리옹·해적은 별도 모습으로 수록했습니다.
  </p>
  <p>
    정해진 외형이 없는 플레이어·부모, 화면에 실체가 없는 Somebody·디버그용 Xsq,
    미등장·삭제 캐릭터 및 모든 의상 변형은 포함하지 않습니다. 각 캐릭터의 대표
    이미지 한 장을 비교하며 오래된 캐릭터는 당시 아트워크나 모델 이미지를
    사용합니다. 한국어 이름을 확인하지 못한 항목은 영문 이름으로 표시합니다.
  </p>
  <p>
    캐릭터 정보·이미지:
    <a
      href="https://nookipedia.com/wiki/List_of_villagers"
      target="_blank"
      rel="noreferrer">Nookipedia 주민 목록 ↗</a
    >
    ·
    <a
      href="https://nookipedia.com/wiki/Category:Special_characters"
      target="_blank"
      rel="noreferrer">특수 캐릭터 목록 ↗</a
    >. 정보는
    <a
      href="https://creativecommons.org/licenses/by-sa/4.0/"
      target="_blank"
      rel="noreferrer">CC BY-SA 4.0</a
    >에 따라 편집·번역했습니다. 한국어 이름 보완:
    <a
      href="https://github.com/lindsaygelle/nook"
      target="_blank"
      rel="noreferrer">nook 데이터셋</a
    >. 이미지 저작권은 Nintendo 등 원권리자에게 있으며, 각 카드의 출처 링크에서
    원본을 확인할 수 있습니다.
  </p>
</details>
<details>
  <summary>AI는 어떻게 작동하나요? <span>+</span></summary>
  <p>
    566개 도감 이미지를 미리 768차원 벡터로 만들었습니다. 사진을 선택하면 동일한
    EmbeddingGemma 2 모델로 사진 벡터를 만들고, 선택한 범위의 모든 캐릭터와
    코사인 유사도를 계산해 상위 다섯 항목을 보여줍니다. 모델은 4비트
    텍스트·이미지 구성으로 WebGPU에서 실행합니다. 토큰 처리와 순위 계산에는
    CPU도 사용합니다.
  </p>
  <p>
    모델과 실행 파일은 Hugging Face에서 받습니다. 캐시 유지 여부는 브라우저
    설정에 따라 달라집니다. 최신 Chrome 또는 Edge와 WebGPU가 필요하며, HEIC는
    지원하지 않습니다. 동물의 숲 식별 전용으로 학습한 모델이 아니므로 결과가
    사람의 직관과 다를 수 있어요.
  </p>
</details>

<style>
  .workspace {
    display: grid;
    grid-template-columns: 1fr 1.15fr;
    gap: 24px;
  }

  .explainer {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 45px;
    margin: 38px 0 32px;
  }

  .explainer span {
    font: 8px monospace;
    letter-spacing: 1px;
    color: #a0a690;
  }

  .explainer h3 {
    font-size: 12px;
    font-weight: 500;
    margin: 11px 0 8px;
  }

  .explainer p {
    font-size: 11px;
    line-height: 1.8;
    color: #939a88;
    margin: 0;
  }

  details {
    border-top: 1px solid var(--color-line);
    border-bottom: 1px solid var(--color-line);
    padding: 20px 0;
    color: #7e8970;
  }

  details + details {
    border-top: 0;
  }

  summary {
    font-size: 11px;
    cursor: pointer;
    list-style: none;
    display: flex;
    justify-content: space-between;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  details p {
    font-size: 11px;
    line-height: 1.9;
    max-width: 830px;
  }

  details a {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (max-width: 850px) {
    .workspace {
      grid-template-columns: 1fr;
    }

    .explainer {
      gap: 20px;
    }
  }

  @media (max-width: 480px) {
    .explainer {
      grid-template-columns: 1fr;
      gap: 23px;
    }
  }
</style>
