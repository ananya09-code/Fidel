import { Browser } from 'file:///C:/Users/ananya/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const browser = await Browser.launch();
try {
 const page = await browser.newPage();
 await page.goto('http://127.0.0.1:3000', {settleMs:8000});
 console.log(await page.eval(() => ({canvas: [...document.querySelectorAll('canvas')].map(c=>({class:c.className,w:c.width,h:c.height})), scripts:document.scripts.length})));
 console.log(await page.eval(async()=>{const c=document.querySelector('.editorial-word-ocean');const a=c.toDataURL();c.parentElement.dispatchEvent(new PointerEvent('pointerdown',{clientX:950,clientY:250,button:0,bubbles:true}));await new Promise(r=>setTimeout(r,220));const b=c.toDataURL();return {painted:c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0),ripple:a!==b};}));
 await page.screenshot({path:'.taste-skill/word-ocean/live-desktop.jpg'});
 await page.eval(()=>window.scrollTo(0,1800));
 await new Promise(r=>setTimeout(r,300));
 console.log(await page.eval(()=>{const c=document.querySelector('.editorial-word-ocean');return {scrollY,canvasHeight:c.height,viewport:innerHeight,fixed:getComputedStyle(c).position,painted:c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0)};}));
 await page.screenshot({path:'.taste-skill/word-ocean/full-page-background.jpg'});
}finally{await browser.close();}
