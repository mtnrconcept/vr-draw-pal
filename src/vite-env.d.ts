/// <reference types="vite/client" />

declare global {
  interface Window {
    THREE: typeof import('three') | any;
    cv: any;
  }
}

export {};
