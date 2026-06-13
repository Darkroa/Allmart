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
  // ── SHOES (5) ──
  { name: "Ankara Canvas Sneakers",        desc: "Vibrant ankara-print canvas sneakers, rubber sole, unisex.",                       cat: "shoes", price: 22000, originalPrice: 32000, stock: 60,  rating: 4.6, colors: ["Blue/Gold","Green/Red"],    productType: "Sneakers", tags: ["fashion","ankara","casual"] },
  { name: "Classic Leather Loafers",       desc: "Full-grain leather slip-on loafers with cushioned insole.",                        cat: "shoes", price: 45000, originalPrice: 60000, stock: 35,  rating: 4.5, colors: ["Brown","Black"],             productType: "Loafers",  tags: ["office","formal","premium"] },
  { name: "Mesh Running Trainers",         desc: "Lightweight breathable mesh trainers with responsive foam.",                        cat: "shoes", price: 18500,                       stock: 80,  rating: 4.4, colors: ["Black","White","Navy"],      productType: "Trainers", tags: ["sport","gym","running"] },
  { name: "Block Heel Sandals",            desc: "Open-toe block heel sandals with adjustable ankle strap.",                         cat: "shoes", price: 16000, originalPrice: 22000, stock: 45,  rating: 4.3, colors: ["Nude","Black","White"],      productType: "Sandals",  tags: ["evening","fashion","heels"] },
  { name: "Chelsea Suede Boots",           desc: "Pull-on suede Chelsea boots with elastic side panels.",                            cat: "shoes", price: 58000,                       stock: 25,  rating: 4.7, colors: ["Tan","Black"],               productType: "Boots",    tags: ["premium","winter","office"] },

  // ── APPAREL (5) ──
  { name: "Oversized Graphic Tee",         desc: "100% cotton oversized tee with street-inspired print, unisex.",                    cat: "apparel", price: 6500,                      stock: 100, rating: 4.5, colors: ["Black","White","Grey"],      productType: "T-Shirt",  tags: ["streetwear","casual","unisex"] },
  { name: "Slim-Fit Linen Trousers",       desc: "Breathable linen slim-fit trousers, perfect for the Nigerian heat.",               cat: "apparel", price: 14000, originalPrice: 19000, stock: 55,  rating: 4.4, colors: ["Cream","Olive","Navy"],      productType: "Trousers", tags: ["casual","summer","office"] },
  { name: "Floral Midi Dress",             desc: "Vibrant floral midi dress with puff sleeves and side pockets.",                    cat: "apparel", price: 17500,                      stock: 40,  rating: 4.6, colors: ["Multi"],                     productType: "Dress",    tags: ["summer","casual","fashion"] },
  { name: "Tailored Blazer",               desc: "Slim-fit structured blazer in premium stretch fabric.",                            cat: "apparel", price: 38000, originalPrice: 52000, stock: 20,  rating: 4.7, colors: ["Black","Navy","Charcoal"],   productType: "Blazer",   tags: ["office","formal","premium"] },
  { name: "Cotton Fleece Hoodie",          desc: "Heavyweight cotton fleece hoodie with kangaroo pocket.",                           cat: "apparel", price: 12000,                      stock: 65,  rating: 4.5, colors: ["Grey","Black","Navy"],       productType: "Hoodie",   tags: ["casual","cozy","unisex"] },

  // ── ELECTRONICS (5) ──
  { name: "ANC Wireless Headphones",       desc: "40-hour active noise-cancelling headphones with premium sound drivers.",           cat: "electronics", price: 89000, originalPrice: 115000, stock: 20,  rating: 4.8, colors: ["Black","Silver"],           productType: "Headphones", tags: ["audio","wireless","premium"] },
  { name: "Smart Watch Pro",               desc: "AMOLED health smartwatch with GPS, SpO2 and 7-day battery.",                      cat: "electronics", price: 75000,                         stock: 25,  rating: 4.7, colors: ["Black","Rose Gold","Silver"],productType: "Wearable",   tags: ["health","fitness","smart"] },
  { name: "TWS Earbuds X7",               desc: "True wireless earbuds with 6h playtime and IPX5 water resistance.",                cat: "electronics", price: 32000, originalPrice: 45000,  stock: 50,  rating: 4.5, colors: ["White","Black"],             productType: "Earbuds",    tags: ["audio","sport","wireless"] },
  { name: "65W Fast Charger Hub",          desc: "6-port USB-C hub with 65W PD fast charging — laptop to phone.",                   cat: "electronics", price: 18000,                         stock: 60,  rating: 4.4, colors: ["Black","White"],             productType: "Charger",    tags: ["accessories","charging","essential"] },
  { name: "Power Bank 20000mAh",           desc: "Slim 20,000mAh power bank, dual USB-A and USB-C output.",                         cat: "electronics", price: 22000, originalPrice: 29000,  stock: 75,  rating: 4.6, colors: ["Black","White"],             productType: "Power Bank", tags: ["travel","essential","charging"] },

  // ── HOME (5) ──
  { name: "Linen Throw Pillow Set (4)",    desc: "4 European linen throw pillows with removable covers in earthy tones.",            cat: "home", price: 16000, originalPrice: 22000, stock: 40,  rating: 4.5, colors: ["Beige","Grey","Terracotta"],  productType: "Bedding",  tags: ["decor","bedroom","cozy"] },
  { name: "Rattan Pendant Lamp",           desc: "Natural rattan pendant lampshade with E27 fitting — boho aesthetic.",              cat: "home", price: 28000,                       stock: 20,  rating: 4.6, colors: ["Natural"],                   productType: "Lighting", tags: ["boho","decor","pendant"] },
  { name: "Scented Soy Candle Set",        desc: "3 hand-poured soy candles: Amber, Sandalwood and Vanilla.",                       cat: "home", price: 12000, originalPrice: 16500, stock: 55,  rating: 4.7, colors: ["Cream"],                     productType: "Candles",  tags: ["gift","aromatherapy","decor"] },
  { name: "Blackout Curtain Pair",         desc: "100% blackout thermal eyelet curtains, reduces heat and noise.",                   cat: "home", price: 32000,                       stock: 30,  rating: 4.4, colors: ["Charcoal","Beige","Navy"],    productType: "Curtains", tags: ["bedroom","living room","essential"] },
  { name: "Jute Area Rug 5×7",            desc: "Hand-woven natural jute rug. Durable, eco-friendly and stylish.",                  cat: "home", price: 45000, originalPrice: 60000, stock: 15,  rating: 4.5, colors: ["Natural","Grey"],             productType: "Rug",      tags: ["eco","living room","decor"] },

  // ── KITCHEN (5) ──
  { name: "Cast Iron Skillet 12 inch",     desc: "Pre-seasoned 12-inch cast iron skillet for even heat distribution.",              cat: "kitchen", price: 28000,                       stock: 25,  rating: 4.8, colors: ["Black"],                     productType: "Cookware",  tags: ["cooking","durable","essential"] },
  { name: "Air Fryer 4L Digital",          desc: "4-litre digital air fryer with 8 presets and non-stick basket.",                  cat: "kitchen", price: 49000, originalPrice: 65000, stock: 22,  rating: 4.7, colors: ["Black","White"],             productType: "Appliance", tags: ["healthy","cooking","essential"] },
  { name: "French Press Coffee Maker",     desc: "Borosilicate glass French press with double-wall steel filter.",                  cat: "kitchen", price: 18500,                       stock: 35,  rating: 4.5, colors: ["Black","Chrome"],            productType: "Coffee",    tags: ["coffee","morning","gift"] },
  { name: "Ceramic Non-Stick Pan Set",     desc: "PFOA-free ceramic non-stick 3-piece set (20/24/28 cm).",                         cat: "kitchen", price: 42000, originalPrice: 55000, stock: 20,  rating: 4.6, colors: ["Stone","Sage","Rust"],       productType: "Cookware",  tags: ["healthy","cooking","premium"] },
  { name: "Glass Meal Prep Containers",    desc: "5 borosilicate glass containers with airtight lids for meal prep.",              cat: "kitchen", price: 24000,                       stock: 40,  rating: 4.4, colors: ["Clear"],                     productType: "Storage",   tags: ["meal prep","healthy","essential"] },

  // ── BEAUTY (5) ──
  { name: "Shea Butter Body Cream",        desc: "Rich raw shea butter cream — deeply moisturises and evens skin tone.",            cat: "beauty", price: 5500,  originalPrice: 8000,  stock: 90,  rating: 4.8, colors: ["Cream"],                    productType: "Body Care", tags: ["natural","moisturiser","gift"] },
  { name: "Vitamin C Brightening Serum",   desc: "15% vitamin C serum — fades dark spots and boosts radiance in 4 weeks.",         cat: "beauty", price: 12500,                       stock: 60,  rating: 4.7, colors: ["Clear"],                    productType: "Serum",     tags: ["skincare","brightening","premium"] },
  { name: "Matte Lipstick Collection",     desc: "Set of 6 long-wear matte lipsticks in Nigerian-friendly shades.",                cat: "beauty", price: 9800,  originalPrice: 14000, stock: 75,  rating: 4.6, colors: ["Nude","Berry","Red","Plum"],  productType: "Makeup",    tags: ["makeup","gift","lipstick"] },
  { name: "Hydrating Face Mask Set",       desc: "5 sheet masks — Hyaluronic, Green Tea, Rose, Charcoal and Collagen.",            cat: "beauty", price: 7000,                        stock: 80,  rating: 4.5, colors: ["Multi"],                    productType: "Skincare",  tags: ["skincare","self-care","gift"] },
  { name: "Natural Hair Growth Oil",       desc: "Castor & peppermint oil blend for faster hair growth and scalp health.",          cat: "beauty", price: 6500,  originalPrice: 9500,  stock: 70,  rating: 4.7, colors: ["Amber"],                    productType: "Hair Care", tags: ["natural","hair","growth"] },

  // ── ACCESSORIES (5) ──
  { name: "RFID Leather Slim Wallet",      desc: "RFID-blocking genuine leather wallet with 6 card slots.",                         cat: "accessories", price: 18000,                       stock: 55,  rating: 4.6, colors: ["Black","Brown","Tan"],        productType: "Wallet",    tags: ["gift","essential","premium"] },
  { name: "Polarised Sunglasses",          desc: "UV400 polarised sunglasses with lightweight metal frame.",                        cat: "accessories", price: 14500, originalPrice: 20000, stock: 45,  rating: 4.5, colors: ["Black","Gold","Silver"],      productType: "Sunglasses",tags: ["summer","driving","fashion"] },
  { name: "Beaded Waist Chain Set",        desc: "3 colourful beaded waist chains — a staple Nigerian accessory.",                  cat: "accessories", price: 4500,                        stock: 100, rating: 4.8, colors: ["Multi","Red/Gold","Blue/Gold"],productType: "Jewellery", tags: ["traditional","fashion","gift"] },
  { name: "Canvas Tote Bag Large",         desc: "Heavy-duty canvas tote with inner pocket and reinforced handles.",                cat: "accessories", price: 9500,  originalPrice: 13000, stock: 65,  rating: 4.4, colors: ["Natural","Black","Navy"],     productType: "Bag",       tags: ["eco","everyday","unisex"] },
  { name: "Chunky Chain Necklace",         desc: "Bold gold-plated chunky chain necklace — statement piece.",                       cat: "accessories", price: 8500,                        stock: 50,  rating: 4.5, colors: ["Gold","Silver"],              productType: "Jewellery", tags: ["fashion","statement","gift"] },

  // ── BOOKS (5) ──
  { name: "Things Fall Apart",             desc: "Chinua Achebe's timeless masterpiece on Igbo culture and colonial Nigeria.",      cat: "books", price: 4500,                        stock: 80,  rating: 4.9, colors: [],                             productType: "Fiction",      tags: ["classic","african","literature"] },
  { name: "Half of a Yellow Sun",          desc: "Chimamanda Ngozi Adichie's award-winning novel on the Biafran war.",             cat: "books", price: 5200,                        stock: 60,  rating: 4.9, colors: [],                             productType: "Fiction",      tags: ["african","award-winning","literary"] },
  { name: "Rich Dad Poor Dad",             desc: "Robert Kiyosaki's personal finance classic — money lessons for everyone.",        cat: "books", price: 4800,  originalPrice: 6500,  stock: 90,  rating: 4.7, colors: [],                             productType: "Finance",      tags: ["finance","self-help","bestseller"] },
  { name: "The Alchemist",                desc: "Paulo Coelho's global bestseller about following your dreams.",                    cat: "books", price: 4200,                        stock: 75,  rating: 4.8, colors: [],                             productType: "Fiction",      tags: ["inspiration","bestseller","gift"] },
  { name: "Atomic Habits",                 desc: "James Clear's practical guide to building good habits and breaking bad ones.",    cat: "books", price: 5500,  originalPrice: 7500,  stock: 85,  rating: 4.8, colors: [],                             productType: "Self-Help",    tags: ["productivity","self-help","bestseller"] },

  // ── TOYS (5) ──
  { name: "LEGO Classic Brick Box",        desc: "480-piece classic brick box for unlimited creative building.",                    cat: "toys", price: 18000, originalPrice: 24000, stock: 35,  rating: 4.8, colors: ["Multi"],                      productType: "Building Sets", tags: ["kids","educational","gift"] },
  { name: "Remote Control Racing Car",     desc: "1:18 scale RC car, 25 km/h, 2.4 GHz control, rechargeable.",                    cat: "toys", price: 12500,                       stock: 40,  rating: 4.6, colors: ["Red","Blue","Green"],          productType: "RC Toys",       tags: ["kids","fun","boys"] },
  { name: "Wooden Puzzle Set (4-in-1)",    desc: "4 educational wooden puzzles — shapes, animals, numbers and transport.",         cat: "toys", price: 7500,                        stock: 55,  rating: 4.7, colors: ["Natural/Multi"],               productType: "Puzzles",       tags: ["educational","toddler","wooden"] },
  { name: "Doll & Accessories Set",        desc: "Fashion doll with 10 outfits, shoes and accessories included.",                  cat: "toys", price: 9500,  originalPrice: 14000, stock: 45,  rating: 4.5, colors: ["Multi"],                      productType: "Dolls",         tags: ["girls","gift","creative"] },
  { name: "Play Sand Creativity Kit",      desc: "2 kg kinetic sand with moulds, tools and storage tray.",                        cat: "toys", price: 8000,                        stock: 50,  rating: 4.4, colors: ["Yellow","Blue","Pink"],        productType: "Creative",      tags: ["sensory","kids","creative"] },

  // ── SPORTS (5) ──
  { name: "Adjustable Dumbbell Set 20kg",  desc: "20 kg adjustable dumbbell pair — space-saving home gym essential.",              cat: "sports", price: 38000, originalPrice: 52000, stock: 25,  rating: 4.7, colors: ["Black"],                      productType: "Weights",     tags: ["fitness","gym","home gym"] },
  { name: "Yoga Mat Non-Slip 6mm",         desc: "Extra-thick 6mm non-slip yoga mat with carry strap.",                           cat: "sports", price: 9500,                        stock: 70,  rating: 4.6, colors: ["Purple","Black","Teal"],      productType: "Yoga",        tags: ["yoga","fitness","wellness"] },
  { name: "Football Training Ball Size 5", desc: "FIFA-quality training football with durable PU outer casing.",                   cat: "sports", price: 12000, originalPrice: 16500, stock: 60,  rating: 4.5, colors: ["Black/White","Blue/White"],   productType: "Football",    tags: ["football","outdoor","training"] },
  { name: "Jump Rope Speed Cable",         desc: "Ball-bearing speed jump rope with adjustable cable — for home or gym.",         cat: "sports", price: 4500,                        stock: 90,  rating: 4.6, colors: ["Black","Red"],                productType: "Cardio",      tags: ["cardio","gym","affordable"] },
  { name: "Resistance Bands Set (5 Levels)",desc: "5-piece latex resistance band set from extra light to extra heavy.",           cat: "sports", price: 8500,  originalPrice: 12000, stock: 80,  rating: 4.7, colors: ["Multi"],                      productType: "Resistance",  tags: ["fitness","gym","home gym"] },
];

async function run() {
  console.log(`Seeding ${products.length} products across 10 categories…`);

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

  console.log(`\n✓ Done — ${products.length} products seeded.`);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
