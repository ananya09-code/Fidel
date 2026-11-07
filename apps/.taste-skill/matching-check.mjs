import {Browser} from 'file:///C:/Users/ananya/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import {mkdirSync} from 'node:fs';
mkdirSync('.taste-skill/matching-check',{recursive:true});
const b=await Browser.launch(),sleep=ms=>new Promise(r=>setTimeout(r,ms)), run=Date.now(), url='http://127.0.0.1:4186/?test='+run;
try{
 const p=await b.newPage();await p.goto(url,{settleMs:1000});
 if(await p.eval(()=>!![...document.querySelectorAll('button')].find(x=>x.textContent==='Start practice')))await p.eval(()=>[...document.querySelectorAll('button')].find(x=>x.textContent==='Start practice').click());
 await sleep(600);
 console.log('board',await p.eval(()=>({title:document.querySelector('h1')?.textContent,tiles:document.querySelectorAll('.matching-tile').length,continueDisabled:document.querySelector('.matching-footer button')?.disabled})));
 await p.screenshot({path:'.taste-skill/matching-check/desktop.jpg',fullPage:true});
 await p.eval(()=>document.querySelector('input[type=checkbox]').click());
 const pair=async(word,meaning)=>{await p.eval(({word,meaning})=>{const tiles=[...document.querySelectorAll('.matching-tile')];const a=tiles.find(t=>t.querySelector('strong')?.textContent===word),c=tiles.find(t=>t.querySelector('strong')?.textContent===meaning);if(!a||!c)throw Error('Pair unavailable');a.click();c.click();},{word,meaning});await sleep(300);};
 await pair('Buna','Coffee');console.log('save failure',await p.eval(()=>({error:document.querySelector('.study-error')?.textContent,matched:document.querySelectorAll('.matching-tile.is-matched').length})));
 await pair('Buna','Mother');console.log('wrong',await p.eval(()=>({red:document.querySelectorAll('.matching-tile.is-wrong').length,text:document.querySelector('.matching-feedback').textContent})));await sleep(700);
 await pair('Buna','Coffee');await pair('Abbaa','Father');
 await p.goto(url,{settleMs:800});
 console.log('resumed out of order',await p.eval(()=>({title:document.querySelector('h1')?.textContent,matched:document.querySelectorAll('.matching-tile.is-matched').length,progress:document.querySelector('.study-progress-label > span')?.textContent})));
 await pair('Mana','House');await pair('Bishaan','Water');await pair('Haadha','Mother');
 console.log('ready',await p.eval(()=>({complete:!document.querySelector('.matching-footer button').disabled,feedback:document.querySelector('.matching-feedback').textContent})));
 await p.screenshot({path:'.taste-skill/matching-check/complete.jpg',fullPage:true});
 await p.eval(()=>document.querySelector('.matching-footer button').click());await sleep(400);
 const map={Friend:'Hiriyyaa',World:'Aduunyaa',Day:'Guyyaa'};
 for(let i=0;i<3;i++){await p.eval(map=>{const meaning=document.querySelector('.study-translations dd')?.textContent;const option=[...document.querySelectorAll('.study-option')].find(x=>x.textContent.includes(map[meaning]));if(!option)throw Error('Missing tail question '+meaning);option.click();},map);await sleep(250);await p.eval(()=>document.querySelector('.study-practice-actions .study-primary').click());await sleep(350);}
 console.log('results',await p.eval(()=>document.querySelector('.study-results')?.textContent));
 await p.screenshot({path:'.taste-skill/matching-check/results.jpg',fullPage:true});
 // Start a separate mixed session to check automatic format switching and phone layout.
 await p.goto('http://127.0.0.1:4186/?round=full&test='+run,{settleMs:700});await p.eval(()=>[...document.querySelectorAll('button')].find(x=>x.textContent==='Start practice')?.click());await sleep(400);
 for(const target of ['Akkam','Galatoomi']){console.log('choice intro',await p.eval(()=>document.querySelector('h1')?.textContent));await p.eval(target=>[...document.querySelectorAll('.study-option')].find(x=>x.textContent.includes(target)).click(),target);await sleep(250);await p.eval(()=>document.querySelector('.study-practice-actions .study-primary').click());await sleep(300);}
 console.log('switched',await p.eval(()=>document.querySelector('h1')?.textContent));
 await p.setViewport({width:390,height:844,mobile:true});await p.screenshot({path:'.taste-skill/matching-check/mobile.jpg',fullPage:true});console.log('mobile overflow',await p.eval(()=>document.documentElement.scrollWidth>innerWidth));
 await p.eval(()=>document.documentElement.classList.add('dark'));await p.screenshot({path:'.taste-skill/matching-check/mobile-dark.jpg',fullPage:true});
 await p.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});console.log('reduced motion',await p.eval(()=>getComputedStyle(document.querySelector('.matching-tile')).transitionDuration));
 await p.setViewport({width:1440,height:900});await p.screenshot({path:'.taste-skill/matching-check/desktop-dark.jpg',fullPage:true});
}finally{await b.close();}

