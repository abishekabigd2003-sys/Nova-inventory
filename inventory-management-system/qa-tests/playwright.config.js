import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../backend/admin-service/.env') });
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['github'], ['html']],
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5000',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
