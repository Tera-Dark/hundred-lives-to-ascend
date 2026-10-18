/** 百世劫录 · MVP-0 deterministic game model. No UI/browser dependency. */
export const SAVE_VERSION = 1;
export const RELICS = Object.freeze({
  W01: { name: '旧纹吐纳玉', rarity: '白', description: '修为产出 +3%', kind: 'cultivation', value: 0.03 },
  W02: { name: '山药篓', rarity: '白', description: '本世首次采材额外 +1 灵材', kind: 'herbs', value: 1 },
  G01: { name: '凝息珠', rarity: '绿', description: '修为产出 +5%', kind: 'cultivation', value: 0.05 },
  G03: { name: '旧井指针', rarity: '绿', description: '寻回前世实物少花 2 年', kind: 'search', value: 2 },
});

const chapters = ['修行', '机缘', '应劫', '轮回'];
export const NAV = Object.freeze(chapters);
const clone = value => JSON.parse(JSON.stringify(value));
const has = (list, value) => list.includes(value);
const clampInt = (n, low, high) => Math.max(low, Math.min(high, Math.trunc(n)));

function freshLife(id, worldYear) {
  return {
    id, birthWorldYear: worldYear, age: 16, lifeCap: 80, path: null,
    realm: '凡人', cultivation: 0, stones: 0, herbs: 0, focus: false,
    xuanUsed: false, foundationReduction: 0, danLongevityUsed: false,
    pill: null, jade: false, trialSeal: 0, trialDone: false, actionStack: [],
    meaningful: [], decisions: [], flags: [], action: null,
    researchCompleted: false, herbBonusUsed: false,
  };
}

export function createGame() {
  const g = {
    version: SAVE_VERSION, worldYear: 0, status: 'playing', dialog: 'path',
    world: { resolved: [], jadeId: 'HEART-JADE-001', jadePlace: 'undiscovered', vein: 'unchanged' },
    life: freshLife(1, 0),
    meta: { rp: 0, upgrades: [], relics: [], equipped: [], achievements: [], reports: [] },
    history: [], info: '请选择这一世的主修道途。',
  };
  record(g, '照世碑苏醒。浮岚历元年，第一世开始。');
  return g;
}

export function validateSave(candidate) {
  if (!candidate || candidate.version !== SAVE_VERSION || !candidate.world || !candidate.life || !candidate.meta) return false;
  if (!Number.isSafeInteger(candidate.worldYear) || candidate.worldYear < 0 || candidate.worldYear > 10000000) return false;
  if (!Number.isSafeInteger(candidate.life.age) || candidate.life.age < 16 || candidate.life.age > 10000000) return false;
  for (const key of ['cultivation', 'stones', 'herbs']) {
    if (!Number.isFinite(candidate.life[key]) || candidate.life[key] < 0 || candidate.life[key] > 1e12) return false;
  }
  if (!Array.isArray(candidate.meta.relics) || !Array.isArray(candidate.meta.equipped) || candidate.meta.equipped.length > 2) return false;
  return true;
}
export function hydrateSave(raw) {
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : clone(raw);
    return validateSave(obj) ? obj : createGame();
  } catch { return createGame(); }
}
function record(g, text, type = 'story') {
  g.history.push({ seq: g.history.length + 1, year: g.worldYear, life: g.life.id, age: g.life.age, type, text });
  if (g.history.length > 120) g.history.splice(0, g.history.length - 120);
  g.info = text;
}
function choice(g, key) {
  if (!has(g.life.meaningful, key)) g.life.meaningful.push(key);
}
function flag(g, key) { if (!has(g.life.flags, key)) g.life.flags.push(key); }
function unlock(g, id) {
  if (has(g.meta.relics, id)) return false;
  g.meta.relics.push(id);
  if (g.meta.equipped.length < 2) g.meta.equipped.push(id);
  record(g, `照世碑收录灵藏「${RELICS[id].name}」，已进入永久遗物库。`, 'relic');
  return true;
}
function perk(g, id) { return has(g.meta.upgrades, id); }
function equipped(g, id) { return has(g.meta.equipped, id); }
export function lifeYear(g) { return g.worldYear - g.life.birthWorldYear; }
export function cultivationRate(g) {
  const base = g.life.realm === '凡人' ? 15 : g.life.realm === '筑基' ? 60 : g.life.focus ? 40 : 28;
  const rp = perk(g, 'meridian') ? 0.25 : 0;
  const relic = Math.min(0.30, g.meta.equipped.reduce((sum, id) => sum + (RELICS[id]?.kind === 'cultivation' ? RELICS[id].value : 0), 0));
  return Math.round(base * (1 + rp) * (1 + relic) * 100) / 100;
}
export function foundationNeed(g) { return 1650 - g.life.foundationReduction; }
export function hasProtection(g) { return g.life.realm === '筑基' || g.life.pill !== null; }
export function track(g) {
  const l = g.life;
  return {
    lifeYear: lifeYear(g), rate: cultivationRate(g), foundationNeed: foundationNeed(g),
    foundationCultGap: Math.max(0, foundationNeed(g) - l.cultivation),
    foundationStoneGap: Math.max(0, 45 - l.stones),
    foundationHerbGap: Math.max(0, 3 - l.herbs),
    nextWorldCrisis: !has(g.world.resolved, 'tide60') && g.worldYear < 60 ? 60 : !has(g.world.resolved, 'vein95') && g.worldYear < 95 ? 95 : 160,
  };
}

function tryQi(g) {
  const l = g.life;
  if (l.realm !== '凡人' || l.cultivation < 180) return;
  l.cultivation -= 180;
  l.realm = '炼气';
  l.lifeCap = Math.max(l.lifeCap, 120);
  flag(g, 'qi');
  record(g, '引气入体，突破炼气！寿元上限提升至120岁。', 'breakthrough');
}
function applyAction(g) {
  const l = g.life;
  const action = l.action;
  if (!action || action.remaining !== 0 || g.dialog || g.status !== 'playing') return;
  l.action = null;
  switch (action.key) {
    case 'focus': l.focus = true; record(g, '专注吐纳习成，炼气修行效率提高。', 'action'); break;
    case 'xuan': l.xuanUsed = true; l.foundationReduction = 140; record(g, '闭关推演完成：下一次筑基所需修为减少140。', 'action'); break;
    case 'foundation':
      l.realm = '筑基'; l.foundationReduction = 0; l.lifeCap = Math.max(l.lifeCap, 240);
      flag(g, 'foundation'); record(g, '道基凝成！境界提升至筑基，寿元上限至少240岁。', 'breakthrough'); break;
    case 'pill-common': case 'pill-economy': case 'pill-long':
      l.pill = action.key;
      if (action.key === 'pill-long') { l.danLongevityUsed = true; l.lifeCap = Math.max(l.lifeCap, 140); }
      record(g, `炼成${action.key === 'pill-long' ? '驻元' : action.key === 'pill-economy' ? '省材' : '普通'}护脉丹，可以抵御本次灵潮。`, 'action'); break;
    case 'trial-cult': case 'trial-herb':
      l.trialSeal = 1;
      record(g, '心魔已定。获得一次「心定印」的当世有价机缘选择，不会每世白送永久碎片。', 'trial'); break;
    case 'trial-retreat': record(g, '暂避心魔，保全性命，但错过此次命关收益。', 'trial'); break;
    case 'seal-cult': l.cultivation += 120; record(g, '心定印化为悟道机缘，修为+120。', 'trial'); break;
    case 'seal-herb': l.herbs += 1; record(g, '心定印引来灵材线索，灵材+1。', 'trial'); break;
    case 'find-jade':
      if (g.world.jadePlace === 'stash') {
        g.world.jadePlace = 'held'; l.jade = true; record(g, `寻回前世护心玉，实物编号 ${g.world.jadeId} 未改变。`, 'legacy');
        if (!has(g.meta.relics, 'G03')) unlock(g, 'G03');
      }
      break;
    case 'explore':
      if (!has(g.meta.relics, 'G01')) unlock(g, 'G01');
      else { l.herbs += 1; record(g, '历练已有收获：灵材+1（本世探索次数受限）。', 'explore'); }
      break;
    case 'vein-stabilize': g.world.vein = 'stable'; record(g, '余潮断脉被稳住，后世仍将记得这个选择。', 'world'); break;
    case 'vein-medicine': g.world.vein = 'stable'; record(g, '丹材调理使灵脉稳定，地方恢复生机。', 'world'); break;
    case 'vein-escape': g.world.vein = 'ruined'; record(g, '远离断脉之地，保全性命，却错过当地遗物探索机会。', 'world'); break;
    case 'vein-labor': g.world.vein = 'ruined'; record(g, '以劳作换取离开灾区的机会，性命得保，地方灵脉受损。', 'world'); break;
    default: break;
  }
  tryQi(g);
  if (l.actionStack?.length) l.action = l.actionStack.pop();
}

function eventAtBoundary(g) {
  const l = g.life, y = lifeYear(g), wy = g.worldYear;
  if (g.status !== 'playing' || g.dialog) return;
  // A historical event has its own absolute year; life events use this incarnation's elapsed years.
  if (wy === 60 && !has(g.world.resolved, 'tide60')) { g.dialog = 'tide60'; return; }
  if (wy === 95 && !has(g.world.resolved, 'vein95')) { g.dialog = 'vein95'; return; }
  if (wy >= 160) { g.status = 'boundary'; record(g, '世界历160年以后的纪元事件尚未制作，当前人生安全暂停，未结算RP。', 'boundary'); return; }
  if (y === 18 && !has(l.flags, 'event18')) { flag(g, 'event18'); g.dialog = 'event18'; return; }
  if (y === 24 && !has(l.flags, 'event24')) { flag(g, 'event24'); g.dialog = 'event24'; return; }
  if (y === 34 && !has(l.flags, 'event34')) { flag(g, 'event34'); g.dialog = 'event34'; return; }
  if (y === 39 && !has(l.flags, 'trial39')) { flag(g, 'trial39'); g.dialog = 'trial39'; return; }
  if (wy === 45 && !has(g.world.resolved, 'warning45')) { g.world.resolved.push('warning45'); g.dialog = 'warning45'; return; }
  if (y === 12 && l.id > 1 && !has(l.flags, 'lifeline')) { flag(g, 'lifeline'); g.dialog = 'lifeline'; return; }
  if (wy === 92 && !has(g.world.resolved, 'warning92') && has(g.world.resolved, 'tide60')) {
    g.world.resolved.push('warning92'); g.dialog = 'warning92'; return;
  }
}

function terminal(g, reason) {
  if (g.status !== 'playing') return;
  g.status = 'ended'; g.dialog = null; g.life.action = null;
  if (g.life.jade) { g.life.jade = false; g.world.jadePlace = 'stash'; }
  const l = g.life, years = lifeYear(g);
  const valid = years >= 25 && l.meaningful.length >= 2;
  const depth = l.realm === '筑基' ? 5 : l.realm === '炼气' ? 2 : 0;
  const choicePoints = Math.min(2, Math.floor(Math.max(0, l.meaningful.length - 2) / 2));
  const journey = Math.min(2, Math.floor(years / 35));
  let rp = valid ? depth + choicePoints + journey : 0;
  const ach = [];
  for (const [key, ok, value] of [
    ['qi', has(l.flags, 'qi'), 1], ['jade', has(l.flags, 'jade'), 1],
    ['foundation', has(l.flags, 'foundation'), 2],
    ['tide-survived', has(l.flags, 'survived60'), 3],
  ]) {
    if (ok && !has(g.meta.achievements, key)) { ach.push(key); rp += value; g.meta.achievements.push(key); }
  }
  g.meta.rp += rp;
  const result = { lifeId: l.id, endYear: g.worldYear, years, realm: l.realm, path: l.path, reason, rp, firsts: ach };
  g.meta.reports.push(result);
  record(g, `第${l.id}世${reason}。本世结算 +${rp} 轮回点；历史与灵藏图谱不会清空。`, 'reincarnation');
}

/** Advance by whole game years; interrupts before resolving any unhandled event. */
export function advance(g, requestedYears = 1) {
  if (!validateSave(g) || g.status !== 'playing' || g.dialog) return g;
  const count = clampInt(requestedYears, 0, 500);
  if (count === 0) { applyAction(g); return g; }
  for (let k = 0; k < count; k++) {
    if (g.status !== 'playing' || g.dialog) break;
    if (g.worldYear >= 160) { g.status = 'boundary'; break; }
    g.worldYear += 1;
    g.life.age += 1;
    g.life.cultivation = Math.round((g.life.cultivation + cultivationRate(g)) * 100) / 100;
    g.life.stones += 2;
    if (g.life.action) g.life.action.remaining = Math.max(0, g.life.action.remaining - 1);
    if (g.life.age >= g.life.lifeCap) { terminal(g, '寿元耗尽'); break; }
    eventAtBoundary(g);
    if (g.dialog || g.status !== 'playing') break;
    applyAction(g);
    if (!g.life.action) tryQi(g);
  }
  return g;
}

export function startAction(g, key) {
  const l = g.life;
  if (g.status !== 'playing' || g.dialog || !l.path || l.action) return false;
  const plans = {
    focus: { years: 2, stones: 30, allow: l.realm === '炼气' && !l.focus },
    xuan: { years: 2, stones: 18, allow: l.path === 'xuan' && l.realm === '炼气' && !l.xuanUsed },
    foundation: { years: 2, stones: 45, herbs: 3, cultivation: foundationNeed(g), allow: l.realm === '炼气' && l.cultivation >= foundationNeed(g) },
    'pill-common': { years: 3, stones: 55, herbs: 5, allow: l.realm !== '凡人' && !l.pill },
    'pill-economy': { years: 4, stones: 55, herbs: 4, allow: l.path === 'dan' && l.realm !== '凡人' && !l.pill },
    'pill-long': { years: 5, stones: 80, herbs: 5, allow: l.path === 'dan' && l.realm !== '凡人' && !l.pill && !l.danLongevityUsed && l.lifeCap < 140 },
    'seal-cult': { years: 2, allow: l.trialSeal > 0 },
    'seal-herb': { years: 2, stones: 10, allow: l.trialSeal > 0 },
    'find-jade': { years: perk(g, 'trace') || equipped(g, 'G03') ? 2 : 4, stones: 10, allow: g.world.jadePlace === 'stash' && !l.jade },
    explore: { years: 3, stones: 10, allow: !has(l.flags, 'explored') },
  };
  const a = plans[key];
  if (!a || !a.allow || crossesBarrier(g,a.years) || l.stones < (a.stones || 0) || l.herbs < (a.herbs || 0) || l.cultivation < (a.cultivation || 0)) return false;
  l.stones -= a.stones || 0; l.herbs -= a.herbs || 0; l.cultivation -= a.cultivation || 0;
  if (key.startsWith('seal-')) l.trialSeal = 0;
  if (key === 'explore') flag(g, 'explored');
  l.action = { key, remaining: a.years, total: a.years };
  record(g, `开始「${actionName(key)}」，预计耗时${a.years}年；若遇历史或命关事件，将暂停结算。`, 'action');
  advance(g, a.years); // advance until first interruption; pending action remains for later continuation
  return true;
}
function crossesBarrier(g, years) {
  const l = g.life, y = lifeYear(g), wy = g.worldYear;
  const lifeEvents = [18, 24, 34, 39, ...(l.id > 1 ? [12] : [])].filter(n => n > y && !has(l.flags, ({ 18:'event18', 24:'event24', 34:'event34', 39:'trial39', 12:'lifeline' })[n]));
  const worldEvents = [45, 60, 92, 95, 160].filter(n => n > wy && (n !== 45 || !has(g.world.resolved, 'warning45')) && (n !== 60 || !has(g.world.resolved, 'tide60')) && (n !== 95 || !has(g.world.resolved, 'vein95')));
  return [...lifeEvents.map(n => l.birthWorldYear + n), ...worldEvents].some(n => n <= wy + years);
}
function actionName(key) {
  return ({ focus:'专注吐纳', xuan:'闭关推演', foundation:'筑基突破', 'pill-common':'普通护脉丹', 'pill-economy':'省材护脉丹', 'pill-long':'驻元护脉丹', 'seal-cult':'心定印·悟道', 'seal-herb':'心定印·寻材', 'find-jade':'寻回前世护心玉', explore:'荒谷历练' })[key] || key;
}
export function actionOptions(g) {
  const l = g.life;
  return [
    ['focus','专注吐纳','30灵石 / 2年，炼气年产修为28→40'],
    ['xuan','闭关推演','18灵石 / 2年，下次筑基需要的修为 -140（高修为加成时可能不划算）'],
    ['foundation','筑基突破',`修为 ${foundationNeed(g)} / 灵石45 / 灵材3 / 2年`],
    ['pill-common','普通护脉丹','55灵石 / 5灵材 / 3年，抵挡灵潮'],
    ['pill-economy','省材护脉丹','55灵石 / 4灵材 / 4年，抵挡灵潮'],
    ['pill-long','驻元护脉丹','80灵石 / 5灵材 / 5年，抵挡灵潮；炼气寿限最多140岁'],
    ['seal-cult','心定印·悟道','2年，修为+120；不会额外奖励RP'],
    ['seal-herb','心定印·寻材','10灵石 / 2年，灵材+1'],
    ['find-jade','寻回前世旧玉',`10灵石 / ${perk(g,'trace') || equipped(g,'G03') ? 2 : 4}年，寻找原世界同一实物`],
    ['explore','荒谷历练','10灵石 / 3年，本世一次，获得灵藏或灵材'],
  ].map(([id,label,desc]) => ({ id,label,desc,available:canAction(g,id) }));
}
export function canAction(g, key) {
  if (g.status !== 'playing' || g.dialog || !g.life.path || g.life.action) return false;
  const copy = g;
  const l = copy.life;
  const durations = { focus:2,xuan:2,foundation:2,'pill-common':3,'pill-economy':4,'pill-long':5,'seal-cult':2,'seal-herb':2,'find-jade':perk(g,'trace')||equipped(g,'G03')?2:4,explore:3 };
  if (durations[key] && crossesBarrier(g,durations[key])) return false;
  if (key === 'focus') return l.realm === '炼气' && !l.focus && l.stones >=30;
  if (key === 'xuan') return l.path === 'xuan' && l.realm === '炼气' && !l.xuanUsed && l.stones >=18;
  if (key === 'foundation') return l.realm === '炼气' && l.cultivation >= foundationNeed(copy) && l.stones >=45 && l.herbs >=3;
  if (key === 'pill-common') return l.realm !== '凡人' && !l.pill && l.stones>=55 && l.herbs>=5;
  if (key === 'pill-economy') return l.path==='dan' && l.realm!=='凡人' && !l.pill && l.stones>=55 && l.herbs>=4;
  if (key === 'pill-long') return l.path==='dan' && l.realm!=='凡人' && !l.pill && l.stones>=80 && l.herbs>=5 && l.lifeCap <140;
  if (key === 'seal-cult') return l.trialSeal>0;
  if (key === 'seal-herb') return l.trialSeal>0 && l.stones>=10;
  if (key === 'find-jade') return copy.world.jadePlace==='stash' && !l.jade && l.stones>=10;
  if (key === 'explore') return !has(l.flags,'explored') && l.stones>=10;
  return false;
}

export function choose(g, option) {
  if (g.status !== 'playing' || !g.dialog) return false;
  const kind = g.dialog, l = g.life;
  if (kind === 'path') {
    if (option !== 'xuan' && option !== 'dan') return false;
    l.path = option; choice(g, 'path'); g.dialog = null;
    record(g, `此世决定主修${option === 'xuan' ? '玄修·以境破劫' : '丹修·以药续命'}。`, 'choice');
    return true;
  }
  if (kind === 'event18') {
    if (option === 'herbs') {
      l.herbs += 3 + (equipped(g,'W02') && !l.herbBonusUsed ? 1 : 0);
      l.herbBonusUsed = true;
      if (!has(g.meta.relics,'W02') && l.id > 1) unlock(g,'W02');
    } else if (option === 'stones') l.stones += 35;
    else return false;
    choice(g,'event18'); g.dialog=null; record(g, option === 'herbs' ? '完成药庐采集，灵材到手。' : '完成药庐交易，灵石增加。','choice');
    return startEventAction(g,2,'event18');
  }
  if (kind === 'event24') {
    if (l.id === 1) {
      if (option !== 'jade') return false;
      l.jade = true; g.world.jadePlace = 'held'; flag(g,'jade'); unlock(g,'W01');
      record(g, '取得旧纹护心玉（世界实物）与旧纹吐纳玉（灵藏图谱）：两者并非同一物品。','legacy');
    } else {
      if (option === 'relic') unlock(g,'G01');
      else if (option === 'herbs') l.herbs += 2;
      else return false;
      choice(g,'event24'); record(g, option === 'relic' ? '照世碑从余波记录中悟出凝息珠图谱。' : '寻得两份灾后灵材。','choice');
    }
    g.dialog=null; return true;
  }
  if (kind === 'event34') {
    if (option==='herbs') l.herbs+=3;
    else if (option==='insight') l.cultivation+=180;
    else return false;
    choice(g,'event34'); g.dialog=null;
    record(g, option==='herbs' ? '荒谷采集成功，灵材+3。' : '参悟荒谷石刻，修为+180。','choice');
    return startEventAction(g,2,'event34');
  }
  if (kind === 'trial39') {
    const options = {
      cultiv: { stones:0, herbs:0, cult:150, years:1, action:'trial-cult', valid:l.cultivation>=900 },
      herbs: { stones:15, herbs:1, cult:0, years:2, action:'trial-herb', valid:true },
      retreat: { stones:0, herbs:0, cult:0, years:2, action:'trial-retreat', valid:true },
    };
    const a=options[option];if (!a || !a.valid || l.stones<a.stones || l.herbs<a.herbs) return false;
    l.stones-=a.stones;l.herbs-=a.herbs;l.cultivation-=a.cult;
    choice(g,'trial39'); l.trialDone=true;g.dialog=null;
    return startEventAction(g,a.years,a.action);
  }
  if (kind==='warning45') {
    if (option!=='ack') return false;
    g.dialog=null; record(g, '灵潮逆涌将在浮岚历60年到来。需要提前完成筑基或护脉丹。','world');
    advance(g,0);return true;
  }
  if (kind==='warning92') {
    if (option!=='ack')return false;
    g.dialog=null;record(g,'灾后灵脉在世界95年出现异动，可提前准备稳定或撤离。','world');advance(g,0);return true;
  }
  if (kind==='lifeline') {
    if(option==='relic')unlock(g,'G01');else if(option==='herbs')l.herbs+=2;else return false;
    choice(g,'lifeline');g.dialog=null;record(g,'本世修行见闻因前世历史而改变。','choice');return true;
  }
  if (kind==='tide60') {
    if(option!=='resolve')return false;
    g.world.resolved.push('tide60');g.dialog=null;
    if (hasProtection(g)) {
      flag(g,'survived60');
      if (l.pill) l.pill=null;
      record(g, '灵潮逆涌过后，你凭准备活了下来。世界记录此劫已发生，下一世不再重演。','world');
      advance(g,0);
    } else terminal(g,'陨于灵潮逆涌');
    return true;
  }
  if(kind==='vein95') {
    const responses={ stabilize:{key:'vein-stabilize',years:2,stones:10,herbs:0,valid:l.realm==='筑基'},
      medicine:{key:'vein-medicine',years:3,stones:35,herbs:2,valid:true},
      escape:{key:'vein-escape',years:1,stones:15,herbs:0,valid:true},
      labor:{key:'vein-labor',years:3,stones:0,herbs:0,valid:true}};
    const a=responses[option];if(!a||!a.valid||l.stones<a.stones||l.herbs<a.herbs)return false;
    g.world.resolved.push('vein95');g.dialog=null;l.stones-=a.stones;l.herbs-=a.herbs;
    choice(g,'vein95');record(g,'余潮断脉发生：你的选择会写入后世的地方历史。','world');
    return startEventAction(g,a.years,a.key);
  }
  return false;
}
function startEventAction(g, years, key) {
  // Selecting an event is a real action with elapsed years. The next pending milestone interrupts as usual.
  if (g.life.action) {
    if (!Array.isArray(g.life.actionStack)) g.life.actionStack = [];
    g.life.actionStack.push(g.life.action);
  }
  g.life.action={key,remaining:years,total:years};
  advance(g,years);
  return true;
}

export function equipRelic(g,id) {
  if (!has(g.meta.relics,id)) return false;
  const slots=g.meta.equipped;
  if (has(slots,id)) slots.splice(slots.indexOf(id),1);
  else if(slots.length<2)slots.push(id);
  else return false;
  return true;
}
export function buyUpgrade(g,id) {
  const specs={meridian:3,trace:4};
  if(g.status!=='ended'||!Object.prototype.hasOwnProperty.call(specs,id)||perk(g,id)||g.meta.rp<specs[id])return false;
  g.meta.rp-=specs[id];g.meta.upgrades.push(id);
  record(g,`照世碑传承已解锁：${id==='meridian'?'旧识经脉（修为+25%）':'旧迹识途（寻回旧玉省2年）'}。`,'prestige');
  return true;
}
export function reincarnate(g) {
  if(g.status !== 'ended')return false;
  const nextId=g.life.id+1;
  g.worldYear+=2;
  if(g.worldYear>=95 && !has(g.world.resolved,'vein95')) {
    g.world.resolved.push('vein95');g.world.vein='ruined';
  }
  g.life=freshLife(nextId,g.worldYear);
  g.status=g.worldYear>=160?'boundary':'playing';g.dialog=g.status==='playing'?'path':null;
  record(g,`照世碑逆转一生。第${nextId}世生于浮岚历${g.worldYear}年；前世因果与灵藏图谱仍在。`,'reincarnation');
  return true;
}
export function voluntarilyEnd(g) {
  if (g.status!=='playing'||g.dialog||g.life.action||lifeYear(g)<25)return false;
  terminal(g,'主动轮回');return true;
}
export function nextMilestone(g) {
  if(g.status!=='playing'||g.dialog)return 0;
  const y=lifeYear(g);
  const lifeSteps=[18,24,34,39,12].filter(x=>x>y && (x!==12||g.life.id>1)).map(x=>g.life.birthWorldYear+x);
  const worldSteps=[45,60,92,95,160].filter(x=>x>g.worldYear && (x!==45||!has(g.world.resolved,'warning45')) && (x!==60||!has(g.world.resolved,'tide60')) && (x!==95||!has(g.world.resolved,'vein95')));
  const next=Math.min(...lifeSteps,...worldSteps,g.worldYear+20);
  return Math.max(1,Math.min(20,next-g.worldYear));
}
export function getDialog(g) {
  const l=g.life;
  const dialogs={
    path:{title:'这一世，修哪条道？',text:'相同的寿元与世界历史，不同的资源与生存选择。',options:[['xuan','玄修 · 以境破劫','靠修为与筑基争取寿元'],['dan','丹修 · 以药续命','靠灵材与护脉丹寻求生路']]},
    event18:{title:'药庐委托',text:'本世第一次重要资源选择。行动消耗2年；之后仍可改变计划。',options:[['herbs','采集灵材','获得3灵材（携山药篓可额外+1）'],['stones','帮助药庐交易','获得35灵石']]},
    event24:l.id===1?{title:'旧纹护心玉',text:'古井边留有一枚可以被后世找回的实体，照世碑也记录了第一幅灵藏图谱。',options:[['jade','拾起旧玉','前世实物 + 旧纹吐纳玉图谱']]}:{title:'灾后山中奇遇',text:'从旧世界留下的线索里，选择不同收获。',options:[['relic','参悟凝息珠','永久收录绿色灵藏图谱'],['herbs','寻找灵药','灵材+2']]},
    event34:{title:'荒谷石洞',text:'时间有限，优先追求丹材还是突破修为？行动消耗2年。',options:[['herbs','继续采材','灵材+3'],['insight','参悟石刻','修为+180']]},
    trial39:{title:'心魔问境',text:'每世可以再次面对个人命关，但世界历史不会重演。通过只获得本世一次性「心定印」，不重复刷永久碎片。',options:[['cultiv','以修为镇心',`修为≥900，消耗150修为、1年；当前${l.cultivation.toFixed(0)}`,l.cultivation>=900],['herbs','以药定神','消耗1灵材、15灵石、2年',l.herbs>=1&&l.stones>=15],['retreat','暂避心魔','消耗2年，保命但放弃本次收益']]},
    warning45:{title:'灵潮将至',text:'浮岚历60年，归墟灵潮会吞没没有准备的修士。你必须在灾劫发生前完成筑基或护脉丹。',options:[['ack','明白，继续备劫','查看应劫面板可以了解缺口']]},
    tide60:{title:'归墟 · 灵潮逆涌',text:hasProtection(g)?'准备生效！本世可以幸存。此事件在本世界只会发生一次。':'你没有在灾劫发生之前完成筑基或护脉丹。本世将在这里陨落。',options:[['resolve',hasProtection(g)?'渡过灵潮':'接受此世结局',hasProtection(g)?'继续人生，寿元不会重置':'结算轮回点，前世实物遗落世间']]},
    warning92:{title:'灵脉传来不祥之兆',text:'世界95年将发生地方余波危机，并非重播全球灵潮。',options:[['ack','记下预兆','可在此之前积累灵材与灵石']]},
    vein95:{title:'余潮断脉',text:'这场地方事件只发生一次，但影响后世。使用不同资源稳定灵脉，或付出代价安全离开。',options:[['stabilize','以境稳脉','筑基、10灵石、2年',l.realm==='筑基'&&l.stones>=10],['medicine','药材调脉','35灵石、2灵材、3年',l.stones>=35&&l.herbs>=2],['escape','花费灵石撤离','15灵石、1年；遗失地方机缘',l.stones>=15],['labor','做工换取撤离','3年；保命但遗失地方机缘']]},
    lifeline:{title:'前世带来的路',text:'世界历史仍在变化，但你的生涯资源机会不会因为跨世而永远消失。',options:[['relic','参悟凝息珠','永久获得绿色灵藏图谱'],['herbs','采集药材','灵材+2']]},
  };
  return dialogs[g.dialog]||null;
}
