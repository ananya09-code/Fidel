import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
mkdirSync('.taste-skill/dictionary-fixture',{recursive:true});
mkdirSync('.taste-skill/dictionary',{recursive:true});
copyFileSync('.taste-skill/home-fixture/index.html','.taste-skill/dictionary-fixture/index.html');
copyFileSync('.taste-skill/home-fixture/fixture.css','.taste-skill/dictionary-fixture/fixture.css');
let s=readFileSync('.taste-skill/home-fixture/main.jsx','utf8').replace("import React from 'react';","import React, {useState} from 'react';");
s=s.replace("import {HomeDashboard} from '../../web/src/components/homepage-ui/HomeDashboard';",[
"import {DictionaryHeader} from '../../web/src/components/dictionary-ui/DictionaryHeader';",
"import {DictionaryFilters} from '../../web/src/components/dictionary-ui/DictionaryFilters';",
"import {VocabularyList} from '../../web/src/components/dictionary-ui/VocabularyList';",
"import {FeaturedWord} from '../../web/src/components/dictionary-ui/FeaturedWord';",
"import '../../web/src/components/dictionary-ui/dictionary.css';"
].join('\n'));
const a=s.indexOf('function Screen()'), b=s.indexOf('const root=',a);
s=s.slice(0,a)+`
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
`+s.slice(b);
writeFileSync('.taste-skill/dictionary-fixture/main.jsx',s);
writeFileSync('.taste-skill/dictionary-preview.mjs',readFileSync('.taste-skill/learn-preview.mjs','utf8').replaceAll('learn-fixture','dictionary-fixture').replaceAll('learn-preview-build','dictionary-preview-build').replace('port:4180','port:4182'));
