import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import ts from 'typescript';
const source=readFileSync(new URL('../src/components/learn-ui/lesson/exercise-plan.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};new Function('exports',compiled)(exports);
const {matchingIndices,shuffleExercise}=exports;
const words=Array.from({length:10},(_,i)=>({id:String(i),word:'word '+i,meaning:'meaning '+i}));
test('mixes two recognition questions with up to five pairs',()=>{
 assert.deepEqual(matchingIndices(words,'practice'),[2,3,4,5,6]);
 assert.deepEqual(matchingIndices(words.slice(0,5),'practice'),[2,3,4]);
});
test('keeps short sessions and assessment quizzes as multiple choice',()=>{
 assert.deepEqual(matchingIndices(words.slice(0,4),'practice'),[]);
 assert.deepEqual(matchingIndices(words,'quiz'),[]);
});
test('rejects ambiguous pair labels and meanings after normalization',()=>{
 const duplicate=words.map(w=>({...w}));duplicate[3].meaning=' MEANING   2 ';
 assert.deepEqual(matchingIndices(duplicate,'practice'),[]);
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
