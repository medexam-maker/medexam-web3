import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { defineConfig } from 'vite';

function buildInfoPlugin() {
  return {
    name: 'build-info-plugin',
    closeBundle() {
      if (process.env.ANDROID_BUILD === 'true') {
        let commitHash = 'unknown';
        try {
          commitHash = execSync('git rev-parse HEAD', { stdio: 'pipe' }).toString().trim();
        } catch (e) {
          if (process.env.VITE_COMMIT_SHA) {
            commitHash = process.env.VITE_COMMIT_SHA;
          }
        }
        const info = {
          commitHash,
          timestamp: new Date().toISOString(),
          environment: 'production-android-bridge'
        };
        fs.writeFileSync('dist/build-info.json', JSON.stringify(info, null, 2));
      }
    }
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), buildInfoPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
