const base=process.env.API_BASE || 'http://localhost:3003/api';
let count=0;
async function call(method,path,body,token,expected=200){
 const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
 const data=await res.json();if(res.status!==expected)throw Error(method+' '+path+' expected '+expected+' got '+res.status+' '+JSON.stringify(data));
 count++;return data;
}
(async()=>{
 const health=await call('GET','/health');if(health.mode!=='mysql')throw Error('Not MySQL');
 await call('GET','/counters',null,null,401);
 await call('POST','/auth/login',{role:'admin',username:'admin',password:'wrong'},null,401);
 const admin=(await call('POST','/auth/login',{role:'admin',username:process.env.ADMIN_USERNAME || 'admin',password:process.env.ADMIN_PASSWORD || 'admin123'})).token;
 const user=(await call('POST','/auth/login',{role:'user',idNumber:'ID1001',lastName:'Kumar'})).token;
 const other=(await call('POST','/auth/login',{role:'user',idNumber:'ID1003',lastName:'Sharma'})).token;
 for(const p of ['/auth/me','/counters','/locations','/tokens/board','/visitors','/queue-entries','/predictions','/stats/dashboard','/queries'])await call('GET',p,null,admin);
 for(let i=1;i<=10;i++){const r=await call('GET','/queries/'+i,null,admin);if(r.source!=='mysql')throw Error('Explorer not MySQL');}
 for(const p of ['/visitors','/queue-entries','/predictions','/stats/dashboard','/queries'])await call('GET',p,null,user,403);
 await call('POST','/me/tickets',{counter_id:101,arrival_time:'12:99'},user,400);
 await call('POST','/me/tickets',{counter_id:999,arrival_time:'12:00'},user,400);
 const ticket=await call('POST','/me/tickets',{counter_id:101,arrival_time:'12:00'},user,201);
 await call('POST','/me/tickets',{counter_id:101,arrival_time:'12:00'},user,400);
 await call('PATCH','/me/tickets/'+ticket.entry.ENTRY_ID+'/cancel',null,other,404);
 await call('GET','/tokens/lookup/'+ticket.entry.TOKEN_NUMBER,null,other,404);
 await call('GET','/tokens/lookup/'+ticket.entry.TOKEN_NUMBER,null,user);
 const calling=await call('PATCH','/tokens/'+ticket.entry.ENTRY_ID+'/status',{status:'Calling'},admin);
 if(calling.STATUS!=='Calling')throw Error('Call failed');
 await call('PATCH','/me/tickets/'+ticket.entry.ENTRY_ID+'/cancel',null,user,400);
 await call('PATCH','/tokens/'+ticket.entry.ENTRY_ID+'/status',{status:'Served'},admin);
 await call('PATCH','/tokens/'+ticket.entry.ENTRY_ID+'/status',{status:'Waiting'},admin,400);
 const cancel=await call('POST','/me/tickets',{counter_id:102,arrival_time:'12:00'},user,201);
 await call('PATCH','/me/tickets/'+cancel.entry.ENTRY_ID+'/cancel',null,user);
 const parallel=await Promise.all([0,1].map(()=>fetch(base+'/tokens/dispense',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+admin},body:JSON.stringify({visitor_id:2,counter_id:101,arrival_time:'12:00'})})));
 const statuses=parallel.map(r=>r.status).sort();if(String(statuses)!=='201,400')throw Error('Concurrent duplicate failure '+statuses);
 const second=await call('POST','/queue-entries',{visitor_id:3,counter_id:101,arrival_time:'12:00'},admin,201);
 const queue=await call('GET','/queue-entries?status=Waiting&counter_id=101',null,admin);
 const first=queue.find(e=>e.VISITOR_ID===2);
 await call('PATCH','/tokens/'+first.ENTRY_ID+'/status',{status:'Calling'},admin);
 await call('PATCH','/tokens/'+second.entry.ENTRY_ID+'/status',{status:'Calling'},admin);
 const board=await call('GET','/tokens/board',null,user);
 if(board[0].nowServing.ENTRY_ID!==second.entry.ENTRY_ID || board[0].nowServing.VISITOR_ID!==undefined)throw Error('Board state/privacy failure');
 const persisted=await call('GET','/me/tickets',null,user);
 if(!persisted.some(e=>e.ENTRY_ID===ticket.entry.ENTRY_ID&&e.STATUS==='Served'))throw Error('Persistence read failed');
 const report={checks:count+2,mode:health.mode,database:health.database,servedTicket:ticket.entry.ENTRY_ID,cancelledTicket:cancel.entry.ENTRY_ID,callingTicket:second.entry.ENTRY_ID,concurrentStatuses:statuses};
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.message);process.exit(1);});
