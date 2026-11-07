import {Browser} from 'file:///C:/Users/ananya/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import {mkdirSync} from 'node:fs';
mkdirSync('.taste-skill/matching-final',{recursive:true});
const b=await Browser.launch(),wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
 const p=await b.newPage();const url='http://127.0.0.1:4186/?test=keys-'+Date.now();await p.goto(url,{settleMs:600});await p.eval(()=>[...document.querySelectorAll('button')].find(n=>n.textContent==='Start practice').click());await wait(400);
 for(const text of ['Buna','Coffee']){await p.eval(text=>[...document.querySelectorAll('.matching-tile')].find(n=>n.querySelector('strong')?.textContent===text).focus(),text);await p.send('Page.bringToFront');await p.send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});await p.send('Input.dispatchKeyEvent',{type:'char',text:'\r',unmodifiedText:'\r'});await p.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait(250);console.log('key state',await p.eval(()=>({selected:[...document.querySelectorAll('.matching-tile[aria-pressed=true]')].map(n=>n.textContent),feedback:document.querySelector('.matching-feedback')?.textContent,error:document.querySelector('.study-error')?.textContent})));}
 console.log('keyboard',await p.eval(()=>({matched:document.querySelectorAll('.matching-tile.is-matched').length,nextFocused:document.activeElement?.classList.contains('matching-tile'),nextEnabled:!document.activeElement?.disabled})));
 for(const [name,width,height] of [['desktop',1440,900],['tablet',768,1024],['mobile',390,844]]){await p.setViewport({width,height,mobile:width===390});await p.screenshot({path:'.taste-skill/matching-final/'+name+'.jpg',fullPage:true});console.log(name,await p.eval(()=>({overflow:document.documentElement.scrollWidth>innerWidth,minTarget:Math.min(...[...document.querySelectorAll('.matching-tile')].map(n=>n.getBoundingClientRect().height))})));}
 await p.eval(()=>document.documentElement.classList.add('dark'));await wait(250);await p.screenshot({path:'.taste-skill/matching-final/mobile-dark.jpg',fullPage:true});
 // Inspector can use this stable saved session and exercise instead of an intro.
 console.log('inspect URL',url);
}finally{await b.close();}


