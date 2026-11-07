import {Browser,sleep} from 'file:///C:/Users/ananya/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import {strict as assert} from 'node:assert';
import {writeFileSync} from 'node:fs';
const b=await Browser.launch();const p=await b.newPage({width:1440,height:900});const results=[];
const click=async text=>{assert(await p.eval(t=>{const el=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t));if(!el)return false;el.click();return true;},text),'Button missing: '+text);await sleep(50);};
const word=()=>p.eval(()=>document.querySelector('.study-card:not(.study-card-ghost) h2')?.textContent);
try{
 await p.goto('http://127.0.0.1:4181/?view=cards');
 assert.equal(await word(),'Akkam');
 await click('Next word');
 const during=await p.eval(()=>({ghost:!!document.querySelector('.study-card-ghost'),active:document.querySelector('.study-card:not(.study-card-ghost)').getAnimations().length}));
 assert(during.ghost&&during.active>0,'Overlapping slides must animate');
 await click('Next word');await sleep(500);
 assert.equal(await word(),'Galatoomi','Rapid click must not skip a card');
 assert.equal(await p.eval(()=>document.querySelectorAll('.study-card-ghost').length),0,'Ghost cleaned up');
 results.push('Simultaneous exit/entry; rapid-click guard; animation cleanup');
 await click('Previous');await sleep(500);assert.equal(await word(),'Akkam');
 await p.eval(()=>document.querySelector('.study-card:not(.study-card-ghost)').focus());
 await p.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
 await p.send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
 await sleep(500);assert.equal(await word(),'Galatoomi');results.push('Previous and keyboard navigation');
 const box=await p.eval(()=>{const r=document.querySelector('.study-card:not(.study-card-ghost)').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+45};});
 await p.send('Input.dispatchMouseEvent',{type:'mousePressed',...box,button:'left',clickCount:1});
 for(let i=1;i<=6;i++){await p.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:box.x-i*20,y:box.y,button:'left',buttons:1});await sleep(16);}
 await p.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:box.x-120,y:box.y,button:'left',clickCount:1});
 await sleep(500);assert.equal(await word(),'Buna');results.push('Real pointer drag advances one card');
 await click('Next word');await sleep(500);await click('Next word');await sleep(500);await click('Finish cards');await sleep(100);
 assert(await p.eval(()=>document.body.textContent.includes('Words met. Time to practise.')));
 await click('Continue to practice');assert(await p.eval(()=>!!document.querySelector('.study-options')));
 for(let i=0;i<5;i++){
   const correct=['Akkam','Galatoomi','Buna','Nagaa','Mana'][i];
   await p.eval(label=>[...document.querySelectorAll('.study-option')].find(x=>x.textContent.includes(label)).click(),correct);
   await sleep(80);
   assert(await p.eval(()=>document.querySelector('.study-feedback').textContent.includes('That’s the one.')));
   await click(i===4?'See my results':'Continue');await sleep(80);
 }
 assert(await p.eval(()=>document.body.textContent.includes('Every word remembered.')));
 const events=await p.eval(()=>JSON.parse(document.querySelector('#test-events').textContent));
 assert.equal(events.filter(x=>x.kind==='answer').length,5);
 assert.equal(events.find(x=>x.kind==='finish').data.score,5);results.push('Cards-to-practice flow, five answers saved once, correct results');
 await p.goto('http://127.0.0.1:4181/?view=quiz&fail=1');
 await p.eval(()=>document.querySelector('.study-option').click());await sleep(100);
 assert(await p.eval(()=>!!document.querySelector('[role=alert]')));
 assert.equal(await p.eval(()=>document.querySelectorAll('.study-option:disabled').length),0);
 assert.equal(await p.eval(()=>!!document.querySelector('.study-feedback')),false);results.push('Failed save preserves unanswered state and retry controls');
 await p.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await p.goto('http://127.0.0.1:4181/?view=cards');await click('Next word');await sleep(100);
 assert.equal(await word(),'Galatoomi');assert.equal(await p.eval(()=>document.querySelector('.study-card:not(.study-card-ghost)').getAnimations().length),0);results.push('Reduced motion skips all card animation');
 assert.deepEqual(p.consoleErrors,[]);writeFileSync('.taste-skill/study/interactions.json',JSON.stringify(results,null,2));console.log(results.join('\n'));
}finally{await b.close();}
