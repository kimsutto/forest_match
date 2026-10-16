<script>
  // 지금 무슨 일이 일어나는지 보여주는 상태 상자.
  // 작은 점(불빛) 색으로 상태를 표시하고, 다운로드 중에는 진행 막대를 보여줍니다.
  //   kind: ''(기본) | 'loading'(작업 중) | 'ready'(준비됨) | 'error'(문제 발생)
  let { supported, message, kind, progress } = $props();

  // WebGPU를 못 쓰는 브라우저에서는 어떤 상태든 안내 문구로 바꿔 보여줍니다.
  const shownMessage = $derived(
    supported
      ? message
      : "WebGPU를 사용할 수 없어요. 최신 Chrome 또는 Edge에서 HTTPS 주소나 localhost로 열어 주세요.",
  );
  const shownKind = $derived(supported ? kind : "error");
</script>

<div class="runtime" aria-live="polite">
  <span class="light {shownKind}"></span>
  <p class:error={shownKind === "error"}>{shownMessage}</p>
  {#if progress !== null}
    <progress max="100" value={progress} aria-label="현재 파일 다운로드 진행률"
    ></progress>
  {/if}
</div>

<style>
  .runtime {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    background: #f4f5ed;
    border-radius: 7px;
    min-height: 45px;
    padding: 12px;
    position: relative;
    overflow: hidden;
  }

  .runtime:has(.error) {
    background: #fcf0ed;
  }

  .runtime p {
    font-size: 10px;
    color: #79836b;
    line-height: 1.5;
    margin: 0;
    overflow-wrap: anywhere;
  }

  .runtime p.error {
    color: #a44738;
  }

  .light {
    width: 5px;
    height: 5px;
    flex: 0 0 5px;
    border-radius: 50%;
    background: #a0a895;
    margin-top: 4px;
  }

  .light.loading {
    background: #ae8a12;
    animation: pulse 1s infinite alternate;
  }

  .light.ready {
    background: #46946a;
  }

  .light.error {
    background: #bd5042;
  }

  progress {
    appearance: none;
    height: 3px;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    border: 0;
  }

  progress::-webkit-progress-bar {
    background: #e5e7da;
  }

  progress::-webkit-progress-value {
    background: #b89d30;
  }

  @media (prefers-reduced-motion: reduce) {
    .light.loading {
      animation: none;
    }
  }

  @keyframes pulse {
    to {
      opacity: 0.25;
    }
  }
</style>
