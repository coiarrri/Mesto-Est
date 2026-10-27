/* Место есть: связь с сервером (Django).
   Принцип: интерфейс всегда работает на демо-данных, а каждый раздел API включается отдельным флагом
   в window.MESTO_CONFIG.api (см. templates/mesto_prototype.html). Пока флаг выключен, раздел живёт локально.
   Приложение сообщает о действиях событиями «mesto:...», этот файл отправляет их на сервер и кладёт ответы в state.
   Описание адресов и полей: API.md. Подключается ПЕРЕД mesto-app.js. */
var API = (function(){
  var cfg = (window.MESTO_CONFIG || {}).api, base = (window.MESTO_CONFIG || {}).base || '';
  function on(area){ return !!(cfg === true || (cfg && cfg[area])); }
  function csrf(){ var m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/); return m ? decodeURIComponent(m[1]) : ''; }
  function req(method, path, body, form){
    var o = {method:method, credentials:'same-origin', headers:{'Accept':'application/json'}};
    if(method !== 'GET') o.headers['X-CSRFToken'] = csrf();
    if(body !== undefined){ if(form) o.body = body; else { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(body); } }
    return fetch(base + path, o).then(function(r){
      return r.text().then(function(t){
        var j = null; try { j = t ? JSON.parse(t) : null; } catch(err){}
        if(!r.ok){ var e = new Error((j && (j.error || j.detail)) || ('Ошибка сервера ' + r.status)); e.status = r.status; e.data = j; throw e; }
        return j;
      });
    }, function(){ var e = new Error('Нет связи с сервером'); e.status = 0; throw e; });
  }
  return {
    on:on, req:req,
    get:function(p){ return req('GET', p); },
    post:function(p, b){ return req('POST', p, b === undefined ? {} : b); },
    put:function(p, b){ return req('PUT', p, b); },
    del:function(p){ return req('DELETE', p); },
    upload:function(p, fd){ return req('POST', p, fd, true); }
  };
})();

/* ---------- синхронизация: события приложения <-> сервер ---------- */
(function(){
  var on = API.on, polling = null;
  function ev(name, fn){ document.addEventListener('mesto:' + name, function(e){ fn(e.detail || {}); }); }
  function say(e){ toast(e && e.message ? e.message : 'Ошибка связи с сервером'); }
  function soft(e){ if(window.console) console.warn('[mesto-api]', e && e.message); }
  function repaint(){ if(state.tab === 'map' && !state.edit){ refreshMap(); } else if(state.tab !== 'map'){ render(); } }
  function n2(v){ return v === '' || v == null ? null : Number(String(v).replace(',', '.')); }

  /* --- преобразование ответов сервера в то, что понимает интерфейс --- */
  function mapOwner(o){
    o = o || {};
    return {on:!!o.is_owner, parking:o.parking || 'gA', addr:o.addr || '', place:o.place || '', status:o.status || (o.is_owner ? 'draft' : 'none'), sentAt:o.submitted_at || '', reason:o.reject_reason || '',
      docs:(o.documents || []).map(function(d){ return {id:'s' + d.id, sid:d.id, kind:d.kind, name:d.name, size:d.size}; })};
  }
  function mapUser(j){
    return {id:j.id, name:j.name, surname:j.surname, patr:j.patronymic || '', phone:j.phone, email:j.email,
      pid:j.passport_set ? (j.pid_masked || '•••••••••••••') : null, passport:j.passport_masked || null, owner:mapOwner(j.owner)};
  }
  function mapListing(j){
    return {id:String(j.id), title:j.title, zone:j.zone, owner:j.owner, rating:j.rating || '', rev:j.reviews || 0, hour:j.hour_price || undefined, day:j.day_price || undefined, month:j.month_price || undefined,
      free:!!j.free, whenText:j.when_text || '', avail:j.avail || [], walk:j.walk || 3, cov:j.covered !== false, ev:!!j.ev, mine:!!j.mine, verified:!!j.verified};
  }
  function mapBooking(j){
    return {id:String(j.id), listing:String(j.listing), fmt:j.fmt, qty:j.qty, qtyText:j.qty_text, when:j.when_text, total:j.total || 0, status:j.status, createdAt:j.created_at || '', acceptedAt:j.accepted_at || ''};
  }
  function mapMark(j){
    var d = new Date(j.at), w = d.getDay();
    return {sid:j.id, srv:true, zone:j.zone, kind:j.kind, hour:d.getHours(), day:(w === 0 || w === 6) ? 'we' : 'wd', time:pad(d.getHours()) + ':' + pad(d.getMinutes())};
  }

  /* --- чтение --- */
  function loadZones(){
    API.get('/api/zones/').then(function(list){
      var by = {}; (list || []).forEach(function(z){ by[z.id] = z; });
      ZS.forEach(function(z){ var s = by[z.id]; z.usual = (s && s.usual) || null; });
      repaint();
    }).catch(soft);
  }
  function pollMarks(){
    API.get('/api/marks/?minutes=180').then(function(list){
      var srv = (list || []).map(mapMark), have = {}; srv.forEach(function(m){ have[m.sid] = m; });
      var keep = state.marks.filter(function(m){ return !m.sid && !m.srv; });          /* ещё не отправленные */
      if(state.last && state.last.sid && have[state.last.sid]) state.last = have[state.last.sid];
      state.marks = keep.concat(srv); repaint();
    }).catch(soft);
  }
  function loadListings(){
    API.get('/api/listings/').then(function(list){
      var all = (list || []).map(mapListing);
      DISTRICT.listings = all.filter(function(l){ return !l.mine; }); state.mine = all.filter(function(l){ return l.mine; }); repaint();
    }).catch(soft);
  }
  function loadBookings(){
    if(!state.user) return;
    API.get('/api/bookings/').then(function(j){
      state.bookings = ((j && j.mine) || []).map(mapBooking); state.incoming = ((j && j.incoming) || []).map(mapBooking); repaint();
    }).catch(soft);
  }
  function afterAuth(){ if(on('listings')) loadListings(); if(on('bookings')) loadBookings(); }
  function setUser(j){ state.user = mapUser(j); state.gate = ''; afterAuth(); render(true); }
  function init(){
    if(on('zones')) loadZones();
    if(on('marks')){ pollMarks(); polling = setInterval(function(){ if(!document.hidden && state.tab === 'map') pollMarks(); }, 30000); }
    if(on('auth')) API.get('/api/me/').then(function(j){ if(j && j.id) setUser(j); else afterAuth(); }).catch(function(){ afterAuth(); });
    else afterAuth();
  }
  ev('ready', init);

  /* --- отметки --- */
  ev('mark', function(d){
    if(!on('marks')) return;
    var m = d.mark, g = d.gps || {};
    API.post('/api/zones/' + encodeURIComponent(m.zone) + '/marks/', {kind:m.kind, lat:g.lat, lng:g.lng, accuracy:g.acc}).then(function(r){ m.sid = r.id; }).catch(function(e){
      var i = state.marks.indexOf(m); if(i >= 0) state.marks.splice(i, 1);
      state.helped = Math.max(0, state.helped - 1); if(state.last === m) state.last = null; repaint(); say(e);
    });
  });
  ev('unmark', function(d){
    var m = d.mark; if(!on('marks') || !m) return;
    var go = function(){ if(m.sid) API.del('/api/zones/' + encodeURIComponent(m.zone) + '/marks/' + m.sid + '/').catch(soft); };
    if(m.sid) go(); else setTimeout(go, 800);
  });

  /* --- аккаунт --- */
  ev('signup', function(d){
    if(!on('auth')) return;
    var u = d.user, own = u.owner;
    API.post('/api/auth/register/', {surname:u.surname, name:u.name, patronymic:u.patr, phone:u.phone, email:u.email, password:d.password}).then(function(j){
      if(!own || !own.on || state.user !== u) return j;                 /* владелец указан при регистрации: поля, файлы, проверка */
      return syncOwnerAll(own, own.status === 'pending').then(function(oj){ j.owner = oj; return j; },
        function(e){ toast('Аккаунт создан, но документы не отправились: ' + e.message + '. Добавьте их в аккаунте'); return j; });
    }).then(function(j){ if(state.user === u) setUser(j); }).catch(function(e){
      if(state.user === u){ state.user = null; state.authMode = 'new'; state.gate = e.message; render(true); } say(e);
    });
  });
  ev('login', function(d){
    API.post('/api/auth/login/', {email:d.email, password:d.password}).then(function(j){ setUser(j); toast('Вы вошли'); }).catch(say);
  });
  ev('logout', function(){ if(on('auth')) API.post('/api/auth/logout/').catch(soft); state.incoming = []; });
  ev('passport', function(d){
    if(!on('auth')) return;
    API.put('/api/me/passport/', {pid:d.pid, passport:d.passport}).then(function(j){
      if(state.user){ state.user.pid = j.pid_masked || state.user.pid; state.user.passport = j.passport_masked || state.user.passport; render(); }
    }).catch(function(e){ if(state.user){ state.user.pid = null; state.user.passport = null; render(true); } say(e); });
  });

  /* --- владелец места --- */
  function ownerBody(o){ return {is_owner:!!o.on, parking:o.parking, addr:o.addr, place:o.place}; }
  function uploadDoc(d){
    var fd = new FormData(); fd.append('kind', d.kind); fd.append('file', d.file, d.name);
    return API.upload('/api/me/owner/documents/', fd).then(function(r){ d.sid = r.id; return r; });
  }
  function syncOwnerAll(o, submit){                                     /* при регистрации: поля, файлы, отправка на проверку */
    return API.put('/api/me/owner/', ownerBody(o)).then(function(){
      return (o.docs || []).reduce(function(p, d){ return p.then(function(){ return d.file ? uploadDoc(d) : null; }); }, Promise.resolve());
    }).then(function(){ return submit ? API.post('/api/me/owner/submit/') : API.get('/api/me/owner/'); });
  }
  ev('owner-toggle', function(d){ if(!on('owner') || !state.user) return; API.put('/api/me/owner/', ownerBody(d.owner)).catch(say); });
  ev('owner-doc', function(d){
    if(!on('owner') || !state.user) return;
    API.put('/api/me/owner/', ownerBody(d.owner)).then(function(){ return uploadDoc(d.doc); }).catch(function(e){
      var o = d.owner; o.docs = o.docs.filter(function(x){ return x !== d.doc; }); say(e); if(document.getElementById('own')) render();
    });
  });
  ev('owner-doc-remove', function(d){ if(on('owner') && state.user && d.doc && d.doc.sid) API.del('/api/me/owner/documents/' + d.doc.sid + '/').catch(soft); });
  ev('owner-submit', function(d){
    if(!on('owner') || !state.user) return;
    API.put('/api/me/owner/', ownerBody(d.owner)).then(function(){ return API.post('/api/me/owner/submit/'); }).then(function(j){ if(j && state.user){ state.user.owner.status = (j.status || 'pending'); state.user.owner.sentAt = j.submitted_at || state.user.owner.sentAt; } })
      .catch(function(e){ if(state.user) state.user.owner.status = 'draft'; render(); say(e); });
  });

  /* --- аренда --- */
  ev('publish', function(d){
    if(!on('listings')) return;
    var l = d.listing, o = d.offer;
    API.post('/api/listings/', {zone:o.zone, date_from:o.from, date_to:o.to || o.from, all_day:!!o.allDay, time_from:o.allDay ? null : o.t1, time_to:o.allDay ? null : o.t2,
      free:!!o.free, hour_price:o.hour ? n2(o.hp) : null, day_price:o.day ? n2(o.dp) : null, month_price:o.month ? n2(o.mp) : null, ev:!!o.ev, place_no:o.num, when_text:l.whenText}).then(function(j){
      var s = mapListing(j), i = state.mine.indexOf(l); if(i >= 0) state.mine[i] = s; repaint();
    }).catch(function(e){ var i = state.mine.indexOf(l); if(i >= 0) state.mine.splice(i, 1); repaint(); say(e); });
  });
  ev('book', function(d){
    if(!on('bookings')) return;
    var b = d.booking;
    API.post('/api/bookings/', {listing:b.listing, fmt:d.fmt, qty:d.qty, date:d.date, time:d.time, accepted_terms:true}).then(function(j){
      var s = mapBooking(j), i = state.bookings.indexOf(b); if(i >= 0) state.bookings[i] = s; repaint();
    }).catch(function(e){ var i = state.bookings.indexOf(b); if(i >= 0) state.bookings.splice(i, 1); repaint(); say(e); });
  });
  ev('answer', function(d){
    if(!on('bookings')) return;
    API.post('/api/bookings/' + encodeURIComponent(d.id) + '/answer/', {accept:!!d.ok}).then(function(j){
      var s = mapBooking(j); state.incoming = (state.incoming || []).map(function(x){ return x.id === s.id ? s : x; }); repaint();
    }).catch(function(e){ say(e); loadBookings(); });
  });
})();
