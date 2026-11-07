import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createRouter,createRootRoute,createRoute,RouterProvider,Link} from '@tanstack/react-router';
import {DictionaryHeader} from '../../web/src/components/dictionary-ui/DictionaryHeader';
import {DictionaryFilters} from '../../web/src/components/dictionary-ui/DictionaryFilters';
import {VocabularyList} from '../../web/src/components/dictionary-ui/VocabularyList';
import {FeaturedWord} from '../../web/src/components/dictionary-ui/FeaturedWord';
import '../../web/src/components/dictionary-ui/dictionary.css';
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

const entries=[['Akkam','Hello / How are you?','ሰላም / እንዴት ነህ?','greetings'],['Galatoomi','Thank you','አመሰግናለሁ','greetings'],['Buna','Coffee','ቡና','food_and_drinks'],['Mana','House','ቤት','everyday'],['Nagaa','Peace','ሰላም','greetings'],['Bishaan','Water','ውሃ','food_and_drinks']];
const all=entries.map(([text,meaning,am,category],i)=>({id:String(i),language_code:'om',text,meaning,category,difficulty:'beginner',transliteration:i===0?'ak-kam':null,content_type:'word',audio:{available:false,url:null},translations:[{language_code:'en',meaning,context_note:i===0?'A greeting to begin a conversation.':null},{language_code:'am',meaning:am,context_note:null}]}));
function Screen(){
 const [q,setQ]=useState(''),[category,setCategory]=useState('All words'),[only,setOnly]=useState(false),[states,setStates]=useState({}),[limit,setLimit]=useState(3),[notice,setNotice]=useState('');
 const favorites=Object.keys(states).filter(id=>states[id].is_favorite);
 const available=all.filter(w=>(category==='All words'||w.category===category)&&(!q||[w.text,w.meaning,...w.translations.map(t=>t.meaning)].some(t=>t.toLowerCase().includes(q.toLowerCase()))));
 const loaded=available.slice(0,limit),words=only?loaded.filter(w=>favorites.includes(w.id)):loaded;
 const update=(id,patch)=>setStates(prev=>({...prev,[id]:{...prev[id],...patch}}));
 const clear=()=>{setQ('');setCategory('All words');setOnly(false);};
 const featured=!q&&!only&&category==='All words';
 return <SidebarProvider defaultOpen><AppSidebar/><SidebarInset><header className="flex h-16 items-center gap-3 px-6"><SidebarTrigger/><strong>Fidel</strong><span className="ml-auto text-xs">Design preview · sample words</span></header><main><div className="fidel-dictionary">
 <DictionaryHeader/><DictionaryFilters query={q} onQueryChange={setQ} activeCategory={category} onCategoryChange={setCategory} categories={[...new Set(all.map(w=>w.category))].map(name=>({name,word_count:all.filter(w=>w.category===name).length}))}/>
 {notice&&<p role="status">{notice}</p>}
 <div className={'dict-layout'+(featured?' has-feature':'')}><VocabularyList words={words} favorites={favorites} favoritesOnly={only} states={states} onToggleFavoritesOnly={()=>setOnly(!only)} onToggleFavorite={id=>update(id,{is_favorite:!states[id]?.is_favorite})} onSetLearningState={(id,learning_state)=>update(id,{learning_state})} onPlayAudio={()=>{}} onPracticeWord={w=>{update(w.id,{learning_state:'needs_review'});setNotice('Practice requested for '+w.text);}} onClearFilters={clear} totalItems={available.length} hasNextPage={loaded.length<available.length} isLoadingMore={false} onLoadMore={()=>setLimit(limit+3)}/>
 {featured&&<FeaturedWord word={all[0]} isFavorite={favorites.includes('0')} onToggleFavorite={id=>update(id,{is_favorite:!states[id]?.is_favorite})} onPlayAudio={()=>{}}/>}</div><p className="dict-save-note">Isolated design preview. No account data is changed.</p>
 </div></main></SidebarInset><MobileBottomNavigation/></SidebarProvider>;
}
const root=createRootRoute({component:Screen});
const routes=['/','/Home','/Learn','/Learn/$lessonId','/dictionary','/review','/settings','/profile'].map(path=>createRoute({getParentRoute:()=>root,path,component:()=>null}));
const router=createRouter({routeTree:root.addChildren(routes)});
createRoot(document.getElementById('root')).render(<RouterProvider router={router}/>);
