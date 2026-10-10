import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./tests/e2e',
  testMatch:['next.spec.ts'],
  timeout:45000,
  expect:{timeout:12000},
  fullyParallel:false,
  retries:process.env.CI?1:0,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://127.0.0.1:4173',screenshot:'only-on-failure',trace:'retain-on-failure',video:'off'},
  projects:[
    {name:'iPhone Safari (WebKit)',use:{...devices['iPhone 14'],viewport:{width:390,height:844}}},
    {name:'compact Android (Chromium)',use:{...devices['Pixel 5'],viewport:{width:360,height:800}}},
    {name:'Desktop (Chromium)',use:{...devices['Desktop Chrome'],viewport:{width:1366,height:900}}},
  ],
  webServer:{command:'npm run dev -- --host 127.0.0.1 --port 4173',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:120000},
});
