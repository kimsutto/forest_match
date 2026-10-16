<script>
  // 첫 화면 인사 영역: 제목, 소개 문구, "566 FOREST FRIENDS" 도장.
</script>

<section class="intro">
  <p class="eyebrow">A PHOTO. A LITTLE FOREST. A FAMILIAR FRIEND.</p>
  <h1>동물의 숲에 산다면,<br />나는 <span>어떤 친구?</span></h1>
  <p class="lede">
    우리 집 고양이부터 오늘의 셀카까지.<br />사진 한 장에서 나와 닮은 숲속
    친구를 만나보세요.
  </p>
  <div class="intro-stamp">ALL SERIES<br /><b>566</b><br />FOREST FRIENDS</div>
</section>

<style>
  .intro {
    position: relative;
    padding: 42px 0 34px;
  }

  .eyebrow {
    font-size: 9px;
    letter-spacing: 1.8px;
    font-weight: 700;
    color: #8b8e78;
  }

  h1 {
    font-size: 48px;
    line-height: 1.18;
    letter-spacing: -2.6px;
    margin: 18px 0;
  }

  h1 span {
    position: relative;
    z-index: 0;
  }

  /* 제목 일부에 연한 녹색 형광펜을 비스듬히 칠한 효과 */
  h1 span:after {
    content: "";
    position: absolute;
    background: var(--color-accent);
    width: 105%;
    height: 19px;
    bottom: 2px;
    left: -3px;
    z-index: -1;
    transform: rotate(-3deg);
  }

  .lede {
    font-size: 13px;
    line-height: 1.8;
    color: #777b6d;
  }

  .intro-stamp {
    position: absolute;
    right: 32px;
    top: 64px;
    width: 115px;
    height: 115px;
    border: 1px solid #b7cda9;
    border-radius: 50%;
    text-align: center;
    padding: 20px 10px;
    font-size: 8px;
    letter-spacing: 1px;
    transform: rotate(12deg);
    background: #edf4e3;
    color: #6d8c66;
  }

  .intro-stamp b {
    font-size: 37px;
    line-height: 1.1;
    letter-spacing: -1px;
    color: #42775c;
  }

  @media (max-width: 850px) {
    .intro-stamp {
      right: 10px;
    }
  }

  @media (max-width: 480px) {
    .intro {
      padding: 33px 0 27px;
    }

    h1 {
      font-size: 36px;
      letter-spacing: -2px;
    }

    .lede {
      font-size: 11px;
    }

    .eyebrow {
      font-size: 7px;
      letter-spacing: 1px;
    }

    .intro-stamp {
      position: static;
      margin-top: 20px;
      width: auto;
      height: auto;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      transform: none;
      padding: 6px 13px;
      font-size: 6px;
    }

    .intro-stamp b {
      font-size: 16px;
    }

    .intro-stamp :global(br) {
      display: none;
    }
  }
</style>
