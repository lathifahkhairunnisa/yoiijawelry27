const products=[
{id:1,name:"Sunny Charm Bracelet",cat:"Bracelet",price:89000,badge:"BEST SELLER",img:"https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=700&q=80"},
{id:2,name:"Cloudy Day Necklace",cat:"Necklace",price:109000,badge:"NEW",img:"https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=80"},
{id:3,name:"Tiny Sparkle Ring",cat:"Ring",price:79000,badge:"CUTE!",img:"https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=80"},
{id:4,name:"Twinkle Earrings",cat:"Earrings",price:99000,badge:"HOT",img:"https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=80"},
{id:5,name:"Sweet Pearl Bracelet",cat:"Bracelet",price:95000,badge:"NEW",img:"https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=700&q=80"},
{id:6,name:"Everyday Necklace",cat:"Necklace",price:119000,badge:"FAVE",img:"https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&q=80"},
{id:7,name:"Soft Glow Ring",cat:"Ring",price:85000,badge:"NEW",img:"https://images.unsplash.com/photo-1603561596112-db1d2d140b8c?auto=format&fit=crop&w=700&q=80"},
{id:8,name:"Mini Star Earrings",cat:"Earrings",price:89000,badge:"LOVE",img:"https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=700&q=80"}];
const waNumber="625979228683";
const waText="Halo kak aku mau custom jawelry .... 5 pack ya";
const waLink=t=>`https://wa.me/${waNumber}?text=${encodeURIComponent(t)}`;
document.querySelector("#waFloat").href=waLink(waText);
document.querySelector("#customWa").href=waLink(waText);

let cart=[];
const money=n=>"Rp"+n.toLocaleString("id-ID");
function renderProducts(list=products){
 document.querySelector("#productGrid").innerHTML=list.map(p=>`<article class="product">
 <div class="product-img"><img src="${p.img}" alt="${p.name}" loading="lazy"><span class="badge">${p.badge}</span></div>
 <div class="product-info"><h3>${p.name}</h3><p>${p.cat}</p><div class="product-bottom"><b>${money(p.price)}</b><button class="add" onclick="addCart(${p.id})" aria-label="Tambah ${p.name}">+</button></div></div></article>`).join("");
}
renderProducts();
window.addCart=id=>{const p=products.find(x=>x.id===id);const found=cart.find(x=>x.id===id);found?found.qty++:cart.push({...p,qty:1});renderCart();};
function renderCart(){
 document.querySelector("#cartCount").textContent=cart.reduce((a,x)=>a+x.qty,0);
 document.querySelector("#cartItems").innerHTML=cart.length?cart.map(x=>`<div class="cart-item"><div><b>${x.name}</b><br><small>${money(x.price)} × ${x.qty}</small></div><button onclick="removeCart(${x.id})">Hapus</button></div>`).join(""):"<p>Keranjang masih kosong ♡</p>";
 document.querySelector("#cartTotal").textContent=money(cart.reduce((a,x)=>a+x.price*x.qty,0));
}
window.removeCart=id=>{cart=cart.filter(x=>x.id!==id);renderCart();};
document.querySelector("#cartBtn").onclick=()=>{document.querySelector("#cartPanel").classList.add("open");document.querySelector("#shade").classList.add("open")};
function closeCart(){document.querySelector("#cartPanel").classList.remove("open");document.querySelector("#shade").classList.remove("open")}
document.querySelector("#closeCart").onclick=closeCart;document.querySelector("#shade").onclick=closeCart;
document.querySelector("#checkoutBtn").onclick=()=>{if(!cart.length)return alert("Keranjang masih kosong.");const items=cart.map(x=>`${x.name} (${x.qty}x)`).join(", ");location.href=waLink(`Halo kak, aku mau pesan: ${items}. Total ${money(cart.reduce((a,x)=>a+x.price*x.qty,0))}`)};

const slides=[...document.querySelectorAll(".slide")], dots=document.querySelector(".dots");let current=0,timer;
slides.forEach((_,i)=>{const b=document.createElement("button");b.onclick=()=>show(i);dots.appendChild(b)});
function show(i){slides[current].classList.remove("active");dots.children[current].classList.remove("active");current=(i+slides.length)%slides.length;slides[current].classList.add("active");dots.children[current].classList.add("active");clearInterval(timer);timer=setInterval(()=>show(current+1),4500)}
document.querySelector(".next").onclick=()=>show(current+1);document.querySelector(".prev").onclick=()=>show(current-1);show(0);

document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{renderProducts(products.filter(p=>p.cat===b.dataset.filter));document.querySelector("#products").scrollIntoView()});

const overlay=document.querySelector("#searchOverlay");
document.querySelector("#searchBtn").onclick=()=>{overlay.classList.add("open");setTimeout(()=>document.querySelector("#searchInput").focus(),100)};
document.querySelector('[data-close="searchOverlay"]').onclick=()=>overlay.classList.remove("open");
overlay.onclick=e=>{if(e.target===overlay)overlay.classList.remove("open")};
document.querySelector("#searchInput").oninput=e=>{const q=e.target.value.toLowerCase();const found=products.filter(p=>(p.name+" "+p.cat).toLowerCase().includes(q));document.querySelector("#searchResults").innerHTML=(q?found:[]).map(p=>`<div class="search-result">${p.name} — ${money(p.price)}</div>`).join("")||(q?"Tidak ada produk yang cocok.":"")};

document.querySelector(".menu-btn").onclick=()=>document.querySelector(".nav").classList.toggle("open");
document.querySelectorAll(".nav a").forEach(a=>a.onclick=()=>document.querySelector(".nav").classList.remove("open"));

const translations={
en:{home:"Home",collection:"Collection",promo:"Promo",custom:"Custom",about:"About",eyebrow:"ACCESSORIES FOR YOUR EVERYDAY SPARKLE ✦",heroTitle:"Little details,<br><em>big sparkle.</em>",heroText:"Sweet accessories made to brighten your day. Pick your favorite or customize it your way.",shopNow:"Shop Now",makeCustom:"Make It Custom",cute:"Cute Design",customizable:"Customizable",gift:"Gift Ready",discover:"DISCOVER YOUR FAVORITES",pick:"Pick your sparkle ✦",seeAll:"See All →",best:"Best sellers",promoTitle:"More sparkle,<br>more happy.",promoText:"Discover special offers and sweet surprises for your order.",grab:"Grab the Deal",customTitle:"Your idea, your jewelry ♡",customText:"Want a special color, name, or detail? Tell us your idea and let's make it happen.",chatCustom:"Chat for Custom",aboutTitle:"Small accessories,<br>happy little moments.",aboutText:"Yoii Jewelry brings playful, minimal accessories into your everyday style, because tiny details can make a day feel special.",searchTitle:"Search accessories",yourCart:"Your cart",checkout:"Checkout via WhatsApp"},
id:{home:"Home",collection:"Koleksi",promo:"Promo",custom:"Custom",about:"About",eyebrow:"AKSESORI UNTUK SPARKLE SETIAP HARI ✦",heroTitle:"Detail kecil,<br><em>sparkle besar.</em>",heroText:"Aksesori manis untuk bikin harimu lebih berwarna. Pilih koleksi favoritmu atau custom sesuai gayamu.",shopNow:"Belanja Sekarang",makeCustom:"Buat Custom",cute:"Desain Gemas",customizable:"Bisa Custom",gift:"Siap Jadi Kado",discover:"TEMUKAN FAVORITMU",pick:"Pilih sparkle-mu ✦",seeAll:"Lihat Semua →",best:"Paling disukai",promoTitle:"Makin sparkle,<br>makin happy.",promoText:"Temukan promo pilihan dan hadiah manis untuk pesananmu.",grab:"Ambil Promonya",customTitle:"Idemu, jewelry-mu ♡",customText:"Mau warna, nama, atau detail khusus? Ceritakan idemu dan kami bantu wujudkan.",chatCustom:"Chat untuk Custom",aboutTitle:"Aksesori kecil,<br>momen bahagia.",aboutText:"Yoii Jewelry hadir untuk menemani gaya sehari-hari lewat aksesori yang playful, minimal, dan mudah dipadukan. Karena detail kecil juga bisa bikin hari terasa spesial.",searchTitle:"Cari aksesori",yourCart:"Keranjangmu",checkout:"Checkout via WhatsApp"}};
document.querySelector("#lang").onchange=e=>{const t=translations[e.target.value];document.querySelectorAll("[data-i18n]").forEach(el=>el.innerHTML=t[el.dataset.i18n]||el.innerHTML);document.documentElement.lang=e.target.value};
renderCart();