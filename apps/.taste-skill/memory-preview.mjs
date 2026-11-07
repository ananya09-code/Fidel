import {build,preview} from '../web/node_modules/vite/dist/node/index.js';
import react from '../web/node_modules/@vitejs/plugin-react/dist/index.js';
import tailwind from '../web/node_modules/@tailwindcss/vite/dist/index.mjs';
import {resolve} from 'node:path';
const config={configFile:false,root:resolve('.taste-skill/memory-fixture'),define:{'import.meta.env.VITE_API_URL':JSON.stringify('http://127.0.0.1:8011')},resolve:{alias:{'zod':resolve('web/node_modules/zod'),'@':resolve('web/src'),'react':resolve('web/node_modules/react'),'react-dom':resolve('web/node_modules/react-dom'),'@tanstack/react-router':resolve('web/node_modules/@tanstack/react-router')}},plugins:[react(),tailwind()],build:{outDir:resolve('.taste-skill/memory-preview-build'),emptyOutDir:true},preview:{host:'127.0.0.1',port:4185,strictPort:true}};
await build(config);if(!process.argv.includes('--build-only')){const server=await preview(config);server.printUrls();}

