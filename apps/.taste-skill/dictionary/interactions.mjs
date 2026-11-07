import {Browser,sleep} from 'file:///C:/Users/ananya/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import {strict as assert} from 'node:assert';
import {writeFileSync} from 'node:fs';
const browser=await Browser.launch(),p=await browser.newPage({width:390,height:844});const results=[];
async function click(label){assert(await p.eval(label=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===label||e.getAttribute('aria-label')===label);if(!e)return false;e.click();return true;},label),'Missing '+label);await sleep(80);}
try{
 await p.goto('http://127.0.0.1:4182/');
 await click('Expand Akkam');assert(await p.eval(()=>document.querySelector('.dict-word-detail:not([hidden])').textContent.includes('A greeting')));
 await click('Mark learned');assert(await p.eval(()=>document.querySelector('.dict-word-status').textContent==='Learned'));
 await click('Needs review');assert(await p.eval(()=>document.querySelector('.dict-word-status').textContent==='Needs review'));
 await click('Practice this word');assert(await p.eval(()=>document.body.textContent.includes('Practice requested for Akkam')));results.push('Expand, full meanings/context, learned/review state and practice callbacks');
 await click('Add Akkam to favorites');await click('Favorites');assert.equal(await p.eval(()=>document.querySelectorAll('.dict-word-row').length),1);results.push('Favorite and favorites-only filter');
 await click('Remove Akkam from favorites');assert.equal(await p.eval(()=>document.querySelectorAll('.dict-word-row').length),0);
 assert(await p.eval(()=>!![...document.querySelectorAll('button')].find(e=>e.textContent.includes('Load more words'))));await click('Load more words');results.push('Load more remains reachable with zero visible favorites');
 await click('Clear filters');
 await p.eval(()=>{const el=document.querySelector('select');el.value='food_and_drinks';el.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(80);
 assert.equal(await p.eval(()=>document.querySelectorAll('.dict-word-row').length),2);results.push('Backend category values retained behind readable labels');
 await p.eval(()=>{const el=document.querySelector('input');const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,'Buna');el.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(80);
 assert.equal(await p.eval(()=>document.querySelectorAll('.dict-word-row').length),1);
 await click('Clear search');assert.equal(await p.eval(()=>document.querySelectorAll('.dict-word-row').length),2);results.push('Search and clear');
 await click('Clear filters').catch(()=>{});await p.goto('http://127.0.0.1:4182/');
 await click('Try to recall');assert(await p.eval(()=>document.querySelector('.dict-recall-space').textContent.includes('Say it before you peek')));
 await click('Reveal meaning');assert(await p.eval(()=>document.querySelector('.dict-recall-space').textContent.includes('Hello / How are you?')));results.push('Featured recall/reveal retains both translations');
 assert.equal(await p.eval(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(p.consoleErrors,[]);writeFileSync('.taste-skill/dictionary/interactions.json',JSON.stringify(results,null,2));console.log(results.join('\n'));
}finally{await browser.close();}
