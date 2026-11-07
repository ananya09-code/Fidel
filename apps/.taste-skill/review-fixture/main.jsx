import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createRouter,createRootRoute,createRoute,RouterProvider,Link} from '@tanstack/react-router';
import {ReviewOverview} from '../../web/src/components/learn-ui/review/ReviewOverview';
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

const queue=[['Akkam','Hello','ሰላም','greetings'],['Galatoomi','Thank you','አመሰግናለሁ','greetings'],['Buna','Coffee','ቡና','food_and_drinks'],['Mana','House','ቤት','everyday'],['Nagaa','Peace','ሰላም','greetings'],['Bishaan','Water','ውሃ','food_and_drinks'],['Haadha','Mother','እናት','family']].map(([text,meaning,amharic,category],i)=>({id:String(i),text,meaning,amharic,category,audio_url:null}));
const history=Array.from({length:6},(_,i)=>({id:String(i),total_count:5,correct_count:Math.max(1,5-i),completed_at:'2026-11-0'+(6-i)+'T12:00:00Z'}));
function Screen(){const [started,setStarted]=useState(false);const active=params.has('active')?{id:'active',total_count:5,correct_count:1,answers:[{word_id:'0',is_correct:true},{word_id:'1',is_correct:false}],words:queue.slice(0,5),status:'in_progress'}:null;
const data={queue:params.has('empty')?[]:queue,history:params.has('empty')?[]:history,active_session:active};
return <SidebarProvider defaultOpen><AppSidebar/><SidebarInset><header className="flex h-16 items-center gap-3 px-6"><SidebarTrigger/><strong>Fidel</strong><span className="ml-auto text-xs">Design preview · sample words</span></header><main><ReviewOverview data={data} onStart={()=>setStarted(true)} isStarting={params.has('busy')} error={params.has('error')?'Unable to start this test session. Try again.':null}/>{started&&<p id="test-started" className="sr-only">Review requested</p>}</main></SidebarInset><MobileBottomNavigation/></SidebarProvider>;
}
const root=createRootRoute({component:Screen});
const routes=['/','/Home','/Learn','/Learn/$lessonId','/dictionary','/review','/settings','/profile'].map(path=>createRoute({getParentRoute:()=>root,path,component:()=>null}));
const router=createRouter({routeTree:root.addChildren(routes)});
createRoot(document.getElementById('root')).render(<RouterProvider router={router}/>);
