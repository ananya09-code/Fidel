import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createRouter,createRootRoute,createRoute,RouterProvider} from '@tanstack/react-router';
import {SettingsForm} from '../../web/src/components/settings-ui/SettingsOverview';
import {ProfileView} from '../../web/src/components/profile-ui/ProfileOverview';
import {StudyActivityCalendar} from '../../web/src/components/profile-ui/StudyActivityCalendar';
import {HeaderView} from '../../web/src/components/common-ui/Header';
import {AppSidebar} from '../../web/src/components/common-ui/AppSideBar';
import {MobileBottomNavigation} from '../../web/src/components/common-ui/MobileBottomNavigation';
import {SidebarProvider,SidebarInset,SidebarTrigger,useSidebar} from '../../web/src/components/ui/sidebar';
import {PageState} from '../../web/src/components/common-ui/PageState';
import {OnboardingView} from '../../web/src/routes/onboarding';
import {AuthLoading} from '../../web/src/components/auth/AuthLoading';
import './fixture.css';
const params=new URLSearchParams(location.search),screen=params.get('screen')||'settings';
document.documentElement.classList.toggle('dark',params.get('theme')==='dark');
const days=Array.from({length:365},(_,i)=>{const d=new Date('2025-11-07T00:00:00Z');d.setUTCDate(d.getUTCDate()+i);return{date:d.toISOString().slice(0,10),answers:i%19===0?12:i%11===0?4:0};});
const activity={timezone:'Africa/Addis_Ababa',start_date:days[0].date,end_date:days.at(-1).date,days};
const dashboard={daily_word_goal:5,words_learned_today:3,study_minutes_today:0,streak_days:2,learned_words:24,needs_review_words:4,lessons_completed:4,reviews_completed:3,correct_answers:35,current_lesson:null,weekly_activity:[],recent_activity:[]};
function PreviewHeader(){const{state}=useSidebar();return <HeaderView displayName="Aster Tesfaye" email="aster@fidel.test" language="Afaan Oromoo" area={screen==='profile'?'Profile':'Settings'} sidebarOpen={state==='expanded'} onSignOut={()=>{}}/>;}
function Screen(){
 const[settings,setSettings]=useState({learning_language:'om',interface_language:'en',daily_goal_words:10,reminders_enabled:true,reminder_time:'19:00',sound_enabled:true,appearance:params.get('theme')==='dark'?'dark':'light'});
 const[saved,setSaved]=useState(false),[saving,setSaving]=useState(false),[step,setStep]=useState(0),[completed,setCompleted]=useState(false);
 const[data,setData]=useState({language:null,level:null,motivations:[],dailyGoal:5,appearance:'light'});
 const set=(key,value)=>{setSettings(prev=>({...prev,[key]:value}));setSaved(false);};
 const appearance=value=>{set('appearance',value);document.documentElement.classList.toggle('dark',value==='dark');};
 if(screen==='onboarding')return <OnboardingView step={step} data={data} completed={completed} canContinue={step===0?!!data.language:step===1?!!data.level:step===2?data.motivations.length>0:true} onBack={()=>{if(completed){setCompleted(false);setStep(4);}else setStep(Math.max(0,step-1));}} onContinue={()=>step<4?setStep(step+1):setCompleted(true)} onStart={()=>{}} onLanguage={language=>setData(prev=>({...prev,language}))} onLevel={level=>setData(prev=>({...prev,level}))} onMotivation={id=>setData(prev=>({...prev,motivations:prev.motivations.includes(id)?prev.motivations.filter(x=>x!==id):[...prev.motivations,id]}))} onGoal={dailyGoal=>setData(prev=>({...prev,dailyGoal}))} onAppearance={appearance=>{setData(prev=>({...prev,appearance}));document.documentElement.classList.toggle('dark',appearance==='dark');}}/>;
 if(screen==='auth')return <AuthLoading/>;
 return <SidebarProvider className="fidel-app" defaultOpen><AppSidebar/><SidebarInset><header className="app-topbar"><SidebarTrigger className="hidden md:inline-flex"/><PreviewHeader/></header><main className="min-w-0 flex-1"><p className="px-6 pt-3 text-xs" style={{color:'var(--ui-muted)'}}>Local design preview · sample account</p>
 {screen==='profile'?<ProfileView name="Aster Tesfaye" email="aster@fidel.test" username="aster" joinedLabel="Joined October 2026" language="Afaan Oromoo" dashboard={dashboard} activity={<StudyActivityCalendar activity={activity}/>}/>:screen==='states'?<div className="fidel-settings"><header className="app-page-title"><h1>Page states</h1></header><div style={{display:'grid',gap:24}}><PageState kind="loading" title="Loading test data" compact/><PageState kind="error" title="We couldn’t load this part" description="Try again when you’re ready." actionLabel="Try again" onAction={()=>setSaved(true)}/><PageState kind="empty" title="Your first words go here" description="Begin a lesson to get started." actionLabel="Explore lessons" onAction={()=>{}}/>{saved&&<p>Retry requested</p>}</div></div>:<SettingsForm settings={settings} onChange={set} onAppearance={appearance} onSave={()=>{setSaving(true);setTimeout(()=>{setSaving(false);setSaved(true);},100);}} onSignOut={()=>{}} onDelete={()=>{}} isSaving={saving} saved={saved} error={params.has('error')?'Test save failed. Please try again.':null}/>}
 </main></SidebarInset><MobileBottomNavigation/></SidebarProvider>;
}
const root=createRootRoute({component:Screen});
const routes=['/','/Home','/Learn','/Learn/$lessonId','/dictionary','/review','/settings','/profile','/onboarding'].map(path=>createRoute({getParentRoute:()=>root,path,component:()=>null}));
const router=createRouter({routeTree:root.addChildren(routes)});
createRoot(document.getElementById('root')).render(<RouterProvider router={router}/>);


