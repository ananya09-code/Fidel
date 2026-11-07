import {readFileSync,writeFileSync} from 'node:fs';
const f='.taste-skill/finish/interactions.mjs';let s=readFileSync(f,'utf8');
s=s.replace("await click('Open profile menu');",`const menuPoint=await p.eval(()=>{const el=document.querySelector('[aria-label="Open profile menu"]');el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};});
 await p.send('Input.dispatchMouseEvent',{type:'mousePressed',...menuPoint,button:'left',clickCount:1});
 await p.send('Input.dispatchMouseEvent',{type:'mouseReleased',...menuPoint,button:'left',clickCount:1});
 await sleep(180);`);
writeFileSync(f,s);
