import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { reconcileInventory } from '../examples/node/reconcile-inventory.mjs';
const root=await mkdtemp(join(tmpdir(),'sheetdelta-inventory-'));
try {
  const before=join(root,'before.csv'),after=join(root,'after.csv'),out=join(root,'report.csv');
  await writeFile(before,'sku,quantity\n001, 10 \n002,2\n004,4');await writeFile(after,'sku,quantity\n001,12\n003,3\n004,4');
  assert.deepEqual(await reconcileInventory(before,after,out),{added:1,removed:1,changed:1,unchanged:1});
  const expected=await readFile(out,'utf8');assert.match(expected,/"001","changed","10","12"/);
  await assert.rejects(reconcileInventory(before,after,out),{code:'EEXIST'});assert.equal(await readFile(out,'utf8'),expected);
  await writeFile(after,'sku,quantity\n001,bad');await assert.rejects(reconcileInventory(before,after,join(root,'failed.csv')),/Invalid inventory record/);
  assert.deepEqual((await readdir(root)).sort(),['after.csv','before.csv','report.csv']);
  console.log('Inventory CSV -> clean -> validate -> stream diff -> atomic report; failure cleanup and existing output protection: PASS');
} finally {await rm(root,{recursive:true,force:true});}
