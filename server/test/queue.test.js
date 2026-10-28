import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as svc from '../src/services/queue.js';
const seed = createRequire(import.meta.url)('../src/mock/data.json');
const fixture = () => structuredClone(seed);

test('historical waiting records do not fill today’s live board',()=>{
 const db=fixture();assert.equal(svc.getCounterBoard(db).reduce((n,c)=>n+c.waitingCount,0),0);
 assert.ok(svc.getCounterBoard(db).every(c=>c.nowServing===null));
});
test('invalid times and inactive locations cannot issue tickets',()=>{
 const db=fixture();
 assert.throws(()=>svc.prepareTicket(db,{visitor_id:1,counter_id:101,arrival_time:'12:99'}),/HH:MM/);
 db.locations[0].STATUS='Inactive';
 assert.throws(()=>svc.prepareTicket(db,{visitor_id:1,counter_id:101,arrival_time:'12:00'}),/inactive/);
});
test('duplicate tickets and full queues are rejected',()=>{
 const db=fixture();db.queue_entries.push({ENTRY_ID:3000,VISITOR_ID:1,COUNTER_ID:101,ENTRY_DATE:svc.todayStr(),ARRIVAL_TIME:'12:00',STATUS:'Waiting',WAIT_MINUTES:0});
 assert.throws(()=>svc.prepareTicket(db,{visitor_id:1,counter_id:101,arrival_time:'12:00'}),/already holds/);
 db.counters[0].QUEUE_LIMIT=1;
 assert.throws(()=>svc.prepareTicket(db,{visitor_id:2,counter_id:101,arrival_time:'12:00'}),/limit/);
});
test('ticket lookup is owner-scoped and selects latest ID-number match',()=>{
 const db=fixture(); db.queue_entries.push({...db.queue_entries[0],ENTRY_ID:4001});
 assert.equal(svc.lookupTicket(db,'ID1001',1).ENTRY_ID,4001);
 assert.equal(svc.lookupTicket(db,'ID1001',2),null);
 assert.notEqual(svc.tokenNumber(db,db.queue_entries[0]),svc.tokenNumber(db,db.queue_entries.at(-1)));
});
test('visitor board exposes tokens without visitor identifiers',()=>{
 const db=fixture();db.queue_entries[0].ENTRY_DATE=svc.todayStr();db.queue_entries[0].STATUS='Waiting';
 const token=svc.getCounterBoard(db,{hideNames:true})[0].nextInLine;
 assert.ok(token.TOKEN_NUMBER);assert.equal(token.VISITOR_ID,undefined);assert.equal(token.visitor,undefined);
});
