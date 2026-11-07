import React from 'react';
import {createRoot} from 'react-dom/client';
import {createRouter,createRootRoute,createRoute,RouterProvider,Link} from '@tanstack/react-router';
import {LearningPathView} from '../../web/src/components/learn-ui/LearningPath';
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

const path={language_code:'om',total_words:60,levels:[{id:'beginner',title:'First conversations',subtitle:'Everyday words, familiar faces',total_words:40,lessons:['Greetings','Family','Food and drinks','Everyday'].map((title,i)=>({id:'lesson-'+i,title,subtitle:'Words for everyday conversations',word_count:10,order:i}))},{id:'next',title:'Keep the conversation going',subtitle:'Build on what you know',total_words:20,lessons:[{id:'later',title:'At the market',subtitle:'Buying and selling',word_count:20,order:0}]}]};
const progress={completed_lesson_keys:params.get('state')==='empty'?[]:['lesson-0'],in_progress:[],lessons_completed:1,correct_answers:8,questions_answered:10};
function Screen(){return <SidebarProvider defaultOpen><AppSidebar/><SidebarInset><header className="flex h-16 items-center gap-3 px-6"><SidebarTrigger/><strong>Fidel</strong><span className="ml-auto text-xs">Design preview · sample data</span></header><main><div className="fidel-learn"><LearningPathView path={path} progress={progress}/></div></main></SidebarInset><MobileBottomNavigation/></SidebarProvider>}
const root=createRootRoute({component:Screen});
const routes=['/','/Home','/Learn','/Learn/$lessonId','/dictionary','/review','/settings','/profile'].map(path=>createRoute({getParentRoute:()=>root,path,component:()=>null}));
const router=createRouter({routeTree:root.addChildren(routes)});
createRoot(document.getElementById('root')).render(<RouterProvider router={router}/>);
