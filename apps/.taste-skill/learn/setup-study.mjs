import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
const route='web/src/routes/_app/Learn/$lessonId.tsx';
let r=readFileSync(route,'utf8').replace('<main className="mx-auto w-full min-w-0 max-w-5xl px-4 py-6 sm:px-6 sm:py-8">','<div className="w-full min-w-0">').replace('    </main>','    </div>');
writeFileSync(route,r);
mkdirSync('.taste-skill/study-fixture',{recursive:true});
copyFileSync('.taste-skill/home-fixture/index.html','.taste-skill/study-fixture/index.html');
copyFileSync('.taste-skill/home-fixture/fixture.css','.taste-skill/study-fixture/fixture.css');
let source=readFileSync('.taste-skill/home-fixture/main.jsx','utf8').replace("import React from 'react';","import React, {useState} from 'react';");
source=source.replace("import {HomeDashboard} from '../../web/src/components/homepage-ui/HomeDashboard';","import {FlashcardSession} from '../../web/src/components/learn-ui/lesson/FlashcardSession';\nimport {LessonQuiz} from '../../web/src/components/learn-ui/lesson/LessonQuiz';");
const a=source.indexOf('function Screen()'), b=source.indexOf('const root=',a);
source=source.slice(0,a)+`
const words=[
{id:'1',word:'Akkam',meaning:'Hello / How are you?',amharic:'ሰላም / እንዴት ነህ?',transliteration:'ak-kam'},
{id:'2',word:'Galatoomi',meaning:'Thank you',amharic:'አመሰግናለሁ'},
{id:'3',word:'Buna',meaning:'Coffee',amharic:'ቡና'},
{id:'4',word:'Nagaa',meaning:'Peace',amharic:'ሰላም'},
{id:'5',word:'Mana',meaning:'House',amharic:'ቤት'}
];
function Screen(){
 const [quiz,setQuiz]=useState(params.get('view')==='quiz');
 const [events,setEvents]=useState([]);
 const record=(kind,data)=>setEvents(prev=>[...prev,{kind,data}]);
 return <SidebarProvider defaultOpen><AppSidebar/><SidebarInset><header className="flex h-16 items-center gap-3 px-6"><SidebarTrigger/><strong>Fidel</strong><span className="ml-auto text-xs">Design preview · sample words</span></header><main>
 {quiz?<LessonQuiz category="Greetings" words={words} onAnswer={async answer=>{record('answer',answer);if(params.has('fail'))throw Error('Test save failed. Choose an answer to retry.');}} onFinish={async result=>record('finish',result)} onBack={()=>setQuiz(false)}/>:<FlashcardSession category="Greetings" words={words} initialWordLimit={5} resumeActive={params.get('view')==='cards'} onStart={async()=>{}} onProgress={async index=>record('progress',index)} onComplete={async()=>setQuiz(true)} onBack={()=>{}}/>}
 <output id="test-events" className="sr-only">{JSON.stringify(events)}</output>
 </main></SidebarInset><MobileBottomNavigation/></SidebarProvider>;
}
`+source.slice(b);
writeFileSync('.taste-skill/study-fixture/main.jsx',source);
writeFileSync('.taste-skill/study-preview.mjs',readFileSync('.taste-skill/learn-preview.mjs','utf8').replaceAll('learn-fixture','study-fixture').replaceAll('learn-preview-build','study-preview-build').replace('port:4180','port:4181'));
