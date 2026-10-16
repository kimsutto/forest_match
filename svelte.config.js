// 이 파일은 SvelteKit의 설정입니다.
// "정적 어댑터"를 써서, 빌드하면 서버 없이 아무 웹서버에나 올릴 수 있는
// HTML/JS/CSS 파일 묶음(build/ 폴더)이 나오게 합니다.
import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      // 빌드 결과가 들어갈 폴더 이름
      pages: "build",
      assets: "build",
      fallback: undefined,
    }),
  },
};

export default config;
