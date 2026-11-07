import React, {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createRouter,createRootRoute,createRoute,RouterProvider,Link,useRouterState,useNavigate} from '@tanstack/react-router';
import {z} from 'zod';
import {MemoryCheckView} from '../../web/src/components/learn-ui/review/MemoryCheckView';
import {ReviewOverview} from '../../web/src/components/learn-ui/review/ReviewOverview';
import {HomeDashboard} from '../../web/src/components/homepage-ui/HomeDashboard';
import {LessonQuiz} from '../../web/src/components/learn-ui/lesson/LessonQuiz';
import {FidelTeacherMark} from '../../web/src/components/common-ui/FidelTeacherMark';
import {getSpacedReviews,getReviews,startReview,saveReviewAnswer,completeReview} from '../../web/src/lib/api/reviews';
import {apiFetch} from '../../web/src/lib/api';
import './preview.css';
const token='local-preview-only';
const initialDark=new URLSearchParams(location.search).get('theme')==='dark';
document.documentElement.classList.toggle('dark',initialDark);
const cardWord=w=>({id:w.id,word:w.text,meaning:w.meaning,amharic:w.amharic,audioUrl:w.audio_url});
function Screen(){
 const location=useRouterState({select:s=>s.location});const navigate=useNavigate();
 const [data,setData]=useState(null),[overview,setOverview]=useState(null),[session,setSession]=useState(null),[error,setError]=useState(null),[days,setDays]=useState(0),[busy,setBusy]=useState(false);
 async function refresh(){try{const [d,o,c]=await Promise.all([getSpacedReviews(token,'om'),getReviews(token),apiFetch('/demo/clock',z.object({days_ahead:z.number()}))]);setData(d);setOverview(o);setDays(c.days_ahead);}catch(e){setError(e.message);}}
 async function begin(mode='manual'){setBusy(true);setError(null);try{setSession(await startReview(token,mode));await refresh();}catch(e){setError(e.message);}finally{setBusy(false);}}
 useEffect(()=>{void refresh();},[]);
 useEffect(()=>{if(location.search.start)void begin('spaced');},[location.search.start]);
 const memory=<MemoryCheckView data={data} loading={!data} error={error??undefined} onRetry={()=>void refresh()}/>;
 const back=()=>{setSession(null);void refresh();void navigate({to:'/review',search:{start:false}});};
 const answers=Object.fromEntries(session?.answers.map(a=>[a.word_id,a.is_correct])??[]);
 const unanswered=session?.words.findIndex(w=>!(w.id in answers))??0;
 return <><header className="demo-toolbar"><Link to="/Home"><FidelTeacherMark style={{width:28,height:32}}/>Fidel</Link><nav><Link to="/Home">Home</Link><Link to="/review" search={{start:false}}>Review</Link></nav><button onClick={()=>document.documentElement.classList.toggle('dark')}>Light / dark</button></header>
 <aside className="demo-notice"><strong>Local test account · disposable data</strong><span>4 words learned 4 days ago, 4 learned today. Clock +{days} days.</span><button disabled={busy||!!session} onClick={async()=>{await apiFetch('/demo/advance',z.object({days_ahead:z.number()}),{method:'POST'});await refresh();}}>Jump ahead 3 days</button></aside>
 {session?<LessonQuiz variant="quiz" key={session.id} words={session.words.map(cardWord)} choiceWords={session.choice_words.map(cardWord)} category="Vocabulary quiz" initialAnswers={answers} initialQuestionIndex={unanswered<0?Math.max(0,session.words.length-1):unanswered} onBack={back} onAnswer={async({wordId,selectedWordId})=>setSession(await saveReviewAnswer(token,session.id,wordId,selectedWordId))} onFinish={async()=>{setSession(await completeReview(token,session.id));await refresh();}}/>:location.pathname==='/Home'?<HomeDashboard languageCode="om" data={{daily_word_goal:5,words_learned_today:4,learned_words:8,needs_review_words:overview?.queue.length??0,lessons_completed:0,streak_days:1,reviews_completed:overview?.history.length??0,correct_answers:0,recent_activity:[],weekly_activity:[],current_lesson:null}} dailyWord={<div><h2>Akkam</h2><p>Hello · ሰላም</p></div>} topics={<p>Preview focuses on the memory check below your next lesson.</p>} memoryCheck={memory}/>:overview?<ReviewOverview data={overview} memoryCheck={memory} onStart={()=>void begin()} isStarting={busy} error={error}/>:<div className="fidel-review">{memory}</div>}
 </>;
}
const root=createRootRoute({component:Screen});
const routes=['/','/Home','/review','/Learn','/Learn/$lessonId','/settings','/profile','/dictionary'].map(path=>createRoute({getParentRoute:()=>root,path,validateSearch:s=>s,component:()=>null}));
const router=createRouter({routeTree:root.addChildren(routes)});
createRoot(document.getElementById('root')).render(<RouterProvider router={router}/>);


