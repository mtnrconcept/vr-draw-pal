/// <reference types="vite/client" />

declare global {
  interface Window {
    THREE: typeof import('three');
    THREEx: any;
  }
}
