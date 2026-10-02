// TypeScript 6부터 noUncheckedSideEffectImports가 기본 활성화되어
// import "./globals.css" 같은 사이드이펙트 import에도 타입 선언이 필요하다.
declare module "*.css";
