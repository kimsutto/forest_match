<script>
  // 모든 페이지의 공통 틀: 머리글(헤더) + 내용 + 바닥글(푸터).
  import "../app.css";
  import Header from "$lib/components/Header.svelte";
  import Footer from "$lib/components/Footer.svelte";

  let { children } = $props();
</script>

<Header />
<main>
  {@render children()}
</main>
<Footer />

<style>
  main {
    max-width: 1160px;
    margin: auto;
  }

  @media (max-width: 1240px) {
    main {
      margin-left: 5%;
      margin-right: 5%;
    }
  }
</style>
