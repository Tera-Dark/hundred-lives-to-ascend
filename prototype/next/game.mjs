/** 百世劫录 · 法财侣地最小可玩版。纯状态机、无 DOM/网络依赖。 */
export const SAVE_VERSION = 2;
export const PLANS = Object.freeze({
  earn:{name:'营生优先',work:.55,train:.30,study:.15},
  balance:{name:'均衡养道',work:.40,train:.45,study:.15},
  cultivate:{name:'潜心苦修',work:.15,train:.70,study:.15},
  study:{name:'研悟攻关',work:.15,train:.30,study:.55},
});
export const CAREERS={merchant:{name:'坊市商行',roles:['坊市学徒','行脚灵商']},herbal:{name:'青药采集',roles:['识草学徒','山野采药客']}};
export const STUDIES={stillness:{name:'静息诀',cost:16,desc:'修为生产+12%',effect:'qi'},trade:{name:'坊市算经',cost:13,desc:'商行工资+15%，职业经验+10%',effect:'merchant'},herbs:{name:'辨草小解',cost:13,desc:'合法采材增益+1，草药经营更可靠',effect:'herbal'}};
export const RELICS={W01:{name:'旧纹吐纳玉',desc:'修行效率+3%',bonus:'qi'},W02:{name:'山药篓',desc:'一次采材选择额外+1灵材',bonus:'herb'},G01:{name:'凝息珠',desc:'修行效率+5%',bonus:'qi'},G03:{name:'旧井指针',desc:'寻回前世实体少耗2年',bonus:'trace'}};
const copy=x=>JSON.parse(JSON.stringify(x));
const round=x=>Math.round(x*100)/100;
const has=(a,v)=>a.includes(v);
const named={gu:'顾南枝',shen:'沈望川'};
function life(id,yr){return {id,birthYear:yr,age:16,lifeCap:80,realm:'凡人',qi:0,money:8,herbs:0,path:null,career:'merchant',level:{merchant:1,herbal:1},xp:{merchant:0,herbal:0},plan:'earn',study:'stillness',studyProgress:{stillness:0,trade:0,herbs:0},studied:[],home:'hut',food:'plain',region:'town',relation:null,flags:[],herbWork:.0,action:null,pill:null,jade:false,origin:'market',trialToken:0,focus:false,foundationReduction:0,decisions:[],trialResolved:false};}
export function createGame(){const g={version:SAVE_VERSION,worldYear:0,status:'playing',pending:'intro',life:life(1,0),world:{tide:'waiting',warning:false,vein:'untouched',veinDone:false,veinWarning:false,jade:'hidden',jadeId:'HEART-JADE-001',npc:{gu:{birth:-20,cap:90,blessed:false,helped:false},shen:{birth:-18,cap:85,helped:false}},flags:[]},meta:{rp:0,bestCareer:{merchant:1,herbal:1},bestStudy:{},perks:[],relics:['W01'],equipped:['W01'],achievements:[],lives:[]},journal:[],notice:'选择这一世的营生与主修。'};log(g,'照世碑苏醒。浮岚界仍是一个需要谋生的世界。','world');return g;}
export const lifeYear=g=>g.worldYear-g.life.birthYear;
function log(g,text,type='story'){g.journal.push({seq:(g.journal.at(-1)?.seq||0)+1,worldYear:g.worldYear,age:g.life.age,lifeId:g.life.id,text,type});if(g.journal.length>180)g.journal.splice(0,g.journal.length-180);g.notice=text;}
function mark(l,x){if(!has(l.flags,x))l.flags.push(x)}
function achievement(g,id){if(!has(g.meta.achievements,id))g.meta.achievements.push(id)}
function have(g,perk){return has(g.meta.perks,perk)}
function equipped(g,id){return has(g.meta.equipped,id)}
export function careerRole(g,career=g.life.career){return CAREERS[career].roles[g.life.level[career]>=5?1:0]}
export function npcState(g,id){const c=g.world.npc[id];const age=g.worldYear-c.birth;const alive=age<c.cap+(id==='gu'&&c.blessed?30:0);return {name:named[id],age,alive,status:alive?age>=70?'年迈':'在世':'已故',helped:c.helped};}
export function rates(g){const l=g.life,p=PLANS[l.plan],prior=g.meta.bestCareer[l.career]||1;const history=1+Math.min(.3,Math.floor((prior-1)/5)*.05);const balance=have(g,'learn')?1.1:1;const valleyState=g.world.vein==='stable'?1.12:g.world.vein==='ruined'?.76:1;const careerArea=l.career==='merchant'?(l.region==='town'?1:.68):(l.region==='valley'?1.3*valleyState:.78);const historicalContract=l.id>1&&g.world.npc.shen.helped&&l.career==='merchant'?1.06:1;let wage=(l.career==='merchant'?7:5)+(l.level[l.career]>=5?4:0);if(l.career==='merchant'&&has(l.studied,'trade'))wage*=1.15;let earn=round(p.work*wage*careerArea*historicalContract);let upkeep=(l.food==='spirit'?.7:0)+(l.home==='cottage'?.9:0);let luxury=(l.food==='spirit'?1.08:1)*(l.home==='cottage'?1.10:1);
const base=l.realm==='凡人'?55:l.realm==='炼气'?125:190;let qiRelic=0;if(equipped(g,'W01'))qiRelic+=.03;if(equipped(g,'G01'))qiRelic+=.05;let qi=round(base*p.train*luxury*(l.region==='valley'?(g.world.vein==='stable'?1.13:g.world.vein==='ruined'?1:1.07):1)*(has(l.studied,'stillness')?1.12:1)*(l.path==='xuan'?1.06:1)*(have(g,'meridian')?1.15:1)*(1+qiRelic));let xp=round(p.work*24*history*balance*(has(l.studied,'trade')&&l.career==='merchant'?1.10:1));let research=round(p.study*18*(l.home==='cottage'?1.10:1)*(g.meta.bestStudy[l.study]||0?1.08:1));let gather=l.career==='herbal'?round(p.work*.30*(l.region==='valley'?1.35*valleyState:1)*(has(l.studied,'herbs')?1.20:1)*(l.id>1&&g.world.npc.gu.helped?1.1:1)):0;
return {wage:earn,upkeep,net:round(earn-upkeep),qi,xp,research,gather,history:round(history)};}
function tryQi(g){const l=g.life;if(l.realm==='凡人'&&l.qi>=180){l.qi=round(l.qi-180);l.realm='炼气';l.lifeCap=Math.max(120,l.lifeCap);achievement(g,'first-qi');log(g,'引气入体，踏入炼气，寿元提升至120岁。','breakthrough');}}
function addStudy(g,amount){const l=g.life,id=l.study;if(has(l.studied,id))return; l.studyProgress[id]=round(l.studyProgress[id]+amount);if(l.studyProgress[id]>=STUDIES[id].cost){l.studied.push(id);g.meta.bestStudy[id]=Math.max(g.meta.bestStudy[id]||0,1);const next=[l.career==='merchant'?'trade':'herbs','stillness','trade','herbs'].find(k=>!has(l.studied,k));if(next)l.study=next;log(g,`研习完成《${STUDIES[id].name}》：${STUDIES[id].desc}。${next?'下一项研习已自动安排。':''}`,'study');}}
function revenue(g){const l=g.life;if(l.action){const u=(l.food==='spirit'?.7:0)+(l.home==='cottage'?.9:0);l.money=round(l.money-u);if(l.money<0){l.money=0;l.food='plain';l.home='hut';log(g,'维持费用不足，自动改用朴素灵食与借宿棚屋。','economy');}return;}
const r=rates(g);l.qi=round(l.qi+r.qi);l.money=round(l.money+r.net);if(l.money<0){l.money=0;l.food='plain';l.home='hut';log(g,'维护费用超出收入，生活条件降档，未产生债务。','economy');}
l.xp[l.career]=round(l.xp[l.career]+r.xp);let levelUps=0;while(levelUps++<20&&l.xp[l.career]>=10+l.level[l.career]*6){l.xp[l.career]=round(l.xp[l.career]-(10+l.level[l.career]*6));l.level[l.career]++;if(l.level[l.career]===5){log(g,`${CAREERS[l.career].name}晋升至「${careerRole(g)}」！全职工资上涨，并开启新的经营资格。`,'career');}}
addStudy(g,r.research);l.herbWork+=r.gather;while(l.herbWork>=1){l.herbWork-=1;l.herbs++;}tryQi(g);}
function resolveAction(g){const l=g.life,a=l.action;if(!a||a.remaining>0||g.pending||g.status!=='playing')return; l.action=null;switch(a.id){
case'foundation':l.realm='筑基';l.lifeCap=Math.max(l.lifeCap,240);achievement(g,'first-foundation');log(g,'道基已成，寿元上限达到240岁。','breakthrough');break;
case'pill':l.pill=a.variant;if(a.variant==='long')l.lifeCap=Math.max(l.lifeCap,140);log(g,`炼成「${{common:'护脉丹',economy:'省材护脉丹',long:'驻元护脉丹'}[a.variant]}」，获得一次灵潮防护。`,'action');break;
case'move':l.region=a.region;log(g,`迁居${a.region==='town'?'浮潮集':'青药谷南麓'}。工作机会与修行效率随地区改变。`,'world');break;
case'gu_help':g.world.npc.gu.helped=true;g.world.npc.gu.blessed=true;l.relation='gu';mark(l,'npc-helped');log(g,'顾南枝与你修好了药圃，留下了一份彼此认可的药谷旧约。','npc');break;
case'shen_help':g.world.npc.shen.helped=true;l.relation='shen';mark(l,'npc-helped');log(g,'沈望川把你们的名字写进商号账本，许诺来日互相照应。','npc');break;
case'explore':if(!has(g.meta.relics,'G01')){g.meta.relics.push('G01');if(g.meta.equipped.length<2)g.meta.equipped.push('G01');log(g,'荒谷历练获得「凝息珠」，收录灵藏图谱，可在下世继续携带。','relic');}else{l.herbs++;log(g,'探索收获一份灵材。','explore');}break;
case'jade':if(g.world.jade==='stashed'){g.world.jade='held';l.jade=true;if(!has(g.meta.relics,'G03'))g.meta.relics.push('G03');log(g,`你找到了前世旧玉，器物编号${g.world.jadeId}始终只有一个。`,'legacy');}break;
case'xuan':l.foundationReduction=140;mark(l,'xuan-used');log(g,'推演完成：下一次筑基所需修为减少140。但它并不一定比直接突破更快。','action');break;
case'focus':l.focus=true;log(g,'专注吐纳法入门；今后修行基础效率提高。','study');break;
case'vein-cult':case'vein-med':g.world.vein='stable';g.world.veinDone=true;log(g,'你参与修复余潮断脉，后世的药谷还将记得这片灵脉。','world');break;
case'vein-leave':g.world.vein='ruined';g.world.veinDone=true;log(g,'你选择离开断脉地区。当地衰败，但保住了继续修行的机会。','world');break;
case'trial-boon':l.qi+=120;log(g,'心定印转为修为感悟+120，仅本世一次。','trial');break;
case'trial-herb':l.herbs++;log(g,'心定印换到灵材+1，仅本世一次。','trial');break;
}}
const worldEvent=(g,key)=>g.world.flags.includes(key);
function event(g){if(g.pending||g.status!=='playing')return;let y=lifeYear(g),w=g.worldYear,l=g.life;
if(w===60&&g.world.tide==='waiting'){g.pending='tide';return;}
if(w===95&&!g.world.veinDone){g.pending='vein';return;}
if(w>=160){g.status='boundary';log(g,'世界历160年以后的史劫尚未制作，当前人物安全暂停；不会凭空死亡。','world');return;}
if(y===12&&l.id>1&&!has(l.flags,'past')){mark(l,'past');g.pending='past';return;}
if(y===18&&!has(l.flags,'materials18')){mark(l,'materials18');g.pending='materials18';return;}
if(y===22&&!has(l.flags,'npc22')){mark(l,'npc22');g.pending='npc';return;}
if(y===24&&!has(l.flags,'jade24')){mark(l,'jade24');g.pending='jade';return;}
if(y===34&&!has(l.flags,'materials34')){mark(l,'materials34');g.pending='materials34';return;}
if(y===39&&!has(l.flags,'trial39')){mark(l,'trial39');g.pending='trial';return;}
if(w===45&&!g.world.warning&&g.world.tide==='waiting'){g.world.warning=true;g.pending='warning';return;}
if(w===92&&!g.world.veinWarning&&g.world.tide!=='waiting'){g.world.veinWarning=true;g.pending='vein-warning';return;}}
function endLife(g,reason){if(g.status!=='playing')return;const l=g.life;g.status='ended';g.pending=null;l.action=null;if(l.jade){l.jade=false;g.world.jade='stashed';}
for(const id of ['merchant','herbal'])g.meta.bestCareer[id]=Math.max(g.meta.bestCareer[id],l.level[id]);
let points=Math.min(6,Math.floor(lifeYear(g)/17))+(l.realm==='筑基'?3:l.realm==='炼气'?1:0)+Math.min(2,l.decisions.length>=3?2:1);
if(!has(g.meta.achievements,'reincarnation')){points+=1;achievement(g,'reincarnation');}
if(reason==='灵潮幸存后主动转世'&&!has(g.meta.achievements,'tide-survivor')){points+=3;achievement(g,'tide-survivor');}
g.meta.rp+=points;g.meta.lives.push({id:l.id,path:l.path,career:l.career,year:g.worldYear,reason,points,realm:l.realm});
log(g,`第${l.id}世${reason}，获得${points}轮回点。旧世界、人脉和产业后果没有重置。`,'reincarnation');}
export function advance(g,years=1){if(g.status!=='playing'||g.pending)return g;let limit=Math.max(0,Math.min(400,Math.floor(years)));for(let k=0;k<limit;k++){if(g.pending||g.status!=='playing')break;
if(g.worldYear>=160){g.status='boundary';break;}g.worldYear++;g.life.age++;revenue(g);if(g.life.action)g.life.action.remaining--;
if(g.life.age>=g.life.lifeCap){endLife(g,'寿元耗尽');break;}
event(g);if(g.pending||g.status!=='playing')break;resolveAction(g);if(!g.life.action)tryQi(g);
if(have(g,'auto')&&g.life.plan==='earn'&&g.life.money>=55){g.life.plan='cultivate';log(g,'照世传承按已设策略：灵石达到55，自动由营生切换为苦修。','automation');}
}return g;}
function canSpend(l,c){return l.money>= (c.money||0)&&l.herbs>= (c.herbs||0)&&l.qi>= (c.qi||0)}
function charge(l,c){l.money=round(l.money-(c.money||0));l.herbs-=c.herbs||0;l.qi=round(l.qi-(c.qi||0));}
const barrierIn=(g,n)=>{const w=g.worldYear,y=lifeYear(g);const future=[...(g.world.tide==='waiting'?[45,60]:[]),...(!g.world.veinDone?[92,95]:[]),160];const personal=[18,22,24,34,39,...(g.life.id>1?[12]:[])].map(z=>g.life.birthYear+z);return [...future,...personal].some(t=>t>w&&t<=w+n)};
export function begin(g,id,variant=''){if(g.status!=='playing'||g.pending||g.life.action||!g.life.path)return false;const l=g.life;const cfg={
 foundation:{time:2,money:45,herbs:3,qi:1650-l.foundationReduction,ok:l.realm==='炼气'},
 pill:{time:variant==='long'?5:variant==='economy'?4:3,money:variant==='long'?80:55,herbs:variant==='economy'?4:5,ok:l.realm!=='凡人'&&!l.pill&&(variant==='common'||l.path==='dan')},
 xuan:{time:2,money:18,ok:l.path==='xuan'&&!has(l.flags,'xuan-used')&&l.realm==='炼气'},
 move:{time:2,money:8,ok:variant!==l.region&&(variant==='town'||variant==='valley')},
 explore:{time:3,money:8,ok:!has(l.flags,'explored')},
 jade:{time:4-(equipped(g,'G03')?2:0),money:8,ok:g.world.jade==='stashed'&&!l.jade},
 'trial-boon':{time:2,ok:l.trialToken>0},'trial-herb':{time:2,money:10,ok:l.trialToken>0},
 focus:{time:2,money:24,ok:l.realm==='炼气'&&!l.focus},
 }[id];if(!cfg?.ok||!canSpend(l,cfg)||l.age+cfg.time>l.lifeCap)return false;
if((id==='foundation'||id==='pill')&&g.world.tide==='waiting'&&g.worldYear+cfg.time>=60){g.notice='此行动无法在世界60年灵潮之前完成，请选择更短的方案或提前准备。';return false;}
charge(l,cfg);if(id==='explore')mark(l,'explored');if(id.startsWith('trial-'))l.trialToken=0;
l.action={id,variant,remaining:cfg.time,total:cfg.time};log(g,`开始${({foundation:'筑基突破',pill:'炼制护脉丹',xuan:'闭关推演',move:'迁居',explore:'荒谷历练',jade:'寻回旧玉','trial-boon':'心定印参悟','trial-herb':'心定印寻材',focus:'专注吐纳'})[id]}，占用${cfg.time}年日程，期间不重复领取普通工作/修行收益。`,'action');advance(g,cfg.time);return true;}
function npcAction(g,id){const l=g.life;const spec=id==='gu_help'?{money:4,herbs:1,time:2}:{money:12,time:1};if(!canSpend(l,spec))return false;charge(l,spec);l.action={id,remaining:spec.time,total:spec.time};advance(g,spec.time);return true;}
export function respond(g,key){if(g.status!=='playing'||!g.pending)return false;const l=g.life,p=g.pending;let ok=true,keep=false;switch(p){
case'intro': if(!['xuan','dan'].includes(key))return false;l.path=key;g.pending=null;log(g,`这一世主修${key==='xuan'?'玄修':'丹修'}。营生、修炼与研习由年度计划共同分配。`);return true;
case'materials18':if(key==='herbs'){l.herbs+=3+(equipped(g,'W02')?1:0)+(has(l.studied,'herbs')?1:0);}else if(key==='money')l.money+=22;else return false;mark(l,'materials18-choice');break;
case'materials34':if(key==='herbs')l.herbs+=3+(has(l.studied,'herbs')?1:0);else if(key==='qi')l.qi+=180;else return false;break;
case'npc':if(key==='gu'){if(l.herbs<1||l.money<4)return false;g.pending=null;mark(l,'npc-gu');l.decisions.push('help-gu');return npcAction(g,'gu_help');}else if(key==='shen'){if(l.money<12)return false;g.pending=null;mark(l,'npc-shen');l.decisions.push('help-shen');return npcAction(g,'shen_help');}else if(key!=='ignore')return false;break;
case'jade':if(l.id===1&&g.world.jade==='hidden'){l.jade=true;g.world.jade='held';log(g,'在旧井边得到一枚护心玉。这是真实器物，离世时会留在同一世界线。','legacy');}else if(g.world.jade==='stashed')log(g,'旧井留下前世旧物的线索，可用探索行动寻回同一个实体。','legacy');break;
case'trial':if(key==='qi'){if(l.qi<900)return false;l.qi-=150;l.trialToken=1;}else if(key==='herbs'){if(l.herbs<1||l.money<15)return false;l.herbs--;l.money-=15;l.trialToken=1;}else if(key!=='retreat')return false;l.trialResolved=true;achievement(g,'first-trial');break;
case'warning':if(key!=='ok')return false;log(g,'灵潮将至：筑基或炼成护脉丹方能抵御。其他生存条件尚未实装。','world');break;
case'tide':if(key!=='face')return false;g.world.tide=l.realm==='筑基'||!!l.pill?'survived':'failed';if(g.world.tide==='failed'){g.pending=null;endLife(g,'灵潮中陨落');return true;}achievement(g,'tide60');mark(l,'survived60');log(g,'浮岚历60年灵潮逆涌，你活了下来。灾劫在这条世界线不会重演。','world');break;
case'past':if(key==='gu-record'&&g.world.npc.gu.helped){l.studyProgress.herbs=Math.min(STUDIES.herbs.cost-1,l.studyProgress.herbs+7);l.herbs++;log(g,'药谷留下旧约与辨草手稿：本世辨草研习进度增加，灵材+1。','legacy');}else if(key==='shen-record'&&g.world.npc.shen.helped){l.money+=12;log(g,'浮潮集账房查到旧商路分红，今世领取12灵石，一生一次。','legacy');}else if(key==='ok'){log(g,'前世人物与旧地并未重置，你开始循着历史继续修行。','legacy');}else return false;break;
case'vein-warning':if(key!=='ok')return false;log(g,'世界95年将出现地方灵脉危机，越接近此年越应注意准备。','world');break;
case'vein':if(key==='cult'){if(l.realm!=='筑基'||l.money<10)return false;g.pending=null;l.money-=10;l.action={id:'vein-cult',remaining:2,total:2};return advance(g,2)&&true;}if(key==='med'){if(l.herbs<2||l.money<35)return false;g.pending=null;charge(l,{money:35,herbs:2});l.action={id:'vein-med',remaining:3,total:3};return advance(g,3)&&true;}if(key==='leave'){if(l.money<15)return false;g.pending=null;charge(l,{money:15});l.action={id:'vein-leave',remaining:1,total:1};return advance(g,1)&&true;}if(key==='labor'){g.pending=null;l.action={id:'vein-leave',remaining:3,total:3};return advance(g,3)&&true;}return false;
default:return false;}
if(ok){g.pending=null;l.decisions.push(p+':'+key);resolveAction(g);return true;}return false;}
export function setOrigin(g,id){if(g.pending!=='intro'||!['market','herbal'].includes(id))return false;const l=g.life;l.origin=id;l.career=id==='market'?'merchant':'herbal';l.region=id==='market'?'town':'valley';l.herbs=id==='herbal'?1:0;l.money=id==='market'?8:7;g.notice=id==='market'?'出身浮潮集散修：经商较方便，灵材需寻觅。':'出身药谷学徒：已有少量灵材，商路和灵石相对紧张。';return true;}
export function setCareer(g,id){if(g.pending||g.status!=='playing'||g.life.action||!CAREERS[id])return false;g.life.career=id;log(g,`现在营生：${careerRole(g)}。职业经验继续保留在本世。`,'career');return true;}
export function setPlan(g,id){if(g.pending||g.status!=='playing'||g.life.action||!PLANS[id])return false;g.life.plan=id;log(g,`修行计划切换为「${PLANS[id].name}」。`,'schedule');return true;}
export function setStudy(g,id){if(g.pending||g.status!=='playing'||g.life.action||!STUDIES[id]||has(g.life.studied,id))return false;g.life.study=id;log(g,`开始研习《${STUDIES[id].name}》。`,'study');return true;}
export function buy(g,id){if(g.pending||g.status!=='playing'||g.life.action)return false;const l=g.life;const items={food:{money:12,ok:l.food!=='spirit'},home:{money:28,ok:l.home!=='cottage'}};const c=items[id];if(!c?.ok||!canSpend(l,c))return false;charge(l,c);if(id==='food')l.food='spirit';else l.home='cottage';log(g,`改善${id==='food'?'灵食':'居处'}，长期提高修行效率，也须支付维护费。`,'lifestyle');return true;}
export function buyPerk(g,id){const cfg={learn:{price:3,name:'旧业识途：职业经验额外+10%'},auto:{price:5,name:'生财有道：灵石达到55自动切换苦修'},meridian:{price:4,name:'旧识经脉：修行效率+15%'}}[id];if(g.status==='boundary'||!cfg||have(g,id)||g.meta.rp<cfg.price)return false;g.meta.rp-=cfg.price;g.meta.perks.push(id);log(g,`永久传承「${cfg.name}」已解锁。`,'legacy');return true;}
export function equip(g,id){if(!has(g.meta.relics,id)||g.status==='boundary')return false;const a=g.meta.equipped;if(has(a,id)){g.meta.equipped=a.filter(x=>x!==id);return true;}if(a.length>=2)return false;a.push(id);return true;}
export function reincarnate(g){if(g.status==='boundary')return false;if(g.status==='playing'){if(g.pending||g.life.action||lifeYear(g)<25)return false;endLife(g,'主动轮回');}if(g.status!=='ended')return false;const old=g.life;const start=g.worldYear+2;g.worldYear=start;g.life=life(old.id+1,start);g.status='playing';g.pending='intro';log(g,`第${g.life.id}世出生。你并未重置浮岚界的历史；新的身体重新开始谋生。`,'reincarnation');return true;}
export function actionAvailability(g,id,variant=''){if(g.pending||g.status!=='playing'||g.life.action)return false;const shallow=copy(g);return begin(shallow,id,variant);}
export function persist(g){return JSON.stringify(g)}
export function restore(data){try{const v=JSON.parse(data);return v.version===SAVE_VERSION&&Number.isFinite(v.worldYear)&&v.life&&v.meta&&v.world&&Array.isArray(v.journal)?v:createGame();}catch{return createGame()}}
