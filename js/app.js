/* ============================================================
   Agua de Mar — app.js
   Lógica de interfaz: render, carrito, modal, eventos.
   Depende de data.js (cargado antes).
   ============================================================ */

/* =================== HELPERS =================== */
const $=(s,el=document)=>el.querySelector(s);
/* onerror delegado — el CSP bloquea atributos inline; este listener en capture phase los cubre todos */
document.addEventListener('error', e=>{ if(e.target.tagName==='IMG') e.target.style.display='none'; }, true);
/* aplica --tone desde data-tone tras cualquier innerHTML (evita style="--tone:..." inline → CSP unsafe-inline) */
const applyTones=(root=document)=>root.querySelectorAll('[data-tone]').forEach(el=>el.style.setProperty('--tone',el.dataset.tone));
const $$=(s,el=document)=>[...el.querySelectorAll(s)];
const crc=n=>'₡'+Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const phNote=(tag,body)=>`<div class="ph-note"><span class="tag">${tag}</span>${body}</div>`;
/* escapa texto antes de inyectarlo en innerHTML (defensa contra storage manipulado) */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* 3D tilt — sutil, sigue el cursor; respeta reduce-motion y solo en dispositivos con hover */
const canTilt=matchMedia('(hover:hover)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches;
function tiltify(el){
  el.addEventListener('pointermove',e=>{
    const r=el.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width-0.5;
    const py=(e.clientY-r.top)/r.height-0.5;
    el.style.transform=`perspective(900px) rotateY(${(px*7).toFixed(2)}deg) rotateX(${(-py*7).toFixed(2)}deg) translateY(-5px)`;
  });
  el.addEventListener('pointerleave',()=>{el.style.transform='';});
}
function applyTilt(){ if(!canTilt)return; $$('.card, .feat').forEach(el=>{ if(!el.dataset.tilt){el.dataset.tilt='1';tiltify(el);} }); }

/* =================== STATE =================== */
const SAFE_KEYS = new Set(['id','size','qty']);
const cartReviver = (key, val) => {
  if (key !== '' && !SAFE_KEYS.has(key)) return undefined;
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined;
  return val;
};
let cart;
try { cart=JSON.parse(localStorage.getItem('adm_cart')||'[]', cartReviver); }
catch { cart=[]; }
if(!Array.isArray(cart)) cart=[];
cart=cart.filter(i=>
  i &&
  typeof i.id === 'string' &&
  typeof i.size === 'string' && i.size.length < 20 &&
  Number.isInteger(i.qty) && i.qty > 0 && i.qty < 1000 &&
  findProduct(i.id)
);
const saveCart=()=>localStorage.setItem('adm_cart',JSON.stringify(cart));
let activeFilter='Todo';
let modalProduct=null, modalSize=null;

/* =================== RENDER CATALOG =================== */
const cardHTML=p=>`
  <article class="card" data-id="${p.id}">
    <div class="frame">
      <div class="ph ph-img" data-tone="${p.tone}">
        ${p.image ? `<img src="${p.image}" alt="${p.type} ${p.color}" class="prod-img">` : '<span class="ph-word">Foto</span>'}
      </div>
      <div class="overlay">
        <span class="see">Ver detalle →</span>
        <button class="quick-add" data-quick="${p.id}" aria-label="Agregar rápido ${p.type} ${p.color}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    </div>
    <div class="meta">
      <div class="name">${p.type} ${p.color}</div>
      <div class="line">
        <span class="desc">${p.sizes.length>1?'Tallas '+p.sizes[0]+'–'+p.sizes[p.sizes.length-1]:'Talla '+p.sizes[0]}</span>
        <span class="price">${crc(p.price)}</span>
      </div>
    </div>
  </article>`;

function renderCatalog(){
  const list=activeFilter==='Todo'?products:products.filter(p=>p.type===activeFilter);
  $('#masonry').innerHTML=list.map(cardHTML).join('');
  applyTones($('#masonry'));
  $('#catalogFoot').textContent=`${list.length} ${list.length===1?'pieza':'piezas'}${activeFilter!=='Todo'?' · '+activeFilter:''}`;
  applyTilt();
}

function renderFilters(){
  const cats=['Todo',...types.map(t=>t.t)];
  $('#filters').innerHTML=cats.map(c=>`<button class="chip${c===activeFilter?' active':''}" data-cat="${c}">${c}</button>`).join('');
}

/* =================== FEATURED =================== */
function renderFeatured(){
  const picks=[products[2],products[11],products[24]];
  const sizeClasses=['ar-4-5','ar-3-4','ar-3-4'];
  $('#featured').innerHTML=picks.map((p,i)=>`
    <div class="feat" data-id="${p.id}">
      <div class="frame ${sizeClasses[i]}">
        <div class="ph" data-tone="${p.tone}">${p.image ? `<img src="${p.image}" alt="${p.type} ${p.color}" class="prod-img">` : '<span class="ph-word">Foto</span>'}</div>
      </div>
      <div class="name">${p.type} ${p.color}</div>
      <div class="sub">${crc(p.price)}</div>
    </div>`).join('');
  applyTones($('#featured'));
  applyTilt();
}

/* =================== CARRUSEL 3D (CLIENTAS) =================== */
const carouselSlides = [
  { alt: 'Modelo 1' },
  { alt: 'Modelo 2' },
  { alt: 'Modelo 3' },
  { alt: 'Modelo 4' },
  { alt: 'Modelo 5' },
];

let carouselIndex = Math.floor(carouselSlides.length / 2);
let carouselTimer = null;

function renderCarousel() {
  const track = $('#carouselTrack');
  const dots = $('#carouselDots');
  if (!track || !dots) return;

  // render slides
  track.innerHTML = carouselSlides.map((s, i) => `
    <div class="carousel-slide" data-slide="${i}">
      ${s.src ? `<img src="${s.src}" alt="${s.alt}" loading="lazy" />` : `<div class="carousel-placeholder" aria-label="${s.alt}"></div>`}
    </div>
  `).join('');

  // render dots
  dots.innerHTML = carouselSlides.map((_, i) =>
    `<button class="carousel-dot${i === carouselIndex ? ' active' : ''}" data-dot="${i}" aria-label="Ir a imagen ${i + 1}"></button>`
  ).join('');

  updateCarousel();
}

function updateCarousel() {
  const slides = $$('.carousel-slide');
  const dots = $$('.carousel-dot');
  const total = carouselSlides.length;

  slides.forEach((slide, index) => {
    const offset = index - carouselIndex;
    let pos = ((offset % total) + total) % total;
    if (pos > Math.floor(total / 2)) pos = pos - total;

    const isCenter = pos === 0;
    const isAdjacent = Math.abs(pos) === 1;

    slide.style.transform = `
      translateX(${pos * 55}%)
      scale(${isCenter ? 1 : isAdjacent ? 0.82 : 0.65})
      rotateY(${pos * -12}deg)
    `;
    slide.style.zIndex = isCenter ? 10 : isAdjacent ? 5 : 1;
    slide.style.opacity = isCenter ? 1 : isAdjacent ? 0.45 : 0;
    slide.style.filter = isCenter ? 'blur(0px)' : isAdjacent ? 'blur(3px)' : 'blur(6px)';
    slide.style.visibility = Math.abs(pos) > 2 ? 'hidden' : 'visible';
    slide.classList.toggle('is-center', isCenter);
  });

  dots.forEach((dot, i) => dot.classList.toggle('active', i === carouselIndex));
}

function carouselNext() {
  carouselIndex = (carouselIndex + 1) % carouselSlides.length;
  updateCarousel();
}
function carouselPrev() {
  carouselIndex = (carouselIndex - 1 + carouselSlides.length) % carouselSlides.length;
  updateCarousel();
}

function startCarouselAutoplay() {
  stopCarouselAutoplay();
  carouselTimer = setInterval(carouselNext, 4000);
}
function stopCarouselAutoplay() {
  if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; }
}

function initCarousel() {
  renderCarousel();

  const prevBtn = $('#carouselPrev');
  const nextBtn = $('#carouselNext');
  const carousel = $('#carousel');
  if (!prevBtn || !nextBtn || !carousel) return;

  prevBtn.addEventListener('click', () => { carouselPrev(); startCarouselAutoplay(); });
  nextBtn.addEventListener('click', () => { carouselNext(); startCarouselAutoplay(); });

  // dot clicks
  carousel.addEventListener('click', e => {
    const dot = e.target.closest('[data-dot]');
    if (dot) {
      carouselIndex = +dot.dataset.dot;
      updateCarousel();
      startCarouselAutoplay();
    }
  });

  // pause on hover
  carousel.addEventListener('mouseenter', stopCarouselAutoplay);
  carousel.addEventListener('mouseleave', startCarouselAutoplay);

  // touch / swipe
  let touchX = 0;
  carousel.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) {
      dx > 0 ? carouselPrev() : carouselNext();
      startCarouselAutoplay();
    }
  }, { passive: true });

  startCarouselAutoplay();
}

/* (clientas gallery replaced by carousel above) */

/* =================== FAQ =================== */
function renderFaq(){
  $('#faqWrap').innerHTML=faqs.map((f,i)=>`
    <div class="faq-item" data-i="${i}">
      <button class="faq-q" aria-expanded="false"><span class="faq-q-text">${f.q}</span><i data-lucide="chevron-down" class="faq-icon" aria-hidden="true"></i></button>
      <div class="faq-a"><p>${f.a}</p></div>
    </div>`).join('');
  if(typeof lucide!=='undefined') lucide.createIcons();
}

/* =================== CART =================== */
function findProduct(id){return products.find(p=>p.id===id);}
function cartCountTotal(){return cart.reduce((s,i)=>s+i.qty,0);}
function cartSubtotal(){return cart.reduce((s,i)=>{const p=findProduct(i.id);return s+(p?p.price*i.qty:0);},0);}

function bumpCount(){
  const el=$('#cartCount');el.classList.add('bump');setTimeout(()=>el.classList.remove('bump'),300);
}
function updateCount(){$('#cartCount').textContent=cartCountTotal();}

function addToCart(id,size,qty=1){
  const ex=cart.find(i=>i.id===id&&i.size===size);
  if(ex)ex.qty+=qty;else cart.push({id,size,qty});
  saveCart();updateCount();bumpCount();renderCart();
}
function removeFromCart(id,size){cart=cart.filter(i=>!(i.id===id&&i.size===size));saveCart();updateCount();renderCart();}
function clearCart(){cart=[];saveCart();updateCount();renderCart();}
function changeQty(id,size,d){
  const it=cart.find(i=>i.id===id&&i.size===size);if(!it)return;
  it.qty+=d;if(it.qty<1)return removeFromCart(id,size);
  saveCart();updateCount();renderCart();
}

function renderCart(){
  const body=$('#drawerBody'),foot=$('#drawerFoot');
  if(!cart.length){
    body.innerHTML=`<div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>
      <div>Tu carrito está vacío.<br>El mar te espera.</div>
    </div>`;
    foot.style.display='none';return;
  }
  body.innerHTML=cart.map(i=>{
    const p=findProduct(i.id);if(!p)return'';
    return `<div class="ci">
      <div class="thumb"><div class="ph" data-tone="${p.tone}">${p.image ? `<img src="${p.image}" alt="" class="prod-img">` : ''}</div></div>
      <div class="info">
        <div class="top">
          <div><div class="nm">${p.type} ${p.color}</div><div class="sz">Talla ${esc(i.size)}</div></div>
          <div class="pr">${crc(p.price*i.qty)}</div>
        </div>
        <div class="stepper">
          <button data-step="-1" data-id="${i.id}" data-size="${esc(i.size)}" aria-label="Quitar uno">−</button>
          <span class="q">${i.qty}</span>
          <button data-step="1" data-id="${i.id}" data-size="${esc(i.size)}" aria-label="Agregar uno">+</button>
        </div>
        <button class="rm" data-rm data-id="${i.id}" data-size="${esc(i.size)}">Quitar</button>
      </div>
    </div>`;
  }).join('');
  applyTones(body);
  $('#subtotal').textContent=crc(cartSubtotal());
  foot.style.display='block';
}

/* foco / inert: aísla el fondo mientras un diálogo está abierto */
let lastFocus=null;
function setBgInert(on){
  $$('header, .mnav, section, footer, .fab-stack').forEach(el=>{
    on?el.setAttribute('inert',''):el.removeAttribute('inert');
  });
}
const openCart=()=>{
  lastFocus=document.activeElement;
  $('#scrim').classList.add('show');$('#drawer').classList.add('open');
  document.body.style.overflow='hidden';setBgInert(true);
  setTimeout(()=>$('#cartClose').focus(),60);
};
const closeCart=()=>{
  $('#scrim').classList.remove('show');$('#drawer').classList.remove('open');
  document.body.style.overflow='';setBgInert(false);
  if(lastFocus&&lastFocus.isConnected)lastFocus.focus();
};

/* =================== MODAL =================== */
function openModal(id){
  const p=findProduct(id);if(!p)return;
  modalProduct=p;modalSize=null;
  $('#mImg').style.setProperty('--tone',p.tone);
  $('#mImg').innerHTML=p.image ? `<img src="${p.image}" alt="${p.type} ${p.color}" class="prod-img">` : '<span class="ph-word">Foto</span>';
  $('#mCat').textContent=p.type;
  $('#mName').textContent=p.type+' '+p.color;
  $('#mPrice').textContent=crc(p.price);
  $('#mDesc').textContent=p.desc;
  $('#mSizes').innerHTML=p.sizes.map(s=>`<button class="size" data-size="${s}">${s}</button>`).join('');
  $('#mHint').classList.remove('show');
  lastFocus=document.activeElement;
  history.replaceState(null, null, `#producto-${p.id}`);
  $('#modal').classList.add('show');document.body.style.overflow='hidden';setBgInert(true);
  setTimeout(()=>$('#modalClose').focus(),60);
}
const closeModal=()=>{
  history.replaceState(null, null, window.location.pathname + window.location.search);
  $('#modal').classList.remove('show');document.body.style.overflow='';setBgInert(false);
  if(lastFocus&&lastFocus.isConnected)lastFocus.focus();
};

/* =================== TOAST =================== */
let toastT;
function toast(msg){
  $('#toastMsg').textContent=msg;
  const t=$('#toast');t.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2200);
}

/* =================== EVENTS =================== */
document.addEventListener('click',e=>{
  // filtros
  const chip=e.target.closest('[data-cat]');
  if(chip){activeFilter=chip.dataset.cat;renderFilters();renderCatalog();observeReveals();return;}
  // quick add
  const q=e.target.closest('[data-quick]');
  if(q){e.stopPropagation();const p=findProduct(q.dataset.quick);if(!p)return;addToCart(p.id,p.sizes[Math.min(1,p.sizes.length-1)],1);toast('Agregado · '+p.type+' '+p.color);return;}
  // abrir detalle (card o featured)
  const card=e.target.closest('.card[data-id], .feat[data-id]');
  if(card){openModal(card.dataset.id);return;}
  // tallas en modal
  const sz=e.target.closest('#mSizes .size');
  if(sz){$$('#mSizes .size').forEach(b=>b.classList.remove('sel'));sz.classList.add('sel');modalSize=sz.dataset.size;$('#mHint').classList.remove('show');return;}
  // stepper
  const step=e.target.closest('[data-step]');
  if(step){changeQty(step.dataset.id,step.dataset.size,+step.dataset.step);return;}
  // quitar
  const rm=e.target.closest('[data-rm]');
  if(rm){removeFromCart(rm.dataset.id,rm.dataset.size);return;}
  // faq
  const fq=e.target.closest('.faq-q');
  if(fq){
    const item=fq.parentElement,a=$('.faq-a',item),isOpen=item.classList.contains('open');
    $$('.faq-item.open').forEach(o=>{o.classList.remove('open');$('.faq-a',o).style.maxHeight=null;$('.faq-q',o).setAttribute('aria-expanded','false');});
    if(!isOpen){item.classList.add('open');a.style.maxHeight=a.scrollHeight+'px';fq.setAttribute('aria-expanded','true');}
    return;
  }
});

$('#mAdd').addEventListener('click',()=>{
  if(!modalSize){$('#mHint').classList.add('show');return;}
  addToCart(modalProduct.id,modalSize,1);
  toast('Agregado · '+modalProduct.type+' '+modalProduct.color);
  closeModal();openCart();
});

$('#cartOpen').addEventListener('click',openCart);
$('#cartClose').addEventListener('click',closeCart);
const btnClear=$('#cartClear');if(btnClear)btnClear.addEventListener('click',clearCart);
$('#scrim').addEventListener('click',()=>{closeCart();});
$('#modalClose').addEventListener('click',closeModal);
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeCart();$('#mnav').classList.remove('open');}});

$('#checkout').addEventListener('click',()=>{
  if(!cart.length)return;
  let msg='¡Hola Agua de Mar! Me interesa este pedido:%0A%0A';
  cart.forEach(i=>{const p=findProduct(i.id);msg+=`• ${i.qty}× ${p.type} ${p.color} (talla ${encodeURIComponent(i.size)}) — ${crc(p.price*i.qty)}%0A`;});
  msg+=`%0ASubtotal: ${crc(cartSubtotal())}%0A%0A¿Me ayudan a coordinar pago y envío?`;
  window.open(`https://wa.me/${WHATSAPP}?text=${msg}`,'_blank','noopener,noreferrer');
});

/* enlaces de contacto (footer + botones flotantes) */
$$('[data-wa-link]').forEach(a=>a.href=`https://wa.me/${WHATSAPP}`);
$$('[data-ig-link]').forEach(a=>a.href=INSTAGRAM);

$('#news').addEventListener('submit',e=>{
  e.preventDefault();
  const form=e.target;
  fetch(form.action,{method:form.method,body:new FormData(form),headers:{'Accept':'application/json'}})
  .then(res=>{if(res.ok){form.reset();toast('¡Gracias! Te escribiremos pronto.');}else{toast('Hubo un error. Intenta de nuevo.');}})
  .catch(()=>toast('Hubo un error de conexión.'));
});

// header scroll
const header=$('#header');
addEventListener('scroll',()=>{header.classList.toggle('scrolled',scrollY>40);},{passive:true});

// scrollspy: resalta el link de la sección visible
const navLinks=$$('nav.main a');
if(navLinks.length){
  const spy=new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(e.isIntersecting){
        const id='#'+e.target.id;
        navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===id));
      }
    });
  },{rootMargin:'-45% 0px -50% 0px',threshold:0});
  ['filosofia','catalogo','clientas','faq'].forEach(id=>{const el=document.getElementById(id);if(el)spy.observe(el);});
}

// menú móvil
$('#menuToggle').addEventListener('click',()=>$('#mnav').classList.toggle('open'));
$$('#mnav a').forEach(a=>a.addEventListener('click',()=>$('#mnav').classList.remove('open')));

/* =================== SCROLL REVEAL (solo opacidad) =================== */
let io;
function observeReveals(){
  if(io)io.disconnect();
  io=new IntersectionObserver((ents)=>{
    ents.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}});
  },{threshold:0.08,rootMargin:'0px 0px -8% 0px'});
  $$('.reveal:not(.in)').forEach(el=>io.observe(el));
}

/* =================== INIT =================== */
renderFilters();renderCatalog();renderFeatured();initCarousel();renderFaq();
updateCount();renderCart();
observeReveals();
if(typeof lucide!=='undefined') lucide.createIcons();

if(window.location.hash&&window.location.hash.startsWith('#producto-')){
  const id=window.location.hash.replace('#producto-','');
  setTimeout(()=>openModal(id), 100);
}
