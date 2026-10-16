// 이 파일은 빌드 도구(Vite)의 설정입니다.
// SvelteKit 플러그인을 켜고, 테스트 도구(Vitest)가 읽을 설정도 함께 둡니다.
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  optimizeDeps: {
    // AI 라이브러리를 서버 시작 때 미리 준비해 둡니다.
    // 안 그러면 첫 분석 버튼을 누르는 순간 페이지가 한 번 새로고침됩니다.
    include: ["@huggingface/transformers"],
  },
  test: {
    // src 안의 *.test.js 파일을 테스트로 실행합니다.
    include: ["src/**/*.test.js"],
  },
});
