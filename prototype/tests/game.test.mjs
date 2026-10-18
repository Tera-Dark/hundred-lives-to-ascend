import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, advance, choose, lifeYear, startAction, reincarnate, voluntarilyEnd, buyUpgrade, cultivationRate, canAction, equipRelic, getDialog, hydrateSave} from '../game.mjs';

function select(g,path='xuan'){assert.equal(g.dialog,'path');assert.equal(choose(g,path),true);return g;}
function stepTo(g,y,optionResolver){let guard=0;while(g.worldYear<y&&g.status==='playing'&&guard++<300){if(g.dialog){const op=optionResolver?.(g.dialog,g)||({event18:'herbs',event24:'jade',event34:'insight',trial39:'retreat',warning45:'ack',tide60:'resolve',warning92:'ack',vein95:'labor',lifeline:'relic'})[g.dialog];assert.ok(op,`missing option for ${g.dialog}`);assert.ok(choose(g,op),`${g.dialog} choice`);}else advance(g,1);}assert.ok(guard<300, 'time progress deadlock');}

test('model initializes and persists safely',()=>{const g=createGame();assert.equal(g.worldYear,0);assert.equal(g.life.age,16);assert.equal(g.dialog,'path');const copy=hydrateSave(JSON.stringify(g));assert.equal(copy.worldYear,0);assert.equal(hydrateSave('{bad').worldYear,0);});

test('life-relative events, year production and safe event pause',()=>{
 const g=select(createGame());const initial=cultivationRate(g);assert.equal(initial,15);
 advance(g,30);assert.equal(g.worldYear,18);assert.equal(g.dialog,'event18');assert.ok(g.life.realm==='炼气');
 assert.equal(choose(g,'herbs'),true);assert.equal(g.worldYear,20);assert.equal(g.life.herbs,3);
 advance(g,50);assert.equal(g.worldYear,24);assert.equal(g.dialog,'event24');choose(g,'jade');assert.equal(g.world.jadePlace,'held');assert.ok(g.meta.relics.includes('W01'));
 advance(g,50);assert.equal(g.worldYear,34);assert.equal(g.dialog,'event34');choose(g,'insight');assert.equal(g.worldYear,36);
 advance(g,50);assert.equal(g.worldYear,39);assert.equal(g.dialog,'trial39');assert.equal(choose(g,'retreat'),true);assert.equal(g.worldYear,41);
 advance(g,20);assert.equal(g.worldYear,45);assert.equal(g.dialog,'warning45');
});

test('foundational first-life success requires real preparation; world 60 resolves once',()=>{
 const g=select(createGame(),'xuan');
 stepTo(g,18);choose(g,'herbs');
 // Closely follows an intended cultivation route.
 while(g.worldYear<24){if(g.dialog)choose(g,'jade');else advance(g,1);}
 if(g.dialog==='event24')choose(g,'jade');
 // Manual plan: buy focus, invest in xuan if useful, harvest insight at world 34.
 if(canAction(g,'focus'))startAction(g,'focus');
 if(canAction(g,'xuan'))startAction(g,'xuan');
 stepTo(g,34);if(g.dialog==='event34')choose(g,'insight');
 stepTo(g,39);if(g.dialog==='trial39')choose(g,'retreat');
 stepTo(g,45);if(g.dialog==='warning45')choose(g,'ack');
 for(let i=0;i<20&&g.worldYear<60;i++){
   if(g.dialog)break;
   if(canAction(g,'foundation'))startAction(g,'foundation');
   else advance(g,1);
 }
 assert.equal(g.worldYear,60);assert.equal(g.dialog,'tide60');
 const before=g.life.realm;
 choose(g,'resolve');
 if(before==='筑基'){assert.equal(g.status,'playing');assert.equal(g.world.resolved.filter(x=>x==='tide60').length,1);}
 else assert.equal(g.status,'ended');
});

test('failure rewards, repeated history suppression and unique inherited jade',()=>{
 const g=select(createGame(),'dan');
 stepTo(g,60,(kind)=>({event18:'herbs',event24:'jade',event34:'herbs',trial39:'retreat',warning45:'ack'})[kind]);
 assert.equal(g.dialog,'tide60');assert.equal(g.life.realm,'炼气');
 choose(g,'resolve');assert.equal(g.status,'ended');assert.equal(g.world.jadePlace,'stash');
 assert.equal(g.meta.reports.length,1);assert.ok(g.meta.rp>=3);
 const priorRp=g.meta.rp;
 assert.equal(reincarnate(g),true);assert.equal(g.worldYear,62);assert.equal(g.life.id,2);
 assert.equal(g.world.jadeId,'HEART-JADE-001');
 select(g,'xuan');
 assert.equal(buyUpgrade(g,'meridian'),false); // purchases only between lives
 stepTo(g,80,(kind)=>({lifeline:'herbs',event18:'stones'})[kind]);
 assert.equal(g.worldYear,80);assert.equal(g.dialog,'event18');
 assert.equal(g.world.resolved.filter(x=>x==='tide60').length,1);
 assert.ok(g.meta.rp===priorRp);
 // Given enough stones, exactly the original jade instance is recoverable.
 g.life.stones=20;choose(g,'stones');
 // The age-24 event at world86 must not be skipped by a 4-year search.
 assert.equal(startAction(g,'find-jade'),false);
 stepTo(g,86,(kind)=>({event24:'herbs'})[kind]);
 if(g.dialog==='event24')choose(g,'herbs');
 assert.equal(startAction(g,'find-jade'),true);
 assert.equal(g.world.jadePlace,'held');assert.equal(g.world.jadeId,'HEART-JADE-001');
});

test('no crossing the 60-year deadline with a five-year unfinished pill',()=>{
 const g=select(createGame(),'dan');g.worldYear=58;g.life.age=74;g.life.realm='炼气';g.life.stones=100;g.life.herbs=8;
 assert.equal(canAction(g,'pill-long'),false);
 assert.equal(startAction(g,'pill-long'),false);
 advance(g,5);assert.equal(g.worldYear,60);assert.equal(g.dialog,'tide60');
 assert.equal(g.life.pill,null);
});

test('dan longevity does not stack and foundation never lowers life cap',()=>{
 const g=select(createGame(),'dan');g.worldYear=25;g.life.age=41;g.life.flags.push('event24');g.life.realm='炼气';g.life.cultivation=2000;g.life.stones=100;g.life.herbs=6;
 assert.equal(startAction(g,'pill-long'),true);assert.equal(g.life.lifeCap,140);assert.ok(g.life.pill);
 assert.equal(canAction(g,'pill-long'),false);
 assert.equal(startAction(g,'foundation'),false); // not enough stones after expensive pill
 g.life.stones=100;g.life.herbs=3;
 assert.equal(startAction(g,'foundation'),true);assert.equal(g.life.lifeCap,240);
});

test('relic loadout max two and same item cannot duplicate',()=>{
 const g=select(createGame());g.meta.relics=['W01','W02','G01'];assert.equal(equipRelic(g,'W01'),true);assert.equal(equipRelic(g,'W02'),true);assert.equal(equipRelic(g,'G01'),false);
 assert.equal(equipRelic(g,'W01'),true);assert.equal(equipRelic(g,'G01'),true);assert.deepEqual(g.meta.equipped,['W02','G01']);
});

test('partial RP economy cannot be bought in active life; purchases idempotent',()=>{
 const g=select(createGame());g.meta.rp=15;
 assert.equal(buyUpgrade(g,'meridian'),false);
 assert.equal(voluntarilyEnd(g),false);
 g.worldYear=30;g.life.age=46;
 assert.equal(voluntarilyEnd(g),true);
 const rp=g.meta.rp;
 assert.equal(buyUpgrade(g,'meridian'),true);assert.equal(g.meta.rp,rp-3);
 assert.equal(buyUpgrade(g,'meridian'),false);
 assert.equal(g.meta.upgrades.filter(x=>x==='meridian').length,1);
 assert.equal(reincarnate(g),true);
});

test('world 160 is safe paused, not a fake death or RP award',()=>{
 const g=select(createGame());g.worldYear=159;g.life.age=18;g.life.birthWorldYear=157;g.world.resolved=['tide60','vein95'];g.dialog=null;
 const rp=g.meta.rp;advance(g,9);
 assert.equal(g.worldYear,160);assert.equal(g.status,'boundary');assert.equal(g.meta.rp,rp);assert.equal(g.meta.reports.length,0);
});

test('regional event 95 stays queued across a life-relative event 34',()=>{
 const g=select(createGame(),'xuan');
 // Test second life born at world62: personal year34 is world96, inside 95–98 region response.
 g.worldYear=94;g.world.resolved=['tide60','warning45','warning92'];g.life.birthWorldYear=62;g.life.id=2;g.life.age=48;g.life.realm='炼气';g.life.lifeCap=120;g.life.stones=60;g.life.herbs=3;
 for(const flag of ['event18','event24','lifeline'])g.life.flags.push(flag);
 advance(g,1);assert.equal(g.dialog,'vein95');
 assert.equal(choose(g,'medicine'),true);
 assert.equal(g.dialog,'event34');
 assert.ok(g.life.action?.key==='vein-medicine');
 assert.equal(choose(g,'insight'),true);
 assert.equal(g.life.action?.key,'vein-medicine'); // parent action resumes after the nested life event
 for(let i=0;i<8&&g.world.vein==='unchanged';i++){
   if(g.dialog){assert.fail('unexpected modal '+g.dialog)}
   advance(g,1);
 }
 assert.equal(g.world.vein,'stable');
 assert.equal(g.world.resolved.filter(x=>x==='vein95').length,1);
});
