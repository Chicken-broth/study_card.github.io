import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // テスト環境を 'jsdom' に設定することで、
    // テストコード内で `window` などのブラウザAPIが使えるようになります。
    environment: 'jsdom',
  },
});
