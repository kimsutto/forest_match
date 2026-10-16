<script>
  // 페이지 맨 위의 머리글: 로고와 "사진은 내 브라우저에만" 배지.
</script>

<header>
  <a href="./" class="brand">
    <span class="leaf" aria-hidden="true">❧</span>FOREST MATCH<span
      class="brand-sub">숲속 닮은꼴</span
    >
  </a>
  <span class="local-badge"><i></i> 사진은 내 브라우저에만</span>
</header>

<style>
  header {
    max-width: 1160px;
    margin: auto;
    height: 88px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-line);
  }

  .brand {
    display: flex;
    gap: 12px;
    align-items: center;
    font-size: 15px;
    font-weight: 900;
    letter-spacing: 1px;
    color: #2f6953;
  }

  .brand-sub {
    font-size: 11px;
    letter-spacing: 0;
    font-weight: 500;
    color: #8d9086;
    border-left: 1px solid var(--color-line);
    padding-left: 12px;
  }

  .leaf {
    font-size: 37px;
    line-height: 1;
    color: #46896a;
    transform: rotate(-25deg);
  }

  .local-badge {
    font-size: 11px;
    color: #6b7766;
    display: flex;
    gap: 7px;
    align-items: center;
  }

  .local-badge i {
    width: 6px;
    height: 6px;
    background: var(--color-primary);
    border-radius: 50%;
  }

  @media (max-width: 1240px) {
    header {
      margin-left: 5%;
      margin-right: 5%;
    }
  }

  @media (max-width: 480px) {
    header {
      height: 70px;
    }

    .brand-sub {
      display: none;
    }

    .brand {
      font-size: 13px;
    }

    .local-badge {
      font-size: 9px;
    }
  }
</style>
