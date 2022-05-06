import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import Unocss from "unocss/vite"
import { presetAttributify, presetUno, presetWind } from "unocss"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Unocss({
      presets: [
        presetAttributify({}),
        presetUno(),
        presetWind()
      ]
    }),
    vue()
  ]
})
