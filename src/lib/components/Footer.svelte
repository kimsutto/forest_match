<script>
  // 페이지 맨 아래 바닥글: 팬 실험 고지와 자료 출처 링크.
</script>

<footer>
  <div>
    <b>FOREST MATCH</b>
    <p>비공식 팬 실험 · Animal Crossing © Nintendo. Nintendo와 무관합니다.</p>
  </div>
  <nav aria-label="자료 출처">
    <a
      href="https://nookipedia.com/wiki/List_of_villagers"
      target="_blank"
      rel="noreferrer">Nookipedia ↗</a
    >
    <a
      href="https://huggingface.co/onnx-community/embeddinggemma-2-ONNX"
      target="_blank"
      rel="noreferrer">EmbeddingGemma 2 ↗</a
    >
    <a
      href="https://huggingface.co/datasets/Xenova/transformers.js-docs"
      target="_blank"
      rel="noreferrer">고양이 예시 출처 ↗</a
    >
  </nav>
</footer>

<style>
  footer {
    max-width: 1160px;
    margin: auto;
    display: flex;
    justify-content: space-between;
    gap: 25px;
    padding: 28px 0 30px;
    color: #a5aa9b;
  }

  footer b {
    font-size: 11px;
    letter-spacing: 1px;
    font-weight: 700;
    color: #859174;
  }

  footer p {
    font-size: 9px;
    margin: 9px 0 0;
  }

  footer nav {
    display: flex;
    gap: 16px;
    align-items: center;
    font-size: 9px;
  }

  @media (max-width: 1240px) {
    footer {
      margin-left: 5%;
      margin-right: 5%;
    }
  }

  @media (max-width: 850px) {
    footer {
      flex-direction: column;
    }

    footer nav {
      flex-wrap: wrap;
    }
  }
</style>
