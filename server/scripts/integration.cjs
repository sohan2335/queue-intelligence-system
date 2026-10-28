// Run only against a fresh seeded verification database; creates sample tickets.
const { spawn } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');
const port=process.env.TEST_PORT || '3003';
const env={...process.env,PORT:port,USE_MOCK:'false',API_BASE:'http://localhost:'+port+'/api'};
const server=spawn(process.execPath,['src/index.js'],{env,stdio:['ignore','ignore','inherit']});
const run=async()=>{
  for(let i=0;i<50;i++){
    if(server.exitCode!==null) throw Error('Test server exited before becoming ready');
    try { const r=await fetch(env.API_BASE+'/health');if(r.ok)break; } catch {}
    if(i===49)throw Error('Test server did not become ready');
    await delay(200);
  }
  const checker=spawn(process.execPath,['scripts/api-smoke.cjs'],{env,stdio:'inherit'});
  const code=await new Promise((resolve,reject)=>{checker.on('exit',resolve);checker.on('error',reject);});
  if(code!==0)throw Error('Integration checks failed');
};
run().catch(err=>{console.error(err.message);process.exitCode=1;}).finally(()=>server.kill());
