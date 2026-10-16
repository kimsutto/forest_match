<script>
  // "02 나의 숲속 닮은꼴" 패널.
  // 결과가 없으면 빈 화면(친구들이 떠 있는 그림)을, 결과가 있으면
  // 1위 큰 카드 + 2~5위 작은 카드를 보여줍니다.
  let { scopeLabel, result } = $props();

  // 1위와 나머지(2~5위)를 나눠 둡니다.
  const winner = $derived(result?.results[0]);
  const others = $derived(result ? result.results.slice(1) : []);
</script>

<div class="result-panel">
  <div class="panel-heading">
    <span class="step">02</span>
    <h2>나의 숲속 닮은꼴</h2>
    <span class="pill">{scopeLabel}</span>
  </div>

  {#if !result}
    <div class="empty">
      <div class="orbit" aria-hidden="true"></div>
      <img class="friend friend-top" src="/characters/518.webp" alt="여울" />
      <img class="friend friend-left" src="/characters/373.webp" alt="잭슨" />
      <img class="friend friend-right" src="/characters/429.webp" alt="패치" />
      <div class="empty-copy">
        <span class="sparkle">✳</span>
        <h3>우리, 같은 섬에서 만났나요?</h3>
        <p>사진과 닮은 친구 TOP 5가 여기 나타나요.</p>
      </div>
    </div>
  {:else}
    <div aria-live="polite">
      <p class="result-meta">
        {result.count}개 항목 비교 완료 · {(result.ms / 1000).toFixed(2)}초 ·
        사진 한 장의 작은 발견
      </p>
      <article class="best-card">
        <div class="winner-label">YOUR CLOSEST MATCH<b>01</b></div>
        <div class="best-score">
          유사도<strong>{winner.score.toFixed(3)}</strong>
        </div>
        <img src={winner.image} alt={winner.name} />
        <p class="dex-no">
          {winner.kind === "special" ? "SPECIAL FRIEND" : "VILLAGER"}
        </p>
        <h3>{winner.name}</h3>
        <p class="english">{winner.english}</p>
        <div class="types">
          {#each winner.types as type (type)}
            <span class="type">{type}</span>
          {/each}
        </div>
      </article>
      <div class="runner-heading">
        이 친구들도 닮았어요 <span>02 — 05</span>
      </div>
      <div class="runners">
        {#each others as character, i (character.id)}
          <article class="runner">
            <span>0{i + 2}</span>
            <img src={character.image} alt={character.name} />
            <h4>{character.name}</h4>
            <p aria-label="유사도 {character.score.toFixed(3)}">
              {character.score.toFixed(3)}
            </p>
          </article>
        {/each}
      </div>
      <p class="score-note">
        유사도는 이미지 특징의 가까운 정도예요. 정답 확률이나 외모 점수가
        아닙니다.
      </p>
    </div>
  {/if}
</div>

<style>
  .result-panel {
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

  .pill {
    margin-left: auto;
    border: 1px solid var(--color-line);
    border-radius: 20px;
    font-size: 9px;
    padding: 5px 8px;
    color: #7b8270;
  }

  .empty {
    position: relative;
    overflow: hidden;
    border-radius: 9px;
    min-height: 588px;
    background: radial-gradient(circle at 50% 39%, #eef5e4, transparent 70%);
  }

  .orbit {
    position: absolute;
    border: 1px dashed #c1d5b9;
    border-radius: 50%;
    left: 50%;
    transform: translateX(-50%);
    top: 60px;
    background: #f1f6e944;
    width: 330px;
    height: 330px;
  }

  .friend {
    position: absolute;
    object-fit: contain;
    filter: drop-shadow(0 12px 9px #282b2110);
  }

  .friend-top {
    width: 175px;
    left: 50%;
    transform: translateX(-50%) rotate(-9deg);
    height: 190px;
    top: 25px;
  }

  .friend-left {
    width: 168px;
    left: 5%;
    transform: rotate(-10deg);
    height: 190px;
    top: 210px;
  }

  .friend-right {
    width: 180px;
    right: 2%;
    transform: rotate(8deg);
    height: 175px;
    top: 223px;
  }

  .empty-copy {
    position: absolute;
    left: 0;
    width: 100%;
    text-align: center;
    color: #717c5f;
    bottom: 33px;
  }

  .sparkle {
    color: #a4ac8e;
    font-size: 28px;
  }

  .empty-copy h3 {
    font-size: 16px;
    font-weight: 500;
    margin: 13px 0;
  }

  .empty-copy p {
    font-size: 11px;
    color: #969e89;
  }

  .result-meta {
    font-size: 10px;
    color: #8c927f;
    margin: -8px 0 18px;
  }

  .best-card {
    position: relative;
    border: 1px solid #d1e2c2;
    border-radius: 11px;
    padding: 19px 20px;
    text-align: center;
    overflow: hidden;
    background: #eef6e6;
  }

  .winner-label {
    position: absolute;
    left: 17px;
    top: 17px;
    font-size: 9px;
    letter-spacing: 1px;
    color: #739463;
  }

  .winner-label b {
    display: block;
    text-align: left;
    font-size: 25px;
    margin-top: 5px;
    color: #437d58;
  }

  .best-card img {
    object-fit: contain;
    filter: drop-shadow(0 10px 7px #594d0712);
    height: 225px;
    width: 205px;
  }

  .dex-no {
    font: 9px monospace;
    letter-spacing: 1px;
    margin: 0 0 5px;
    color: #739463;
  }

  .best-card h3 {
    font-size: 26px;
    margin: 3px 0 5px;
    letter-spacing: -1px;
  }

  .english {
    font-size: 10px;
    margin: 0 0 12px;
    color: #739463;
  }

  .types {
    display: flex;
    gap: 5px;
    justify-content: center;
  }

  .type {
    border-radius: 20px;
    padding: 4px 8px;
    background: #fff9;
    font-size: 9px;
    color: #52764b;
  }

  .best-score {
    position: absolute;
    right: 17px;
    top: 17px;
    text-align: right;
    font-size: 9px;
    color: #739463;
  }

  .best-score strong {
    display: block;
    font: 20px monospace;
    margin-top: 5px;
    color: #437d58;
  }

  .runner-heading {
    font-size: 11px;
    color: #697459;
    display: flex;
    justify-content: space-between;
    margin: 23px 0 11px;
  }

  .runner-heading span {
    font: 9px monospace;
    color: #a2a796;
  }

  .runners {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .runner {
    padding: 9px 5px 11px;
    border: 1px solid #e8eadf;
    border-radius: 8px;
    background: #fafbf7;
    text-align: center;
    min-width: 0;
  }

  .runner > span {
    display: block;
    text-align: left;
    color: #a4ab96;
    font: 9px monospace;
    margin-left: 4px;
  }

  .runner img {
    width: 75px;
    height: 75px;
    object-fit: contain;
  }

  .runner h4 {
    font-size: 11px;
    margin: 1px 0 7px;
    overflow-wrap: anywhere;
  }

  .runner p {
    font: 10px monospace;
    color: #939d84;
    margin: 0;
  }

  .score-note {
    font-size: 9px;
    color: #a2a796;
    line-height: 1.8;
    margin: 17px 0 0;
  }

  @media (max-width: 850px) {
    .result-panel {
      padding: 24px;
    }

    .empty {
      min-height: 510px;
    }

    .friend-left {
      top: 175px;
    }

    .friend-right {
      top: 190px;
    }
  }

  @media (max-width: 480px) {
    .result-panel {
      padding: 20px;
    }

    .panel-heading h2 {
      font-size: 14px;
    }

    .pill {
      font-size: 8px;
    }

    .runners {
      gap: 5px;
    }

    .runner img {
      height: 59px;
      width: 59px;
    }

    .runner h4 {
      font-size: 10px;
    }

    .empty {
      min-height: 450px;
    }

    .empty .friend {
      width: 140px;
      height: 140px;
    }

    .empty .friend-top {
      top: 22px;
      height: 170px;
    }

    .empty .friend-right {
      right: 0;
      top: 183px;
    }

    .empty .friend-left {
      left: 0;
      top: 170px;
    }

    .orbit {
      width: 245px;
      height: 270px;
    }

    .empty-copy {
      bottom: 18px;
    }

    .best-card img {
      height: 195px;
    }

    .best-card h3 {
      font-size: 23px;
    }

    .best-score strong {
      font-size: 17px;
    }
  }
</style>
