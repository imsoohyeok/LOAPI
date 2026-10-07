// 브라우저에서 파일을 내려받고 읽는 작은 도우미입니다. 서버를 거치지 않고 기기 안에서만 처리합니다.

// 메모리 속 데이터를 Blob으로 만들고, 그 Blob을 가리키는 임시 URL(blob:...)을
// download 속성이 있는 <a>로 클릭해서 파일로 저장하게 합니다.
export function downloadJson(fileName: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  // 일부 브라우저(Firefox 구버전)는 문서에 붙어 있지 않은 링크의 click을 무시합니다.
  document.body.appendChild(link);
  link.click();
  link.remove();
  // blob URL은 페이지를 떠날 때까지 Blob을 메모리에 붙잡아 두므로 직접 해제합니다.
  // 클릭과 같은 틱에 해제하면 다운로드가 시작되기 전에 URL이 사라지는 브라우저가 있어 한 틱 미룹니다.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// File.text()가 더 짧지만 jsdom(테스트 환경)에 없어서, 어디서나 동작하는 FileReader를 Promise로 감쌉니다.
export function readFileAsText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
