<script>
  // "01 어떤 사진을 볼까요?" 패널.
  // 사진 끌어놓기/선택, 미리보기, 예시 사진 버튼, 비교 범위 선택,
  // "닮은 친구 찾기" 버튼까지 — 분석을 시작하기 전까지의 모든 입력을 담당합니다.
  // 실제 처리(검증·분석)는 부모가 넘겨준 함수(onchoose, onmatch 등)가 합니다.
  let {
    busy,
    supported,
    previewURL, // 다듬어진 사진의 미리보기 주소 ('' 이면 아직 없음)
    filename,
    scope = $bindable(),
    matchLabel,
    onchoose, // (파일 또는 주소, 표시할 이름) => 사진 선택 처리
    onclear, // () => 사진 지우기
    onmatch, // () => 분석 시작
    onscopechange, // () => 비교 범위가 바뀌었을 때
    statusArea, // 패널 아래쪽에 들어갈 상태 상자 (부모가 끼워 넣음)
  } = $props();

  let fileInput; // 숨겨진 <input type="file">
  let dragging = $state(false);

  function chooseFile() {
    const file = fileInput.files[0];
    if (file) onchoose(file, file.name);
    fileInput.value = "";
  }

  function drop(event) {
    event.preventDefault();
    dragging = false;
    if (busy) return;
    if (event.dataTransfer.files.length !== 1) {
      onchoose(null, "한 번에 사진 한 장을 선택해 주세요.");
      return;
    }
    const file = event.dataTransfer.files[0];
    onchoose(file, file.name);
  }

  function dragOver(event) {
    event.preventDefault();
    if (!busy) dragging = true;
  }
</script>

<div class="upload-panel">
  <div class="panel-heading">
    <span class="step">01</span>
    <h2>어떤 사진을 볼까요?</h2>
  </div>

  <input
    bind:this={fileInput}
    class="visually-hidden"
    type="file"
    accept="image/jpeg,image/png,image/webp"
    aria-label="사진 파일 선택"
    disabled={busy}
    onchange={chooseFile}
  />
  <button
    class="drop-zone"
    class:dragging
    type="button"
    aria-label="사진 업로드"
    disabled={busy}
    onclick={() => fileInput.click()}
    ondragenter={dragOver}
    ondragover={dragOver}
    ondragleave={() => (dragging = false)}
    ondrop={drop}
  >
    {#if previewURL}
      <img src={previewURL} alt="선택한 사진 미리보기" />
    {:else}
      <span>
        <span class="upload-icon" aria-hidden="true">↥</span>
        <strong>사진을 끌어놓거나 눌러주세요</strong>
        <span>JPG, PNG, WebP · 최대 12MB</span>
      </span>
    {/if}
  </button>

  <div class="photo-meta">
    <span>{filename}</span>
    {#if previewURL}
      <button class="quiet" onclick={onclear} disabled={busy}
        >사진 지우기 ×</button
      >
    {/if}
  </div>

  <div class="sample-row">
    <span>가볍게 시작하기</span>
    <button
      class="sample"
      disabled={busy}
      onclick={() => onchoose("/examples/cats.jpg", "고양이 예시 사진")}
    >
      <img src="/examples/cats.jpg" alt="" width="24" height="24" />고양이
    </button>
    <button
      class="sample"
      disabled={busy}
      onclick={() =>
        onchoose("/characters/373.webp", "잭슨 · 같은 이미지 찾기 테스트")}
    >
      <img src="/characters/373.webp" alt="" width="24" height="24" />잭슨
    </button>
    <button
      class="sample"
      disabled={busy}
      onclick={() =>
        onchoose("/characters/518.webp", "여울 · 같은 이미지 찾기 테스트")}
    >
      <img src="/characters/518.webp" alt="" width="24" height="24" />여울
    </button>
  </div>

  <label class="scope-label">
    비교할 친구들
    <select bind:value={scope} disabled={busy} onchange={onscopechange}>
      <option value="all">전체 · 566개 항목</option>
      <option value="villager">모든 시리즈 주민 · 490명</option>
      <option value="nh">모여봐요 주민 · 417명</option>
      <option value="special">특수 캐릭터 · 76개 항목</option>
    </select>
  </label>

  <button
    class="match-button"
    disabled={busy || !previewURL || !supported}
    onclick={onmatch}
  >
    <span>{matchLabel}</span><span class="match-arrow" aria-hidden="true"
      >↗</span
    >
  </button>

  <p class="download-note">
    첫 실행에는 AI 가중치 약 284MB와 추가 실행 파일을 내려받아요.<br />그다음
    사진 분석은 내 브라우저에서 이루어집니다.
  </p>

  {@render statusArea?.()}
</div>

<style>
  .upload-panel {
    min-width: 0;
    border: 1px solid var(--color-line);
    background: var(--color-surface);
    border-radius: 15px;
    padding: 27px;
  }

  .panel-heading {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 24px;
  }

  .step {
    font: 10px monospace;
    color: #979b90;
  }

  .panel-heading h2 {
    font-size: 16px;
    letter-spacing: -0.5px;
    margin: 0;
  }

  .drop-zone {
    display: flex;
    width: 100%;
    height: 265px;
    align-items: center;
    justify-content: center;
    padding: 0;
    overflow: hidden;
    background: #fbfbf6;
    border: 1.5px dashed #cdd0be;
    border-radius: 11px;
    transition:
      border-color 0.2s,
      background 0.2s;
  }

  .drop-zone:hover,
  .drop-zone.dragging {
    background: #f0f7ed;
    border-color: #6c9d7f;
  }

  .drop-zone img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: white;
  }

  .drop-zone > span {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 14px;
    color: #8a8f7a;
    font-size: 11px;
  }

  .drop-zone strong {
    font-size: 13px;
    font-weight: 500;
    color: #676d5d;
  }

  .upload-icon {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border: 1px solid #d7dccb;
    background: white;
    border-radius: 13px;
    font: 33px Georgia;
    color: #727a60;
    margin-bottom: 7px;
  }

  .photo-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin: 12px 0 20px;
    font-size: 10px;
    color: #92978a;
    min-height: 19px;
  }

  .photo-meta > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .quiet {
    border: 0;
    background: none;
    color: #7b806e;
    font-size: 10px;
    padding: 0;
    white-space: nowrap;
  }

  .sample-row {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
    font-size: 10px;
    color: #92978a;
    margin-bottom: 23px;
  }

  .sample-row > span {
    margin-right: auto;
  }

  .sample {
    display: flex;
    align-items: center;
    gap: 5px;
    border: 1px solid #e6e8df;
    background: white;
    border-radius: 20px;
    padding: 4px 8px;
    font-size: 10px;
    color: #616954;
  }

  .sample img {
    border-radius: 50%;
    object-fit: cover;
    background: #f4f4eb;
  }

  .scope-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    color: #697b65;
    gap: 10px;
    margin: 0 0 16px;
  }

  .scope-label select {
    font-size: 11px;
  }

  .match-button {
    width: 100%;
    border: 1px solid var(--color-primary);
    border-radius: 8px;
    color: #fff;
    padding: 17px 18px;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--color-primary);
  }

  .match-button:hover:not(:disabled) {
    background: #285c46;
  }

  .match-arrow {
    color: var(--color-accent);
    font-size: 20px;
    line-height: 14px;
  }

  .download-note {
    font-size: 10px;
    line-height: 1.8;
    color: #989d90;
    margin: 14px 0 20px;
  }

  @media (max-width: 850px) {
    .upload-panel {
      padding: 24px;
    }

    .drop-zone {
      height: 260px;
    }

    .sample-row > span {
      margin-right: 10px;
    }
  }

  @media (max-width: 480px) {
    .upload-panel {
      padding: 20px;
    }

    .panel-heading h2 {
      font-size: 14px;
    }

    .drop-zone {
      height: 230px;
    }

    .sample-row {
      gap: 5px;
    }

    .sample-row > span {
      margin-right: 3px;
    }

    .scope-label select {
      max-width: 75%;
      font-size: 10px;
    }
  }
</style>
