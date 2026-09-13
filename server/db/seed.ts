import { getDb, run, query, saveDb } from './database.js';

export async function seed() {
  await getDb();
  console.log('Seeding India Fashions database...');

  // 1. Settings
  const settings = [
    ['brand_name', 'India Fashions'],
    ['tagline', 'Handcrafted Heritage & Festive Weaves'],
    ['shop_address', 'Shop 14, Royal Silk Arcade, MG Road, Bangalore 560001'],
    ['shop_latitude', '12.9716'],
    ['shop_longitude', '77.5946'],
    ['delivery_radius_km', '12'],
    ['delivery_base_charge', '50'],
    ['free_delivery_threshold', '2999'],
    ['cod_enabled', '1'],
    ['upi_enabled', '1'],
    ['card_enabled', '1'],
    ['imps_neft_enabled', '1'],
    ['bank_account_name', 'India Fashions Boutique Pvt Ltd'],
    ['bank_account_number', '987654321098'],
    ['bank_ifsc', 'HDFC0001234'],
    ['bank_branch', 'MG Road Heritage Branch'],
    ['upi_id', 'indiafashions@okhdfcbank'],
    ['contact_phone', '+91 98450 12345'],
    ['contact_email', 'care@indiafashions.com'],
    ['offer_2_plus_1_enabled', '1']
  ];

  for (const [k, v] of settings) {
    run('INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)', [k, v]);
  }

  // 2. Categories
  const categories = [
    { id: 'cat-sarees', name: 'Sarees', slug: 'sarees', description: 'Timeless handwoven silk, brocade, and festive sarees', is_active: 1, display_order: 1 },
    { id: 'cat-punjabi', name: 'Punjabi Dresses', slug: 'punjabi-dresses', description: 'Rich embroidered suits and Patiala sets', is_active: 1, display_order: 2 },
    { id: 'cat-children', name: 'Children', slug: 'children', description: 'Traditional festive wear for young princes and princesses', is_active: 1, display_order: 3 },
    { id: 'cat-kurti', name: 'Kurti', slug: 'kurti', description: 'Handcrafted kurtis in pure silks and chanderi', is_active: 1, display_order: 4 },
    { id: 'cat-lehenga', name: 'Lehenga', slug: 'lehenga', description: 'Royal bridal and celebratory lehenga ensembles', is_active: 1, display_order: 5 },
    { id: 'cat-salwar', name: 'Salwar Suit', slug: 'salwar-suit', description: 'Classic silhouettes tailored from heritage weaves', is_active: 1, display_order: 6 },
    { id: 'cat-mens', name: "Men's Ethnic", slug: 'mens-ethnic', description: 'Kurta pajama sets, bandhgalas, and silk dhotis', is_active: 1, display_order: 7 },
    { id: 'cat-accessories', name: 'Accessories', slug: 'accessories', description: 'Potlis, dupattas, and ornate handcrafted accents', is_active: 1, display_order: 8 }
  ];

  for (const c of categories) {
    run('INSERT OR REPLACE INTO categories (id, name, slug, description, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?)',
      [c.id, c.name, c.slug, c.description, c.is_active, c.display_order]);
  }

  // 3. Users
  const users = [
    { id: 'u-owner', name: 'Rajesh Mehra (Shop Owner)', email: 'owner@indiafashions.com', password_hash: 'admin123', role: 'SUPER_ADMIN' },
    { id: 'u-admin', name: 'Ananya Sharma (Store Manager)', email: 'admin@indiafashions.com', password_hash: 'admin123', role: 'ADMIN' },
    { id: 'u-cashier', name: 'Sunil Kumar (Head Cashier)', email: 'cashier@indiafashions.com', password_hash: 'admin123', role: 'HEAD_CASHIER' },
    { id: 'u-pos', name: 'Pooja Verma (Counter Cashier)', email: 'pos@indiafashions.com', password_hash: 'admin123', role: 'POS_CASHIER' },
    { id: 'u-inv', name: 'Vikram Singh (Dock Controller)', email: 'inventory@indiafashions.com', password_hash: 'admin123', role: 'INVENTORY_EXECUTIVE' }
  ];

  for (const u of users) {
    run('INSERT OR REPLACE INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [u.id, u.name, u.email, u.password_hash, u.role, new Date().toISOString()]);
  }

  // 4. Products & Variants & Media
  const productsData = [
    {
      id: 'prod-kanjeevaram-emerald',
      name: 'Kanjeevaram Pure Mulberry Silk Saree',
      slug: 'kanjeevaram-pure-mulberry-silk-saree',
      category_id: 'cat-sarees',
      description: 'Handwoven in the ancient temple city of Kanchipuram, this masterpiece is crafted from 100% pure Mulberry silk and adorned with rich gold zari korvai borders and intricate temple vanki motifs on the pallu.',
      fabric: 'Pure Mulberry Silk with 2G Gold Zari',
      care_instructions: 'Dry clean only. Store wrapped in soft unbleached muslin cloth with natural cedar balls. Avoid spraying perfume directly.',
      status: 'PUBLISHED',
      is_featured: 1,
      homepage_placement: 'HERO',
      campaign_label: 'Limited weave',
      seo_title: 'Kanjeevaram Pure Mulberry Silk Saree | India Fashions',
      seo_description: 'Authentic handwoven Kanchipuram pure silk saree with regal emerald green and gold zari temple motifs.',
      canonical_url: 'https://indiafashions.com/product/kanjeevaram-pure-mulberry-silk-saree',
      variants: [
        { id: 'var-kj-01', sku: 'KJ-EMR-01', size: 'Free Size (6.3m with blouse)', color: 'Emerald Green & Ruby Gold', color_code: '#0F5F56', cost_price: 12000, selling_price: 18999, sale_price: 16999, quantity: 5, low_stock_threshold: 2 },
        { id: 'var-kj-02', sku: 'KJ-MAR-02', size: 'Free Size (6.3m with blouse)', color: 'Deep Maroon & Antique Gold', color_code: '#6B1724', cost_price: 12500, selling_price: 19499, sale_price: null, quantity: 3, low_stock_threshold: 2 }
      ],
      media: [
        { id: 'med-kj-01', file_path: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80', alt_text: 'Emerald green Kanjeevaram pure silk saree with antique gold border', sort_order: 1, is_primary: 1 },
        { id: 'med-kj-02', file_path: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80', alt_text: 'Close up of gold zari temple weave pallu detail', sort_order: 2, is_primary: 0 }
      ]
    },
    {
      id: 'prod-banarasi-georgette',
      name: 'Banarasi Handloom Georgette Brocade Saree',
      slug: 'banarasi-handloom-georgette-brocade-saree',
      category_id: 'cat-sarees',
      description: 'An ethereal confluence of lightweight hand-twisted georgette and opulent Banarasi antique gold zari. Woven by master artisans in Varanasi using the time-honored Kadwa technique.',
      fabric: 'Pure Georgette Silk with Kadwa Antique Zari',
      care_instructions: 'Strictly dry clean. Roll inside muslin fabric to preserve metallic sheen. Iron on reverse side on low heat.',
      status: 'PUBLISHED',
      is_featured: 1,
      homepage_placement: 'FEATURED',
      campaign_label: 'Festive edit',
      seo_title: 'Banarasi Handloom Georgette Brocade Saree | India Fashions',
      seo_description: 'Exquisite Kadwa weave Banarasi georgette saree in royal midnight navy and festive dusty rose.',
      canonical_url: 'https://indiafashions.com/product/banarasi-handloom-georgette-brocade-saree',
      variants: [
        { id: 'var-bg-01', sku: 'BG-NVY-01', size: 'Free Size (6.3m with blouse)', color: 'Midnight Navy Blue', color_code: '#102A43', cost_price: 8000, selling_price: 14500, sale_price: 11999, quantity: 4, low_stock_threshold: 2 },
        { id: 'var-bg-02', sku: 'BG-ROS-02', size: 'Free Size (6.3m with blouse)', color: 'Festive Dusty Rose', color_code: '#B85D6F', cost_price: 8200, selling_price: 14800, sale_price: 12499, quantity: 2, low_stock_threshold: 2 }
      ],
      media: [
        { id: 'med-bg-01', file_path: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80', alt_text: 'Royal navy Banarasi handloom saree with antique brocade', sort_order: 1, is_primary: 1 },
        { id: 'med-bg-02', file_path: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80', alt_text: 'Pallu detail of Banarasi Kadwa gold zari weave', sort_order: 2, is_primary: 0 }
      ]
    },
    {
      id: 'prod-chanderi-tissue',
      name: 'Chanderi Tissue Zari Festive Saree',
      slug: 'chanderi-tissue-zari-festive-saree',
      category_id: 'cat-sarees',
      description: 'Celebrated for its feather-light feel and luminous glow, this Chanderi tissue saree blends fine silk warps with gold zari wefts, finished with intricate floral bootis and an ornate zari border.',
      fabric: 'Chanderi Silk Tissue with Meenakari Butis',
      care_instructions: 'Dry clean only. Gentle steam pressing recommended.',
      status: 'PUBLISHED',
      is_featured: 1,
      homepage_placement: 'NEW_ARRIVAL',
      campaign_label: 'New arrival',
      seo_title: 'Chanderi Tissue Zari Festive Saree | India Fashions',
      seo_description: 'Luminous Chanderi tissue festive saree with delicate gold border and silk sheen.',
      canonical_url: 'https://indiafashions.com/product/chanderi-tissue-zari-festive-saree',
      variants: [
        { id: 'var-ct-01', sku: 'CT-GLD-01', size: 'Free Size (6.3m with blouse)', color: 'Luminous Antique Gold', color_code: '#D4AF37', cost_price: 4500, selling_price: 7800, sale_price: 6499, quantity: 8, low_stock_threshold: 3 },
        { id: 'var-ct-02', sku: 'CT-TEA-02', size: 'Free Size (6.3m with blouse)', color: 'Peacock Teal with Gold', color_code: '#005F73', cost_price: 4500, selling_price: 7800, sale_price: 6499, quantity: 6, low_stock_threshold: 3 }
      ],
      media: [
        { id: 'med-ct-01', file_path: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80', alt_text: 'Chanderi gold tissue saree with floral buti detail', sort_order: 1, is_primary: 1 }
      ]
    },
    {
      id: 'prod-paithani-peacock',
      name: 'Paithani Handwoven Peacock Motif Silk Saree',
      slug: 'paithani-handwoven-peacock-motif-silk-saree',
      category_id: 'cat-sarees',
      description: 'The royal queen of Maharashtrian weaves. Woven painstakingly over six months with a vibrant silk body and an iconic kaleidoscope Peacock (mor) and parrot (tota) pallu on pure gold zari.',
      fabric: 'Pure Mulberry Silk with Tapestry Peacock Pallu',
      care_instructions: 'Dry clean only. Air dry once every six months in indirect sunlight.',
      status: 'PUBLISHED',
      is_featured: 1,
      homepage_placement: 'FEATURED',
      campaign_label: 'Handpicked',
      seo_title: 'Royal Paithani Peacock Motif Silk Saree | India Fashions',
      seo_description: 'Authentic Yeola Paithani handwoven silk saree with intricate peacock and lotus tapestry pallu.',
      canonical_url: 'https://indiafashions.com/product/paithani-handwoven-peacock-motif-silk-saree',
      variants: [
        { id: 'var-pt-01', sku: 'PT-PRP-01', size: 'Free Size (6.3m with blouse)', color: 'Royal Purple & Orange Mor', color_code: '#4A154B', cost_price: 15000, selling_price: 24999, sale_price: 21999, quantity: 1, low_stock_threshold: 2 } // LOW STOCK!
      ],
      media: [
        { id: 'med-pt-01', file_path: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80', alt_text: 'Royal Paithani purple saree with peacock gold pallu', sort_order: 1, is_primary: 1 }
      ]
    },
    {
      id: 'prod-patola-double-ikat',
      name: 'Royal Patan Patola Double Ikat Heritage Saree',
      slug: 'royal-patan-patola-double-ikat-heritage-saree',
      category_id: 'cat-sarees',
      description: 'An exquisite collector heirloom woven in Patan, Gujarat. Crafted with the rare double ikat resist-dye technique where both warp and weft threads are pre-dyed to create sharp geometric florals with no reverse side.',
      fabric: 'Patan Pure Mulberry Silk Double Ikat',
      care_instructions: 'Dry clean only. Store flat in cedar chest.',
      status: 'PUBLISHED',
      is_featured: 0,
      homepage_placement: 'NONE',
      campaign_label: 'Heritage weave',
      seo_title: 'Royal Patan Patola Double Ikat Saree | India Fashions',
      seo_description: 'Heirloom Patan Patola double ikat silk saree. Available for advance artisan reservation.',
      canonical_url: 'https://indiafashions.com/product/royal-patan-patola-double-ikat-heritage-saree',
      variants: [
        { id: 'var-pat-01', sku: 'PAT-MAR-01', size: 'Free Size (6.3m with blouse)', color: 'Heritage Crimson & Mustard', color_code: '#800020', cost_price: 22000, selling_price: 34999, sale_price: null, quantity: 0, low_stock_threshold: 2 }, // OUT OF STOCK!
        { id: 'var-pat-02', sku: 'PAT-GRN-02', size: 'Free Size (6.3m with blouse)', color: 'Forest Green & Ruby Red', color_code: '#1B4332', cost_price: 22500, selling_price: 35999, sale_price: null, quantity: 0, low_stock_threshold: 2 }  // OUT OF STOCK!
      ],
      media: [
        { id: 'med-pat-01', file_path: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80', alt_text: 'Patan Patola geometric double ikat silk saree', sort_order: 1, is_primary: 1 }
      ]
    },
    {
      id: 'prod-tussar-kantha',
      name: 'Tussar Silk Handcrafted Kantha Stitch Saree',
      slug: 'tussar-silk-handcrafted-kantha-stitch-saree',
      category_id: 'cat-sarees',
      description: 'Rich textured wild Tussar silk brought to life with intricate needlework hand-stitched by Bengal rural craftswomen over weeks of detailed artistry depicting nature and folklore.',
      fabric: 'Pure Wild Tussar Silk with Resham Kantha',
      care_instructions: 'Dry clean only to maintain delicate embroidery threads.',
      status: 'PUBLISHED',
      is_featured: 1,
      homepage_placement: 'FEATURED',
      campaign_label: 'Drape the moment',
      seo_title: 'Tussar Silk Kantha Stitch Saree | India Fashions',
      seo_description: 'Authentic wild Tussar silk saree featuring intricate Bengal Kantha hand embroidery.',
      canonical_url: 'https://indiafashions.com/product/tussar-silk-handcrafted-kantha-stitch-saree',
      variants: [
        { id: 'var-tk-01', sku: 'TK-BGE-01', size: 'Free Size (6.3m with blouse)', color: 'Natural Golden Beige', color_code: '#D4B996', cost_price: 6000, selling_price: 9200, sale_price: null, quantity: 4, low_stock_threshold: 2 },
        { id: 'var-tk-02', sku: 'TK-RST-02', size: 'Free Size (6.3m with blouse)', color: 'Warm Terracotta Rust', color_code: '#C1440E', cost_price: 6200, selling_price: 9500, sale_price: 8499, quantity: 3, low_stock_threshold: 2 }
      ],
      media: [
        { id: 'med-tk-01', file_path: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80', alt_text: 'Tussar silk natural beige saree with Kantha embroidery', sort_order: 1, is_primary: 1 }
      ]
    },
    {
      id: 'prod-organza-scallop',
      name: 'Organza Floral Embroidered Saree with Scalloped Border',
      slug: 'organza-floral-embroidered-saree-with-scalloped-border',
      category_id: 'cat-sarees',
      description: 'Whisper-light pure silk organza drape adorned with pastel French knot floral embroidery and hand-cut scalloped borders highlighted with subtle sequin glimmer.',
      fabric: 'Pure Silk Organza with Resham Embroidery',
      care_instructions: 'Dry clean only. Store on padded hanger in garment bag.',
      status: 'PUBLISHED',
      is_featured: 0,
      homepage_placement: 'NEW_ARRIVAL',
      campaign_label: 'Festive edit',
      seo_title: 'Organza Floral Embroidered Saree | India Fashions',
      seo_description: 'Dreamy pastel organza silk saree with delicate floral embroidery and cut-work scalloped borders.',
      canonical_url: 'https://indiafashions.com/product/organza-floral-embroidered-saree-with-scalloped-border',
      variants: [
        { id: 'var-org-01', sku: 'ORG-BLU-01', size: 'Free Size (6.3m with blouse)', color: 'Sky Powder Blue', color_code: '#A0C4E2', cost_price: 5500, selling_price: 8400, sale_price: 7499, quantity: 6, low_stock_threshold: 2 },
        { id: 'var-org-02', sku: 'ORG-MNT-02', size: 'Free Size (6.3m with blouse)', color: 'Mint Sage Green', color_code: '#A3B18A', cost_price: 5500, selling_price: 8400, sale_price: null, quantity: 4, low_stock_threshold: 2 }
      ],
      media: [
        { id: 'med-org-01', file_path: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80', alt_text: 'Sky blue pastel organza saree with scalloped border', sort_order: 1, is_primary: 1 }
      ]
    },
    {
      id: 'prod-maheshwari-silk',
      name: 'Maheshwari Handloom Silk Cotton Saree',
      slug: 'maheshwari-handloom-silk-cotton-saree',
      category_id: 'cat-sarees',
      description: 'Handwoven in the historic town of Maheshwar along the sacred Narmada river. Features a lightweight silk-cotton body with the signature Narmada lehariya wave border in antique zari.',
      fabric: 'Pure Handloom Silk Cotton Blend',
      care_instructions: 'Dry clean or very gentle cold hand wash with mild silk detergent.',
      status: 'PUBLISHED',
      is_featured: 1,
      homepage_placement: 'FEATURED',
      campaign_label: 'Handpicked',
      seo_title: 'Maheshwari Handloom Silk Cotton Saree | India Fashions',
      seo_description: 'Lightweight Maheshwari silk cotton saree with traditional Narmada wave zari border.',
      canonical_url: 'https://indiafashions.com/product/maheshwari-handloom-silk-cotton-saree',
      variants: [
        { id: 'var-mah-01', sku: 'MAH-YEL-01', size: 'Free Size (6.3m with blouse)', color: 'Mustard Gold & Maroon', color_code: '#E0A96D', cost_price: 3000, selling_price: 4800, sale_price: 3999, quantity: 7, low_stock_threshold: 2 },
        { id: 'var-mah-02', sku: 'MAH-PNK-02', size: 'Free Size (6.3m with blouse)', color: 'Rani Fuchsia Pink', color_code: '#C2185B', cost_price: 3000, selling_price: 4800, sale_price: null, quantity: 5, low_stock_threshold: 2 }
      ],
      media: [
        { id: 'med-mah-01', file_path: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80', alt_text: 'Maheshwari mustard gold silk cotton saree with zari border', sort_order: 1, is_primary: 1 }
      ]
    }
  ];

  const now = new Date().toISOString();

  for (const p of productsData) {
    run(`INSERT OR REPLACE INTO products (
      id, name, slug, category_id, description, fabric, care_instructions, 
      status, is_featured, homepage_placement, campaign_label, 
      seo_title, seo_description, canonical_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      p.id, p.name, p.slug, p.category_id, p.description, p.fabric, p.care_instructions,
      p.status, p.is_featured, p.homepage_placement, p.campaign_label,
      p.seo_title, p.seo_description, p.canonical_url, now, now
    ]);

    for (const v of p.variants) {
      run(`INSERT OR REPLACE INTO product_variants (
        id, product_id, sku, size, color, color_code, 
        cost_price, selling_price, sale_price, quantity, low_stock_threshold
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        v.id, p.id, v.sku, v.size, v.color, v.color_code,
        v.cost_price, v.selling_price, v.sale_price, v.quantity, v.low_stock_threshold
      ]);

      // Seed initial movement
      run(`INSERT OR REPLACE INTO inventory_movements (
        id, variant_id, sku, product_name, change_type, quantity_changed, quantity_after, reference_note, actor_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        'mov-' + v.id, v.id, v.sku, p.name, 'PURCHASE_RECEIPT', v.quantity, v.quantity, 'Initial stock intake from master weavers', 'Vikram Singh (Dock Controller)', now
      ]);
    }

    for (const m of p.media) {
      run(`INSERT OR REPLACE INTO product_media (
        id, product_id, file_path, alt_text, sort_order, is_primary, crop_desktop, crop_mobile
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
        m.id, p.id, m.file_path, m.alt_text, m.sort_order, m.is_primary, '4:5', '1:1'
      ]);
    }
  }

  // 5. Ticker Messages (scheduled right-to-left scrolling)
  const tomorrow = new Date(Date.now() + 30 * 86400000).toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();

  const tickers = [
    { id: 'tick-1', content: '✨ Festive Offers: Drape the moment with authentic Kanjivaram & Banarasi Handlooms', link_url: '/category/sarees', sort_order: 1 },
    { id: 'tick-2', content: '🎉 Today Offers: Buy 2 Sarees & Get 1 Festive Silk Bundle (T&C Apply)', link_url: '/category/sarees', sort_order: 2 },
    { id: 'tick-3', content: '🚚 Express Local Delivery: Guaranteed delivery within 12 km from our Bangalore boutique', link_url: '#', sort_order: 3 },
    { id: 'tick-4', content: '💳 Secure Payments: UPI, Credit Cards, NetBanking & Cash on Delivery accepted', link_url: '#', sort_order: 4 },
    { id: 'tick-5', content: '🌟 Handpicked Festive Edit: New seasonal weaves added to our bridal showcase', link_url: '/category/sarees', sort_order: 5 }
  ];

  for (const t of tickers) {
    run(`INSERT OR REPLACE INTO ticker_messages (id, content, link_url, publish_at, expire_at, is_active, sort_order)
         VALUES (?, ?, ?, ?, ?, 1, ?)`, [t.id, t.content, t.link_url, yesterday, tomorrow, t.sort_order]);
  }

  // 6. Campaign
  run(`INSERT OR REPLACE INTO sale_campaigns (
    id, name, label, description, discount_percentage, start_at, end_at, is_active, show_countdown, apply_to
  ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 'ALL')`, [
    'camp-festive-2026',
    'Royal Heritage Festive Edit 2026',
    'Festive edit',
    'Celebrate auspicious moments in heirloom Indian weaves with curated discounts and 2+1 festive bundles.',
    15,
    yesterday,
    tomorrow
  ]);

  // 7. Seed Orders (including IMPS verification required order!)
  const sampleOrders = [
    {
      id: 'ord-1001',
      order_number: 'IF-2026-1001',
      customer_name: 'Priyanka Sen',
      customer_phone: '+91 98451 22334',
      customer_email: 'priyanka.sen@gmail.com',
      delivery_address: 'Flat 402, Prestige Palms, Indiranagar, Bangalore',
      pincode: '560038',
      distance_km: 4.8,
      subtotal: 16999,
      discount_amount: 1000,
      delivery_charge: 0,
      tax_amount: 800,
      total_amount: 16799,
      status: 'CONFIRMED',
      payment_method: 'UPI',
      payment_status: 'PAID',
      payment_reference: 'UPI-REF-98437291',
      customer_notes: 'Please pack in festive gift box with ribbon',
      items: [
        { id: 'oi-1', product_id: 'prod-kanjeevaram-emerald', variant_id: 'var-kj-01', product_name: 'Kanjeevaram Pure Mulberry Silk Saree', sku: 'KJ-EMR-01', size: 'Free Size (6.3m with blouse)', color: 'Emerald Green & Ruby Gold', unit_price: 16999, quantity: 1, total_price: 16999 }
      ]
    },
    {
      id: 'ord-1002',
      order_number: 'IF-2026-1002',
      customer_name: 'Meenakshi Iyer',
      customer_phone: '+91 97401 55667',
      customer_email: 'meenakshi.iyer@outlook.com',
      delivery_address: 'Villa 12, Sobha Morzaria, Bannerghatta Road, Bangalore',
      pincode: '560076',
      distance_km: 8.2,
      subtotal: 11999,
      discount_amount: 0,
      delivery_charge: 0,
      tax_amount: 600,
      total_amount: 12599,
      status: 'PLACED',
      payment_method: 'IMPS_NEFT',
      payment_status: 'VERIFICATION_REQUIRED',
      payment_reference: 'UTR-HDFC-9988221100',
      customer_notes: 'Paid via IMPS from HDFC bank account',
      items: [
        { id: 'oi-2', product_id: 'prod-banarasi-georgette', variant_id: 'var-bg-01', product_name: 'Banarasi Handloom Georgette Brocade Saree', sku: 'BG-NVY-01', size: 'Free Size (6.3m with blouse)', color: 'Midnight Navy Blue', unit_price: 11999, quantity: 1, total_price: 11999 }
      ]
    },
    {
      id: 'ord-1003',
      order_number: 'IF-2026-1003',
      customer_name: 'Kavita Reddy',
      customer_phone: '+91 99002 88990',
      customer_email: 'kavita.reddy@yahoo.com',
      delivery_address: '15, 4th Main, Malleshwaram, Bangalore',
      pincode: '560003',
      distance_km: 6.1,
      subtotal: 7800,
      discount_amount: 500,
      delivery_charge: 0,
      tax_amount: 365,
      total_amount: 7665,
      status: 'SHIPPED',
      payment_method: 'CARD',
      payment_status: 'PAID',
      payment_reference: 'TXN-CARD-4482',
      customer_notes: 'Call before delivery',
      items: [
        { id: 'oi-3', product_id: 'prod-chanderi-tissue', variant_id: 'var-ct-01', product_name: 'Chanderi Tissue Zari Festive Saree', sku: 'CT-GLD-01', size: 'Free Size (6.3m with blouse)', color: 'Luminous Antique Gold', unit_price: 7800, quantity: 1, total_price: 7800 }
      ]
    }
  ];

  for (const o of sampleOrders) {
    run(`INSERT OR REPLACE INTO orders (
      id, order_number, customer_name, customer_phone, customer_email, delivery_address, 
      pincode, distance_km, subtotal, discount_amount, delivery_charge, tax_amount, 
      total_amount, status, payment_method, payment_status, payment_reference, customer_notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      o.id, o.order_number, o.customer_name, o.customer_phone, o.customer_email, o.delivery_address,
      o.pincode, o.distance_km, o.subtotal, o.discount_amount, o.delivery_charge, o.tax_amount,
      o.total_amount, o.status, o.payment_method, o.payment_status, o.payment_reference, o.customer_notes, now, now
    ]);

    for (const item of o.items) {
      run(`INSERT OR REPLACE INTO order_items (
        id, order_id, product_id, variant_id, product_name, sku, size, color, unit_price, quantity, total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        item.id, o.id, item.product_id, item.variant_id, item.product_name, item.sku, item.size, item.color, item.unit_price, item.quantity, item.total_price
      ]);
    }
  }

  // 8. Seed Advance Order for Out-of-Stock Saree
  run(`INSERT OR REPLACE INTO advance_orders (
    id, product_id, product_name, variant_id, variant_details, customer_name, customer_phone, customer_email, notes, status, notification_sent, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, ?)`, [
    'adv-001',
    'prod-patola-double-ikat',
    'Royal Patan Patola Double Ikat Heritage Saree',
    'var-pat-01',
    'Heritage Crimson & Mustard (PAT-MAR-01)',
    'Sunita Singhania',
    '+91 98860 77112',
    'sunita.singhania@heritage.org',
    'Client wants this weave for a family wedding in November. Please prioritize weaving batch allocation.',
    now
  ]);

  // 9. Initial Audit Log
  run(`INSERT OR REPLACE INTO audit_logs (
    id, actor_id, actor_name, actor_role, entity, entity_id, action, previous_value, new_value, timestamp
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    'aud-init',
    'u-owner',
    'Rajesh Mehra (Shop Owner)',
    'SUPER_ADMIN',
    'STORE_CATALOG',
    'all',
    'INITIALIZE_CATALOG',
    null,
    'Catalog initialized with 8 royal saree collections and staff accounts',
    now
  ]);

  saveDb();
  console.log('Database seeded successfully!');
}

// Run immediately if called directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seed().catch(err => {
    console.error('Failed to seed:', err);
    process.exit(1);
  });
}
