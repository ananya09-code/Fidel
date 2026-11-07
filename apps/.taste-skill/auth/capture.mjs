import {Browser} from 'file:///C:/Users/ananya/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='.taste-skill/auth/loaded';mkdirSync(out,{recursive:true});
const browser=await Browser.launch(); const page=await browser.newPage({width:1440,height:900});
const reports=[];
try {for(const mode of ['sign-in','sign-up']){
 await page.goto('http://127.0.0.1:4173/'+mode,{settleMs:18000});
 for(const theme of ['light','dark']) for(const width of [1440,768,390]){
 await page.setViewport({width,height:width===1440?900:width===768?1024:844});
 await page.eval(theme=>{document.documentElement.classList.toggle('dark',theme==='dark');document.documentElement.style.colorScheme=theme;},theme); await new Promise(r=>setTimeout(r,1000));
 await page.screenshot({path:out+'/'+mode+'-'+theme+'-'+width+'.jpg',fullPage:true});
 reports.push(await page.eval(()=>({url:location.pathname,width:innerWidth,h1:[...document.querySelectorAll('h1')].map(x=>x.textContent),inputs:document.querySelectorAll('input').length,overflow:document.documentElement.scrollWidth>innerWidth,clerk:!!document.querySelector('.cl-rootBox')})));
 }
}writeFileSync(out+'/report.json',JSON.stringify(reports,null,2)); console.log(JSON.stringify(reports));} finally{await browser.close();}
