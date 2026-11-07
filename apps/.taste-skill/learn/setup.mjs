import {readFileSync,writeFileSync} from 'node:fs';
let source=readFileSync('.taste-skill/home-fixture/main.jsx','utf8');
source=source.replace("import {HomeDashboard} from '../../web/src/components/homepage-ui/HomeDashboard';","import {LearningPathView} from '../../web/src/components/learn-ui/LearningPath';");
const a=source.indexOf('function Screen()');
const b=source.indexOf('const root=',a);
source=source.slice(0,a)+`
const path={language_code:'om',total_words:60,levels:[{id:'beginner',title:'First conversations',subtitle:'Everyday words, familiar faces',total_words:40,lessons:['Greetings','Family','Food and drinks','Everyday'].map((title,i)=>({id:'lesson-'+i,title,subtitle:'Words for everyday conversations',word_count:10,order:i}))},{id:'next',title:'Keep the conversation going',subtitle:'Build on what you know',total_words:20,lessons:[{id:'later',title:'At the market',subtitle:'Buying and selling',word_count:20,order:0}]}]};
const progress={completed_lesson_keys:params.get('state')==='empty'?[]:['lesson-0'],in_progress:[],lessons_completed:1,correct_answers:8,questions_answered:10};
function Screen(){return <SidebarProvider defaultOpen><AppSidebar/><SidebarInset><header className="flex h-16 items-center gap-3 px-6"><SidebarTrigger/><strong>Fidel</strong><span className="ml-auto text-xs">Design preview · sample data</span></header><main><div className="fidel-learn"><LearningPathView path={path} progress={progress}/></div></main></SidebarInset><MobileBottomNavigation/></SidebarProvider>}
`+source.slice(b);
writeFileSync('.taste-skill/learn-fixture/main.jsx',source);
let preview=readFileSync('.taste-skill/home-preview.mjs','utf8').replaceAll('home-fixture','learn-fixture').replaceAll('home-preview-build','learn-preview-build').replace('port:4178','port:4179');
writeFileSync('.taste-skill/learn-preview.mjs',preview);
