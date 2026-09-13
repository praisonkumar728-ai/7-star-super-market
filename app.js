const PASS="admin123",K={p:"ssProducts",c:"ssCategories",o:"ssOrders",u:"ssCustomers",f:"ssOffers",cp:"ssCoupons",s:"ssSettings",l:"ssLogo",cart:"ssCart",me:"ssCurrentCustomer"};
const defaults={loyaltyPoints:[],p:[{id:1,name:"Premium Basmati Rice",brand:"7 Star Select",sku:"RICE-001",price:1299,offerPrice:1199,category:"Groceries",stock:42,low:5,image:"https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",description:"Long-grain everyday rice."},{id:2,name:"Fresh Full Cream Milk",brand:"Daily Fresh",sku:"DAIRY-002",price:68,category:"Dairy",stock:7,low:10,image:"https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=80",description:"Fresh dairy essential."},{id:3,name:"Organic Bananas",brand:"Farm Fresh",sku:"FRUIT-003",price:75,category:"Fruits",stock:24,low:5,image:"https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80",description:"Naturally sweet and fresh."}],c:["Groceries","Dairy","Fruits","Household","Snacks"],o:[{id:"ORD-1001",customer:"Arun Kumar",phone:"9876543210",total:2398,status:"Processing",date:"2026-09-12"},{id:"ORD-1002",customer:"Meena S",phone:"9876501234",total:272,status:"Delivered",date:"2026-09-11"}],u:[{id:1,name:"Arun Kumar",phone:"9876543210",email:"arun@example.com",orders:4,total:4890},{id:2,name:"Meena S",phone:"9876501234",email:"meena@example.com",orders:7,total:8240}],f:[],cp:[],s:{name:"7 Star Super Market",tagline:"Premium supermarket shopping.",phone:"",email:"",address:"",footer:"Premium supermarket shopping."}};
const load=(k)=>{
  let v=JSON.parse(localStorage.getItem(K[k])||"null")??defaults[k];
  if(k==="o" && Array.isArray(v)){
    const statusMap={Processing:"Confirmed",Shipped:"Out for delivery",Completed:"Delivered"};
    v=v.map(o=>({...o,status:statusMap[o.status]||o.status||"Pending"}));
  }
  return v;
};let products=load("p"),categories=load("c"),orders=load("o"),customers=load("u"),offers=load("f"),coupons=load("cp"),settings=load("s"),cart=load("cart")||[],currentCustomer=JSON.parse(localStorage.getItem(K.me)||"null"),tab="dashboard",editing=null,catFilter="All";
const $=x=>document.getElementById(x),save=(k,v)=>localStorage.setItem(K[k],JSON.stringify(v)),money=v=>`₹${Number(v||0).toLocaleString("en-IN")}`,esc=x=>String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
function toast(x){let t=$("toast");t.textContent=x;t.classList.add("show");clearTimeout(window.t);window.t=setTimeout(()=>t.classList.remove("show"),2200)}function cats(){return [...new Set(categories)]}function low(){return products.filter(p=>+p.stock<=+(p.low??5))}function sales(){return orders.filter(o=>o.status!=="Cancelled").reduce((a,o)=>a+(+o.total||0),0)}
function renderStore(){ $("categoryGrid").innerHTML=cats().map((c,i)=>`<button class="category-card" data-cat="${esc(c)}"><span>${String(i+1).padStart(2,"0")}</span><strong>${esc(c)}</strong><small>Explore selection</small></button>`).join("");$("categoryGrid").querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{catFilter=b.dataset.cat;renderStore()});let q=$("search").value.toLowerCase();$("filters").innerHTML=["All",...cats()].map(c=>`<button class="filter ${catFilter===c?"active":""}" data-f="${esc(c)}">${esc(c)}</button>`).join("");$("filters").querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{catFilter=b.dataset.f;renderStore()});let list=products.filter(p=>(catFilter==="All"||p.category===catFilter)&&(`${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(q)));$("productGrid").innerHTML=list.map(p=>{let price=p.offerPrice&&p.offerPrice<p.price?p.offerPrice:p.price;return `<article class="product-card"><div class="product-image">${p.image?`<img src="${esc(p.image)}">`:"7★"}</div><div class="product-info"><span>${esc(p.category)}</span><h3>${esc(p.name)}</h3><p>${esc(p.brand)}</p><div class="product-bottom"><strong>${money(price)}</strong>${p.offerPrice&&p.offerPrice<p.price?`<del>${money(p.price)}</del>`:""}<button class="add-btn" data-add="${p.id}">Add</button></div></div></article>`}).join("")||"<div class='empty-state'>No products found.</div>";$("productGrid").querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>add(+b.dataset.add));renderCart();applyLogo()}
function add(id){let x=cart.find(a=>a.id===id);x?x.qty++:cart.push({id,qty:1});save("cart",cart);renderCart();toast("Added to cart")};function unitPrice(p){return p?.offerPrice&&p.offerPrice<p.price?p.offerPrice:p?.price||0}

function customerByPhone(phone){
  const n=String(phone||"").replace(/\D/g,"");
  return customers.find(c=>String(c.phone||"").replace(/\D/g,"")===n);
}
function pointsForCustomer(c){
  if(!c)return 0;
  const rec=loyaltyPoints.find(x=>x.customerId===c.id || (x.phone&&String(x.phone).replace(/\D/g,"")===String(c.phone||"").replace(/\D/g,"")));
  return rec?Number(rec.points||0):Number(c.points||0);
}
function ensureLoyalty(c){
  if(!c)return;
  let rec=loyaltyPoints.find(x=>x.customerId===c.id);
  if(!rec){loyaltyPoints.push({customerId:c.id,phone:c.phone||"",name:c.name||"",points:Number(c.points||0)});save("loy",loyaltyPoints);}
  else {rec.phone=c.phone||rec.phone;rec.name=c.name||rec.name;save("loy",loyaltyPoints);}
}
function renderCustomerOrders(){
  const host=$("customerOrders");
  if(!host)return;
  const email=(currentCustomer?.email||"").toLowerCase();
  const phone=String(currentCustomer?.phone||"").replace(/\D/g,"");
  const mine=orders.filter(o=>(o.customerEmail||o.email||"").toLowerCase()===email || (phone&&String(o.customerPhone||o.phone||"").replace(/\D/g,"")===phone)).slice().reverse();
  host.innerHTML=mine.length?mine.map(o=>`<div class="order-card"><b>Order #${esc(String(o.id))}</b><span class="order-status">${esc(o.status||"Pending")}</span><div>${esc((o.items||[]).map(i=>`${i.name} × ${i.qty}`).join(", "))}</div><small>${money(o.total||0)} · ${esc(o.delivery?.city||o.city||"")}</small></div>`).join(""):'<div class="empty-state">No previous orders yet.</div>';
}
function renderCustomerAddresses(){
  const host=$("savedAddresses");
  if(!host)return;
  const email=(currentCustomer?.email||"").toLowerCase(), phone=String(currentCustomer?.phone||"").replace(/\D/g,"");
  const mine=orders.filter(o=>(o.customerEmail||o.email||"").toLowerCase()===email || (phone&&String(o.customerPhone||o.phone||"").replace(/\D/g,"")===phone));
  const seen=new Set();
  const addresses=[];
  mine.slice().reverse().forEach(o=>{
    const d=o.delivery||{};
    const key=[d.house,d.street,d.city,d.state,d.pincode].join("|");
    if(key!=="||||"&&!seen.has(key)){seen.add(key);addresses.push(d);}
  });
  host.innerHTML=addresses.length?addresses.map((d,i)=>`<div class="address-card"><b>Saved address ${i+1}</b><div>${esc(d.house||"")}, ${esc(d.street||"")}</div><div>${esc(d.city||"")}, ${esc(d.state||"")} - ${esc(d.pincode||"")}</div></div>`).join(""):'<div class="empty-state">No saved delivery addresses yet.</div>';
}
function renderLoyaltyPublic(){
  const host=$("publicLeaderboard");
  if(!host)return;
  const rows=customers.map(c=>({name:c.name||"Customer",points:pointsForCustomer(c)})).sort((a,b)=>b.points-a.points);
  host.innerHTML=rows.map((r,i)=>`<div class="leader-row"><span>${i+1}. ${esc(r.name)}</span><b>${r.points} points</b></div>`).join("")||'<div class="empty-state">No customers yet.</div>';
}
function lookupPublicPoints(){
  const input=$("pointsPhone");
  const out=$("pointsResult");
  if(!input||!out)return;
  const phone=input.value.replace(/\D/g,"");
  const c=customerByPhone(phone);
  out.innerHTML=c?`<b>${esc(c.name||"Customer")}</b><div>${pointsForCustomer(c)} points</div>`:'No customer found for this number.';
}
function renderCart(){
  let xs=cart.map(c=>({...c,p:products.find(p=>p.id===c.id)})).filter(x=>x.p);
  $("cartCount").textContent=xs.reduce((a,x)=>a+x.qty,0);
  $("cartItems").innerHTML=xs.map(x=>`<div class="cart-item"><div><b>${esc(x.p.name)}</b><small>${money(unitPrice(x.p))} × ${x.qty}</small></div><div><button data-q="${x.id}" data-d="-1">−</button> ${x.qty} <button data-q="${x.id}" data-d="1">+</button></div></div>`).join("")||"<div class='empty-state'>Your cart is empty.</div>";
  $("cartTotal").textContent=money(xs.reduce((a,x)=>a+unitPrice(x.p)*x.qty,0));
  $("cartItems").querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{
    let x=cart.find(c=>c.id==b.dataset.q);
    if(!x)return;
    x.qty+=+b.dataset.d;
    if(x.qty<1)cart=cart.filter(c=>c.id!=b.dataset.q);
    save("cart",cart);renderCart()
  });
}
function applyLogo(){let l=localStorage.getItem(K.l);document.querySelectorAll(".logo-placeholder").forEach(x=>x.innerHTML=l?`<img src="${esc(l)}">`:"7★")}
function openAdmin(){$("adminPassword").value="";$('adminLogin').classList.add("show");setTimeout(()=>$("adminPassword").focus(),50)}function unlock(){if($("adminPassword").value!==PASS)return toast("Incorrect admin password");$("adminLogin").classList.remove("show");$("adminPanel").classList.add("open");renderAdmin()}function lock(){$("adminPanel").classList.remove("open")}
function head(title,sub,btn=""){return `<div class="admin-page-head"><div><p class="eyebrow">STORE MANAGEMENT</p><h1>${title}</h1><p class="muted">${sub}</p></div>${btn}</div>`}function orderRow(o){return `<div class="mini-row"><div><b>${esc(o.id)}</b><small>${esc(o.customer)} · ${o.date}</small></div><div><b>${money(o.total)}</b><span class="status ${o.status.toLowerCase()}">${o.status}</span></div></div>`}
function view(){let v={dashboard:()=>head("Dashboard","Overview of your supermarket.")+`<div class="kpi-grid"><div class="kpi"><span>Total sales</span><b>${money(sales())}</b></div><div class="kpi"><span>Orders</span><b>${orders.length}</b></div><div class="kpi"><span>Products</span><b>${products.length}</b><small>${low().length} low stock</small></div><div class="kpi"><span>Customers</span><b>${customers.length}</b></div></div><div class="admin-grid-2"><div class="panel"><h3>Recent orders</h3>${orders.slice(0,6).map(orderRow).join("")}</div><div class="panel"><h3>Low stock</h3>${low().map(p=>`<div class="mini-row"><span>${esc(p.name)}</span><b class="danger-text">${p.stock} left</b></div>`).join("")||"All stock levels are healthy."}</div></div>`,products:productsView,categories:categoriesView,inventory:inventoryView,orders:ordersView,customers:customersView,offers:offersView,coupons:couponsView,settings:settingsView};return v[tab]()}
function productsView(){return head("Products","Add, edit, delete and upload product pictures.",`<button class="primary" data-act="add">+ Add product</button>`)+`<div class="toolbar"><input id="psearch" placeholder="Search products, SKU, brand..."><select id="pcat"><option>All</option>${cats().map(c=>`<option>${esc(c)}</option>`).join("")}</select></div><div class="table-wrap"><table><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>${products.map(p=>`<tr class="prow" data-q="${esc((p.name+" "+p.brand+" "+p.sku).toLowerCase())}" data-c="${esc(p.category)}"><td><div class="product-cell"><div class="thumb">${p.image?`<img src="${esc(p.image)}">`:"7★"}</div><div><b>${esc(p.name)}</b><small>${esc(p.brand)}</small></div></div></td><td>${esc(p.sku||"-")}</td><td>${esc(p.category)}</td><td><b>${money(p.offerPrice&&p.offerPrice<p.price?p.offerPrice:p.price)}</b></td><td class="${p.stock<=p.low?"danger-text":"stock-ok"}">${p.stock}</td><td><button class="table-btn" data-edit="${p.id}">Edit</button><button class="table-btn danger-btn" data-del="${p.id}">Delete</button></td></tr>`).join("")}</tbody></table></div>`}
function categoriesView(){return head("Categories","Create, rename and delete storefront categories.",`<button class="primary" data-act="cat">+ Add category</button>`)+`<div class="card-grid">${cats().map((c,i)=>`<div class="setting-card"><div class="category-icon">${String(i+1).padStart(2,"0")}</div><h3>${esc(c)}</h3><p>${products.filter(p=>p.category===c).length} products</p><button class="table-btn" data-ren="${esc(c)}">Rename</button><button class="table-btn danger-btn" data-dcat="${esc(c)}">Delete</button></div>`).join("")}</div>`}
function inventoryView(){return head("Inventory","Stock levels, low-stock alerts and quick updates.")+`<div class="inventory-alert">${low().length?`⚠ ${low().length} product(s) need attention.`:"✓ Inventory looks healthy."}</div><div class="table-wrap"><table><thead><tr><th>Product</th><th>Current stock</th><th>Low limit</th><th>Update</th></tr></thead><tbody>${products.map(p=>`<tr><td><b>${esc(p.name)}</b></td><td class="${p.stock<=p.low?"danger-text":"stock-ok"}">${p.stock}</td><td>${p.low}</td><td><input class="inline-number" id="st${p.id}" type="number" min="0" value="${p.stock}"><button class="table-btn" data-stock="${p.id}">Save</button></td></tr>`).join("")}</tbody></table></div>`}
function ordersView(){return head("Orders","Real orders created through checkout, with customer, delivery and notification details.")+`<div class="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Delivery</th><th>Total</th><th>Status</th></tr></thead><tbody>${orders.map(o=>`<tr><td><b>${esc(o.id)}</b><small>${esc(o.date)} · ${esc(o.paymentStatus||"Pending")}</small></td><td>${esc(o.customer)}<small>${esc(o.email||"")}<br>${esc(o.phone||"")}</small></td><td><small>${(o.items||[]).map(i=>`${esc(i.name)} × ${i.qty}`).join("<br>")}</small></td><td><small>${esc(o.delivery?.house||"")}, ${esc(o.delivery?.street||"")}<br>${esc(o.delivery?.city||"")}, ${esc(o.delivery?.state||"")} - ${esc(o.delivery?.pincode||"")}<br><b>Note:</b> ${esc(o.delivery?.note||"None")}</small></td><td>${money(o.total)}</td><td><select class="inline-select" data-os="${esc(o.id)}">${["Pending","Confirmed","Packed","Out for delivery","Delivered","Cancelled"].map(st=>`<option ${o.status===st?"selected":""}>${st}</option>`).join("")}</select></td></tr>`).join("")||`<tr><td colspan="6"><div class="empty-panel">No real orders yet. Orders placed from checkout will appear here.</div></td></tr>`}</tbody></table></div>`}
function customersView(){return head("Customers","Customers are created and updated automatically when they place an order.")+`<div class="table-wrap"><table><thead><tr><th>Customer</th><th>Phone</th><th>Email</th><th>Orders</th><th>Total spent</th><th>Latest order</th></tr></thead><tbody>${customers.map(c=>`<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.phone||"-")}</td><td>${esc(c.email||"-")}</td><td>${c.orders||0}</td><td>${money(c.total||0)}</td><td>${esc(c.latestOrder||"-")}</td></tr>`).join("")||`<tr><td colspan="6"><div class="empty-panel">No customers yet. Customer accounts will appear here after sign-in and checkout.</div></td></tr>`}</tbody></table></div>`}
function offersView(){return head("Offers","Create and manage promotional offers.",`<button class="primary" data-act="offer">+ New offer</button>`)+`<div class="card-grid">${offers.map((o,i)=>`<div class="setting-card"><span class="status ${o.active?"delivered":"cancelled"}">${o.active?"Active":"Disabled"}</span><h3>${esc(o.name)}</h3><p>${esc(o.description)}</p><b>${o.discount}% OFF</b><br><button class="table-btn" data-to="${i}">${o.active?"Disable":"Enable"}</button><button class="table-btn danger-btn" data-do="${i}">Delete</button></div>`).join("")||"<div class='empty-panel'>No offers yet.</div>"}</div>`}
function couponsView(){return head("Coupons","Create, disable and delete discount codes.",`<button class="primary" data-act="coupon">+ New coupon</button>`)+`<div class="table-wrap"><table><thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Status</th><th>Actions</th></tr></thead><tbody>${coupons.map((c,i)=>`<tr><td><b>${esc(c.code)}</b></td><td>${c.type==="percent"?c.value+"%":money(c.value)}</td><td>${money(c.min)}</td><td>${c.active?"Active":"Disabled"}</td><td><button class="table-btn" data-tc="${i}">${c.active?"Disable":"Enable"}</button><button class="table-btn danger-btn" data-dc="${i}">Delete</button></td></tr>`).join("")}</tbody></table></div>`}
function settingsView(){return head("Website Settings","Change store identity, contact details and logo.")+`<div class="admin-grid-2"><div class="panel"><h3>Store identity</h3><form id="settingsForm" class="settings-form"><label>Store name<input id="sn" value="${esc(settings.name)}"></label><label>Tagline<input id="st" value="${esc(settings.tagline)}"></label><label>Phone<input id="sp" value="${esc(settings.phone)}"></label><label>Email<input id="se" value="${esc(settings.email)}"></label><label>Address<textarea id="sa">${esc(settings.address)}</textarea></label><label>Footer<input id="sf" value="${esc(settings.footer)}"></label><label>Google OAuth Client ID<input id="sg" value="${esc(settings.googleClientId||"")}" placeholder="1234567890-....apps.googleusercontent.com"></label><hr><h3>Order email automation</h3><p class="muted">New website orders can be emailed automatically to the store email. This static site uses EmailJS so no private SMTP password is stored in the browser.</p><label>EmailJS Public Key<input id="ejsPublic" value="${esc(settings.emailjsPublicKey||"")}" placeholder="Your EmailJS public key"></label><label>EmailJS Service ID<input id="ejsService" value="${esc(settings.emailjsServiceId||"")}" placeholder="service_xxxxxxx"></label><label>EmailJS Template ID<input id="ejsTemplate" value="${esc(settings.emailjsTemplateId||"")}" placeholder="template_xxxxxxx"></label><button class="primary">Save settings</button></form></div><div class="panel"><h3>Logo</h3><div class="big-logo">${localStorage.getItem(K.l)?`<img src="${esc(localStorage.getItem(K.l))}">`:"7★"}</div><input id="logoUpload" type="file" accept="image/*"><button class="ghost" data-act="rmLogo">Use default logo</button><hr><h3>Admin access</h3><p class="muted">Admin password is configured in app.js. Google Sign-In uses the Client ID saved above. For production, move authentication, orders and customer data to a secure server/database.</p></div></div>`}
function renderAdmin(){$("adminContent").innerHTML=view();document.querySelectorAll(".admin-nav button").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));bindAdmin()}
function bindAdmin(){let root=$("adminContent");root.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>action(b.dataset.act));root.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>openProduct(+b.dataset.edit));root.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>delProduct(+b.dataset.del));root.querySelectorAll("[data-ren]").forEach(b=>b.onclick=()=>renameCat(b.dataset.ren));root.querySelectorAll("[data-dcat]").forEach(b=>b.onclick=()=>delCat(b.dataset.dcat));root.querySelectorAll("[data-stock]").forEach(b=>b.onclick=()=>{let p=products.find(x=>x.id==b.dataset.stock);p.stock=+$('st'+p.id).value;save('p',products);renderStore();renderAdmin();toast('Stock updated')});root.querySelectorAll("[data-os]").forEach(s=>s.onchange=()=>{orders.find(o=>o.id===s.dataset.os).status=s.value;save('o',orders);renderAdmin();toast('Order status updated')});root.querySelectorAll("[data-to]").forEach(b=>b.onclick=()=>{offers[b.dataset.to].active=!offers[b.dataset.to].active;save('f',offers);renderAdmin()});root.querySelectorAll("[data-do]").forEach(b=>b.onclick=()=>{offers.splice(+b.dataset.do,1);save('f',offers);renderAdmin()});root.querySelectorAll("[data-tc]").forEach(b=>b.onclick=()=>{coupons[b.dataset.tc].active=!coupons[b.dataset.tc].active;save('cp',coupons);renderAdmin()});root.querySelectorAll("[data-dc]").forEach(b=>b.onclick=()=>{coupons.splice(+b.dataset.dc,1);save('cp',coupons);renderAdmin()});root.querySelector('#psearch')?.addEventListener('input',filterProducts);root.querySelector('#pcat')?.addEventListener('change',filterProducts);root.querySelector('#settingsForm')?.addEventListener('submit',e=>{e.preventDefault();settings={...settings,name:$('sn').value,tagline:$('st').value,phone:$('sp').value,email:$('se').value,address:$('sa').value,footer:$('sf').value,googleClientId:$('sg').value.trim(),emailjsPublicKey:$('ejsPublic').value.trim(),emailjsServiceId:$('ejsService').value.trim(),emailjsTemplateId:$('ejsTemplate').value.trim()};save('s',settings);renderStore();setupGoogle();toast('Website settings saved')});root.querySelector('#logoUpload')?.addEventListener('change',async e=>{if(e.target.files[0]){localStorage.setItem(K.l,await data(e.target.files[0]));applyLogo();renderAdmin();toast('Logo updated')}})}
function filterProducts(){let q=$('psearch').value.toLowerCase(),c=$('pcat').value;document.querySelectorAll('.prow').forEach(r=>r.style.display=(!q||r.dataset.q.includes(q))&&(c==='All'||r.dataset.c===c)?'':'none')}
function action(a){if(a==='add')openProduct();if(a==='cat'){let x=prompt('Category name:');if(x&&x.trim()){categories.push(x.trim());save('c',categories);renderStore();renderAdmin()}}if(a==='offer'){let n=prompt('Offer name:'),d=prompt('Discount %:','10');if(n&&d){offers.push({id:Date.now(),name:n,discount:+d,description:prompt('Description:','Special savings')||'',active:true});save('f',offers);renderAdmin()}}if(a==='coupon'){let code=prompt('Coupon code:'),v=prompt('Discount value:','10');if(code&&v){coupons.push({code:code.toUpperCase(),value:+v,type:confirm('OK for percentage, Cancel for fixed ₹')?'percent':'fixed',min:+(prompt('Minimum order:','500')||0),active:true});save('cp',coupons);renderAdmin()}}if(a==='rmLogo'){localStorage.removeItem(K.l);applyLogo();renderAdmin()}}
function openProduct(id){editing=id?products.find(p=>p.id===id):null;$('productModalTitle').textContent=editing?'Edit product':'Add product';$('editProductId').value=editing?.id||'';$('productName').value=editing?.name||'';$('productBrand').value=editing?.brand||'';$('productSku').value=editing?.sku||'';$('productPrice').value=editing?.price??'';$('productStock').value=editing?.stock??0;$('productLowStock').value=editing?.low??5;$('productOfferPrice').value=editing?.offerPrice??'';$('productImage').value=editing?.image?.startsWith('data:')?'':editing?.image||'';$('productDescription').value=editing?.description||'';$('productCategory').innerHTML=cats().map(c=>`<option ${editing?.category===c?'selected':''}>${esc(c)}</option>`).join('');$('productModal').classList.add('show')}
async function submitProduct(e){e.preventDefault();let img=$('productImage').value.trim()||editing?.image||'';if($('productImageFile').files[0])img=await data($('productImageFile').files[0]);let p=editing||{id:Date.now()};Object.assign(p,{name:$('productName').value,brand:$('productBrand').value,sku:$('productSku').value,price:+$('productPrice').value,stock:+$('productStock').value,low:+$('productLowStock').value,offerPrice:+$('productOfferPrice').value||0,category:$('productCategory').value,image:img,description:$('productDescription').value});if(!editing)products.unshift(p);save('p',products);$('productModal').classList.remove('show');renderStore();renderAdmin();toast(editing?'Product updated':'Product added')}
function data(f){return new Promise((res,rej)=>{let r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)})}function delProduct(id){let p=products.find(x=>x.id===id);if(p&&confirm(`Delete ${p.name}?`)){products=products.filter(x=>x.id!==id);save('p',products);renderStore();renderAdmin();toast('Product deleted')}}function renameCat(c){let n=prompt('Rename category:',c);if(n&&n!==c){products.forEach(p=>{if(p.category===c)p.category=n});categories[categories.indexOf(c)]=n;save('c',categories);save('p',products);renderStore();renderAdmin()}}function delCat(c){if(products.some(p=>p.category===c))return toast('Move products out of this category first');categories=categories.filter(x=>x!==c);save('c',categories);renderStore();renderAdmin()}
function openAuth(){if(currentCustomer){openCheckout();return}$("authModal").classList.add("show");$("authName").focus()}
function saveCustomerProfile(c){
  c={...c,name:(c.name||"").trim(),email:(c.email||"").trim().toLowerCase(),phone:(c.phone||"").trim()};
  currentCustomer=c;
  localStorage.setItem(K.me,JSON.stringify(c));renderCustomerOrders();renderCustomerAddresses();
  let existing=customers.find(x=>x.email&&c.email&&x.email.toLowerCase()===c.email.toLowerCase());
  if(!existing){
    customers.unshift({id:Date.now(),name:c.name,phone:c.phone,email:c.email,googleId:c.googleId||"",picture:c.picture||"",orders:0,total:0,latestOrder:""});
  }else{
    existing.name=c.name||existing.name;
    existing.phone=c.phone||existing.phone;
    if(c.googleId)existing.googleId=c.googleId;
    if(c.picture)existing.picture=c.picture;
  }
  save("u",customers);ensureLoyalty(existing||customers.find(x=>x.email===c.email));
}
function decodeGooglePayload(credential){
  const parts=String(credential||"").split(".");
  if(parts.length!==3) throw new Error("Invalid Google credential");
  const base64=parts[1].replace(/-/g,"+").replace(/_/g,"/");
  const json=decodeURIComponent(atob(base64.padEnd(base64.length+((4-base64.length%4)%4),"="))
    .split("").map(c=>"%"+("00"+c.charCodeAt(0).toString(16)).slice(-2)).join(""));
  return JSON.parse(json);
}
function handleGoogleCredential(resp){
  try{
    const payload=decodeGooglePayload(resp.credential);
    const clientId=(settings.googleClientId||"").trim();
    const issuer=payload.iss;
    if(!payload.email || payload.email_verified===false) throw new Error("Google email is not verified");
    if(issuer!=="https://accounts.google.com" && issuer!=="accounts.google.com") throw new Error("Invalid Google issuer");
    if(clientId && payload.aud!==clientId) throw new Error("Google client mismatch");
    saveCustomerProfile({
      name:payload.name||payload.email.split("@")[0],
      email:payload.email,
      phone:"",
      googleId:payload.sub,
      picture:payload.picture||""
    });
    $("authModal").classList.remove("show");
    openCheckout();
    toast("Google profile saved ✓");
  }catch(e){
    console.error(e);
    toast("Google sign-in could not be completed");
  }
}
function setupGoogle(){
  const id=(settings.googleClientId||"").trim();
  if(!id){
    $("googleHint").textContent="Admin → Website Settings → add your Google OAuth Client ID to enable Google Sign-In.";
    return;
  }
  if(window.google?.accounts?.id){
    google.accounts.id.initialize({client_id:id,callback:handleGoogleCredential});
    const host=$("googleSignIn");
    if(host){
      host.innerHTML='<span class="google-mark">G</span><span>Continue with Google</span>';
      host.onclick=()=>google.accounts.id.prompt();
    }
    $("googleHint").textContent="Google Sign-In is ready.";
  }else{
    setTimeout(setupGoogle,500);
  }
}
function openCheckout(){if(!cart.length)return toast("Your cart is empty");let c=currentCustomer||{};$("dName").value=c.name||"";$("dPhone").value=c.phone||"";$("checkoutAccount").textContent=c.email?`Signed in as ${c.email}`:"";let items=cart.reduce((a,x)=>{let p=products.find(p=>p.id===x.id);return a+(p?(p.offerPrice&&p.offerPrice<p.price?p.offerPrice:p.price)*x.qty:0)},0);$("checkoutItems").textContent=money(items);$("checkoutTotal").textContent=money(items);$("checkoutModal").classList.add("show")}
async function sendOrderEmail(order){
  const to=(settings.email||"").trim();
  const publicKey=(settings.emailjsPublicKey||"").trim();
  const serviceId=(settings.emailjsServiceId||"").trim();
  const templateId=(settings.emailjsTemplateId||"").trim();
  if(!to || !publicKey || !serviceId || !templateId || !window.emailjs) return {sent:false,reason:"not_configured"};
  try{
    emailjs.init({publicKey});
    const itemLines=order.items.map(i=>`${i.name} × ${i.qty} — ${money(i.price*i.qty)}`).join("\\n");
    const d=order.delivery||{};
    await emailjs.send(serviceId,templateId,{
      to_email:to,
      store_email:to,
      order_id:order.id,
      order_date:order.date,
      customer_name:order.customer,
      customer_email:order.email,
      customer_phone:order.phone,
      delivery_address:`${d.house||""}, ${d.street||""}, ${d.city||""}, ${d.state||""} - ${d.pincode||""}`,
      delivery_instructions:d.note||"None",
      order_items:itemLines,
      order_total:money(order.total),
      payment_status:order.paymentStatus||"Cash on delivery",
      order_status:order.status||"Pending"
    });
    return {sent:true};
  }catch(err){
    console.error("Order email failed:",err);
    return {sent:false,reason:"failed"};
  }
}
function orderEmailConfigured(){
  return !!((settings.email||"").trim()&&(settings.emailjsPublicKey||"").trim()&&(settings.emailjsServiceId||"").trim()&&(settings.emailjsTemplateId||"").trim());
}
async function placeOrder(e){
  e.preventDefault();
  const phone=$("dPhone").value.trim(), pin=$("dPin").value.trim();
  if(!/^\d{10}$/.test(phone)) return toast("Enter a valid 10-digit phone number");
  if(!/^\d{6}$/.test(pin)) return toast("Enter a valid pincode");
  if(!currentCustomer){$("checkoutModal").classList.remove("show");return openAuth()}
  if(!cart.length) return toast("Your cart is empty");

  let needed=cart.map(c=>({c,p:products.find(p=>p.id===c.id)}));
  if(needed.some(x=>!x.p||x.c.qty>x.p.stock)) return toast("Some items are out of stock. Please update your cart.");

  let total=needed.reduce((a,x)=>a+unitPrice(x.p)*x.c.qty,0);
  let id="ORD-"+Date.now().toString().slice(-8);
  let order={
    id,customer:$("dName").value.trim(),phone,email:currentCustomer.email,total,
    status:"Pending",paymentStatus:"Cash on delivery",
    date:new Date().toISOString().slice(0,10),createdAt:new Date().toISOString(),
    delivery:{
      house:$("dHouse").value.trim(),street:$("dStreet").value.trim(),
      city:$("dCity").value.trim(),state:$("dState").value.trim(),
      pincode:pin,note:$("dNote").value.trim()
    },
    items:needed.map(x=>({id:x.p.id,name:x.p.name,qty:x.c.qty,price:unitPrice(x.p)}))
  };

  // Create the order and reduce stock immediately.
  orders.unshift(order);
  needed.forEach(x=>x.p.stock-=x.c.qty);

  let cust=customers.find(x=>x.email&&currentCustomer.email&&x.email.toLowerCase()===currentCustomer.email.toLowerCase());
  if(!cust){
    cust={id:Date.now(),name:order.customer,phone:order.phone,email:order.email,orders:0,total:0,latestOrder:""};
    customers.unshift(cust);
  }
  cust.name=order.customer; cust.phone=order.phone;
  cust.orders=(cust.orders||0)+1; cust.total=(cust.total||0)+total; cust.latestOrder=id;

  save("o",orders);
  const orderPoints=Math.max(0,Math.floor(total));
  const loyaltyCustomer=customers.find(x=>x.id===cust?.id) || customerByPhone(cust?.phone);
  if(loyaltyCustomer){
    ensureLoyalty(loyaltyCustomer);
    let lr=loyaltyPoints.find(x=>x.customerId===loyaltyCustomer.id);
    if(lr){lr.points=Number(lr.points||0)+orderPoints;lr.name=loyaltyCustomer.name;lr.phone=loyaltyCustomer.phone||lr.phone;save("loy",loyaltyPoints);}
  } save("p",products); save("u",customers);
  cart=[]; save("cart",cart);

  $("checkoutModal").classList.remove("show");
  $("successText").innerHTML=`<strong>Profile saved ✓</strong><br>Your order <b>${esc(id)}</b> has been placed successfully for <b>${money(total)}</b>.<br><small>${orderEmailConfigured()?"The store has also been notified by email.":"Your order is saved. Store email automation can be enabled in Website Settings."}</small>`;
  $("orderSuccess").classList.add("show");
  renderStore();

  // Email is sent after the local order is safely created, so an email failure
  // never loses the customer's order.
  const emailResult=await sendOrderEmail(order);
  if(emailResult.sent){
    $("successText").innerHTML=`<strong>Profile saved ✓</strong><br>Your order <b>${esc(id)}</b> has been placed successfully for <b>${money(total)}</b>.<br><small>✓ Order details have been emailed to the store.</small>`;
  }else if(emailResult.reason==="failed"){
    $("successText").innerHTML+=`<br><small>Order was saved successfully, but the store notification email could not be sent.</small>`;
  }
}

$("adminBtn").onclick=openAdmin;$("closeAdminLogin").onclick=()=>$("adminLogin").classList.remove("show");$("adminLoginBtn").onclick=unlock;$("adminPassword").onkeydown=e=>{if(e.key==='Enter')unlock()};$("adminLogout").onclick=lock;document.querySelectorAll('.admin-nav button').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;renderAdmin()});$("productForm").onsubmit=submitProduct;document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).classList.remove('show'));$("search").oninput=renderStore;$("cartBtn").onclick=()=>{$("cartPanel").classList.add('open');$("overlay").classList.add('show')};$("closeCart").onclick=$("overlay").onclick=()=>{$("cartPanel").classList.remove('open');$("overlay").classList.remove('show')};$("checkoutBtn").onclick=openAuth;$("closeAuth").onclick=()=>$("authModal").classList.remove("show");$("authForm").onsubmit=e=>{e.preventDefault();const name=$("authName").value.trim(),email=$("authEmail").value.trim(),phone=$("authPhone").value.trim();if(!name||!email||!/^\d{10}$/.test(phone))return toast("Enter your name, email and valid 10-digit phone");saveCustomerProfile({name,email,phone});$("authModal").classList.remove("show");toast("Profile saved ✓");setTimeout(openCheckout,180)};$("closeCheckout").onclick=()=>$("checkoutModal").classList.remove("show");$("backToCart").onclick=()=>$("checkoutModal").classList.remove("show");$("checkoutForm").onsubmit=placeOrder;$("closeSuccess").onclick=()=>$("orderSuccess").classList.remove("show");$("googleSignIn").onclick=()=>{if(!settings.googleClientId)toast("Add Google Client ID in Admin → Website Settings")};renderStore();setupGoogle();

function renderAccountPanel(){
  const c=currentCustomer;
  const n=$("accountName"),e=$("accountEmail"),p=$("accountPhone"),pts=$("accountPoints");
  if(n){n.textContent=c?.name||"Not signed in";e.textContent=c?.email||"";p.textContent=c?.phone||"";pts.textContent=`${pointsForCustomer(c)} points`;}
  renderCustomerOrders();renderCustomerAddresses();renderLoyaltyPublic();
}
function renderLoyaltyAdmin(){
  const host=$("adminLoyaltyTable"); if(!host)return;
  host.innerHTML=customers.slice().sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""))).map(c=>{
    ensureLoyalty(c); const p=pointsForCustomer(c);
    return `<div class="loyalty-admin-row"><div><b>${esc(c.name||"Customer")}</b><small>${esc(c.phone||"No phone")} · ${esc(c.email||"")}</small></div><strong>${p}</strong><input id="pts-${c.id}" type="number" min="0" placeholder="Points"><button class="btn primary" onclick="adminAddPoints(${c.id})">Send Points</button></div>`;
  }).join("")||'<div class="empty-state">No customers yet.</div>';
}
window.adminAddPoints=function(id){
  const c=customers.find(x=>x.id===id); if(!c)return;
  const input=$(`pts-${id}`), amount=Number(input?.value||0);
  if(!Number.isFinite(amount)||amount<=0)return toast("Enter a positive points value");
  ensureLoyalty(c); const r=loyaltyPoints.find(x=>x.customerId===id);
  r.points=Number(r.points||0)+Math.floor(amount); save("loy",loyaltyPoints);
  if(input)input.value="";
  renderLoyaltyAdmin();renderLoyaltyPublic();renderAccountPanel();toast(`${Math.floor(amount)} points sent to ${c.name}`);
};
document.addEventListener("DOMContentLoaded",()=>{
  setTimeout(()=>{
    $("checkPoints")?.addEventListener("click",lookupPublicPoints);
    renderAccountPanel();renderLoyaltyAdmin();
  },300);
});

setInterval(()=>{try{renderAccountPanel();renderLoyaltyAdmin()}catch(e){}},5000);
