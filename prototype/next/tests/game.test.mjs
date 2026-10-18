import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,respond,advance,begin,buy,setPlan,setCareer,setStudy,rates,reincarnate,lifeYear,npcState,persist,restore,equip,buyPerk} from '../game.mjs';
const choose=(g,key)=>assert.equal(respond(g,key),true);
const start=(p='xuan',c='merchant')=>{const g=createGame();choose(g,p);setCareer(g,c);return g;};
function eventDecision(g,path='xuan',help='ignore',method='herbs'){
 const p=g.pending;
 if(p==='intro')return choose(g,path);
 if(p==='materials18')return choose(g,'herbs');
 if(p==='npc')return choose(g,help);
 if(p==='jade')return choose(g,'ok');
 if(p==='materials34')return choose(g,method);
 if(p==='trial')return choose(g,path==='xuan'&&g.life.qi>=900?'qi':g.life.money>=15&&g.life.herbs?'herbs':'retreat');
 if(p==='warning'||p==='past'||p==='vein-warning')return choose(g,'ok');
 if(p==='tide')return choose(g,'face');
 if(p==='vein')return choose(g,'labor');
 throw Error('unexpected pending '+p);
}
function until(g,year,{path='xuan',help='ignore',method='herbs',policy=()=>{}}={}){
 for(let i=0;i<350&&g.status==='playing'&&g.worldYear<year;i++){
  if(g.pending){eventDecision(g,path,help,method);continue;}
  policy(g);advance(g,1);
 }
 assert.ok(g.worldYear>=year||g.status!=='playing',`world ${g.worldYear} ${g.status}`);
 return g;
}
test('年时间预算之和为1，经营计划真实改变资源效率',()=>{
 const a=start(),b=start();setPlan(a,'earn');setPlan(b,'cultivate');let ra=rates(a),rb=rates(b);assert.ok(ra.net>rb.net);assert.ok(ra.qi<rb.qi);assert.ok(ra.xp>rb.xp);
});
test('两营生有不同工资、灵材来源；职业Lv5晋升',()=>{
 const m=start('xuan','merchant'),h=start('xuan','herbal');assert.ok(rates(m).wage>rates(h).wage);until(m,12);until(h,12);assert.ok(m.life.level.merchant>=5);assert.ok(h.life.level.herbal>=5);assert.ok(h.life.herbs>m.life.herbs);
});
test('生活消费有成本，后续效率提升，不产生第二次年度收益',()=>{
 const g=start();advance(g,2);const old=rates(g).qi;assert.ok(buy(g,'food'));assert.ok(rates(g).qi>old);const money=g.life.money;advance(g,1);assert.ok(g.life.money>money);assert.equal(g.worldYear,3);assert.equal(g.life.age,19);
});
test('年度研修独立项目能解锁确切增益',()=>{
 const g=start();setPlan(g,'study');for(let i=0;i<4;i++)advance(g,1);assert.ok(g.life.studied.includes('stillness'));assert.ok(rates(g).qi>0);assert.ok(g.meta.bestStudy.stillness===1);
});
test('玄修×商行与采药都能在灵潮前筑基',()=>{
 for(const career of ['merchant','herbal']){
  const g=start('xuan',career);let done=false;until(g,60,{path:'xuan',policy:x=>{if(x.worldYear===8)buy(x,'food');if(x.worldYear>=20&&x.life.plan!=='cultivate')setPlan(x,'cultivate');if(!done&&x.worldYear>=43&&x.life.realm==='炼气'&&x.life.qi>=1650&&x.life.money>=45&&x.life.herbs>=3)done=begin(x,'foundation');}});
  assert.equal(g.life.realm,'筑基');assert.equal(g.pending,'tide');choose(g,'face');assert.equal(g.world.tide,'survived');assert.equal(g.status,'playing');
 }
});
test('丹修×商行与采药都可稳定炼护脉丹',()=>{
 for(const career of ['merchant','herbal']){
  const g=start('dan',career);let done=false;until(g,60,{path:'dan',policy:x=>{if(x.worldYear>=20&&x.life.plan!=='balance')setPlan(x,'balance');if(!done&&x.worldYear>=40&&x.life.money>=55&&x.life.herbs>=5)done=begin(x,'pill','common');}});
  assert.ok(g.life.pill,'should have pill');choose(g,'face');assert.equal(g.world.tide,'survived');
 }
});
test('灾劫前不足年数的丹方被明确阻止，且不能越过历史检查',()=>{
 const g=start('dan');until(g,58,{path:'dan'});g.life.money=200;g.life.herbs=20;assert.equal(begin(g,'pill','long'),false);assert.match(g.notice,/无法在世界60年/);advance(g,2);assert.equal(g.pending,'tide');choose(g,'face');assert.equal(g.status,'ended');
});
test('世界史只一次，重生保留账户遗物与职业历史但不复制财产',()=>{
 const g=start('xuan');until(g,60,{path:'xuan'});assert.equal(g.pending,'tide');choose(g,'face');assert.equal(g.status,'ended');const record=g.meta.bestCareer.merchant;assert.ok(record>1);assert.ok(reincarnate(g));assert.equal(g.life.id,2);assert.equal(g.worldYear,62);assert.equal(g.life.money,8);assert.equal(g.meta.bestCareer.merchant,record);assert.equal(g.world.tide,'failed');until(g,76);assert.equal(g.world.tide,'failed');assert.ok(g.meta.relics.includes('W01'));
});
test('帮药谷救人形成真实世界NPC年龄，跨世追加有价回响',()=>{
 const g=start('dan','herbal');until(g,22,{path:'dan'});assert.equal(g.pending,'npc');g.life.herbs=Math.max(1,g.life.herbs);g.life.money=20;choose(g,'gu');if(g.pending==='jade')choose(g,'ok');if(g.life.action)advance(g,1);assert.equal(g.world.npc.gu.helped,true);assert.equal(npcState(g,'gu').age,g.worldYear+20);
 // 一直活到首劫或寿尽，不要求本世幸存
 until(g,60,{path:'dan'});if(g.pending==='tide')choose(g,'face');if(g.status==='playing')assert.ok(reincarnate(g));else assert.ok(reincarnate(g));assert.equal(g.life.id,2);
 until(g,74,{path:'dan'});assert.equal(g.pending,'past');const before=g.life.herbs;choose(g,'gu-record');assert.ok(g.life.herbs>before);assert.ok(g.life.studyProgress.herbs>=7);
});
test('不帮NPC则下一世不凭空获得药谷旧约与旧账',()=>{
 const g=start('dan');until(g,60,{path:'dan'});choose(g,'face');reincarnate(g);until(g,74);assert.equal(g.pending,'past');assert.equal(respond(g,'gu-record'),false);choose(g,'ok');
});
test('唯一世界实体在死亡/转世/取回时始终只有一个ID',()=>{
 const g=start('dan');until(g,60,{path:'dan'});assert.equal(g.world.jade,'held');choose(g,'face');assert.equal(g.world.jade,'stashed');reincarnate(g);choose(g,'dan');let before=g.world.jadeId;const l=g.life;l.money=40;assert.ok(begin(g,'jade'));assert.equal(g.world.jade,'held');assert.equal(l.jade,true);assert.equal(g.world.jadeId,before);
});
test('世界年95地方余波同线一次，不伪装成第二次灵潮',()=>{
 const g=start('dan');until(g,60,{path:'dan'});choose(g,'face');reincarnate(g);until(g,95,{path:'dan'});assert.equal(g.pending,'vein');choose(g,'labor');for(let i=0;i<8&&!g.world.veinDone;i++){if(g.pending)eventDecision(g,'dan');else advance(g,1);}assert.equal(g.world.veinDone,true);assert.equal(g.world.vein,'ruined');assert.equal(g.world.tide,'failed');
});
test('存档读回，错误存档安全回到新开局',()=>{
 const g=start();advance(g,7);assert.equal(restore(persist(g)).worldYear,7);assert.equal(restore('{bad').pending,'intro');
});
test('买RP传承需要真实RP，不能无中生有',()=>{
 const g=start();assert.equal(buyPerk(g,'auto'),false);g.meta.rp=6;assert.ok(buyPerk(g,'auto'));assert.equal(g.meta.rp,1);assert.equal(buyPerk(g,'auto'),false);
});
test('2槽遗物不能重复占位，手动换装不复制物件',()=>{
 const g=start();g.meta.relics.push('W02','G01');assert.ok(equip(g,'W02'));assert.equal(equip(g,'G01'),false);assert.ok(equip(g,'W01'));assert.ok(equip(g,'G01'));assert.equal(g.meta.equipped.length,2);
});
test('跨行动年份只加一次年龄与世界年，关键事件会中断行动',()=>{
 const g=start('xuan');until(g,21,{path:'xuan'});g.life.money=50;g.life.herbs=3;assert.equal(g.life.id,1);const oldAge=g.life.age;assert.ok(begin(g,'explore'));assert.equal(g.worldYear,22);assert.equal(g.life.age-oldAge,1);assert.equal(g.pending,'npc');assert.equal(g.life.action.remaining,2);choose(g,'ignore');advance(g,2);assert.equal(g.worldYear,24);assert.equal(g.pending,'jade');choose(g,'ok');assert.equal(g.life.action,null);assert.equal(g.worldYear,24);
});
test('世界年160未开发时安全暂停，不擅自发RP或杀死角色',()=>{
 const g=start('xuan');g.worldYear=159;g.life.birthYear=159;g.life.age=16;g.life.lifeCap=240;g.world.tide='survived';g.world.veinDone=true;g.world.warning=true;advance(g,1);assert.equal(g.status,'boundary');assert.equal(g.meta.rp,0);assert.equal(reincarnate(g),false);
});
test('浮潮散修与药谷学徒出身会改变起始地区职业和材料，均能选两种主修',async()=>{
 const {setOrigin}=await import('../game.mjs');const a=createGame(),b=createGame();
 assert.ok(setOrigin(b,'herbal'));assert.equal(b.life.region,'valley');assert.equal(b.life.career,'herbal');assert.equal(b.life.herbs,1);
 assert.equal(setOrigin(a,'market'),true);choose(a,'xuan');choose(b,'dan');assert.equal(setOrigin(b,'market'),false);
});
test('第二世历史商约改变收入结构，但不自动给予第一世现金',()=>{
 const g=start();g.world.npc.shen.helped=true;g.world.tide='failed';g.worldYear=65;g.status='ended';g.life.age=80;g.meta.bestCareer.merchant=7;
 assert.ok(reincarnate(g));choose(g,'xuan');const boosted=rates(g).wage;
 const plain=createGame();choose(plain,'xuan');plain.worldYear=g.worldYear;plain.life.id=g.life.id;plain.life.birthYear=g.life.birthYear;assert.ok(boosted>rates(plain).wage);
 assert.equal(g.life.money,8);
});
