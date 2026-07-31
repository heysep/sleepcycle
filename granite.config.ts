import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // src/config.ts APP_NAME과 문자 단위 동일. 딥링크 intoss://sleepcycle.
  appName: 'sleepcycle',
  brand: {
    displayName: '꿀잠 사이클',
    primaryColor: '#1E3A8A',
    // ⚠️ 콘솔에 아이콘 업로드 후 발급되는 static.toss.im URL로 교체할 것 (로컬 경로 금지)
    icon: 'https://static.toss.im/appsintoss/61245/835dc47a-9e69-4673-b3d0-8b01848436a5.png',
  },
  web: { host: 'localhost', port: 4739, commands: { dev: 'vite', build: 'vite build' } },
  permissions: [],
  outdir: 'dist',
});
