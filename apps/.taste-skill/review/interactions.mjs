import {Browser,sleep} from 'file:///C:/Users/ananya/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import {strict as assert} from 'node:assert';
import {writeFileSync} from 'node:fs';
const b=await Browser.launch(),p=await b.newPage({width:390,height:844}),results=[];
async function click(text){assert(await p.eval(t=>{const el=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===t);if(!el)return false;el.click();return true;},text));await sleep(80);}
try{
 await p.goto('http://127.0.0.1:4183/');
 assert.equal(await p.eval(()=>document.querySelectorAll('.review-words li').length),6);
 await click('Hide meanings');assert.equal(await p.eval(()=>document.querySelectorAll('.review-meanings dd').length),0);
 await click('Show meanings');assert.equal(await p.eval(()=>document.querySelectorAll('.review-meanings dd').length),12);
 await click('Show all 7 words');assert.equal(await p.eval(()=>document.querySelectorAll('.review-words li').length),7);
 await click('Show fewer words');assert.equal(await p.eval(()=>document.querySelectorAll('.review-words li').length),6);
 await click('Show all recent sessions');assert.equal(await p.eval(()=>document.querySelectorAll('.review-history li').length),6);
 await click('Show fewer sessions');assert.equal(await p.eval(()=>document.querySelectorAll('.review-history li').length),4);
 await click('Start review');assert(await p.eval(()=>!!document.querySelector('#test-started')));results.push('Recall toggle, word/history expansion/collapse and start callback');
 await p.goto('http://127.0.0.1:4183/?active=1');assert.equal(await p.eval(()=>document.querySelector('progress').value),2);assert.equal(await p.eval(()=>document.querySelector('progress').max),5);
 await click('Continue review');assert(await p.eval(()=>!!document.querySelector('#test-started')));results.push('Resume label/action and saved 2/5 progress');
 await p.goto('http://127.0.0.1:4183/?empty=1');
 assert.equal(await p.eval(()=>document.querySelectorAll('.review-words li').length),0);
 assert(await p.eval(()=>!![...document.querySelectorAll('a')].find(a=>a.textContent.includes('Explore lessons'))));
 assert(await p.eval(()=>document.body.textContent.includes('Your first review goes here.')));results.push('Honest empty queue/history and real learning links');
 await p.goto('http://127.0.0.1:4183/?busy=1&error=1');
 assert(await p.eval(()=>document.querySelector('.review-primary').disabled));
 assert(await p.eval(()=>!!document.querySelector('[role=alert]')));results.push('Spinner/disabled starting state and action error');
 assert.equal(await p.eval(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(p.consoleErrors,[]);
 writeFileSync('.taste-skill/review/interactions.json',JSON.stringify(results,null,2));console.log(results.join('\n'));
}finally{await b.close();}
