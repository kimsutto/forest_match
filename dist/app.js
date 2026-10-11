import { prepareImage } from './image.mjs';
import { inScope } from './match.mjs';

const $ = (id) => document.getElementById(id);
const supported = window.isSecureContext && Boolean(navigator.gpu);
const scopeLabels = {
  all: '전체 566개',
  villager: '주민 490명',
  nh: '모여봐요 417명',
  special: '특수 76개',
};
const pageSize = 24;
let worker, selected, previewURL;
let busy = false;
let catalog = [],
  page = 0;

function setStatus(message, state = '') {
  $('status').textContent = supported
    ? message
    : 'WebGPU를 사용할 수 없어요. 최신 Chrome 또는 Edge에서 HTTPS 주소나 localhost로 열어 주세요.';
  $('light').className = `light ${supported ? state : 'error'}`;
}

function setBusy(value) {
  busy = value;
  $('match').disabled = busy || !selected || !supported;
  for (const button of document.querySelectorAll('.catalog-card button'))
    button.disabled = busy;
  for (const id of [
    'drop-zone',
    'file',
    'sample-cat',
    'sample-villager',
    'sample-special',
    'scope',
    'clear',
  ]) {
    $(id).disabled = busy;
  }
}

function clearResults() {
  $('results').hidden = true;
  $('empty').hidden = false;
}

function clearPhoto() {
  selected = undefined;
  if (previewURL) URL.revokeObjectURL(previewURL);
  previewURL = undefined;
  $('preview').removeAttribute('src');
  $('preview').hidden = true;
  $('upload-prompt').hidden = false;
  $('clear').hidden = true;
  $('file').value = '';
  $('filename').textContent = '주인공이 크게 나온 사진이면 더 좋아요.';
  clearResults();
  setBusy(false);
  setStatus('사진을 선택하면 시작할 수 있어요.');
}

// Files, examples and catalog cards all enter through the same selection flow.
async function choose(source, name) {
  if (busy) return;
  setBusy(true);
  try {
    let blob = source;
    if (typeof source === 'string') {
      try {
        const response = await fetch(source);
        if (!response.ok) throw new Error();
        blob = await response.blob();
      } catch {
        throw new Error('예시 사진을 불러오지 못했어요. 다시 시도해 주세요.');
      }
    }
    const preview = await prepareImage(blob);
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = URL.createObjectURL(preview);
    selected = blob;
    $('preview').src = previewURL;
    $('preview').hidden = false;
    $('upload-prompt').hidden = true;
    $('clear').hidden = false;
    $('filename').textContent = name;
    clearResults();
    setStatus('사진 준비 완료 · 닮은 친구 찾기를 눌러 주세요.', 'ready');
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    $('file').value = '';
    setBusy(false);
  }
}

function fail(message) {
  worker?.terminate();
  worker = undefined;
  $('progress').hidden = true;
  $('match-label').textContent = '다시 찾아보기';
  setBusy(false);
  setStatus(`실행하지 못했어요. ${message}`, 'error');
}

function cloneCard(template) {
  return $(template).content.firstElementChild.cloneNode(true);
}

function renderResult({ results, count, ms }) {
  const [winner, ...others] = results;
  $('result-meta').textContent =
    `${count}개 항목 비교 완료 · ${(ms / 1000).toFixed(2)}초 · 사진 한 장의 작은 발견`;
  const best = $('best');
  best.querySelector('.best-score strong').textContent =
    winner.score.toFixed(3);
  best.querySelector('img').src = winner.image;
  best.querySelector('img').alt = winner.name;
  best.querySelector('.dex-no').textContent =
    winner.kind === 'special' ? 'SPECIAL FRIEND' : 'VILLAGER';
  best.querySelector('h3').textContent = winner.name;
  best.querySelector('.english').textContent = winner.english;
  best.querySelector('.types').replaceChildren(
    ...winner.types.map((type) => {
      const badge = document.createElement('span');
      badge.className = 'type';
      badge.textContent = type;
      return badge;
    }),
  );
  $('runners').replaceChildren(
    ...others.map((character, i) => {
      const card = cloneCard('runner-template');
      card.querySelector('span').textContent = `0${i + 2}`;
      card.querySelector('img').src = character.image;
      card.querySelector('img').alt = character.name;
      card.querySelector('h4').textContent = character.name;
      const score = card.querySelector('p');
      score.textContent = character.score.toFixed(3);
      score.setAttribute('aria-label', `유사도 ${score.textContent}`);
      return card;
    }),
  );
  $('results').hidden = false;
  $('empty').hidden = true;
}

function createWorker() {
  const instance = new Worker(new URL('./worker.js', import.meta.url), {
    type: 'module',
  });
  instance.onerror = (event) =>
    fail(
      event.message ||
        '실행 파일을 불러오지 못했습니다. 네트워크를 확인해 주세요.',
    );
  instance.onmessage = ({ data }) => {
    switch (data.type) {
      case 'status':
        $('progress').hidden = true;
        setStatus(data.message, 'loading');
        break;
      case 'download': {
        const percent = Math.max(0, Math.min(100, data.progress || 0));
        $('progress').hidden = false;
        $('progress').value = percent;
        const size = data.total
          ? ` (${(data.loaded / 1e6).toFixed(0)}/${(data.total / 1e6).toFixed(0)}MB)`
          : '';
        setStatus(
          `AI 다운로드 · ${data.file} · ${percent.toFixed(0)}%${size}`,
          'loading',
        );
        break;
      }
      case 'error':
        fail(data.message);
        break;
      case 'results':
        $('progress').hidden = true;
        $('match-label').textContent = '다시 비교하기';
        renderResult(data);
        setBusy(false);
        setStatus(
          `WebGPU 분석 완료 · ${(data.ms / 1000).toFixed(2)}초 · 사진은 전송되지 않았어요.`,
          'ready',
        );
        break;
    }
  };
  return instance;
}

function match() {
  if (busy || !selected || !supported) return;
  setBusy(true);
  clearResults();
  $('match-label').textContent = '닮은꼴을 찾는 중…';
  setStatus('AI를 준비하고 사진을 비교하고 있어요…', 'loading');
  try {
    worker ??= createWorker();
    worker.postMessage({
      type: 'match',
      blob: selected,
      scope: $('scope').value,
    });
  } catch (error) {
    fail(error.message);
  }
}

function catalogCard(item) {
  const card = cloneCard('catalog-template');
  const button = card.querySelector('button');
  button.disabled = busy;
  button.setAttribute('aria-label', `${item.name} 이미지로 시험하기`);
  card.querySelector('img').src = item.image;
  card.querySelector('strong').textContent = item.name;
  card.querySelector('small').textContent = item.types.join(' · ');
  button.onclick = async () => {
    if (busy) return;
    await choose(item.image, `${item.name} · 도감 이미지`);
    $('drop-zone').scrollIntoView({
      block: 'center',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  };
  const source = card.querySelector('a');
  source.href = item.imagePage;
  source.setAttribute('aria-label', `${item.name} 이미지 출처`);
  return card;
}

function renderCatalog() {
  const query = $('catalog-search').value.trim().toLocaleLowerCase();
  const filtered = catalog.filter((item) => {
    const names = [
      item.name,
      item.english,
      item.japanese || '',
      item.aliases || '',
      ...item.types,
    ];
    return (
      inScope(item, $('catalog-filter').value) &&
      names.join(' ').toLocaleLowerCase().includes(query)
    );
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  page = Math.min(page, pages - 1);
  const start = page * pageSize;
  $('catalog-count').textContent = filtered.length
    ? `${filtered.length}개 항목 · ${start + 1}–${Math.min(start + pageSize, filtered.length)} 표시`
    : '일치하는 친구가 없어요. 다른 이름이나 종류로 검색해 보세요.';
  $('page-label').textContent = `${page + 1} / ${pages}`;
  $('previous').disabled = page === 0;
  $('next').disabled = page + 1 === pages;
  $('catalog-grid').replaceChildren(
    ...filtered.slice(start, start + pageSize).map(catalogCard),
  );
}

// UI events
$('drop-zone').onclick = () => $('file').click();
$('file').onchange = () => {
  const file = $('file').files[0];
  if (file) choose(file, file.name);
};
$('clear').onclick = clearPhoto;
for (const event of ['dragenter', 'dragover']) {
  $('drop-zone').addEventListener(event, (e) => {
    e.preventDefault();
    if (!busy) $('drop-zone').classList.add('dragging');
  });
}
$('drop-zone').ondragleave = () => $('drop-zone').classList.remove('dragging');
$('drop-zone').ondrop = (event) => {
  event.preventDefault();
  $('drop-zone').classList.remove('dragging');
  if (busy) return;
  if (event.dataTransfer.files.length !== 1) {
    setStatus('한 번에 사진 한 장을 선택해 주세요.', 'error');
    return;
  }
  const file = event.dataTransfer.files[0];
  choose(file, file.name);
};
$('sample-cat').onclick = () =>
  choose('./examples/cats.jpg', '고양이 예시 사진');
$('sample-villager').onclick = () =>
  choose('./characters/373.webp', '잭슨 · 같은 이미지 찾기 테스트');
$('sample-special').onclick = () =>
  choose('./characters/518.webp', '여울 · 같은 이미지 찾기 테스트');
$('match').onclick = match;
$('scope').onchange = () => {
  clearResults();
  $('scope-pill').textContent = scopeLabels[$('scope').value];
  setStatus('비교 범위를 바꿨어요. 찾기를 눌러 다시 비교해 보세요.');
};
$('catalog-search').oninput = $('catalog-filter').onchange = () => {
  page = 0;
  renderCatalog();
};
$('previous').onclick = () => {
  page--;
  renderCatalog();
};
$('next').onclick = () => {
  page++;
  renderCatalog();
};

setBusy(false);
setStatus('사진을 선택하면 시작할 수 있어요.');
try {
  const response = await fetch('./characters.json');
  if (!response.ok) throw new Error();
  catalog = await response.json();
  renderCatalog();
} catch {
  $('catalog-count').textContent =
    '도감을 불러오지 못했어요. 네트워크 연결을 확인한 뒤 새로고침해 주세요.';
}
