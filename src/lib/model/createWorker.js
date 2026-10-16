// 이 파일이 하는 일:
// 화면 쪽 코드가 작업 스레드(worker.js)를 만들 때 쓰는 작은 도우미입니다.
// Vite가 이 특별한 문법(new URL + import.meta.url)을 보고
// worker.js를 따로 묶어서(bundle) 올바른 주소로 연결해 줍니다.
export function createMatchWorker() {
  return new Worker(new URL("./worker.js", import.meta.url), {
    type: "module",
  });
}
