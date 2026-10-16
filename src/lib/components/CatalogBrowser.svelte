<script>
  // 도감 섹션: 566개 캐릭터를 검색·분류·페이지로 넘겨 보고,
  // 카드를 누르면 그 캐릭터 이미지로 매칭을 시험할 수 있습니다.
  import { inScope } from "$lib/matching/match.js";

  let { catalog, loadError, busy, onpick } = $props();

  const PAGE_SIZE = 24; // 한 페이지에 보여줄 카드 수

  let query = $state(""); // 검색어
  let filter = $state("all"); // 분류 (전체/주민/NH/특수)
  let page = $state(0); // 현재 페이지 (0부터)

  // 검색어와 분류에 맞는 캐릭터만 추립니다.
  const filtered = $derived(
    catalog.filter((item) => {
      const names = [
        item.name,
        item.english,
        item.japanese || "",
        item.aliases || "",
        ...item.types,
      ];
      const matchesQuery = names
        .join(" ")
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase());
      return inScope(item, filter) && matchesQuery;
    }),
  );

  const pageCount = $derived(
    Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
  );
  const safePage = $derived(Math.min(page, pageCount - 1));
  const start = $derived(safePage * PAGE_SIZE);
  const shown = $derived(filtered.slice(start, start + PAGE_SIZE));

  function resetPage() {
    page = 0;
  }
</script>

<section class="catalog-section">
  <div class="catalog-title">
    <div>
      <p class="eyebrow">MEET EVERYONE</p>
      <h2>모든 친구가 비교 대상이에요.</h2>
    </div>
    <span class="catalog-total">주민 490명 + 특수 캐릭터 76개 항목</span>
  </div>
  <p class="catalog-description">
    초기 시리즈부터 모여봐요 3.0까지. 콜라보 주민, 떠나간 주민, 너굴과 여울도
    함께 있어요.
  </p>

  <div class="catalog-toolbar">
    <input
      type="search"
      placeholder="이름이나 동물 종류로 찾아보기"
      aria-label="캐릭터 검색"
      bind:value={query}
      oninput={resetPage}
    />
    <select aria-label="도감 분류" bind:value={filter} onchange={resetPage}>
      <option value="all">전체 도감</option>
      <option value="villager">일반 주민</option>
      <option value="nh">모여봐요 주민</option>
      <option value="special">특수 캐릭터</option>
    </select>
  </div>

  <p class="catalog-count" role="status">
    {#if loadError}
      도감을 불러오지 못했어요. 네트워크 연결을 확인한 뒤 새로고침해 주세요.
    {:else if catalog.length === 0}
      도감을 불러오는 중…
    {:else if filtered.length === 0}
      일치하는 친구가 없어요. 다른 이름이나 종류로 검색해 보세요.
    {:else}
      {filtered.length}개 항목 · {start + 1}–{Math.min(
        start + PAGE_SIZE,
        filtered.length,
      )} 표시
    {/if}
  </p>

  <div class="catalog-grid">
    {#each shown as item (item.id)}
      <article class="catalog-card">
        <button
          type="button"
          disabled={busy}
          aria-label="{item.name} 이미지로 시험하기"
          onclick={() => onpick(item)}
        >
          <img src={item.image} alt="" loading="lazy" width="92" height="92" />
          <strong>{item.name}</strong>
          <small>{item.types.join(" · ")}</small>
        </button>
        <a
          href={item.imagePage}
          target="_blank"
          rel="noreferrer"
          aria-label="{item.name} 이미지 출처">이미지 출처 ↗</a
        >
      </article>
    {/each}
  </div>

  <div class="catalog-pagination">
    <button disabled={safePage === 0} onclick={() => (page = safePage - 1)}
      >← 이전</button
    >
    <span>{safePage + 1} / {pageCount}</span>
    <button
      disabled={safePage + 1 === pageCount}
      onclick={() => (page = safePage + 1)}>다음 →</button
    >
  </div>
  <p class="catalog-description">
    카드를 누르면 해당 캐릭터 이미지로 매칭을 시험할 수 있어요. 도감 검색과 위의
    비교 범위는 별도로 설정됩니다.
  </p>
</section>

<style>
  .catalog-section {
    margin-top: 48px;
    padding: 30px;
    background: #f0f3e7;
    border: 1px solid #dfe6d4;
    border-radius: 16px;
    scroll-margin-top: 20px;
  }

  .eyebrow {
    font-size: 9px;
    letter-spacing: 1.8px;
    font-weight: 700;
    color: #8b8e78;
  }

  .catalog-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
  }

  .catalog-title h2 {
    font-size: 22px;
    letter-spacing: -0.7px;
    margin: 10px 0;
  }

  .catalog-total {
    color: #69906a;
    font-size: 11px;
  }

  .catalog-description {
    font-size: 11px;
    color: #7b8970;
    line-height: 1.9;
  }

  .catalog-toolbar {
    display: flex;
    gap: 10px;
    margin-top: 24px;
  }

  .catalog-toolbar input {
    font: inherit;
    font-size: 12px;
    border: 1px solid #d4dec8;
    border-radius: 8px;
    padding: 12px 14px;
    flex: 1;
    min-width: 0;
    background: #fffefa;
    color: #354c3a;
  }

  .catalog-toolbar select {
    font-size: 12px;
  }

  .catalog-count {
    font-size: 11px;
    color: #718565;
    margin: 16px 0;
  }

  .catalog-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 12px;
  }

  .catalog-card {
    min-width: 0;
    border: 1px solid #e0e8d6;
    background: #fffef9;
    border-radius: 11px;
    padding: 6px;
    transition: transform 0.15s;
  }

  .catalog-card:hover {
    transform: translateY(-3px);
  }

  .catalog-card button {
    width: 100%;
    background: none;
    border: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 3px 6px;
    color: #40523c;
    min-height: 150px;
  }

  .catalog-card img {
    width: 92px;
    height: 92px;
    object-fit: contain;
    margin-bottom: 10px;
  }

  .catalog-card strong {
    font-size: 12px;
    overflow-wrap: anywhere;
  }

  .catalog-card small {
    font-size: 9px;
    color: #87957d;
    margin-top: 5px;
  }

  .catalog-card a {
    display: block;
    text-align: center;
    font-size: 9px;
    color: #94a18a;
    padding: 4px;
  }

  .catalog-card a:hover {
    text-decoration: underline;
  }

  .catalog-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin: 24px 0 15px;
    color: #7d8d70;
    font-size: 11px;
  }

  .catalog-pagination button {
    border: 1px solid #d0dcc3;
    background: #fffefa;
    color: #617c50;
    border-radius: 7px;
    padding: 8px 14px;
  }

  @media (max-width: 850px) {
    .catalog-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .catalog-title {
      align-items: flex-start;
      flex-direction: column;
      gap: 0;
    }
  }

  @media (max-width: 480px) {
    .catalog-section {
      padding: 20px;
      margin-top: 30px;
    }

    .catalog-title h2 {
      font-size: 20px;
    }

    .catalog-toolbar {
      flex-direction: column;
    }

    .catalog-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 7px;
    }

    .catalog-card img {
      width: 75px;
      height: 85px;
    }

    .catalog-card button {
      min-height: 146px;
    }

    .catalog-card strong {
      font-size: 10px;
    }

    .catalog-card small {
      font-size: 8px;
    }

    .catalog-card a {
      font-size: 8px;
    }
  }
</style>
