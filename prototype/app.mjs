import { createGame, hydrateSave, validateSave, NAV, RELICS, advance, nextMilestone, track, lifeYear, cultivationRate, foundationNeed, hasProtection, actionOptions, choose, startAction, getDialog, equipRelic, voluntarilyEnd, buyUpgrade, reincarnate } from './game.mjs';

const KEY='hundred-lives-prototype-v1';
let game;try{game=hydrateSave(localStorage.getItem(KEY));}catch{game=createGame();}
let tab='修行';
const $=(id)=>document.getElementById(id);
const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(v)=>Number(v).toLocaleString('zh-CN',{maximumFractionDigits:1});
function save(){try{if(validateSave(game))localStorage.setItem(KEY,JSON.stringify(game));}catch(e){console.warn('Local save unavailable',e);}}
function run(cb){try{cb();}catch(err){console.error(err);game.info='操作遇到异常：请刷新页面；未能完成本次更新。';}save();render();}
function card(title,desc,extra='',cls=''){return `<article class="panel ${cls}"><h3>${esc(title)}</h3><p>${esc(desc)}</p>${extra}</article>`;}
function actionButton(id,title,desc,enabled=true,primary=false,kind='action'){
 return `<button type="button" data-${kind}="${esc(id)}" class="action-button ${primary?'primary':''}" ${enabled?'':'disabled'}><span><strong>${esc(title)}</strong><span>${esc(desc)}</span></span><span class="arrow">›</span></button>`;
}
function stats(){const l=game.life;const fields=[['此世',`第${l.id}世`,''],['浮岚历',num(game.worldYear),'年'],['寿龄',`${l.age}/${l.lifeCap}`,'岁'],['修为',num(l.cultivation),''],['灵石',num(l.stones),''],['灵材',num(l.herbs),'']];$('stats').innerHTML=fields.map(([title,value,suffix])=>`<div class="stat"><div class="stat-label">${title}</div><div class="stat-value">${value}<span class="stat-suffix">${suffix}</span></div></div>`).join('');$('notice').textContent=game.info || '时光缓缓流淌。';const percent=Math.round(100*l.age/l.lifeCap);$('progress-bar').style.width=`${Math.min(percent,100)}%`;$('time-meter').textContent=`已历 ${lifeYear(game)} 年 · 余寿 ${Math.max(0,l.lifeCap-l.age)} 年`;}
function panels(){const l=game.life;const t=track(game);
 if(game.status==='ended'){return card('本世已了',`第${l.id}世因 ${game.meta.reports.at(-1)?.reason||'轮回'} 结束。本次获得 ${game.meta.reports.at(-1)?.rp??0} RP。可以购买永久传承，然后进入下一世。`,`${actionButton('next','转生下一世','世界历继续前行，旧物留在原世界线',true,true,'system')}`,'finished')+prestige();}
 if(game.status==='boundary')return card('测试边界 · 浮岚历160年','世界160年的下一场历史关口尚未制作。人生被安全暂停，没有死亡，也没有结算轮回点。',actionButton('reset','重置原型重新体验','仅用于测试，会清空当前浏览器原型存档',true,false,'system'));
 if(tab==='修行'){
   const sect=l.path==='xuan'?'玄修 · 以境破劫':'丹修 · 以药续命';
   let html=`<div class="section-title">修行道途</div>`+card(sect,`境界：${l.realm} · 修为年产 ${num(cultivationRate(game))} · 当前寿元上限 ${l.lifeCap} 岁`, `<div class="meter-label"><span>筑基修为进度</span><span>${num(l.cultivation)} / ${foundationNeed(game)}</span></div><div class="meter-bar"><span style="width:${Math.min(100,100*l.cultivation/foundationNeed(game))}%"></span></div><p class="help">${l.realm==='筑基'?'已经筑基。':'还需 '+num(t.foundationCultGap)+' 修为 / '+t.foundationStoneGap+' 灵石 / '+t.foundationHerbGap+' 灵材。'}${l.realm==='炼气'?'选择耗年动作会继续正常生产修为和灵石。':''}</p>`);
   html+=`<div class="section-title">推进岁月</div><div class="time-controls"><button data-time="1" class="time-button">过 1 年</button><button data-time="5" class="time-button">过 5 年</button><button data-time="next" class="time-button">到下一节点 →</button></div>`;
   if(l.action)html+=card('进行中的行动',`${l.action.key}：尚余${l.action.remaining}年。事件已打断该行动，处理完可继续推进完成。`,actionButton('resume','继续完成行动','只推进所需年份，中途仍会被关键事件中断',true,true,'system'));
   html+=`<div class="section-title">可选修行行动</div>`;
   for(const a of actionOptions(game).filter(a=>['focus','xuan','foundation','pill-common','pill-economy','pill-long','seal-cult','seal-herb'].includes(a.id))) {
     if(a.id==='xuan'&&l.path!=='xuan'||a.id==='pill-economy'&&l.path!=='dan'||a.id==='pill-long'&&l.path!=='dan'||a.id.startsWith('seal-')&&l.trialSeal<1)continue;
     if(a.id==='focus'&&l.focus||a.id==='xuan'&&l.xuanUsed||a.id==='foundation'&&l.realm==='筑基'||a.id.startsWith('pill-')&&l.pill)continue;
     html+=actionButton(a.id,a.label,a.desc,a.available);
   }
   html+=`<div class="bottom-hint">操作遇到命关、历史事件或截止年时会暂停。灰色按钮表示资源、境界不足，或行动会跨越未处理的节点。</div>`;
   return html;
 }
 if(tab==='机缘'){
   let h='<div class="section-title">机缘与灵藏</div>'+card('旧世实物 · 护心玉',game.world.jadePlace==='held'&&l.jade?`已持有 ${game.world.jadeId}，跨世时仍会留下同一件实物。`:game.world.jadePlace==='stash'?'护心玉遗落在旧井。它没有复制，可以花费时间与灵石寻回。':'尚未找到前世实物。',game.world.jadePlace==='stash'&&actionOptions(game).find(x=>x.id==='find-jade')?(()=>{const a=actionOptions(game).find(x=>x.id==='find-jade');return actionButton('find-jade',a.label,a.desc,a.available,true);})():'');
   const exp=actionOptions(game).find(x=>x.id==='explore');h+=card('荒谷历练','在每一世进行一次有代价探索。首轮更注重体验不同遗物功能，而不是刷等级。',actionButton('explore','出发历练',exp.desc,exp.available));
   h+='<div class="section-title">灵藏遗物库 <span class="pill-label">携带上限 2 / 6</span></div><p class="section-note">本原型实装4件功能性遗物。可永久收录，但每世同时激活最多2件；点击切换。</p>';
   h+=`<div class="item-list">${Object.entries(RELICS).map(([id,item])=>{
      const owned=game.meta.relics.includes(id),worn=game.meta.equipped.includes(id);
      return `<button class="relic ${worn?'equipped':''}" data-equip="${id}" ${owned?'':'disabled'}><span class="relic-badge">${item.rarity} · ${id}</span><div class="relic-name">${owned?esc(item.name):'尚未发现'}</div><div class="relic-desc">${owned?esc(item.description):'探索/事件中解锁'}</div><b>${owned?(worn?'已激活 · 点击卸下':'点击装备'):'未收录'}</b></button>`;
   }).join('')}</div>`;
   return h;
 }
 if(tab==='应劫'){
   const done=game.world.resolved.includes('tide60');const next=done?'下一次地方余波 · 浮岚历95年':'归墟灵潮 · 浮岚历60年';
   const status=done?'已发生，今世不重播':hasProtection(game)?'已具备生存条件':'准备不足';
   let h='<div class="section-title">应劫推演</div>'+card(next,`当前世界历${game.worldYear}年 · ${status}`,`<div class="panel-header"><span class="chip ${hasProtection(game)?'':'muted'}">${hasProtection(game)?'已符合': '可规划'} · 筑基 / 护脉丹</span><span class="chip muted">世界史唯一</span></div>`);
   h+=card('以境承载',l.realm==='筑基'?'已筑基，本世可以凭境界抗住首道灵潮。':`未筑基：修为还差${num(t.foundationCultGap)}；突破额外需要45灵石、3灵材与2年。`,l.realm==='筑基'?'<span class="chip">满足</span>':'<span class="chip muted">待完成</span>');
   h+=card('以药化解',l.pill?'已炼成一枚护脉丹，可在世界年60使用。':'普通丹：55灵石+5灵材+3年；丹修另有省材与驻元配方。',l.pill?'<span class="chip">满足</span>':'<span class="chip muted">待完成</span>');
   h+=card('世界因果',`已发生事件：${game.world.resolved.join(' / ')||'暂无'}。地方灵脉：${game.world.vein==='stable'?'已稳定':game.world.vein==='ruined'?'已受损':'尚未决定'}。`, '');
   return h;
 }
 if(tab==='轮回'){
   let h='<div class="section-title">照世碑 · 轮回传承</div>'+card('这一世如何结束',`目前${lifeYear(game)}个游戏年；主动轮回需至少经历25年，且不能有未完成的事件/行动。轮回点仅在真正结束人生时结算。`,actionButton('retire','主动轮回','留存图鉴与世界史；前世实体遗落世界',lifeYear(game)>=25&&!l.action,false,'system'));
   h+=prestige();
   h+='<div class="section-title">世录与成就</div>';
   const ach=[['qi','首次炼气'],['jade','寻得前世旧玉'],['foundation','首次筑基'],['tide-survived','首次渡过灵潮']];
   h+=`<div class="panel"><h3>首次道途纪录</h3>${ach.map(([k,v])=>`<p>${game.meta.achievements.includes(k)?'✦':'◌'} ${v}</p>`).join('')}<small>首次奖励只在结算时发放一次。跨世世界事件绝不重复结算。</small></div>`;
   h+=`<div class="panel"><h3>本世日志 · 浮岚大事记</h3>${game.history.slice(-15).reverse().map(r=>`<p><span class="gold">第${r.life}世 · 世界${r.year}年</span> ${esc(r.text)}</p>`).join('')}</div>`;
   h+=`<button class="reset" data-system="reset">重置原型测试存档（不可撤销）</button>`;
   return h;
 }
 return '';
}
function prestige(){const rp=game.meta.rp;const ended=game.status==='ended';const a=game.meta.upgrades;return `<div class="section-title">跨世传承 · ${num(rp)} RP</div>`+card('旧识经脉',`永久修为产出 +25%。${a.includes('meridian')?'已购买':''}`,actionButton('meridian',a.includes('meridian')?'已解锁':'购买 · 3 RP','新一世发育速度改变；不会强迫玄修使用闭关',ended&&!a.includes('meridian')&&rp>=3,false,'buy'))+card('旧迹识途',`找回前世实体的时间 4→2年。${a.includes('trace')?'已购买':''}`,actionButton('trace',a.includes('trace')?'已解锁':'购买 · 4 RP','另一条资源选择，未直接增加修为',ended&&!a.includes('trace')&&rp>=4,false,'buy'));}
function renderDialog(){const d=getDialog(game);if(!d){$('modal-root').innerHTML='';return;}const l=game.life;let note=`第${l.id}世 · 浮岚历${game.worldYear}年 · 年龄${l.age}/${l.lifeCap}岁`;
 $('modal-root').innerHTML=`<div class="veil"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="dialog-eyebrow">照世碑 · 命数所至</div><h2 id="dialog-title">${esc(d.title)}</h2><p>${esc(d.text)}</p>${d.options.map(([id,name,sub,allowed=true])=>actionButton(id,name,sub,allowed,true,'choice')).join('')}<div class="foot-note">${esc(note)}<br>面板展示期间游戏时间暂停；所示所有成本均按统一世界年结算。</div></section></div>`;}
function sidebar(){const list=game.history.slice(-8).reverse();$('sidebar-history').innerHTML='<div class="history">'+list.map(it=>`<div class="entry"><em>第${it.life}世 · 浮岚历${it.year}</em>${esc(it.text)}</div>`).join('')+'</div>';}
function render(){stats();for(const btn of document.querySelectorAll('[data-tab]'))btn.classList.toggle('active',btn.dataset.tab===tab);$('content').innerHTML=panels();sidebar();renderDialog();}

function resumeAction(){if(!game.life.action)return;advance(game,game.life.action.remaining||0);}
document.addEventListener('click',event=>{
 const target=event.target.closest('button');if(!target||target.disabled)return;
 if(target.dataset.tab){tab=target.dataset.tab;render();return;}
 if(target.dataset.choice)run(()=>choose(game,target.dataset.choice));
 else if(target.dataset.action)run(()=>startAction(game,target.dataset.action));
 else if(target.dataset.equip)run(()=>{equipRelic(game,target.dataset.equip);});
 else if(target.dataset.buy)run(()=>buyUpgrade(game,target.dataset.buy));
 else if(target.dataset.time)run(()=>advance(game,target.dataset.time==='next'?nextMilestone(game):Number(target.dataset.time)));
 else if(target.dataset.system)run(()=>{
   const key=target.dataset.system;
   if(key==='next'){reincarnate(game);tab='修行';}
   if(key==='retire'){voluntarilyEnd(game);tab='轮回';}
   if(key==='resume')resumeAction();
   if(key==='reset'&&window.confirm('确认清空这个原型的所有本地测试存档？')){game=createGame();tab='修行';}
 });
});
render();
