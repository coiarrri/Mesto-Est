/* Место есть: интерфейс (вкладки, отметки, аренда, договор, аккаунт).
   Карта подключается отдельным файлом mesto-map.js и регистрируется в объекте MAP.
   Без неё вкладка «Карта» показывает заглушку, всё остальное работает. */
var MAP = {};
function mapCall(name){ var f = MAP[name]; return f ? f.apply(null, [].slice.call(arguments, 1)) : undefined; }
function mapAttachOrPlaceholder(){
  if(MAP.attach){ MAP.attach(); return; }
  var slot = $('#mapslot');
  if(slot) slot.innerHTML = '<div class="mapph"><div><b>Здесь будет карта района</b><span>Карту подключаем отдельным файлом. Остальное работает</span></div></div>';
}
  var $ = function(s){ return document.querySelector(s); };
  var clamp = function(v,a,b){ return Math.max(a, Math.min(b, v)); };
  var bump = function(h,mu,s,a){ return a * Math.exp(-Math.pow((h-mu)/s, 2)); };
  var pad = function(n){ return (n < 10 ? '0' : '') + n; };
  var A = function(a,v){ return ' data-a="'+a+'"' + (v !== undefined ? ' data-v="'+v+'"' : ''); };
  var PROFILE = {
    home:function(d,h){ return d==='wd' ? 0.35+bump(h,21,3.5,0.55)+bump(h,6.5,2,0.15)-bump(h,13,3,0.2) : 0.55+bump(h,15,6,0.15)+bump(h,22,3,0.2); },
    park:function(d,h){ return d==='wd' ? 0.25+bump(h,18,3,0.4) : 0.3+bump(h,14,4,0.55); },
    edge:function(d,h){ return d==='wd' ? 0.2+bump(h,9,2.5,0.45)+bump(h,17.5,2,0.25) : 0.2+bump(h,14,5,0.15); }
  };
  var IC = {
    pin:'<path d="M12 21s-6.5-5.4-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.6 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/>',
    cal:'<rect x="4" y="5" width="16" height="14" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    plus:'<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>',
    user:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5"/>',
    check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
    bolt:'<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
    wheel:'<circle cx="11" cy="4.5" r="1.8"/><path d="M11 8v6h5l2.5 5"/><path d="M8.2 11.6A5 5 0 1 0 15 18.6"/>',
    phone:'<path d="M6 4h3l1.5 4-2 1.3a10 10 0 0 0 4.2 4.2L14 11.5l4 1.5v3a2 2 0 0 1-2 2A12 12 0 0 1 4 6a2 2 0 0 1 2-2z"/>',
    park:'<path d="M9 18V6h4.2a3.4 3.4 0 0 1 0 6.8H9"/>',
    loc:'<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>',
    all:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    arrow:'<path d="M7 17L17 7M9 7h8v8"/>'
  };
  function ic(n, s){ return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"'+(s?' style="width:'+s+'px;height:'+s+'px"':'')+'>'+IC[n]+'</svg>'; }

  /* ---------- время ---------- */
  var DOW = ['вс','пн','вт','ср','чт','пт','сб'];
  var MON = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  var MS = ['янв.','февр.','мар.','апр.','мая','июн.','июл.','авг.','сент.','окт.','нояб.','дек.'];
  function realNow(){ var d = new Date(), w = d.getDay(); return {day:(w===0||w===6)?'we':'wd', hour:d.getHours(), time:pad(d.getHours())+':'+pad(d.getMinutes()), dow:DOW[w]}; }
  function ymd(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function pdate(s){ var p = s.split('-'); return new Date(+p[0], +p[1]-1, +p[2]); }
  function fmtD(s){ var d = pdate(s); return d.getDate()+' '+MS[d.getMonth()]; }
  function hh(h){ return pad(h)+':00'; }
  function stamp(){ var d = new Date(); return d.getDate()+' '+MS[d.getMonth()]+', '+pad(d.getHours())+':'+pad(d.getMinutes()); }

  var n0 = realNow(), today0 = new Date();
  var state = {tab:'map', fc:{day:n0.day, hour:n0.hour}, mapFc:false, layer:'places', sel:defSel(), theme:'light', sheetMore:false, look:'bands', edit:false, tool:'row', kind:'perp', snap:true, draft:null, gps:null, here:false, marks:[], last:null, user:null, bookings:[], mine:[], when:'all', fCov:false, fEv:false, fFree:false, zoneFilter:'', helped:0, nextId:100, gate:'', sheetMin:false};
  function T(){ if(state.mapFc) return state.fc; var n = realNow(); return {day:n.day, hour:n.hour}; }

  function zone(id){ return DISTRICT.zones.filter(function(z){ return z.id === id; })[0]; }
  function load(z,t){ return clamp(PROFILE[z.profile](t.day, t.hour) + (z.j || 0), 0, 0.97); }
  function shift(z,t){
    var s = 0;
    state.marks.forEach(function(m){ if(m.zone !== z.id || m.day !== t.day) return; s += Math.exp(-Math.abs(t.hour - m.hour) * 60 / 30) * (m.kind === 'busy' ? -0.2 : 0.2); });
    return s;
  }
  function frac(z,t){ t = t || T(); return clamp(1 - load(z,t) + shift(z,t), 0.02, 0.98); }
  function freeEst(z,t){ return Math.max(0, Math.round(z.spots * frac(z,t))); }
  function pct(z,t){ return Math.round(frac(z,t)*100); }
  function level(z){ var c = frac(z); return c >= 0.6 ? 'hi' : (c >= 0.35 ? 'mid' : 'lo'); }
  function lvlText(z){ var l = level(z); return l==='hi' ? 'Места есть' : (l==='mid' ? 'Придётся поискать' : 'Почти нет мест'); }
  function perim(){ return DISTRICT.zones.filter(function(z){ return z.type === 'perimeter'; }); }
  function allListings(){ return state.mine.concat(DISTRICT.listings); }
  function listing(id){ return allListings().filter(function(l){ return l.id === id; })[0]; }
  function fmtP(v){ return Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ','); }
  function money(v){ return fmtP(Math.round(v*100)/100) + ' руб.'; }
  function parseP(s){ var v = parseFloat(String(s).replace(',', '.')); return (isFinite(v) && v > 0) ? Math.round(v*100)/100 : NaN; }
  function parkName(l){ var z = zone(l.zone); return z ? z.name : 'Парковка'; }
  function fullName(u){ return u.surname + ' ' + u.name + (u.patr ? ' ' + u.patr : ''); }
  function maskId(s){ return s ? s.slice(0,3) + '•••••••••' + s.slice(-2) : 'не указан'; }
  function needPassport(msg){ state.gate = msg; state.tab = 'account'; render(true); toast('Добавьте паспортные данные'); }

  function mapPart(){ return '<div id="legendwrap">' + legend() + '</div>'; }
  function legend(){
    if(state.layer !== 'places') return '';
    return '<div class="legend"><span><i style="background:#C9F54E"></i>Свободно</span><span><i style="background:#12150F;border:1px solid #888"></i>Занято</span><span>≈ оценка по зоне, не по каждому месту</span></div>';
  }

  var DEMO = true;   /* демо: отмечать можно без GPS. В боевой версии поставить false */
  function canMark(z){ return z.type === 'perimeter' && (DEMO || !!state.gps); }
  function whenLabel(t){ return (t.day === 'wd' ? 'будни' : 'выходные') + ', ' + hh(t.hour); }
  function dock(){
    if(state.edit && MAP.editHtml) return MAP.editHtml();
    var L = state.layer, z = zone(state.sel), live = !state.mapFc, n = realNow();
    var tag = live ? '<span class="nowtag">Сейчас · '+n.dow+', '+n.time+'</span>' : '<button type="button" class="fctag"'+A('gonow')+'>Прогноз: '+whenLabel(state.fc)+' · вернуться к «сейчас»</button>';
    if(L === 'access'){
      return '<section class="dock"><div class="nm">Места для людей с инвалидностью</div><div class="sub">Статус обновляют жители</div><ul class="zl" style="margin-top:12px">' +
        DISTRICT.accessible.map(function(a){ return '<li><div class="irow"><span>'+a.name+'</span><span class="st '+a.status+'">'+(a.status==='free'?'Свободно':'Занято')+'</span></div></li>'; }).join('') +
        '</ul><div class="dockhint" style="font-size:14px;color:var(--ink);margin-top:14px">Место занято без права? Позвоните в службу.</div><a href="tel:" class="dbtn" onclick="return false">'+ic('phone')+' Позвонить: '+ACCESS_PHONE+'</a><div class="dockhint">Номер службы уточним (скорее всего ГАИ района). Приложение ничего не отправляет, вы звоните сами.</div></section>';
    }
    if(L === 'ev'){
      return '<section class="dock"><div class="nm">Места с зарядкой</div><div class="sub">Электричество по договорённости с владельцем</div><ul class="zl" style="margin-top:12px">' +
        DISTRICT.chargers.map(function(c){ return '<li><div class="irow"><span>'+c.name+'</span><span class="st '+c.status+'">'+(c.status==='free'?'Свободно':'Занято')+'</span></div></li>'; }).join('') +
        '</ul><button type="button" class="dbtn"'+A('evrent')+'>Смотреть места с зарядкой</button></section>';
    }
    if(L === 'parkings' || z.type === 'garage'){
      var g = z.type === 'garage' ? z : zone('gA');
      return '<section class="dock"><div class="nm">'+g.name+'</div><div class="sub">Многоуровневый паркинг · почасовая оплата</div>' +
        '<div class="row"><div class="big">'+g.freeDemo+'<small>из '+g.spots+' мест свободно</small></div></div>' +
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><span class="pill">от '+fmtP(g.hourly)+' руб. в час</span><span class="pill">'+allListings().filter(function(l){ return l.zone===g.id; }).length+' мест в аренде</span></div>' +
        '<button type="button" class="dbtn"'+A('gorent',g.id)+'>Смотреть места в аренде</button><div class="dockhint">Демо: так могла бы выглядеть почасовая парковка у застройщика или ТС.</div></section>';
    }
    var last = state.marks.filter(function(m){ return m.zone === z.id; }).slice(-1)[0];
    var can = live && canMark(z);
    var where = state.gps && state.gps.acc ? 'Вы здесь · точность около '+state.gps.acc+' м' : (DEMO ? 'Демо: выбрано на карте' : 'Выбрано на карте');
    var h = '<section class="dock"><div class="rowi"><span class="ico">'+ic('pin')+'</span><div class="rt"><small>'+where+'</small><b>'+z.name+'</b></div><span class="pill">шанс '+pct(z)+'%</span></div>' +
      '<div class="stat"><div class="big">≈'+freeEst(z)+'</div><div class="bt"><b>из '+z.spots+' мест свободно</b><span>'+lvlText(z)+'</span></div></div><div style="margin:2px 2px 0">'+tag+'</div>';
    if(can){
      h += '<div class="btns"><button type="button" class="bigbtn free"'+A('mark','free')+'>'+ic('check',22)+'Свободно</button><button type="button" class="bigbtn busy"'+A('mark','busy')+'>'+ic('x',22)+'Занято</button></div>';
      if(state.last && state.last.zone === z.id) h += '<div class="stamp"><span>Ваша отметка: <b>'+(state.last.kind==='free'?'свободно':'занято')+'</b> в '+state.last.time+'</span><button type="button"'+A('undo')+'>Отменить</button></div>';
      else h += '<div class="dockhint" style="margin-top:8px">'+(state.gps ? 'Зона определена по GPS. Один тап, без подтверждений.' : 'Демо: в боевой версии кнопки появятся, когда вы рядом с зоной (GPS до 40 м).')+'</div>';
    } else if(live){
      h += '<div class="dockhint">Чтобы отметить место, нужно находиться на парковке. Нажмите «Где я» справа на карте.</div>';
      if(last) h += '<div class="stamp"><span>Последняя отметка: <b>'+(last.kind==='free'?'свободно':'занято')+'</b> в '+last.time+'</span></div>';
    } else {
      h += '<div class="dockhint">Отметки «свободно / занято» доступны только для текущего момента.</div>';
    }
    return h + '</section>';
  }
  function fcResults(){
    var t = state.fc, list = perim().slice().sort(function(a,b){ return frac(b,t) - frac(a,t); }).slice(0,3);
    return '<div class="sm muted" style="margin-top:12px">Лучше всего приехать сюда ('+whenLabel(t)+'):</div><ul class="zl">' + list.map(function(z){
      return '<li><button type="button"'+A('zlist',z.id)+'><span>'+z.name+'</span><span class="ct">≈'+freeEst(z,t)+' · '+pct(z,t)+'%</span></button></li>'; }).join('') + '</ul>';
  }

  function moreHtml(){
    var t = state.fc, list = perim().slice().sort(function(a,b){ return frac(b) - frac(a); }).slice(0,6);
    return '<div class="card"><div class="lbl" style="margin-bottom:10px">Прогноз на другое время</div><div class="timecard"><div class="seg" role="group" aria-label="Тип дня"><button type="button"'+A('fcday','wd')+' aria-pressed="'+(t.day==='wd')+'">Будни</button><button type="button"'+A('fcday','we')+' aria-pressed="'+(t.day==='we')+'">Выходные</button></div>' +
      '<input id="hour" type="range" min="0" max="23" step="1" value="'+t.hour+'" aria-label="Время"><output id="fcout" for="hour">'+hh(t.hour)+'</output></div>' +
      '<div id="fcres">'+fcResults()+'</div>' +
      (state.mapFc ? '<button type="button" class="cta ghost" style="margin-top:12px;min-height:48px;font-size:15px"'+A('gonow')+'>Вернуться к «сейчас»</button>' : '<button type="button" class="cta" style="margin-top:12px;min-height:48px;font-size:15px"'+A('fcmap')+'>Показать на карте</button>') + '</div>' +
      '<div class="card"><div class="lbl">Свободнее всего сейчас</div><ul class="zl">' +
      list.map(function(z){ return '<li><button type="button"'+A('zlist',z.id)+'><span>'+z.name+'</span><span class="ct">≈'+freeEst(z)+' · '+pct(z)+'%</span></button></li>'; }).join('') + '</ul></div>' + mapPart();
  }
  function mapView(){
    var layers = [['places','Места','pin'],['parkings','Паркинги','park'],['access','Спецместа','wheel'],['ev','Зарядки','bolt']];
    return '<div class="stage"><div id="mapslot"></div>' +
      '<div class="topbar"><div class="chips" role="group" aria-label="Слои карты">' + (state.edit ? '<span class="chip" style="background:var(--lime);color:#0E100D;border:0">Режим разметки</span>' : layers.map(function(l){ return '<button type="button" class="chip"'+A('layer',l[0])+' aria-pressed="'+(state.layer===l[0])+'">'+ic(l[2])+l[1]+'</button>'; }).join('')) + '</div></div>' +
      (MAP.attach ? '<button type="button" class="locbtn"'+A('locate')+' aria-label="Где я">'+ic('loc',22)+'</button><button type="button" class="locbtn two"'+A('fitall')+' aria-label="Весь район">'+ic('all',22)+'</button>' : '') +
      '<aside class="sheet" aria-label="Панель парковок"><div id="dockwrap">'+dock()+'</div>' +
      (state.edit ? '' : '<button type="button" class="moreb"'+A('more')+' aria-expanded="'+state.sheetMore+'">'+(state.sheetMore?'Скрыть':'Прогноз и список зон')+'<svg class="i" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>' +
      (state.sheetMore ? '<div id="morewrap">'+moreHtml()+'</div>' : '')) + '</aside></div>';
  }

  /* ---------- аренда ---------- */
  function mainPrice(l){
    if(l.free && !l.hour && !l.day && !l.month) return ['Бесплатно',''];
    if(l.hour) return [fmtP(l.hour), 'руб. в час'];
    if(l.day) return [fmtP(l.day), 'руб. в сутки'];
    return [fmtP(l.month), 'руб. в месяц'];
  }
  function altPrice(l){
    var a = [];
    if(l.free && (l.hour||l.day||l.month)) a.push('можно бесплатно');
    if(l.hour && l.day) a.push(fmtP(l.day)+' руб./сутки');
    if(l.month && (l.hour||l.day)) a.push(fmtP(l.month)+' руб./мес');
    return a.join(' · ');
  }
  function card(l, preview){
    var p = mainPrice(l), alt = altPrice(l);
    return '<article class="l-card"><div class="l-head"><div><div class="l-title">'+l.title+'</div><div class="muted sm">'+parkName(l)+' · '+l.walk+' мин пешком</div></div>' +
      (preview ? '' : '<button type="button" class="round"'+A('book',l.id)+' aria-label="Забронировать: '+l.title+'">'+ic('arrow')+'</button>') + '</div>' +
      '<div><div class="price">'+p[0]+(p[1]?'<small>'+p[1]+'</small>':'')+'</div>'+(alt?'<div class="alt">'+alt+'</div>':'')+'</div>' +
      '<div class="facts"><span class="fact">'+ic('cal')+l.whenText+'</span><span class="fact">'+ic('user')+l.owner+(l.rating?' · '+l.rating:'')+'</span>' +
      (l.ev?'<span class="fact lime">'+ic('bolt')+'Зарядка</span>':'')+(l.mine&&!preview?'<span class="fact lime">Ваше</span>':'')+'</div></article>';
  }
  function rentView(){
    var items = allListings().filter(function(l){
      if(state.when !== 'all' && l.avail.indexOf(state.when) < 0 && !l.mine) return false;
      if(state.fCov && !l.cov) return false; if(state.fEv && !l.ev) return false; if(state.fFree && !l.free) return false;
      if(state.zoneFilter && l.zone !== state.zoneFilter) return false; return true;
    });
    var whens = [['all','Любое время'],['today','Сегодня'],['tomorrow','Завтра'],['weekend','Выходные']];
    var mine = state.bookings.length ? '<section class="card"><div class="lbl" style="margin-bottom:10px">Мои брони</div>' + state.bookings.map(function(b){
      var l = listing(b.listing);
      return '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--line)"><div><b>'+l.title+'</b><div class="muted sm">'+b.when+', '+b.qtyText+' · '+(b.total?money(b.total):'бесплатно')+'</div></div><span class="st '+b.status+'">'+({request:'Запрос',confirmed:'Подтверждено',declined:'Отказ'})[b.status]+'</span></div>';
    }).join('') + '</section>' : '';
    return '<h1 class="h1">Места в аренде</h1>' +
      '<div class="chips" role="group" aria-label="Когда нужно">' + whens.map(function(w){ return '<button type="button" class="chip"'+A('when',w[0])+' aria-pressed="'+(state.when===w[0])+'">'+w[1]+'</button>'; }).join('') + '</div>' +
      '<div class="chips" role="group" aria-label="Фильтры"><button type="button" class="chip lime"'+A('flt','fFree')+' aria-pressed="'+state.fFree+'">Бесплатно</button><button type="button" class="chip lime"'+A('flt','fCov')+' aria-pressed="'+state.fCov+'">Крытое</button><button type="button" class="chip lime"'+A('flt','fEv')+' aria-pressed="'+state.fEv+'">С зарядкой</button>' +
      (state.zoneFilter ? '<button type="button" class="chip"'+A('zf')+'>'+zone(state.zoneFilter).name+' ×</button>' : '') + '</div>' +
      mine + (items.length ? '<div class="lgrid">' + items.map(function(l){ return card(l); }).join('') + '</div>' : '<p class="muted">Ничего не нашлось. Попробуйте другое время или уберите фильтры.</p>') +
      '<p class="hint">Номер места виден после подтверждения брони. Цены демонстрационные: на Realt аренда места в месяц стоит 100–300 руб. (данные команды). Платежи появятся на втором этапе.</p>';
  }

  /* ---------- сдать ---------- */
  var offer = {zone:'gA', from:null, to:null, cm:{y:today0.getFullYear(), m:today0.getMonth()}, allDay:true, t1:'09:00', t2:'18:00', free:false, hour:true, day:false, month:false, hp:'3', dp:'15', mp:'180', ev:false, num:'', own:false, terms:false};
  function rangeText(){
    var o = offer;
    if(!o.from) return '';
    var f = pdate(o.from), t = pdate(o.to || o.from), txt;
    if(o.to && o.to !== o.from){ txt = (f.getMonth() === t.getMonth()) ? f.getDate()+'–'+t.getDate()+' '+MS[t.getMonth()] : f.getDate()+' '+MS[f.getMonth()]+' – '+t.getDate()+' '+MS[t.getMonth()]; }
    else txt = f.getDate()+' '+MS[f.getMonth()];
    return txt + ', ' + (o.allDay ? 'весь день' : o.t1 + '–' + o.t2);
  }
  function calHtml(){
    var cm = offer.cm, first = new Date(cm.y, cm.m, 1), start = (first.getDay()+6)%7, dim = new Date(cm.y, cm.m+1, 0).getDate(), tdy = ymd(new Date()), i;
    var h = '<div class="cal"><div class="cal-h"><button type="button"'+A('cal','-1')+' aria-label="Предыдущий месяц">‹</button><b>'+MON[cm.m]+' '+cm.y+'</b><button type="button"'+A('cal','1')+' aria-label="Следующий месяц">›</button></div><div class="cal-g">' +
      ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(function(d){ return '<span class="dw">'+d+'</span>'; }).join('');
    for(i = 0; i < start; i++) h += '<span></span>';
    for(i = 1; i <= dim; i++){
      var s = ymd(new Date(cm.y, cm.m, i)), end = offer.to || offer.from;
      var inr = offer.from && s >= offer.from && s <= end, edge = s === offer.from || s === end;
      h += '<button type="button" class="day'+(edge?' edge':(inr?' in':''))+(s===tdy?' today':'')+'"'+A('cd',s)+(s < tdy?' disabled':'')+' aria-pressed="'+(!!edge)+'" aria-label="'+i+' '+MON[cm.m]+'">'+i+'</button>';
    }
    return h + '</div></div>';
  }
  function priceField(key, label, id){
    return '<div class="field" style="margin-bottom:12px"><label class="lbl" for="'+id+'" style="font-weight:500;font-size:14px">'+label+'</label><div class="inp"><input id="'+id+'" type="text" inputmode="decimal" autocomplete="off" value="'+offer[key]+'" placeholder="0,00"><span>руб.</span></div></div>';
  }
  function previewListing(){
    var o = offer, l = {id:'prev', title:o.ev?'Место с зарядкой':'Крытое место', zone:o.zone, owner:state.user?state.user.name:'Вы', rating:'', whenText:rangeText() || 'выберите даты', avail:[], walk:3, cov:true, ev:o.ev, mine:true}, ok = false, v;
    if(o.free){ l.free = true; ok = true; }
    if(o.hour && !isNaN(v = parseP(o.hp))){ l.hour = v; ok = true; }
    if(o.day && !isNaN(v = parseP(o.dp))){ l.day = v; ok = true; }
    if(o.month && !isNaN(v = parseP(o.mp))){ l.month = v; ok = true; }
    return ok ? l : null;
  }
  function previewHtml(){ var l = previewListing(); return l ? card(l, true) : '<p class="muted sm" style="margin:0 4px 12px">Выберите формат и введите цену, здесь появится карточка.</p>'; }
  function offerView(){
    var o = offer, fmt = function(k, name){ return '<button type="button" class="chip"'+A('fmt',k)+' aria-pressed="'+o[k]+'">'+name+'</button>'; };
    return '<h1 class="h1">Сдать своё место</h1>' +
      '<section class="card">' +
      '<div class="field"><div class="lbl">1. Где место</div><div class="chips wrap"><button type="button" class="chip"'+A('ozone','gA')+' aria-pressed="'+(o.zone==='gA')+'">Паркинг A</button><button type="button" class="chip"'+A('ozone','gB')+' aria-pressed="'+(o.zone==='gB')+'">Паркинг B</button></div></div>' +
      '<div class="field"><div class="lbl">2. Когда свободно</div><p class="sm muted">Нажмите первый день, затем последний. Один день: нажмите его дважды.</p>' + calHtml() +
      '<div class="range">'+(o.from ? rangeText() : 'Даты не выбраны')+'</div>' +
      '<label class="opt"><input type="checkbox" class="sw" id="of-all"'+(o.allDay?' checked':'')+'><span>Весь день</span></label>' +
      (o.allDay ? '' : '<div class="two"><div><label class="sm muted" for="of-t1">С</label><input id="of-t1" type="time" value="'+o.t1+'"></div><div><label class="sm muted" for="of-t2">До</label><input id="of-t2" type="time" value="'+o.t2+'"></div></div>') + '</div>' +
      '<div class="field"><div class="lbl">3. Как сдаёте</div><div class="chips wrap">'+fmt('free','Бесплатно')+fmt('hour','Почасово')+fmt('day','Посуточно')+fmt('month','Помесячно')+'</div>' +
      (o.hour?priceField('hp','Цена за час','of-hp'):'') + (o.day?priceField('dp','Цена за сутки','of-dp'):'') + (o.month?priceField('mp','Цена за месяц','of-mp'):'') +
      '<p class="sm muted">Копейки можно: 5,60 или 5.6.</p></div>' +
      '<div class="field" style="margin-bottom:0"><div class="lbl">4. Детали</div><input id="of-num" type="text" inputmode="numeric" placeholder="Номер места, виден только после брони" value="'+o.num+'" aria-label="Номер места"><label class="opt"><input type="checkbox" class="sw" id="of-ev"'+(o.ev?' checked':'')+'><span>Есть зарядка для электромобиля</span></label></div></section>' +
      '<div class="lbl" style="margin:4px 4px 8px">Так увидят ваше место</div><div id="prev">'+previewHtml()+'</div>' +
      '<section class="card"><div class="lbl" style="margin-bottom:10px">Как оформляется сделка</div><ol class="steps"><li>Гость отправляет запрос и принимает условия.</li><li>Вы подтверждаете запрос в приложении.</li><li>Договор формируется сам из данных обеих сторон и принимается онлайн. Бумаги не нужны.</li></ol></section>' +
      '<label class="opt" style="margin-bottom:4px"><input type="checkbox" class="ck" id="of-own"'+(o.own?' checked':'')+'><span>Я владелец места или имею право им распоряжаться</span></label>' +
      '<label class="opt" style="margin-bottom:12px"><input type="checkbox" class="ck" id="of-terms"'+(o.terms?' checked':'')+'><span>Принимаю <button type="button" class="linkbtn"'+A('doc','terms')+'>соглашение</button> и <button type="button" class="linkbtn"'+A('doc','offer')+'>оферту</button> сервиса</span></label>' +
      '<button type="button" class="cta"'+A('publish')+'>Опубликовать</button>';
  }

  /* ---------- аккаунт ---------- */
  function accountView(){
    var docs = '<section class="card"><div class="lbl" style="margin-bottom:10px">Документы</div><div class="chips wrap"><button type="button" class="chip"'+A('doc','terms')+'>Соглашение</button><button type="button" class="chip"'+A('doc','offer')+'>Оферта</button><button type="button" class="chip"'+A('doc','privacy')+'>Политика данных</button><button type="button" class="chip"'+A('doc','contract')+'>Шаблон договора</button></div></section>';
    if(!state.user){
      return '<h1 class="h1">Аккаунт</h1>' + (state.gate ? '<div class="card" style="background:var(--lime-tint);border-color:transparent"><b>'+state.gate+'</b></div>' : '') +
        '<section class="card"><div class="lbl">Вы гость</div><p class="muted sm" style="margin-top:6px">Смотреть карту и отмечать места можно без регистрации. Аккаунт нужен, чтобы бронировать и сдавать места: договор заключается между конкретными людьми.</p></section>' +
        '<section class="card"><div class="field"><label class="lbl" for="ac-s">Фамилия</label><input id="ac-s" type="text" autocomplete="family-name"></div>' +
        '<div class="two"><div class="field"><label class="lbl" for="ac-n">Имя</label><input id="ac-n" type="text" autocomplete="given-name"></div><div class="field"><label class="lbl" for="ac-o">Отчество</label><input id="ac-o" type="text" autocomplete="additional-name"></div></div>' +
        '<div class="field"><label class="lbl" for="ac-p">Телефон</label><input id="ac-p" type="tel" placeholder="+375" autocomplete="tel"></div>' +
        '<div class="field"><label class="lbl" for="ac-e">Электронная почта</label><input id="ac-e" type="text" inputmode="email" placeholder="name@mail.by" autocomplete="email"></div>' +
        '<div class="field"><label class="lbl" for="ac-w">Пароль</label><input id="ac-w" type="password" placeholder="От 6 знаков" autocomplete="new-password"></div>' +
        '<div class="note"><b>Код из SMS или письма пока не отправляем.</b> Рассылка кодов платная, поэтому на первом этапе вход без подтверждения. Подтверждение номера и почты подключим на втором этапе, когда будет бюджет.</div>' +
        '<button type="button" class="cta"'+A('signup')+'>Создать аккаунт</button><p class="hint">Паспортные данные попросим позже, перед первой бронью или сдачей места. Прототип: данные никуда не отправляются.</p></section>' + docs;
    }
    var reqs = state.bookings.filter(function(b){ return b.status === 'request'; }), u = state.user;
    return '<h1 class="h1">Аккаунт</h1>' +
      '<section class="card" style="display:flex;gap:14px;align-items:center"><div class="avatar">'+u.name.charAt(0).toUpperCase()+'</div><div style="flex:1;min-width:0"><div class="lbl" style="font-size:18px">'+fullName(u)+'</div><div class="muted sm">'+u.phone+' · '+u.email+'</div></div><button type="button" class="chip"'+A('logout')+'>Выйти</button></section>' +
      (state.gate ? '<div class="card" style="background:var(--lime-tint);border-color:transparent"><b>'+state.gate+'</b></div>' : '') +
      (u.pid ? '<div class="note" style="margin-top:0">Личность указана: ИН '+maskId(u.pid)+', паспорт '+u.passport+'</div>' :
        '<section class="card"><div class="lbl">Добавьте паспортные данные</div><p class="muted sm" style="margin:6px 0 12px">Нужно один раз, перед первой бронью или публикацией места. Они подставляются в договор. Другая сторона видит только ваше имя.</p>' +
        '<div class="field"><label class="lbl" for="pp-i">Идентификационный номер</label><input id="pp-i" type="text" placeholder="3010190A001PB1" maxlength="14" autocapitalize="characters" autocomplete="off"></div>' +
        '<div class="field"><label class="lbl" for="pp-n">Серия и номер паспорта</label><input id="pp-n" type="text" placeholder="MP1234567" maxlength="9" autocapitalize="characters" autocomplete="off"></div>' +
        '<button type="button" class="cta"'+A('passport')+'>Сохранить</button><p class="hint">Хранить будем в зашифрованном виде. Проверка по базе (например, через МСИ) появится на втором этапе.</p></section>') +
      '<div class="two" style="margin-bottom:12px"><div class="tile"><b>'+state.helped+'</b><span class="muted sm">отметок вы сделали</span></div><div class="tile"><b>'+state.mine.length+'</b><span class="muted sm">мест вы сдаёте</span></div></div>' +
      '<section class="card"><div class="lbl" style="margin-bottom:8px">Мои брони</div>' + (state.bookings.length ? state.bookings.map(function(b){
        var l = listing(b.listing);
        return '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:9px 0;border-top:1px solid var(--line)"><div><b>'+l.title+'</b><div class="muted sm">'+b.when+', '+b.qtyText+'</div></div><div style="text-align:right"><span class="st '+b.status+'">'+({request:'Запрос',confirmed:'Подтверждено',declined:'Отказ'})[b.status]+'</span>'+(b.status==='confirmed'?'<div><button type="button" class="chip" style="min-height:32px;padding:4px 10px;margin-top:6px"'+A('agree',b.id)+'>Договор</button></div>':'')+'</div></div>';
      }).join('') : '<p class="muted sm">Броней пока нет. Выберите место на вкладке «Аренда».</p>') + '</section>' +
      '<section class="card"><div class="lbl" style="margin-bottom:8px">Мои места</div>' + (state.mine.length ? state.mine.map(function(l){ return '<div style="padding:9px 0;border-top:1px solid var(--line)"><b>'+l.title+'</b><div class="muted sm">'+parkName(l)+' · '+l.whenText+'</div></div>'; }).join('') : '<p class="muted sm">Вы пока ничего не сдаёте. Вкладка «Сдать», это минута.</p>') + '</section>' +
      '<section class="card"><div class="lbl" style="margin-bottom:4px">Запросы мне</div><p class="muted sm" style="margin-bottom:8px">Демо: вы играете и гостя, и владельца.</p>' + (reqs.length ? reqs.map(function(b){ var l = listing(b.listing);
        return '<div style="padding:9px 0;border-top:1px solid var(--line)"><b>'+l.title+'</b><div class="muted sm" style="margin-bottom:8px">'+b.when+', '+b.qtyText+' · '+(b.total?money(b.total):'бесплатно')+'</div><div class="two"><button type="button" class="cta" style="min-height:46px;font-size:15px"'+A('ans','ok:'+b.id)+'>Подтвердить</button><button type="button" class="cta ghost" style="min-height:46px;font-size:15px"'+A('ans','no:'+b.id)+'>Отказать</button></div></div>'; }).join('') : '<p class="muted sm">Новых запросов нет.</p>') + '</section>' + docs;
  }

  /* ---------- модальные окна ---------- */
  function openModal(html){ $('#msheet').innerHTML = html; $('#modal').hidden = false; var f = $('#msheet').querySelector('button,select,input'); if(f) f.focus(); }
  function closeModal(){ $('#modal').hidden = true; }
  var bk = null;
  function bookingHtml(){
    var l = listing(bk.id), fm = [];
    if(l.free) fm.push(['free','Бесплатно']); if(l.hour) fm.push(['hour','Час']); if(l.day) fm.push(['day','Сутки']); if(l.month) fm.push(['month','Месяц']);
    if(!bk.fmt || !fm.some(function(f){ return f[0] === bk.fmt; })) bk.fmt = fm[0][0];
    var maxq = bk.fmt==='hour' ? 12 : (bk.fmt==='month' ? 1 : 14);
    bk.qty = clamp(bk.qty, 1, maxq);
    var total = bk.fmt==='free' ? 0 : bk.fmt==='hour' ? l.hour*bk.qty : bk.fmt==='day' ? l.day*bk.qty : l.month*bk.qty;
    bk.total = total;
    return '<div class="l-title" style="font-size:22px">'+l.title+'</div><p class="muted sm" style="margin:2px 0 14px">'+parkName(l)+' · '+l.owner+' · доступно: '+l.whenText+'</p>' +
      '<div class="chips wrap" style="margin-bottom:12px">'+fm.map(function(f){ return '<button type="button" class="chip"'+A('bf',f[0])+' aria-pressed="'+(bk.fmt===f[0])+'">'+f[1]+'</button>'; }).join('')+'</div>' +
      '<div class="two" style="margin-bottom:12px"><div><label class="sm muted" for="bk-d">Дата</label><input id="bk-d" type="date" min="'+ymd(new Date())+'" value="'+bk.date+'"></div><div><label class="sm muted" for="bk-t">Начало</label><input id="bk-t" type="time" value="'+bk.time+'"></div></div>' +
      (bk.fmt==='month' ? '' : '<div class="num" style="margin-bottom:6px"><span class="nm">'+(bk.fmt==='hour'?'Сколько часов':'Сколько суток')+'</span><div class="step"><button type="button"'+A('bq','-1')+' aria-label="Меньше">−</button><b>'+bk.qty+'</b><button type="button"'+A('bq','1')+' aria-label="Больше">+</button></div></div>') +
      '<div class="sum"><span class="muted">Итого</span><b>'+(total?money(total):'бесплатно')+'</b></div>' +
      '<div class="doc"><p><b>Договор сформируется автоматически</b></p><p>Из ваших данных и данных владельца. Вы принимаете его в приложении, владелец подтверждает запрос, и договор вступает в силу. Подписывать бумаги не нужно.</p><p><button type="button" class="linkbtn"'+A('doc','contract')+'>Посмотреть шаблон договора</button></p></div>' +
      '<label class="opt" style="margin:8px 0"><input type="checkbox" class="ck" id="bk-ok"><span>Принимаю условия договора и оферту сервиса</span></label>' +
      '<div class="two"><button type="button" class="cta ghost"'+A('close')+'>Отмена</button><button type="button" class="cta"'+A('send')+'>Отправить запрос</button></div>';
  }
  function agreementHtml(b){
    var l = listing(b.listing), u = state.user;
    return '<div class="l-title" style="font-size:22px;margin-bottom:12px">Договор</div><div class="doc">' +
      '<p><b>Стороны.</b> Владелец: '+l.owner+'. Пользователь: '+fullName(u)+', ИН '+maskId(u.pid)+'.</p>' +
      '<p><b>Предмет.</b> Предоставление машино-места: '+l.title+', '+parkName(l)+'.</p>' +
      '<p><b>Срок.</b> '+b.when+', '+b.qtyText+'. <b>Цена.</b> '+(b.total?money(b.total):'бесплатно')+'</p>' +
      '<p><b>Правила.</b> Один автомобиль, правила паркинга и ТС, фото состояния места при въезде и выезде.</p>' +
      '<p><b>Принят в приложении.</b> Пользователь: '+b.createdAt+'. Владелец: '+(b.acceptedAt||'ожидается')+'.</p>' +
      '<p class="muted">Демонстрационный шаблон. Юридическую проверку пройдёт на втором этапе.</p></div>' +
      '<button type="button" class="cta" style="margin-top:12px"'+A('close')+'>Закрыть</button>';
  }
  var DOCS = {
    terms:['Пользовательское соглашение', ['Сервис помогает найти и сдать машино-место, платформа информационный посредник и не является стороной сделки.', 'Пользователь отвечает за достоверность данных и за право распоряжаться местом, которое сдаёт.', 'Нельзя сдавать чужие места, публиковать ложные отметки и использовать сервис за рулём.', 'За нарушения аккаунт может быть ограничен.']],
    offer:['Оферта сервиса', ['Принятие условий в приложении (нажатие «Принимаю») считается акцептом оферты.', 'Договор между владельцем и пользователем формируется автоматически из данных объявления и брони.', 'Условия, срок и цена фиксируются в приложении и доступны обеим сторонам.', 'Платежи в первой версии не проходят через сервис, стороны рассчитываются между собой.']],
    privacy:['Политика данных', ['Какие данные: имя, фамилия, телефон, идентификационный номер, геопозиция в момент отметки.', 'Зачем: заключение договора, защита от мошенничества, расчёт свободных мест.', 'Кому видны: другой стороне сделки только имя. Идентификационный номер никому не показывается.', 'Хранение: в зашифрованном виде, в соответствии с требованиями закона о защите персональных данных.']],
    contract:['Шаблон договора', ['Стороны: владелец места и пользователь, данные подставляются из аккаунтов.', 'Предмет: машино-место, адрес и номер, срок, цена и порядок расчётов.', 'Права и обязанности: один автомобиль, соблюдение правил паркинга, освобождение места в срок.', 'Ответственность: каждая сторона отвечает за причинённый вред. Фото состояния места при въезде и выезде.']]
  };
  function docHtml(k){
    var d = DOCS[k];
    return '<div class="l-title" style="font-size:22px;margin-bottom:12px">'+d[0]+'</div><div class="doc">'+d[1].map(function(p){ return '<p>'+p+'</p>'; }).join('')+'<p class="muted">Демонстрационный текст. Юридическую проверку пройдёт на втором этапе.</p></div><button type="button" class="cta" style="margin-top:12px"'+A('close')+'>Закрыть</button>';
  }

  var toastT;
  function toast(m){ var t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function(){ t.classList.remove('on'); }, 2800); }
  function needAccount(msg){ state.gate = msg; state.tab = 'account'; render(true); toast('Сначала создайте аккаунт'); }

  /* ---------- отрисовка и события ---------- */
  var main = $('#main');
  var views = {map:mapView, rent:rentView, offer:offerView, account:accountView};
  var TABS = [['map','Карта','pin'],['rent','Аренда','cal'],['offer','Сдать','plus'],['account','Аккаунт','user']];
  function render(top){
    var sc = main.scrollTop;
    main.className = state.tab === 'map' ? 'mapmain' : '';
    main.innerHTML = state.tab === 'map' ? views.map() : '<div class="narrow' + ((state.tab === 'offer' || state.tab === 'account') ? ' cols' : '') + '">' + views[state.tab]() + '</div>';
    main.scrollTop = top ? 0 : sc;
    if(state.tab === 'map') mapAttachOrPlaceholder();
    $('#nav').innerHTML = TABS.map(function(t){ return '<button type="button" role="tab"'+A('tab',t[0])+' aria-selected="'+(state.tab===t[0])+'" aria-label="'+t[1]+'">'+ic(t[2])+'<span>'+t[1]+'</span></button>'; }).join('');
  }
  function themeSeg(){ $('#themeseg').innerHTML = [['light','Светлый'],['dark','Тёмный']].map(function(t){ return '<button type="button"'+A('theme',t[0])+' aria-pressed="'+(state.theme===t[0])+'">'+t[1]+'</button>'; }).join(''); }
  function refreshMap(){ var d = $('#dockwrap'); if(d) d.innerHTML = dock(); var lg = $('#legendwrap'); if(lg) lg.innerHTML = legend(); mapCall('draw'); }
  function syncText(){ var v = $('#of-num'); if(v) offer.num = v.value; }

  document.addEventListener('click', function(e){
    var t = e.target.closest('[data-a]');
    if(!t || t.disabled) return;
    var a = t.getAttribute('data-a'), v = t.getAttribute('data-v'), i;
    switch(a){
      case 'tab': state.tab = v; if(v !== 'account') state.gate = ''; if(v !== 'rent') state.zoneFilter = ''; render(true); break;
      case 'zone': state.sel = v; render(); break;
      case 'zlist': state.sel = v; state.layer = 'places'; render(); mapCall('focusZone', v); break;
      case 'fcday': state.fc.day = v; render(); break;
      case 'fcmap': state.mapFc = true; render(true); break;
      case 'gonow': state.mapFc = false; var nn = realNow(); state.fc = {day:nn.day, hour:nn.hour}; render(true); break;
      case 'layer': state.layer = v; render(); mapCall('onLayer', v); break;
      case 'more': state.sheetMore = !state.sheetMore; render(); break;
      case 'theme': state.theme = v; document.documentElement.setAttribute('data-theme', v); themeSeg(); break;
      case 'mark':
        var nw = realNow(), m = {zone:state.sel, kind:v, hour:nw.hour, day:nw.day, time:nw.time};
        state.marks.push(m); state.last = m; state.helped += 1; toast('Отмечено в '+m.time+'. Увидят соседи'); render(); break;
      case 'undo': i = state.marks.indexOf(state.last); if(i >= 0){ state.marks.splice(i,1); state.helped = Math.max(0, state.helped-1); } state.last = null; toast('Отметка отменена'); render(); break;
      case 'gorent': state.zoneFilter = v; state.tab = 'rent'; render(true); break;
      case 'evrent': state.fEv = true; state.zoneFilter = ''; state.tab = 'rent'; render(true); break;
      case 'when': state.when = v; render(); break;
      case 'flt': state[v] = !state[v]; render(); break;
      case 'zf': state.zoneFilter = ''; render(); break;
      case 'book':
        if(!state.user){ needAccount('Чтобы бронировать, войдите в аккаунт'); break; }
        if(listing(v).mine){ toast('Это ваше место'); break; }
        if(!state.user.pid){ needPassport('Чтобы бронировать, добавьте паспортные данные: они нужны для договора'); break; }
        bk = {id:v, fmt:'', qty:1, date:ymd(new Date()), time:'19:00'}; openModal(bookingHtml()); break;
      case 'close': closeModal(); break;
      case 'doc': openModal(docHtml(v)); break;
      case 'bf': bk.fmt = v; bk.qty = 1; openModal(bookingHtml()); break;
      case 'bq': bk.qty += Number(v); openModal(bookingHtml()); break;
      case 'send':
        if(!$('#bk-ok').checked){ toast('Подтвердите согласие с условиями'); break; }
        if(!bk.date){ toast('Выберите дату'); break; }
        var qt = bk.fmt==='month' ? '1 мес.' : bk.qty+' '+(bk.fmt==='hour'?'ч':'сут.');
        state.bookings.unshift({id:'b'+(state.nextId++), listing:bk.id, fmt:bk.fmt, qty:bk.qty, qtyText:qt, when:fmtD(bk.date)+', с '+bk.time, total:bk.total, status:'request', createdAt:stamp()});
        closeModal(); state.tab = 'rent'; render(true); toast('Запрос отправлен владельцу'); break;
      case 'ans':
        var p = v.split(':');
        state.bookings.forEach(function(b){ if(b.id === p[1]){ b.status = p[0] === 'ok' ? 'confirmed' : 'declined'; if(p[0] === 'ok') b.acceptedAt = stamp(); } });
        render(); toast(p[0]==='ok' ? 'Подтверждено. Договор принят обеими сторонами' : 'Запрос отклонён'); break;
      case 'agree': openModal(agreementHtml(state.bookings.filter(function(x){ return x.id === v; })[0])); break;
      case 'fmt': syncText(); offer[v] = !offer[v]; render(); break;
      case 'ozone': syncText(); offer.zone = v; render(); break;
      case 'cal': syncText(); offer.cm.m += Number(v); if(offer.cm.m > 11){ offer.cm.m = 0; offer.cm.y++; } if(offer.cm.m < 0){ offer.cm.m = 11; offer.cm.y--; } render(); break;
      case 'cd':
        syncText();
        if(!offer.from || offer.to){ offer.from = v; offer.to = null; }
        else if(v < offer.from){ offer.from = v; }
        else { offer.to = v; }
        render(); break;
      case 'publish':
        syncText();
        var pv = previewListing();
        if(!state.user){ needAccount('Чтобы сдать место, войдите в аккаунт'); break; }
        if(!state.user.pid){ needPassport('Чтобы сдавать место, добавьте паспортные данные: они нужны для договора'); break; }
        if(!offer.from){ toast('Выберите даты, когда место свободно'); break; }
        if(!pv){ toast('Выберите формат и введите цену'); break; }
        if(!offer.num.trim()){ toast('Укажите номер места'); break; }
        if(!offer.own || !offer.terms){ toast('Отметьте право на место и согласие с условиями'); break; }
        var l = {id:'m'+(state.nextId++), mine:true, title:pv.title, zone:offer.zone, owner:state.user.name, rating:'', whenText:rangeText(), avail:[], walk:3, cov:true, ev:offer.ev};
        if(pv.free) l.free = true; if(pv.hour) l.hour = pv.hour; if(pv.day) l.day = pv.day; if(pv.month) l.month = pv.month;
        state.mine.unshift(l); offer.num = ''; offer.own = false; offer.terms = false; offer.from = null; offer.to = null; state.tab = 'rent'; render(true); toast('Место опубликовано'); break;
      case 'signup':
        var n = $('#ac-n').value.trim(), sn = $('#ac-s').value.trim(), po = $('#ac-o').value.trim(), ph = $('#ac-p').value.trim(), em = $('#ac-e').value.trim(), pw = $('#ac-w').value;
        if(!n || !sn || !ph){ toast('Заполните фамилию, имя и телефон'); break; }
        if(!/^\S+@\S+\.\S+$/.test(em)){ toast('Проверьте электронную почту'); break; }
        if(pw.length < 6){ toast('Пароль от 6 знаков'); break; }
        state.user = {name:n, surname:sn, patr:po, phone:ph, email:em, pid:null, passport:null}; state.gate = ''; render(true); toast('Аккаунт создан. Паспортные данные добавьте позже'); break;
      case 'passport':
        var pid = $('#pp-i').value.trim().toUpperCase(), pn = $('#pp-n').value.trim().toUpperCase();
        if(!/^\d{7}[A-Z]\d{3}[A-Z]{2}\d$/.test(pid)){ toast('Идентификационный номер: 14 символов, например 3010190A001PB1'); break; }
        if(!/^[A-Z]{2}\d{7}$/.test(pn)){ toast('Паспорт: 2 буквы и 7 цифр, например MP1234567'); break; }
        state.user.pid = pid; state.user.passport = pn.slice(0,2)+'•••'+pn.slice(-2); state.gate = ''; render(true); toast('Данные сохранены'); break;
      case 'logout': state.user = null; render(true); break;
    }
  });
  document.addEventListener('change', function(e){
    var id = e.target.id;
    if(id === 'of-ev'){ syncText(); offer.ev = e.target.checked; render(); }
    else if(id === 'of-all'){ syncText(); offer.allDay = e.target.checked; render(); }
    else if(id === 'of-own'){ offer.own = e.target.checked; }
    else if(id === 'of-terms'){ offer.terms = e.target.checked; }
  });
  document.addEventListener('input', function(e){
    var id = e.target.id, val = e.target.value;
    if(id === 'hour'){ state.fc.hour = Number(val); $('#fcout').textContent = hh(state.fc.hour); $('#fcres').innerHTML = fcResults(); if(state.mapFc) refreshMap(); }
    else if(id === 'of-num'){ offer.num = val; }
    else if(id === 'of-hp' || id === 'of-dp' || id === 'of-mp'){ offer[id.slice(3)] = val; $('#prev').innerHTML = previewHtml(); }
    else if(id === 'of-t1' || id === 'of-t2'){ offer[id.slice(3)] = val; }
    else if(id === 'bk-d'){ bk.date = val; }
    else if(id === 'bk-t'){ bk.time = val; }
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && !$('#modal').hidden){ closeModal(); return; }
    if((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('zone')){ e.preventDefault(); var id = e.target.getAttribute('data-v'); state.sel = id; render(); }
  });
  $('#modal').addEventListener('click', function(e){ if(e.target.id === 'modal') closeModal(); });
document.addEventListener('DOMContentLoaded', function(){
  document.documentElement.setAttribute('data-theme', state.theme); themeSeg();
  render(true);
});
