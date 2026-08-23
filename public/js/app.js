/* ============================================================
   Agua de Mar — app.js
   Lógica de interfaz: render, carrito, modal, eventos.

   - Usa AguaDeMar.data (de data.js) para evitar globals sueltos.
   - Manejo centralizado de errores (handleError).
   - Cart y renders protegidos con try/catch.
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

/* =================== ERROR HANDLING =================== */
function handleError(message, err){
  console.error('[AguaDeMar]', message, err || '');
  try {
    toast(message || 'Ocurrió un error inesperado. Intenta de nuevo.');
  } catch(e) { /* noop */ }
}

const DM = AguaDeMar.data;

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
function findProduct(id){ return DM.products.find(p => p.id === id); }

const SAFE_KEYS = new Set(['id','size','qty']);

const cartReviver = (key, val) => {
  if (key !== '' && !SAFE_KEYS.has(key)) return undefined;
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined;
  return val;
};

// Cart Manager - centralizado, con notificaciones (pub/sub simple)
const Cart = {
  items: [],

  _listeners: [],

  subscribe(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter(l => l !== fn);
    };
  },

  _notify() {
    this._listeners.forEach(fn => {
      try { fn(this.items); } catch(e) { handleError('Error en listener del carrito', e); }
    });
  },

  load() {
    try {
      const raw = localStorage.getItem('adm_cart');
      let loaded = raw ? JSON.parse(raw, cartReviver) : [];
      if (!Array.isArray(loaded)) loaded = [];

      this.items = loaded.filter(i =>
        i &&
        typeof i.id === 'string' &&
        typeof i.size === 'string' && i.size.length < 20 &&
        Number.isInteger(i.qty) && i.qty > 0 && i.qty < 1000 &&
        DM.products.some(p => p.id === i.id)
      );
    } catch(err) {
      handleError('Tu carrito anterior no se pudo leer correctamente. Se ha reiniciado.', err);
      this.items = [];
    }
  },

  save() {
    try {
      localStorage.setItem('adm_cart', JSON.stringify(this.items));
    } catch(err) {
      handleError('No pudimos guardar tu carrito. Verifica el espacio disponible o el modo incógnito.', err);
    }
  },

  add(id, size, qty = 1) {
    const ex = this.items.find(i => i.id === id && i.size === size);
    if (ex) {
      ex.qty += qty;
    } else {
      this.items.push({ id, size, qty });
    }
    this.save();
    this._notify();
  },

  remove(id, size) {
    this.items = this.items.filter(i => !(i.id === id && i.size === size));
    this.save();
    this._notify();
  },

  clear() {
    this.items = [];
    this.save();
    this._notify();
  },

  changeQty(id, size, delta) {
    const it = this.items.find(i => i.id === id && i.size === size);
    if (!it) return;
    it.qty += delta;
    if (it.qty < 1) {
      return this.remove(id, size);
    }
    this.save();
    this._notify();
  },

  count() {
    return this.items.reduce((s, i) => s + i.qty, 0);
  },

  subtotal() {
    return this.items.reduce((s, i) => {
      const p = findProduct(i.id);
      return s + (p ? p.price * i.qty : 0);
    }, 0);
  },

};

Cart.subscribe(() => {
  updateCount();
  const drawer = $('#drawer');
  if (drawer && drawer.classList.contains('open')) renderCart();
});

let activeFilter = 'Todo';
let modalProduct = null;
let modalSize = null;

/* =================== RENDER CATALOG =================== */
const cardHTML=(p,i)=>`
  <article class="card" data-id="${p.id}">
    <div class="frame">
      <div class="ph" data-tone="${p.tone}">
        ${p.image ? `<img src="${p.image}" alt="${p.type} ${p.color}" class="prod-img">` : '<span class="ph-word">Foto</span>'}
      </div>
      <div class="overlay">
        <span class="card-num">N°${String(i+1).padStart(2,'0')}</span>
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
  try {
    const list=activeFilter==='Todo'?DM.products:DM.products.filter(p=>p.type===activeFilter);
    $('#masonry').innerHTML=list.map((p,i)=>cardHTML(p,i)).join('');
    applyTones($('#masonry'));
    $('#catalogFoot').textContent=`${list.length} ${list.length===1?'pieza':'piezas'}${activeFilter!=='Todo'?' · '+activeFilter:''}`;
    applyTilt();
  } catch(err) {
    handleError('No se pudo cargar el catálogo.', err);
  }
}

function renderFilters(){
  const cats=['Todo',...DM.types.map(t=>t.t)];
  $('#filters').innerHTML=cats.map(c=>`<button class="chip${c===activeFilter?' active':''}" data-cat="${c}">${c}</button>`).join('');
}

/* =================== FEATURED =================== */
function renderFeatured(){
  try {
    const picks = DM.products.filter(p => p.featured).slice(0, 3);
    if(!picks.length){ $('#featured').innerHTML=''; return; }
    const sizeClasses = ['ar-4-5','ar-3-4','ar-3-4'];

    $('#featured').innerHTML = picks.map((p, i) => {
      const imgSrc = p.image || '';
      const altText = `Colección Destacada - ${p.type} ${p.color}`;
      const imgHtml = imgSrc 
        ? `<img src="${imgSrc}" alt="${altText}" class="prod-img">` 
        : '<span class="ph-word">Foto</span>';

      const badgeText = i === 0 ? 'Más Vendido' : 'Destacado';
      const overlayTitle = `${p.type} ${p.color}`;

      return `
        <div class="feat" data-id="${p.id}">
          <div class="frame ${sizeClasses[i]}">
            <div class="ph" data-tone="${p.tone}">
              ${imgHtml}
              <span class="feat-badge">${badgeText}</span>
              <div class="feat-overlay">
                <span class="feat-overlay-title">${overlayTitle}</span>
              </div>
            </div>
          </div>
          <div class="name">${p.type} ${p.color}</div>
          <div class="sub">${crc(p.price)}</div>
        </div>`;
    }).join('');

    applyTones($('#featured'));
    applyTilt();
  } catch(err) {
    handleError('No se pudo cargar la colección destacada.', err);
  }
}

/* =================== CARRUSEL 3D (CLIENTAS) =================== */
const carouselSlides = [
  { src: 'assets/images/clientas/modelo-1.jpg', alt: 'Clienta real usando traje de baño de Agua de Mar' },
  { src: 'assets/images/clientas/modelo-2.jpg', alt: 'Clienta real usando traje de baño de Agua de Mar' },
  { src: 'assets/images/clientas/modelo-3.jpg', alt: 'Clienta real usando traje de baño de Agua de Mar' },
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
      translateX(${pos * 48}%)
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

/* =================== FAQ =================== */
function renderFaq(){
  $('#faqWrap').innerHTML=DM.faqs.map((f,i)=>`
    <div class="faq-item" data-i="${i}">
      <button class="faq-q" aria-expanded="false"><span class="faq-q-text">${f.q}</span><i data-lucide="chevron-down" class="faq-icon" aria-hidden="true"></i></button>
      <div class="faq-a"><p>${f.a}</p></div>
    </div>`).join('');
  if(typeof lucide!=='undefined') lucide.createIcons();
}

/* =================== CART HELPERS =================== */
function bumpCount(){
  const el=$('#cartCount');el.classList.add('bump');setTimeout(()=>el.classList.remove('bump'),300);
}
function updateCount(){ const el=$('#cartCount'); if(el) el.textContent=Cart.count(); }

function addToCart(id, size, qty=1){
  try {
    const product = findProduct(id);
    if (!product) { handleError('Producto no encontrado.'); return; }
    if (!product.sizes.includes(size)) { handleError('Talla no válida para este producto.'); return; }
    Cart.add(id, size, qty);
    bumpCount();
  } catch(err) {
    handleError('No se pudo agregar el producto al carrito.', err);
  }
}

function removeFromCart(id, size){
  try {
    Cart.remove(id, size);
    // subscriber maneja el resto
  } catch(err) {
    handleError('No se pudo quitar el producto.', err);
  }
}

function clearCart(){
  try {
    Cart.clear();
  } catch(err) {
    handleError('No se pudo vaciar el carrito.', err);
  }
}

function changeQty(id, size, d){
  try {
    Cart.changeQty(id, size, d);
  } catch(err) {
    handleError('No se pudo cambiar la cantidad.', err);
  }
}

function renderCart(){
  const body=$('#drawerBody'),foot=$('#drawerFoot');
  try {
    const items = Cart.items;
    if(!items.length){
      body.innerHTML=`<div class="empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>
        <div>Tu carrito está vacío.<br>El mar te espera.</div>
      </div>`;
      foot.style.display='none';return;
    }
    body.innerHTML=items.map(i=>{
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
    $('#subtotal').textContent = crc(Cart.subtotal());
    foot.style.display='block';
  } catch(err) {
    handleError('No se pudo mostrar el carrito.', err);
    foot.style.display='none';
  }
}

/* aísla el fondo mientras un diálogo está abierto — previene scroll y foco en elementos ocultos */
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
  renderCart(); // asegurar contenido fresco al abrir
  setTimeout(()=>$('#cartClose').focus(),60);
};
const closeCart=()=>{
  $('#scrim').classList.remove('show');$('#drawer').classList.remove('open');
  document.body.style.overflow='';setBgInert(false);
  if(lastFocus&&lastFocus.isConnected)lastFocus.focus();
};

/* =================== MODAL =================== */
function openModal(id){
  try {
    const p = findProduct(id);
    if (!p) return;

    modalProduct = p;
    modalSize = null;
    $('#mImg').style.setProperty('--tone', p.tone);
    $('#mImg').innerHTML = p.image 
      ? `<img src="${p.image}" alt="${p.type} ${p.color}" class="prod-img">` 
      : '<span class="ph-word">Foto</span>';
    $('#mCat').textContent = p.type;
    $('#mName').textContent = p.type + ' ' + p.color;
    $('#mPrice').textContent = crc(p.price);
    $('#mDesc').textContent = p.desc;
    $('#mSizes').innerHTML = p.sizes.map(s => `<button class="size" data-size="${s}">${s}</button>`).join('');
    $('#mHint').classList.remove('show');
    lastFocus = document.activeElement;
    history.replaceState(null, null, `#producto-${p.id}`);
    $('#modal').classList.add('show');
    document.body.style.overflow = 'hidden';
    setBgInert(true);
    setTimeout(() => $('#modalClose').focus(), 60);
  } catch(err) {
    handleError('No se pudo abrir el detalle del producto.', err);
  }
}
const closeModal=()=>{
  history.replaceState(null, null, window.location.pathname + window.location.search);
  $('#modal').classList.remove('show');document.body.style.overflow='';setBgInert(false);
  if(lastFocus&&lastFocus.isConnected)lastFocus.focus();
};

/* =================== TOAST =================== */
let toastT;
function toast(msg){
  try {
    const toastEl = $('#toast');
    const msgEl = $('#toastMsg');
    if (!toastEl || !msgEl) return;

    msgEl.textContent = msg || 'Ocurrió algo inesperado.';
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), 2400);
  } catch(e) {
    // Último recurso
    console.warn('Toast falló:', msg);
  }
}

/* =================== EVENTS =================== */
document.addEventListener('click',e=>{
  try {
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
  } catch(err) {
    handleError('Ocurrió un error al procesar la acción.', err);
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
  try {
    const items = Cart.items;
    if(!items.length) return;
    let msg='¡Hola Agua de Mar! Me interesa este pedido:%0A%0A';
    items.forEach(i=>{const p=findProduct(i.id);msg+=`• ${i.qty}× ${p.type} ${p.color} (talla ${encodeURIComponent(i.size)}) — ${crc(p.price*i.qty)}%0A`;});
    msg+=`%0ASubtotal: ${crc(Cart.subtotal())}%0A%0A¿Me ayudan a coordinar pago y envío?`;
    window.open(`https://wa.me/${DM.WHATSAPP}?text=${msg}`,'_blank','noopener,noreferrer');
  } catch(err) {
    handleError('No se pudo preparar el mensaje de WhatsApp.', err);
  }
});

$('#news').addEventListener('submit',e=>{
  e.preventDefault();
  const form = e.target;

  fetch(form.action, {
    method: form.method,
    body: new FormData(form),
    headers: {'Accept': 'application/json'}
  })
  .then(res => {
    if (res.ok) {
      form.reset();
      toast('¡Gracias! Te escribiremos pronto.');
    } else {
      // Intentamos leer el mensaje de error de Formspree si existe
      return res.json().catch(() => ({}))
        .then(data => {
          const msg = data.error || 'Hubo un problema al enviar el formulario. Intenta de nuevo.';
          toast(msg);
        });
    }
  })
  .catch(err => {
    handleError('Error de conexión. Revisa tu internet e intenta de nuevo.', err);
  });
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
async function init(){
  const [productsResult, siteContentResult] = await Promise.allSettled([
    fetch('/api/products').then(r => { if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }),
    fetch('/api/site-content').then(r => { if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }),
  ]);

  if (productsResult.status === 'fulfilled') {
    DM.products = productsResult.value;
  } else {
    handleError('No se pudo cargar el catálogo. Intenta de nuevo más tarde.', productsResult.reason);
    DM.products = [];
  }

  if (siteContentResult.status === 'fulfilled') {
    DM.WHATSAPP = siteContentResult.value.whatsapp || DM.WHATSAPP;
    DM.INSTAGRAM = siteContentResult.value.instagram || DM.INSTAGRAM;
  } else {
    console.warn('[AguaDeMar] No se pudo cargar la configuración del sitio, usando valores por defecto.', siteContentResult.reason);
  }

  try {
    Cart.load();
    renderFilters();
    renderCatalog();
    renderFeatured();
    initCarousel();
    renderFaq();
    updateCount();
    renderCart();
    observeReveals();
    $$('[data-wa-link]').forEach(a=>a.href=`https://wa.me/${DM.WHATSAPP}`);
    $$('[data-ig-link]').forEach(a=>a.href=DM.INSTAGRAM);
    if(typeof lucide!=='undefined') lucide.createIcons();

    if(window.location.hash && window.location.hash.startsWith('#producto-')){
      const id = window.location.hash.replace('#producto-','');
      setTimeout(()=>openModal(id), 100);
    }
  } catch(err) {
    handleError('Hubo un problema al cargar la página. Algunas funciones pueden no estar disponibles.', err);
  }
}
init();
