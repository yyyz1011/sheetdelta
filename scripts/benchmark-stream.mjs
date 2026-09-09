import assert from 'node:assert/strict';
import { createWriteStream } from 'node:fs';
import { mkdtemp,rm,stat } from 'node:fs/promises';
import { tmpdir,cpus } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { writeExcelStream } from '../packages/core/dist/excel-stream.js';
import { readExcelStream } from '../packages/core/dist/excel-node.js';
const count=Number(process.argv[2]??100000);assert.ok(Number.isSafeInteger(count)&&count>0&&count<=1048575);
const folder=await mkdtemp(join(tmpdir(),'sheetdelta-benchmark-'));const file=join(folder,'data.xlsx');
console.log(JSON.stringify({node:process.version,cpu:cpus()[0]?.model,rows:count,columns:5}));
let peak=0;const sample=()=>{peak=Math.max(peak,process.memoryUsage().rss);};const timer=setInterval(sample,10);
try{
  async function* rows(){for(let i=0;i<count;i++){if(i%1000===0)sample();yield{id:String(i).padStart(8,'0'),price:i/10,stock:i%100,category:`C${i%20}`,active:true};}}
  const start=performance.now();await pipeline(writeExcelStream(rows(),{columns:['id','price','stock','category','active']}),createWriteStream(file));const written=performance.now();let seen=0;
  for await(const {row,rowNumber} of readExcelStream(file)){assert.equal(row.id,String(seen).padStart(8,'0'));assert.equal(rowNumber,seen+2);seen++;if(seen%1000===0)sample();}
  assert.equal(seen,count);sample();console.log(JSON.stringify({writeMilliseconds:Math.round(written-start),readMilliseconds:Math.round(performance.now()-written),xlsxBytes:(await stat(file)).size,sampledPeakRssMiB:Math.round(peak/1024**2)}));
}finally{clearInterval(timer);await rm(folder,{recursive:true,force:true});}
