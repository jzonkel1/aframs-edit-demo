(function(){
  var b=document.body, burger=document.querySelector('.burger'), m=document.getElementById('mnav');
  function setMenu(open){b.classList.toggle('menu-open',open);burger.setAttribute('aria-expanded',open);m.setAttribute('aria-hidden',!open)}
  burger.addEventListener('click',function(){var o=!b.classList.contains('menu-open');setMenu(o);burger.setAttribute('aria-label',o?'Close menu':'Open menu')});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&b.classList.contains('menu-open')){setMenu(false);burger.focus()}});
  m.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
  // phone call bar waits until the hero (which has its own call button) is scrolled past
  var mbar=document.querySelector('.mbar'),hero=document.querySelector('.hero');
  if(mbar&&hero&&'IntersectionObserver' in window){
    new IntersectionObserver(function(en){var x=en[0];mbar.classList.toggle('on',!x.isIntersecting&&x.boundingClientRect.top<0)}).observe(hero);
  } else if(mbar) mbar.classList.add('on');
  // live open/closed line (store hours Tue-Sat 10-6, Corpus Christi time)
  var oh=document.querySelector('[data-hours]');
  if(oh&&window.Intl){try{
    var p={};new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',weekday:'short',hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(new Date()).forEach(function(x){p[x.type]=x.value});
    var D=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],d=D.indexOf(p.weekday),t=(+p.hour%24)+(+p.minute)/60,openDay=d>=2&&d<=6,txt,on=false;
    var nextOpen=function(){var n=(d+1)%7;while(n<2)n++;return n===(d+1)%7?'tomorrow':['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][n]};
    if(openDay&&t>=10&&t<18){on=true;txt='Open now until 6 PM'}
    else if(openDay&&t<10){txt='Opens today at 10 AM'}
    else{txt='Closed, opens '+nextOpen()+' 10 AM'}
    oh.querySelector('b').textContent=txt;
  }catch(e){}}
  var els=document.querySelectorAll('.rv');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(e){io.observe(e)});
  } else els.forEach(function(e){e.classList.add('in')});
  // phones: swipe rows drift slowly on their own. The drift is a GPU transform on the cards (sub-pixel smooth),
  // not scrollLeft (which rounds to whole pixels and stutters). On touch the drift offset is handed to the
  // native scroll position in the same frame, so nothing jumps; drift resumes 3.5s after the last touch or scroll.
  (function(){
    var mq=matchMedia('(max-width:760px)'),still=matchMedia('(prefers-reduced-motion:reduce)');
    if(still.matches||!('IntersectionObserver' in window)) return;
    document.querySelectorAll('[data-drift]').forEach(function(row){
      var kids=[].slice.call(row.children);
      kids.forEach(function(k){var c=k.cloneNode(true);c.classList.add('is-clone');c.setAttribute('aria-hidden','true');c.querySelectorAll('a,button').forEach(function(a){a.tabIndex=-1});if(c.tagName==='A')c.tabIndex=-1;row.appendChild(c)});
      row.classList.add('drift');
      var dx=0,last=0,seen=false,held=false,timer=0,raf=0,SPEED=18;
      function period(){var c=row.querySelector('.is-clone');return c?c.offsetLeft-kids[0].offsetLeft:0}
      function setDx(v){dx=v;row.style.setProperty('--dx',v.toFixed(2))}
      function step(t){
        raf=0;
        if(!seen||held||!mq.matches){last=0;return}
        var dt=last?Math.min(50,t-last):0;last=t;
        var v=dx+SPEED*dt/1000,P=period();if(P>0&&v>=P)v-=P;
        setDx(v);raf=requestAnimationFrame(step);
      }
      function go(){if(!raf&&seen&&!held&&mq.matches){last=0;raf=requestAnimationFrame(step)}}
      // drift offset -> real scroll position (the visitor takes over exactly where it is)
      function hold(){clearTimeout(timer);if(held)return;held=true;if(raf){cancelAnimationFrame(raf);raf=0}
        if(dx){var x=row.scrollLeft+dx;setDx(0);row.scrollLeft=x}}
      // real scroll position -> drift offset, then keep drifting from there
      function release(){clearTimeout(timer);timer=setTimeout(function(){var P=period(),x=row.scrollLeft;if(P>0&&x>=P)x-=P;row.scrollLeft=0;setDx(x);held=false;go()},3500)}
      row.addEventListener('touchstart',hold,{passive:true});
      row.addEventListener('pointerdown',hold,{passive:true});
      row.addEventListener('wheel',function(){hold();release()},{passive:true});
      ['touchend','touchcancel','pointerup'].forEach(function(ev){row.addEventListener(ev,release,{passive:true})});
      row.addEventListener('scroll',function(){if(held)release()},{passive:true});
      new IntersectionObserver(function(en){seen=en[0].isIntersecting;if(seen)setTimeout(go,700)},{threshold:.3}).observe(row);
    });
  })();
  // phones: flip each step number once it passes the middle of the screen; flip back when scrolled back above
  (function(){
    var lis=document.querySelectorAll('.steps li'),mq=matchMedia('(max-width:760px)');
    if(!lis.length||!('IntersectionObserver' in window)) return;
    var io=new IntersectionObserver(function(en){en.forEach(function(x){
      if(!mq.matches) return;
      var on=x.isIntersecting||x.boundingClientRect.top<0,li=x.target,was=li.classList.contains('flip-on');
      if(on&&!was){li.classList.remove('flip-off');li.classList.add('flip-on')}
      else if(!on&&was){li.classList.remove('flip-on');li.classList.add('flip-off')}
    })},{rootMargin:'0px 0px -45% 0px'});
    lis.forEach(function(li){io.observe(li)});
  })();
  function esc(t){return t.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function card(r){return '<figure class="rc"><span class="stars" aria-hidden="true"><svg class="st"><use href="#i-star"/></svg><svg class="st"><use href="#i-star"/></svg><svg class="st"><use href="#i-star"/></svg><svg class="st"><use href="#i-star"/></svg><svg class="st"><use href="#i-star"/></svg></span><p>&ldquo;'+esc(r.t).replace(/ (\S{1,12})$/,'&nbsp;$1')+'&rdquo;</p><cite>'+esc(r.n)+', Google review</cite></figure>'}
  // home review marquee: window.R (5-star Google reviews, verbatim) is printed by the home page only
  var R=window.R;
  if(R&&document.getElementById('row1')){
    var half=Math.ceil(R.length/2),a=R.slice(0,half),c=R.slice(half);
    [['row1',a],['row2',c]].forEach(function(p){var el=document.getElementById(p[0]),h=p[1].map(card).join('');el.innerHTML=h+h;el.querySelectorAll('figure').forEach(function(f,i){if(i>=p[1].length)f.setAttribute('aria-hidden','true')})});
  }
})();

(function(){
  var f=document.getElementById('quoteWizard'); if(!f) return;
  var steps=f.querySelectorAll('.qw-step'), bar=f.querySelector('.qw-bar i'), cnt=f.querySelector('.qw-count b'), back=f.querySelector('.qw-back'), cur=1;
  var NEXT={
    'Ring':['What does the ring need?',['Sizing','Repair or rebuild','Loose or missing stone','Not sure']],
    'Watch':['What does the watch need?',['New battery','Band or bracelet','Repair','Not sure']],
    'Appraisal':['What is the appraisal for?',['Insurance','Estate or inheritance','Just curious what it is worth']],
    'Selling gold':['What are you looking to sell?',['Chains and jewelry','Broken or single pieces','Coins','A little of everything']]
  };
  function go(n){cur=n;steps.forEach(function(s){s.classList.toggle('is-on',+s.dataset.step===n)});bar.style.width=(n*25)+'%';cnt.textContent=n;back.hidden=n===1;
    if(n>1&&window.innerWidth<761){f.scrollIntoView({behavior:'smooth',block:'start'})}}
  function pick(btn){var fld=btn.dataset.field;f.querySelectorAll('.qw-opt[data-field="'+fld+'"]').forEach(function(b){b.classList.toggle('is-picked',b===btn)});f.elements[fld].value=btn.dataset.value}
  function buildStep2(item){var s=f.querySelector('[data-step="2"]'),q=s.querySelector('[data-q]'),o=s.querySelector('[data-opts]'),els=s.querySelectorAll('.qw-else');o.innerHTML='';f.elements.need.value='';
    if(NEXT[item]){q.textContent=NEXT[item][0];NEXT[item][1].forEach(function(v,i,a){var b=document.createElement('button');b.type='button';b.className='qw-opt'+(a.length%2&&i===a.length-1?' qw-wide':'');b.dataset.field='need';b.dataset.value=v;b.textContent=v;o.appendChild(b)});o.hidden=false;els.forEach(function(e){e.hidden=true})}
    else{q.textContent='What can we help with?';o.hidden=true;els.forEach(function(e){e.hidden=false})}}
  f.addEventListener('click',function(e){
    var b=e.target.closest('.qw-opt');
    if(b){pick(b);if(b.dataset.field==='item'){buildStep2(b.dataset.value)}setTimeout(function(){go(cur+1)},230);return}
    if(e.target.closest('.qw-back')){go(cur-1);return}
    if(e.target.closest('.qw-next')){
      if(cur===3){var ph=f.elements.phone.value.replace(/\D/g,'').replace(/^1(?=\d{10}$)/,''),err=f.querySelector('.qw-err');err.hidden=ph.length===10;if(ph.length!==10){f.elements.phone.focus();return}}
      go(cur+1)}
  });
  f.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();var n=f.querySelector('.qw-step.is-on .qw-next');if(n)n.click()}});
  var file=f.querySelector('input[type=file]'),th=f.querySelector('.qw-thumbs');
  file.addEventListener('change',function(){th.innerHTML='';[].slice.call(file.files,0,6).forEach(function(x){var i=document.createElement('img');i.src=URL.createObjectURL(x);i.alt='';th.appendChild(i)});f.querySelector('.qw-drop b').textContent=file.files.length?file.files.length+' photo'+(file.files.length>1?'s':'')+' added':'Add photos'});
  f.addEventListener('submit',function(e){e.preventDefault();var nm=f.elements.name.value.trim().split(' ')[0];if(nm)f.querySelector('[data-name]').textContent=nm;
    steps.forEach(function(s){s.classList.remove('is-on')});f.querySelector('.qw-top').hidden=true;f.querySelector('.qw-bar').hidden=true;back.hidden=true;f.querySelector('.qw-done').hidden=false});
})();

// home hero option A: slow crossfade through what the store does; hovering a tab shows that photo
(function(){
  var h=document.querySelector('.hero-show'); if(!h) return;
  var s=h.querySelectorAll('.slide'),tabs=h.querySelector('.slide-tabs'),t=tabs?tabs.querySelectorAll('a'):[],i=0,timer=0;
  var still=matchMedia('(prefers-reduced-motion:reduce)').matches;
  function show(n){s[i].classList.remove('on');if(t[i])t[i].classList.remove('on');i=(n+s.length)%s.length;
    var im=s[i].querySelector('img');if(im&&im.loading==='lazy')im.loading='eager';
    s[i].classList.add('on');if(t[i]){t[i].classList.remove('on');void t[i].offsetWidth;t[i].classList.add('on')}}
  function run(){clearInterval(timer);if(tabs)tabs.classList.remove('held');if(!still)timer=setInterval(function(){show(i+1)},4000)}   // 4s a slide (was 6s; Jeffrey 10/24: "should change faster"); keep in step with tabfill in pages.css
  // warm the next photos once the page is idle so the first fade never shows a blank panel
  window.addEventListener('load',function(){setTimeout(function(){s.forEach(function(f){var im=f.querySelector('img');if(im)im.loading='eager'})},1200)});
  // hovering or keyboard-focusing a tab holds that slide (the pause the accessibility statement describes)
  t.forEach(function(a,k){function hold(){clearInterval(timer);tabs.classList.add('held');if(k!==i)show(k)}
    a.addEventListener('mouseenter',hold);a.addEventListener('focus',hold);a.addEventListener('mouseleave',run);a.addEventListener('blur',run)});
  document.addEventListener('visibilitychange',function(){if(document.hidden)clearInterval(timer);else run()});
  run();
})();
