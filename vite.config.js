import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 部署在 https://<user>.github.io/zhaiwu/ 子路径下
// 因此 base 必须与仓库名一致，否则 JS/CSS 会 404
export default defineConfig({
  base: '/zhaiwu/',
  plugins: [vue()],
  build: {
    // 构建产物输出到 docs 目录，GitHub Pages 选择 main 分支 /docs 即可
    outDir: 'docs',
    emptyOutDir: true
  }
})
