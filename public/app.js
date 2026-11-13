// PRESENTATION TIER - talks to the Application tier only through the REST API
(() => {
  const $ = (id) => document.getElementById(id);
  const money = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const state = { page: 1, category: '', search: '', sort: '', minPrice: '', maxPrice: '', products: new Map() };
  let cart = JSON.parse(localStorage.getItem('easyshop_cart') || '[]'); // [{id,name,price,qty,stock}]

  async function api(path, options) {
    const res = await fetch('/api' + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (res.status === 204) return null;
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'Request failed');
    return body;
  }

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.add('hidden'), 3000);
  }

  /* ---------- Categories ---------- */
  async function loadCategories() {
    const cats = await api('/categories');
    const items = [{ id: '', name: 'All', productCount: cats.reduce((s, c) => s + c.productCount, 0) }, ...cats];
    $('categoryList').innerHTML = items.map((c) =>
      `<li><button data-id="${c.id}" class="${String(c.id) === String(state.category) ? 'active' : ''}">
         <span>${esc(c.name)}</span><span>${c.productCount}</span></button></li>`).join('');
  }

  /* ---------- Products ---------- */
  async function loadProducts() {
    const q = new URLSearchParams({ page: state.page, limit: 12 });
    if (state.category) q.set('category', state.category);
    if (state.search) q.set('search', state.search);
    if (state.sort) q.set('sort', state.sort);
    if (state.minPrice !== '') q.set('minPrice', state.minPrice);
    if (state.maxPrice !== '') q.set('maxPrice', state.maxPrice);

    try {
      const res = await api('/products?' + q);
      res.data.forEach((p) => state.products.set(p.id, p));
      $('resultInfo').textContent = `${res.total} product${res.total === 1 ? '' : 's'} found`;
      $('productGrid').innerHTML = res.data.length
        ? res.data.map(cardHtml).join('')
        : '<p class="empty">No products match your filters.</p>';
      renderPagination(res.page, res.totalPages);
    } catch (err) {
      $('productGrid').innerHTML = `<p class="empty">${esc(err.message)}</p>`;
    }
  }

  function cardHtml(p) {
    const stock = p.stock === 0
      ? '<span class="stock-low">Out of stock</span>'
      : p.stock < 10 ? `<span class="stock-low">Only ${p.stock} left</span>` : '<span class="stock-ok">In stock</span>';
    return `<article class="card">
      <img src="${esc(p.imageUrl || '')}" alt="${esc(p.name)}" loading="lazy" />
      <div class="card-body">
        <span class="brand">${esc(p.brand)} · ${esc(p.category)}</span>
        <h4>${esc(p.name)}</h4>
        <p class="desc">${esc(p.description)}</p>
        <div class="price">${money(p.price)}</div>
        ${stock}
        <button class="btn" data-add="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>Add to cart</button>
      </div></article>`;
  }

  function renderPagination(page, totalPages) {
    if (totalPages <= 1) { $('pagination').innerHTML = ''; return; }
    $('pagination').innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1)
      .map((n) => `<button data-page="${n}" class="${n === page ? 'active' : ''}">${n}</button>`).join('');
  }

  /* ---------- Cart ---------- */
  function saveCart() {
    localStorage.setItem('easyshop_cart', JSON.stringify(cart));
    renderCart();
  }

  function addToCart(id) {
    const p = state.products.get(id);
    if (!p) return;
    const line = cart.find((l) => l.id === id);
    if (line) {
      if (line.qty >= p.stock) return toast('No more stock available');
      line.qty++;
    } else {
      cart.push({ id, name: p.name, price: p.price, qty: 1, stock: p.stock });
    }
    saveCart();
    toast(`${p.name} added to cart`);
  }

  function renderCart() {
    $('cartCount').textContent = cart.reduce((s, l) => s + l.qty, 0);
    $('cartTotal').textContent = money(cart.reduce((s, l) => s + l.price * l.qty, 0));
    $('checkoutBtn').disabled = cart.length === 0;
    $('cartItems').innerHTML = cart.length
      ? cart.map((l) => `<div class="cart-row">
          <span class="name">${esc(l.name)}</span><strong>${money(l.price * l.qty)}</strong>
          <div class="qty">
            <button data-dec="${l.id}" aria-label="Decrease">−</button><span>${l.qty}</span>
            <button data-inc="${l.id}" aria-label="Increase">+</button>
          </div>
          <button class="link-btn" data-del="${l.id}">Remove</button>
        </div>`).join('')
      : '<p class="empty">Your cart is empty.</p>';
  }

  function openCart(open) {
    $('cartDrawer').classList.toggle('hidden', !open);
    $('overlay').classList.toggle('hidden', !open);
  }

  /* ---------- Checkout ---------- */
  async function submitOrder(e) {
    e.preventDefault();
    $('checkoutError').textContent = '';
    const f = new FormData(e.target);
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: JSON.stringify({
          name: f.get('name'), email: f.get('email'), phone: f.get('phone'), address: f.get('address'),
          items: cart.map((l) => ({ productId: l.id, quantity: l.qty }))
        })
      });
      cart = [];
      saveCart();
      $('checkoutModal').classList.add('hidden');
      openCart(false);
      e.target.reset();
      toast(`Order #${order.id} placed! Total ${money(order.totalAmount)}`);
      loadProducts();
    } catch (err) {
      $('checkoutError').textContent = err.message;
    }
  }

  /* ---------- Events ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.add) addToCart(Number(t.dataset.add));
    if (t.dataset.page) { state.page = Number(t.dataset.page); loadProducts(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    if (t.dataset.id !== undefined && t.closest('#categoryList')) {
      state.category = t.dataset.id; state.page = 1;
      loadCategories(); loadProducts();
    }
    const line = (id) => cart.find((l) => l.id === Number(id));
    if (t.dataset.inc) { const l = line(t.dataset.inc); if (l && l.qty < l.stock) { l.qty++; saveCart(); } else toast('No more stock available'); }
    if (t.dataset.dec) { const l = line(t.dataset.dec); if (l) { l.qty--; if (l.qty <= 0) cart = cart.filter((x) => x !== l); saveCart(); } }
    if (t.dataset.del) { cart = cart.filter((x) => x.id !== Number(t.dataset.del)); saveCart(); }
  });

  let searchTimer;
  $('search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.search = e.target.value.trim(); state.page = 1; loadProducts(); }, 300);
  });
  $('sort').addEventListener('change', (e) => { state.sort = e.target.value; state.page = 1; loadProducts(); });
  $('applyPrice').addEventListener('click', () => {
    state.minPrice = $('minPrice').value; state.maxPrice = $('maxPrice').value; state.page = 1; loadProducts();
  });
  $('cartBtn').addEventListener('click', () => openCart(true));
  $('closeCart').addEventListener('click', () => openCart(false));
  $('overlay').addEventListener('click', () => openCart(false));
  $('checkoutBtn').addEventListener('click', () => $('checkoutModal').classList.remove('hidden'));
  $('cancelCheckout').addEventListener('click', () => $('checkoutModal').classList.add('hidden'));
  $('checkoutForm').addEventListener('submit', submitOrder);

  renderCart();
  loadCategories();
  loadProducts();
})();
