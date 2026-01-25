/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  // 如需添加更多环境变量，在此处定义
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
