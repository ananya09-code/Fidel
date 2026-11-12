import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import ts from 'typescript';
const source=readFileSync(new URL('../src/components/learn-ui/lesson/exercise-plan.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};new Function('exports',compiled)(exports);
const {matchingIndices,listeningIndices,shuffleExercise}=exports;
const words=Array.from({length:10},(_,i)=>({id:String(i),word:'word '+i,meaning:'meaning '+i}));
test('mixes two recognition questions with up to five pairs',()=>{
 assert.deepEqual(matchingIndices(words,'practice'),[2,3,4,5,6]);
 assert.deepEqual(matchingIndices(words.slice(0,5),'practice'),[2,3,4]);
});
test('keeps short sessions as multiple choice and scales matching in reviews',()=>{
 assert.deepEqual(matchingIndices(words.slice(0,4),'practice'),[]);
 assert.deepEqual(matchingIndices(words.slice(0,7),'quiz'),[]);
 assert.deepEqual(matchingIndices(words,'quiz'),[2,3,4]);
 const twenty=Array.from({length:20},(_,i)=>({id:String(i),word:'word '+i,meaning:'meaning '+i}));
 assert.deepEqual(matchingIndices(twenty,'quiz'),[2,3,4,5,6]);
});
test('rejects ambiguous pair labels and meanings after normalization',()=>{
 const duplicate=words.map(w=>({...w}));duplicate[3].meaning=' MEANING   2 ';
 assert.deepEqual(matchingIndices(duplicate,'practice'),[]);
 assert.deepEqual(matchingIndices(duplicate,'quiz'),[3,4,5]);
 duplicate[3].meaning='unique';duplicate[3].word=' WORD  2 ';
 assert.deepEqual(matchingIndices(duplicate,'practice'),[]);
 duplicate[3].word='different';duplicate[3].id=duplicate[2].id;
 assert.deepEqual(matchingIndices(duplicate,'practice'),[]);
});
test('shuffle is stable across a resumed session and never mutates input',()=>{
 const before=words.map(w=>w.id);const a=shuffleExercise(words,'same-session');
 assert.deepEqual(a,shuffleExercise(words,'same-session'));
 assert.deepEqual(words.map(w=>w.id),before);
 assert.deepEqual(a.map(w=>w.id).sort(),before.slice().sort());
});
test('listening uses approved audio outside matching and stays stable on resume',()=>{
 const withAudio=words.map((word,index)=>({...word,audioUrl:[0,3,7].includes(index)?`/audio/${index}`:null}));
 assert.deepEqual(listeningIndices(withAudio,'practice'),[7]);
 assert.deepEqual(listeningIndices(withAudio,'practice'),[7]);
 assert.deepEqual(listeningIndices(withAudio,'quiz'),[0,7]);
 assert.deepEqual(listeningIndices(words,'practice'),[]);
 assert.deepEqual(listeningIndices(withAudio.slice(0,1),'practice'),[]);
});
test('twenty review words become five listening, five matching, ten choices',()=>{
 const twenty=Array.from({length:20},(_,i)=>({id:String(i),word:'word '+i,meaning:'meaning '+i,audioUrl:`/audio/${i}`}));
 const matching=matchingIndices(twenty,'quiz');
 const listening=listeningIndices(twenty,'quiz');
 assert.equal(matching.length,5);
 assert.equal(listening.length,5);
 assert.equal(listening.filter(index=>matching.includes(index)).length,0);
 assert.equal(twenty.length-matching.length-listening.length,10);
 const ten=twenty.slice(0,10);
 assert.equal(matchingIndices(ten,'quiz').length,3);
 assert.equal(listeningIndices(ten,'quiz').length,2);
 assert.equal(listeningIndices(ten.map(word=>({...word,audioUrl:null})),'quiz').length,0);
});
