import { db, productsTable } from "@workspace/db";

const SELLER = "AllMart";

const images = {
  shoes:       "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
  apparel:     "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
  electronics: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
  home:        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
  kitchen:     "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
  beauty:      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80",
  accessories: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80",
  books:       "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
  toys:        "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80",
  sports:      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
};

type Cat = keyof typeof images;

const products: {
  name: string; desc: string; cat: Cat;
  price: number; originalPrice?: number;
  stock: number; rating: number;
  colors: string[]; productType: string; tags: string[];
}[] = [
  // ── SHOES (4) ──
  { name: "Platform Chunky Sneaker",    desc: "Retro-inspired platform sneaker with thick EVA sole and leather upper.",        cat: "shoes", price: 28500,                       stock: 40, rating: 4.4, colors: ["White","Black"],             productType: "Sneakers",  tags: ["fashion","retro","street"] },
  { name: "Gladiator Flat Sandal",      desc: "Multi-strap leather gladiator sandal with adjustable buckles.",                 cat: "shoes", price: 14000, originalPrice: 19500, stock: 50, rating: 4.3, colors: ["Tan","Black","Gold"],         productType: "Sandals",   tags: ["summer","casual","fashion"] },
  { name: "Knit Slip-On Trainer",       desc: "Sock-style knit upper with memory foam insole — all-day comfort.",             cat: "shoes", price: 21000,                       stock: 60, rating: 4.5, colors: ["Grey","Black","Navy"],        productType: "Trainers",  tags: ["comfort","casual","sport"] },
  { name: "Waterproof Rain Boot",       desc: "Pull-on rubber rain boot with fleece lining and non-slip outsole.",            cat: "shoes", price: 19500, originalPrice: 26000, stock: 35, rating: 4.2, colors: ["Black","Navy","Red"],         productType: "Boots",     tags: ["rain","winter","essential"] },

  // ── APPAREL (4) ──
  { name: "Linen Co-Ord Set",           desc: "Matching relaxed linen shirt and trouser set in earth tones.",                 cat: "apparel", price: 22000,                       stock: 35, rating: 4.6, colors: ["Cream","Olive","Sky Blue"],   productType: "Set",       tags: ["casual","linen","summer"] },
  { name: "Fitted Turtleneck",          desc: "Ribbed cotton-modal turtleneck — a minimalist everyday essential.",            cat: "apparel", price: 9500,                        stock: 65, rating: 4.4, colors: ["Black","White","Cream"],      productType: "Top",       tags: ["minimalist","basics","layering"] },
  { name: "Pleated Midi Skirt",         desc: "Satin pleated midi skirt with elasticated waistband and fluid drape.",        cat: "apparel", price: 16000, originalPrice: 22000, stock: 38, rating: 4.5, colors: ["Black","Dusty Rose","Forest"], productType: "Skirt",     tags: ["elegant","versatile","fashion"] },
  { name: "Puffer Jacket Oversized",    desc: "Lightweight quilted puffer jacket with high collar and side pockets.",        cat: "apparel", price: 34000, originalPrice: 48000, stock: 22, rating: 4.7, colors: ["Black","Navy","Olive"],       productType: "Jacket",    tags: ["winter","cozy","layering"] },

  // ── ELECTRONICS (4) ──
  { name: "Mechanical Keyboard TKL",    desc: "Tenkeyless RGB mechanical keyboard with tactile brown switches.",             cat: "electronics", price: 55000,                         stock: 18, rating: 4.6, colors: ["Black","White"],             productType: "Keyboard",   tags: ["gaming","productivity","RGB"] },
  { name: "Ring Light 18-Inch",         desc: "Professional LED ring light with tripod stand and phone holder.",            cat: "electronics", price: 28000, originalPrice: 38000,  stock: 30, rating: 4.5, colors: ["White"],                     productType: "Lighting",   tags: ["creator","studio","streaming"] },
  { name: "4K Webcam Ultra",            desc: "4K autofocus webcam with built-in noise-cancelling microphone.",             cat: "electronics", price: 47000,                         stock: 22, rating: 4.6, colors: ["Black"],                     productType: "Webcam",     tags: ["work","streaming","home office"] },
  { name: "White Noise Sleep Machine",  desc: "30 soothing sounds with auto-off timer for deeper, uninterrupted sleep.",   cat: "electronics", price: 27000, originalPrice: 35000,  stock: 35, rating: 4.7, colors: ["White","Grey"],               productType: "Wellness",   tags: ["sleep","wellness","bedroom"] },

  // ── HOME (4) ──
  { name: "Wicker Storage Basket Set",  desc: "3 handwoven seagrass baskets with handles for stylish organisation.",       cat: "home", price: 19500,                       stock: 25, rating: 4.5, colors: ["Natural"],                   productType: "Storage",   tags: ["storage","boho","living room"] },
  { name: "Velvet Cushion Cover Pair",  desc: "Soft velvet cushion covers with hidden zip closure. 45 × 45 cm.",          cat: "home", price: 11000, originalPrice: 15500, stock: 50, rating: 4.4, colors: ["Emerald","Mustard","Navy"],    productType: "Decor",     tags: ["decor","living room","cozy"] },
  { name: "Geometric Metal Wall Clock", desc: "Modern powder-coated geometric clock in bold metal. 40 cm diameter.",      cat: "home", price: 24000,                       stock: 22, rating: 4.6, colors: ["Black","Gold"],               productType: "Decor",     tags: ["modern","wall decor","gift"] },
  { name: "Bamboo Desk Organiser",      desc: "6-slot bamboo desktop organiser — clears clutter, looks sharp.",           cat: "home", price: 8500,  originalPrice: 12000, stock: 55, rating: 4.5, colors: ["Natural"],                   productType: "Storage",   tags: ["office","organisation","eco"] },

  // ── KITCHEN (4) ──
  { name: "Pour-Over Coffee Set",       desc: "Dripper, gooseneck kettle and glass server — the full pour-over kit.",     cat: "kitchen", price: 36000, originalPrice: 49000, stock: 18, rating: 4.7, colors: ["Black","White"],             productType: "Coffee",    tags: ["coffee","pour-over","gift"] },
  { name: "Silicone Baking Mat 2-Pack", desc: "Non-stick reusable silicone mat, oven-safe to 230 °C.",                   cat: "kitchen", price: 10500,                       stock: 55, rating: 4.5, colors: ["Red","Blue"],               productType: "Baking",    tags: ["baking","eco","essential"] },
  { name: "Rotating Spice Rack 24-Jar",desc: "Rotating chrome rack with glass jars and chalkboard labels.",             cat: "kitchen", price: 19000, originalPrice: 26000, stock: 28, rating: 4.4, colors: ["Chrome","Black"],            productType: "Storage",   tags: ["organisation","cooking","gift"] },
  { name: "Stand Mixer 5-Speed",        desc: "Tilt-head 4.5 L stand mixer with dough hook and balloon whisk.",         cat: "kitchen", price: 79000, originalPrice: 105000,stock: 12, rating: 4.8, colors: ["Red","Silver","Black"],       productType: "Appliance", tags: ["baking","professional","premium"] },

  // ── BEAUTY (4) ──
  { name: "Retinol Night Cream",        desc: "0.3% retinol and peptide night cream for overnight cell renewal.",         cat: "beauty", price: 22000,                       stock: 30, rating: 4.6, colors: [],                            productType: "Skincare",  tags: ["anti-aging","night","premium"] },
  { name: "Hyaluronic Acid Serum",      desc: "Triple-weight HA for deep and surface hydration. Fragrance-free.",        cat: "beauty", price: 16500, originalPrice: 22000, stock: 45, rating: 4.7, colors: [],                            productType: "Serum",     tags: ["hydration","skincare","plumping"] },
  { name: "Arabica Coffee Body Scrub",  desc: "Exfoliating coffee scrub with coconut oil and shea butter. 300 g.",      cat: "beauty", price: 9500,                        stock: 55, rating: 4.6, colors: [],                            productType: "Body",      tags: ["exfoliant","natural","gift"] },
  { name: "18-Pan Eyeshadow Palette",   desc: "18 warm-tone matte and shimmer shades for every look.",                  cat: "beauty", price: 15000, originalPrice: 20000, stock: 40, rating: 4.5, colors: ["Warm Tones"],                productType: "Makeup",    tags: ["eyes","makeup","gift"] },

  // ── ACCESSORIES (4) ──
  { name: "Silk Scarf 90 × 90",        desc: "Pure silk scarf with abstract print — wear as head wrap, belt or bag tie.", cat: "accessories", price: 22000,                       stock: 35, rating: 4.7, colors: ["Multi","Navy","Ivory"],        productType: "Scarf",     tags: ["elegant","gift","versatile"] },
  { name: "Natural Stone Bracelet Set", desc: "5 stackable bracelets: Amazonite, Tiger Eye, Onyx, Lapis, Rose Quartz.", cat: "accessories", price: 14500, originalPrice: 20000, stock: 55, rating: 4.6, colors: ["Multi"],                       productType: "Jewellery", tags: ["boho","gift","stacking"] },
  { name: "Wide Brim Straw Hat",        desc: "Natural straw hat with ribbon band. Blocks UV and turns heads.",          cat: "accessories", price: 16000,                       stock: 30, rating: 4.4, colors: ["Natural","Black"],             productType: "Hat",       tags: ["summer","beach","fashion"] },
  { name: "Leather Luggage Tag Set",    desc: "2 genuine leather luggage tags with buckle strap and ID window.",         cat: "accessories", price: 11000, originalPrice: 15000, stock: 45, rating: 4.5, colors: ["Tan","Black"],                productType: "Travel",    tags: ["travel","gift","leather"] },

  // ── BOOKS (4) ──
  { name: "There Was a Country",        desc: "Chinua Achebe's memoir on Nigeria and the Biafran War.",                   cat: "books", price: 4800,                        stock: 55, rating: 4.7, colors: [],                             productType: "Non-Fiction",  tags: ["nigerian","history","memoir"] },
  { name: "Purple Hibiscus",            desc: "Chimamanda Adichie's debut — a coming-of-age story of faith and freedom.", cat: "books", price: 4500,                        stock: 60, rating: 4.8, colors: [],                             productType: "Fiction",      tags: ["african","award-winning","literary"] },
  { name: "The Psychology of Money",    desc: "Morgan Housel on how to think about wealth, greed and happiness.",        cat: "books", price: 5800, originalPrice: 7500,   stock: 75, rating: 4.8, colors: [],                             productType: "Finance",      tags: ["finance","self-help","bestseller"] },
  { name: "Ikigai",                     desc: "The Japanese secret to a long and happy life — find your purpose.",       cat: "books", price: 4200,                        stock: 70, rating: 4.7, colors: [],                             productType: "Self-Help",    tags: ["wellness","inspiration","gift"] },

  // ── TOYS (4) ──
  { name: "Magnetic Building Tiles 60pc",desc: "60-piece magnetic construction tiles for shapes and 3D structures.",     cat: "toys", price: 16500, originalPrice: 22000, stock: 40, rating: 4.8, colors: ["Multi"],                       productType: "Building Sets", tags: ["educational","kids","stem"] },
  { name: "Mini Science Lab Kit",        desc: "Beginner science kit — 20 safe experiments with full instructions.",     cat: "toys", price: 12000,                       stock: 35, rating: 4.7, colors: ["Multi"],                       productType: "Educational",   tags: ["stem","kids","learning"] },
  { name: "Plush Animal Backpack",       desc: "Cute plush animal backpack — durable, roomy and oh-so-adorable.",        cat: "toys", price: 7500,  originalPrice: 10500, stock: 60, rating: 4.6, colors: ["Bear","Bunny","Panda"],         productType: "Bags",          tags: ["kids","school","gift"] },
  { name: "Outdoor Sprinkler Play Mat",  desc: "Inflatable sprinkler splash pad — 150 cm, BPA-free, summer fun.",       cat: "toys", price: 9000,                        stock: 45, rating: 4.5, colors: ["Multi"],                       productType: "Outdoor",       tags: ["summer","outdoor","water play"] },

  // ── SPORTS (4) ──
  { name: "Pull-Up Bar Doorframe",      desc: "No-screw doorframe pull-up bar, 100 kg capacity, padded grips.",         cat: "sports", price: 14500, originalPrice: 19500, stock: 45, rating: 4.6, colors: ["Black"],                       productType: "Strength",    tags: ["home gym","upper body","essential"] },
  { name: "Foam Roller 60 cm",          desc: "High-density foam roller for deep-tissue muscle recovery.",               cat: "sports", price: 8000,                        stock: 65, rating: 4.7, colors: ["Black","Blue"],                productType: "Recovery",    tags: ["recovery","yoga","fitness"] },
  { name: "Basketball Size 7 Spalding", desc: "Official size 7 indoor/outdoor basketball — superior grip and bounce.",  cat: "sports", price: 18000, originalPrice: 24000, stock: 40, rating: 4.6, colors: ["Orange/Black"],               productType: "Basketball",  tags: ["basketball","outdoor","sport"] },
  { name: "Neoprene Gym Gloves",        desc: "Padded neoprene gloves with wrist wrap for heavy lifting.",              cat: "sports", price: 5500,                        stock: 80, rating: 4.5, colors: ["Black","Black/Red"],           productType: "Accessories", tags: ["gym","lifting","protection"] },
];

async function run() {
  console.log(`Seeding ${products.length} extra products (4 per category)…`);
  for (const p of products) {
    await db.insert(productsTable).values({
      name: p.name,
      description: p.desc,
      category: p.cat,
      price: p.price,
      originalPrice: p.originalPrice ?? null,
      currency: "NGN",
      imageUrl: images[p.cat],
      stock: p.stock,
      sellerName: SELLER,
      rating: p.rating,
      colors: p.colors,
      productType: p.productType,
      tags: p.tags,
      featured: Math.random() > 0.7,
    });
    process.stdout.write(".");
  }
  console.log(`\n✓ Done — ${products.length} products added.`);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
