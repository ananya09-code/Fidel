import { Browser } from 'file:///C:/Users/ananya/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const browser = await Browser.launch();
try {
 for (const [name,width,height,dark] of [['desktop',1440,900,false],['mobile',390,844,false],['dark',1440,900,true]]) {
  const page = await browser.newPage({width,height});
  await page.goto('http://127.0.0.1:3000', {settleMs:6000});
  if(dark) await page.eval(()=>document.documentElement.classList.add('dark'));
  console.log(name,await page.eval(()=>({grid:!!document.querySelector('.editorial-woven-grid'),oldWords:!!document.querySelector('.editorial-word-ocean'),overflow:document.documentElement.scrollWidth>innerWidth})));
  console.log(await page.eval(async()=>{const host=document.querySelector('.fidel-editorial');host.dispatchEvent(new PointerEvent('pointermove',{clientX:360,clientY:360,bubbles:true}));host.dispatchEvent(new PointerEvent('pointerdown',{clientX:360,clientY:360,button:0,bubbles:true}));await new Promise(r=>setTimeout(r,350));return {thread:document.querySelector('.editorial-woven-grid').classList.contains('is-weaving'),bloom:document.querySelector('.woven-grid-bloom').getAnimations().length>0};}));
  await page.screenshot({path:`.taste-skill/word-ocean/woven-${name}.jpg`});
  await page.close();
 }
}finally{await browser.close();}
