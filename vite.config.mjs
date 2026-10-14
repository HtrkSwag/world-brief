import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import tailwindcss from '@tailwindcss/postcss';
export default defineConfig({base:'./',resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},esbuild:{jsx:'automatic'},css:{postcss:{plugins:[tailwindcss()]}},build:{outDir:'dist',emptyOutDir:true}});
