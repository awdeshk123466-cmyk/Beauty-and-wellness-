// ---------- data ----------
const PRODUCTS = [
  { id: "p1", name: "Bare Cloud Cleanser", type: "Cleanser", price: "$18", note: "Gel-to-milk, no foam. For skin that gets tight after washing.", ingredients: "Oat kernel, glycerin, panthenol", baseRating: 4.6, baseCount: 128 },
  { id: "p2", name: "Second Skin Serum", type: "Vitamin C Serum", price: "$32", note: "10% ascorbic acid, stabilized. Goes on before moisturizer, not after.", ingredients: "L-ascorbic acid, ferulic acid, vit E", baseRating: 4.3, baseCount: 94 },
  { id: "p3", name: "Slow Water Toner", type: "Toner", price: "$22", note: "No alcohol. A pass before serum, not a step to skip.", ingredients: "Centella asiatica, niacinamide, aloe", baseRating: 4.5, baseCount: 76 },
  { id: "p4", name: "Quiet Night Cream", type: "Night Moisturizer", price: "$36", note: "Heavier than it looks. Built for the 4 hours skin actually repairs in.", ingredients: "Ceramide NP, shea butter, squalane", baseRating: 4.7, baseCount: 151 },
  { id: "p5", name: "Even Ground Exfoliant", type: "AHA/BHA", price: "$28", note: "Alternate nights only. Two acids, one low dose, so skin doesn't fight back.", ingredients: "Glycolic acid, salicylic acid, allantoin", baseRating: 4.1, baseCount: 63 },
  { id: "p6", name: "Field Shade SPF 40", type: "Sunscreen", price: "$24", note: "No white cast on deeper tones. Reapply after 3 hours outdoors.", ingredients: "Zinc oxide, niacinamide, green tea extract", baseRating: 4.4, baseCount: 187 },
  { id: "p7", name: "Underlayer Oil", type: "Face Oil", price: "$30", note: "A few drops mixed into night cream, not worn alone.", ingredients: "Squalane, rosehip, jojoba", baseRating: 4.2, baseCount: 52 },
  { id: "p8", name: "Retinal 0.05 Drop", type: "Retinoid", price: "$34", note: "Faster-converting than retinol. Start twice a week, no more.", ingredients: "Retinaldehyde, squalane, bisabolol", baseRating: 4.0, baseCount: 71 },
  { id: "p9", name: "Salt Line Eye Balm", type: "Eye Cream", price: "$26", note: "Ring finger only, patted not rubbed, morning and night.", ingredients: "Caffeine, peptide complex, shea butter", baseRating: 4.3, baseCount: 89 }
];

const STORAGE_KEY = "fieldfold_notes_v1";

// ---------- render products ----------
function starString(rating){
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function renderProducts(){
  const grid = document.getElementById("productGrid");
  const template = document.getElementById("cardTemplate");
  const notes = loadNotes();

  PRODUCTS.forEach((p, i) => {
    const node = template.content.cloneNode(true);
    node.querySelector(".card-index").textContent = "No. " + String(i + 1).padStart(3, "0");
    node.querySelector(".card-type").textContent = p.type;
    node.querySelector(".card-name").textContent = p.name;
    node.querySelector(".card-note").textContent = p.note;
    node.querySelector(".ing-list").textContent = p.ingredients;
    node.querySelector(".card-price").textContent = p.price;

    const { avg, count } = ratingFor(p, notes);
    node.querySelector(".stars-display").textContent = starString(avg);
    node.querySelector(".rating-count").textContent = avg.toFixed(1) + " (" + count + ")";

    grid.appendChild(node);
  });
}

function ratingFor(product, notes){
  const productNotes = notes.filter(n => n.productId === product.id);
  const totalCount = product.baseCount + productNotes.length;
  const totalScore = product.baseRating * product.baseCount + productNotes.reduce((s, n) => s + n.rating, 0);
  const avg = totalCount ? totalScore / totalCount : 0;
  return { avg, count: totalCount };
}

// ---------- product select in form ----------
function populateSelect(){
  const select = document.getElementById("noteProduct");
  PRODUCTS.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    select.appendChild(opt);
  });
}

// ---------- star input ----------
function setupStarInput(){
  const stars = document.querySelectorAll("#starInput .star");
  const hidden = document.getElementById("noteRating");

  function paint(value){
    stars.forEach(s => {
      s.classList.toggle("filled", Number(s.dataset.value) <= value);
    });
  }

  stars.forEach(star => {
    star.addEventListener("click", () => {
      hidden.value = star.dataset.value;
      paint(Number(star.dataset.value));
    });
    star.addEventListener("mouseenter", () => paint(Number(star.dataset.value)));
  });
  document.getElementById("starInput").addEventListener("mouseleave", () => {
    paint(Number(hidden.value));
  });
}

// ---------- storage ----------
function loadNotes(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    return [];
  }
}
function saveNotes(notes){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }catch(e){ /* storage unavailable, fail quietly */ }
}

// ---------- ledger render ----------
function renderLedger(){
  const ledger = document.getElementById("ledger");
  const notes = loadNotes().slice().reverse();
  ledger.innerHTML = "";

  if (notes.length === 0){
    const empty = document.createElement("div");
    empty.className = "ledger-empty";
    empty.textContent = "No notes yet — be the first to log a result.";
    ledger.appendChild(empty);
    return;
  }

  notes.forEach(n => {
    const product = PRODUCTS.find(p => p.id === n.productId);
    const entry = document.createElement("article");
    entry.className = "note-entry";
    entry.innerHTML = `
      <div class="note-entry-head">
        <span class="note-entry-name"></span>
        <span class="note-entry-meta"></span>
      </div>
      <div class="note-entry-stars"></div>
      <p class="note-entry-text"></p>
    `;
    entry.querySelector(".note-entry-name").textContent = n.name;
    entry.querySelector(".note-entry-meta").textContent = product ? product.name : "Unknown product";
    entry.querySelector(".note-entry-stars").textContent = starString(n.rating);
    entry.querySelector(".note-entry-text").textContent = n.text;
    ledger.appendChild(entry);
  });
}

// ---------- form submit ----------
function setupForm(){
  const form = document.getElementById("noteForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("noteName").value.trim();
    const productId = document.getElementById("noteProduct").value;
    const rating = Number(document.getElementById("noteRating").value);
    const text = document.getElementById("noteText").value.trim();

    if (!name || !productId || !rating || !text){
      alert("Fill in a name, a rating, and what happened — the rest is optional.");
      return;
    }

    const notes = loadNotes();
    notes.push({ name, productId, rating, text, ts: Date.now() });
    saveNotes(notes);

    form.reset();
    document.getElementById("noteRating").value = "0";
    document.querySelectorAll("#starInput .star").forEach(s => s.classList.remove("filled"));

    renderLedger();
    document.getElementById("productGrid").innerHTML = "";
    renderProducts(); // refresh star averages
  });
}

// ---------- init ----------
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  populateSelect();
  setupStarInput();
  setupForm();
  renderLedger();
});
