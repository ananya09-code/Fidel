import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
mkdirSync('.taste-skill/finish-fixture',{recursive:true});
writeFileSync('.taste-skill/finish-fixture/index.html','<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fidel finishing preview</title></head><body><div id="root"></div><script type="module" src="/main.jsx"></script></body></html>');
writeFileSync('.taste-skill/finish-preview.mjs',readFileSync('.taste-skill/learn-preview.mjs','utf8').replaceAll('learn-fixture','finish-fixture').replaceAll('learn-preview-build','finish-preview-build').replace('port:4180','port:4184'));
