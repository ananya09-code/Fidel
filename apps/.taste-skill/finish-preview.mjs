import {build,preview} from '../web/node_modules/vite/dist/node/index.js';
import react from '../web/node_modules/@vitejs/plugin-react/dist/index.js';
import tailwind from '../web/node_modules/@tailwindcss/vite/dist/index.mjs';
import {resolve} from 'node:path';
const config={configFile:false,root:resolve('.taste-skill/finish-fixture'),resolve:{alias:{'@':resolve('web/src'),'react':resolve('web/node_modules/react'),'react-dom':resolve('web/node_modules/react-dom'),'@tanstack/react-router':resolve('web/node_modules/@tanstack/react-router')}},plugins:[react(),tailwind()],build:{outDir:resolve('.taste-skill/finish-preview-build'),emptyOutDir:true},preview:{host:'127.0.0.1',port:4184,strictPort:true}};
await build(config); const server=await preview(config);server.printUrls();

