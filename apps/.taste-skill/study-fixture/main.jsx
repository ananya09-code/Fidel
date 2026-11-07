import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createRouter,createRootRoute,createRoute,RouterProvider,Link} from '@tanstack/react-router';
import {FlashcardSession} from '../../web/src/components/learn-ui/lesson/FlashcardSession';
import {LessonQuiz} from '../../web/src/components/learn-ui/lesson/LessonQuiz';
import {TopicList} from '../../web/src/components/homepage-ui/ExploreTopics';
import {WordOfTheDay} from '../../web/src/components/homepage-ui/WordOfTheDay';
import {PageState} from '../../web/src/components/common-ui/PageState';
import {MobileBottomNavigation} from '../../web/src/components/common-ui/MobileBottomNavigation';
import {AppSidebar} from '../../web/src/components/common-ui/AppSideBar';
import {SidebarProvider,SidebarInset,SidebarTrigger} from '../../web/src/components/ui/sidebar';
import './fixture.css';
const params=new URLSearchParams(location.search);
document.documentElement.classList.toggle('dark',params.get('theme')==='dark');
const empty=params.get('state')==='empty';
const data={daily_word_goal:5,words_learned_today:0,study_minutes_today:0,streak_days:0,learned_words:empty?0:12,needs_review_words:empty?0:9,lessons_completed:empty?0:1,reviews_completed:0,correct_answers:0,weekly_activity:[],current_lesson:empty?null:{lesson_key:'body',title:'Body',stage:'practice',question_index:3,question_count:10},recent_activity:empty?[]:[{kind:'lesson',title:'body',occurred_at:'2026-11-03T12:00:00Z',correct_count:1,total_count:1},{kind:'lesson',title:'common_expressions',occurred_at:'2026-10-30T12:00:00Z',correct_count:8,total_count:10}]};
const topics=['body','common_expressions','family','food_and_drinks','greetings','numbers','everyday'].map((name,index)=>({name,word_count:12+index*3}));

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
const root=createRootRoute({component:Screen});
const routes=['/','/Home','/Learn','/Learn/$lessonId','/dictionary','/review','/settings','/profile'].map(path=>createRoute({getParentRoute:()=>root,path,component:()=>null}));
const router=createRouter({routeTree:root.addChildren(routes)});
createRoot(document.getElementById('root')).render(<RouterProvider router={router}/>);
