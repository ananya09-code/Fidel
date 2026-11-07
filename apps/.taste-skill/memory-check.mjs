import {Browser} from 'file:///C:/Users/ananya/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import {mkdirSync} from 'node:fs';
const out='.taste-skill/memory-check';mkdirSync(out,{recursive:true});
const b=await Browser.launch();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try {
 const p=await b.newPage();await p.goto('http://127.0.0.1:4185/Home',{settleMs:1500});
 console.log('home',await p.eval(()=>({card:document.querySelector('.memory-check')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth})));
 await p.screenshot({path:out+'/home-desktop.jpg',fullPage:true});
 await p.eval(()=>document.querySelector('.memory-action').click());await wait(800);
 const count=await p.eval(()=>Number(document.querySelector(".study-progress-label > span").textContent.match(/of (\d+)/)[1])); for(let i=0;i<count;i++){
  console.log('question',await p.eval(({i})=>{const meaning=document.querySelector('.study-translations dd')?.textContent;const map={Hello:'Akkam',Coffee:'Buna',House:'Mana',Water:'Bishaan','Thank you':'Galatoomi',Mother:'Haadha',Father:'Abbaa',Friend:'Hiriyyaa'};const options=[...document.querySelectorAll('.study-option')];const chosen=i===1?options.find(o=>!o.textContent.includes(map[meaning])):options.find(o=>o.textContent.includes(map[meaning]));if(!chosen)throw Error('No real matching choice for '+meaning);chosen.click();return {meaning,options:options.length};},{i}));
  await wait(300);
  await p.eval(()=>document.querySelector('.study-practice-actions .study-primary').click());await wait(400);
  if(i===0){await p.eval(()=>document.querySelector('.study-header button').click());await wait(400);console.log('resume',await p.eval(()=>document.querySelector('.memory-action').textContent));await p.eval(()=>document.querySelector('.memory-action').click());await wait(500);}
 }
 console.log('results',await p.eval(()=>document.body.textContent.includes('3 / 4')||document.querySelector('.study-milestone')?.textContent));
 await p.screenshot({path:out+'/results.jpg',fullPage:true});
 await p.eval(()=>[...document.querySelectorAll('button')].find(n=>n.textContent==='Back to review').click());await wait(400);
 console.log('after',await p.eval(()=>document.querySelector('.memory-check').textContent));
 await p.screenshot({path:out+'/review-desktop.jpg',fullPage:true});
 await p.eval(()=>[...document.querySelectorAll('button')].find(n=>n.textContent==='Jump ahead 3 days').click());await wait(400);
 console.log('advanced',await p.eval(()=>document.querySelector('.memory-check').textContent));
 await p.setViewport({width:390,height:844,mobile:true});await p.screenshot({path:out+'/review-mobile.jpg',fullPage:true});
 console.log('mobile overflow',await p.eval(()=>document.documentElement.scrollWidth>innerWidth));
 await p.eval(()=>document.documentElement.classList.add('dark'));await p.screenshot({path:out+'/review-dark-mobile.jpg',fullPage:true});
 await p.setViewport({width:1440,height:900});await p.screenshot({path:out+'/review-dark.jpg',fullPage:true});
}finally{await b.close();}

