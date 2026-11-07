import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {z} from 'zod';
import {LessonQuiz} from '../../web/src/components/learn-ui/lesson/LessonQuiz';
import {FidelTeacherMark} from '../../web/src/components/common-ui/FidelTeacherMark';
import {apiFetch} from '../../web/src/lib/api';
import {getLessonAttempt,startLesson,checkpointLesson,saveLessonAnswer,completeLesson} from '../../web/src/lib/api/learning';
import './preview.css';
const params=new URLSearchParams(location.search),mode=params.get('round')??'matching',key='demo-'+mode+'-'+(params.get('test')??'shared'),token='local-preview';
document.documentElement.classList.toggle('dark',params.get('theme')==='dark');
const wordSchema=z.object({id:z.string(),word:z.string(),meaning:z.string(),amharic:z.string()});
function Screen(){
 const [words,setWords]=useState([]),[attempt,setAttempt]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(null),[failNext,setFailNext]=useState(false);
 useEffect(()=>{Promise.all([apiFetch('/demo/words',z.array(wordSchema)),getLessonAttempt(token,key)]).then(([w,a])=>{setWords(w);setAttempt(a);}).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
 async function begin(){setLoading(true);setError(null);try{
  let saved=await startLesson(token,key,{difficulty:'beginner',category_key:'everyday',question_count:words.length});
  saved=await checkpointLesson(token,saved.id,'practice',0);
  if(mode==='matching')for(let i=0;i<2;i++)if(!saved.answers.some(a=>a.question_id===words[i].id))saved=await saveLessonAnswer(token,saved.id,{question_id:words[i].id,word_id:words[i].id,selected_word_id:words[i].id,question_index:i});
  setAttempt(saved);
 }catch(e){setError(e.message);}finally{setLoading(false);}}
 return <><header className="matching-demo-header"><span><FidelTeacherMark style={{width:30,height:34}}/>Fidel</span><nav><a href="/?round=matching">Matching round</a><a href="/?round=full">Full mixed practice</a><a href="/?round=quiz">Choice-only quiz</a></nav><button onClick={()=>document.documentElement.classList.toggle('dark')}>Light / dark</button></header>
 <aside className="matching-demo-notice">Local test account · saves to a disposable database. Neon is untouched.<label><input type="checkbox" checked={failNext} onChange={e=>setFailNext(e.target.checked)}/> Test one save failure</label></aside>
 {loading?<div className="fidel-study" role="status">Preparing local practice…</div>:attempt?<LessonQuiz key={attempt.id} words={words} variant={mode==='quiz'?'quiz':'practice'} category="Everyday words" initialQuestionIndex={attempt.question_index} initialAnswers={Object.fromEntries(attempt.answers.map(a=>[a.question_id,a.is_correct]))} onBack={()=>setAttempt(null)} onAnswer={async answer=>{if(failNext){setFailNext(false);throw Error('Test save failed. Select the pair again to retry.');}setAttempt(await saveLessonAnswer(token,attempt.id,{question_id:answer.questionId,word_id:answer.wordId,selected_word_id:answer.selectedWordId,question_index:answer.questionIndex,question_type:answer.questionType??'multiple_choice'}));}} onFinish={async()=>setAttempt(await completeLesson(token,attempt.id))}/>:<div className="fidel-study"><section className="study-setup"><FidelTeacherMark className="study-teacher"/><h1>{mode==='quiz'?'Multiple-choice quiz':mode==='full'?'A little variety in your practice.':'Match words. Make connections.'}</h1><p>{mode==='quiz'?'Individual questions for the assessment quiz.':mode==='full'?'Two choice questions, a matching round, then the remaining choice questions.':'Try five word pairs. This preview starts after the first two choice questions.'}</p><button className="study-primary" onClick={()=>void begin()}>Start practice</button></section></div>}
 {error&&<p role="alert" className="fidel-study">{error}</p>}
 </>;
}
createRoot(document.getElementById('root')).render(<Screen/>);

