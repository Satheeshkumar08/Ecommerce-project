import { PrismaClient, Role, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // Clean existing tables (in correct order of dependencies)
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data.');

  // 1. Create Users
  const adminPassword = await bcrypt.hash('Admin@123456', 10);
  const customerPassword = await bcrypt.hash('Customer@123456', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'System Administrator',
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      password: customerPassword,
      name: 'John Doe',
      role: Role.CUSTOMER,
      addresses: {
        create: [
          {
            fullName: 'John Doe',
            addressLine1: '742 Evergreen Terrace',
            addressLine2: 'Apt 4B',
            city: 'Springfield',
            state: 'Oregon',
            postalCode: '97477',
            country: 'United States',
            phone: '+1 (555) 019-2834',
            isDefault: true,
          },
        ],
      },
    },
  });

  console.log('Seeded Users:');
  console.log(`- Admin: ${admin.email} (password: Admin@123456)`);
  console.log(`- Customer: ${customer.email} (password: Customer@123456)`);

  // 2. Create 5+ Categories
  const categoriesData = [
    {
      name: 'Electronics & Gadgets',
      slug: 'electronics',
      description: 'Cutting-edge consumer tech, audio, and smart devices.',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Fashion & Apparel',
      slug: 'fashion',
      description: 'Modern, comfortable clothing and everyday essentials.',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Designer furniture, premium lighting, and kitchenware.',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Beauty & Wellness',
      slug: 'beauty-wellness',
      description: 'Organic skincare, self-care routines, and fragrances.',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Sports & Outdoors',
      slug: 'sports-outdoors',
      description: 'Durable gear, activewear, and fitness equipment.',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Books & Stationery',
      slug: 'books-stationery',
      description: 'Best-selling books, handcrafted notebooks, and pens.',
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    categories[cat.slug] = await prisma.category.create({ data: cat });
  }

  console.log(`Seeded ${Object.keys(categories).length} categories.`);

  // 3. Create 32 detailed sample products
  const productsData = [
    // Electronics
    {
      name: 'AcousticPulse Pro Wireless Headphones',
      slug: 'acousticpulse-pro-wireless-headphones',
      description: 'Industry-leading hybrid active noise cancellation with 40-hour battery life and spatial audio support. Lightweight aerospace-grade aluminum build.',
      price: 299.99,
      compareAtPrice: 349.99,
      stock: 45,
      sku: 'ELEC-AP-001',
      isFeatured: true,
      categorySlug: 'electronics',
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'UltraVision 4K OLED Smart Monitor 32"',
      slug: 'ultravision-4k-oled-smart-monitor',
      description: 'Crisp 4K UHD OLED panel with 144Hz refresh rate, 99% DCI-P3 color accuracy, HDR10+, and integrated Thunderbolt 4 dock.',
      price: 799.00,
      compareAtPrice: 899.00,
      stock: 18,
      sku: 'ELEC-UV-002',
      isFeatured: true,
      categorySlug: 'electronics',
      images: [
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Veloce Mechanical Wireless Keyboard',
      slug: 'veloce-mechanical-wireless-keyboard',
      description: 'Custom hot-swappable tactile switches, gasket mounted, RGB per-key backlighting, and CNC anodized aluminum chassis.',
      price: 149.50,
      compareAtPrice: 179.99,
      stock: 55,
      sku: 'ELEC-KB-003',
      isFeatured: false,
      categorySlug: 'electronics',
      images: [
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'ErgoGlide Precision Wireless Mouse',
      slug: 'ergoglide-precision-wireless-mouse',
      description: 'Ergonomic sculptured design with dual connection (Bluetooth + 2.4Ghz), hyper-fast magspeed scroll wheel, and 8K DPI sensor.',
      price: 89.99,
      compareAtPrice: 99.99,
      stock: 60,
      sku: 'ELEC-MS-004',
      isFeatured: false,
      categorySlug: 'electronics',
      images: [
        'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'SoundSphere 360 Portable Speaker',
      slug: 'soundsphere-360-portable-speaker',
      description: 'IPX7 waterproof Bluetooth speaker delivering room-filling 360-degree immersive sound with up to 24 hours of playtime.',
      price: 119.00,
      compareAtPrice: 139.00,
      stock: 35,
      sku: 'ELEC-SP-005',
      isFeatured: true,
      categorySlug: 'electronics',
      images: [
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'NovaFit GPS Smartwatch Gen 4',
      slug: 'novafit-gps-smartwatch-gen-4',
      description: 'Advanced AMOLED health tracker with heart rate monitor, SpO2, sleep scoring, dual-frequency GPS, and 10-day battery life.',
      price: 249.99,
      compareAtPrice: 299.99,
      stock: 22,
      sku: 'ELEC-SW-006',
      isFeatured: false,
      categorySlug: 'electronics',
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // Fashion
    {
      name: 'Cashmere-Wool Blend Minimalist Overcoat',
      slug: 'cashmere-wool-blend-minimalist-overcoat',
      description: 'Tailored luxury coat cut from an Italian virgin wool and cashmere blend. Fully lined with horn buttons and notched lapels.',
      price: 389.00,
      compareAtPrice: 450.00,
      stock: 15,
      sku: 'FASH-COAT-001',
      isFeatured: true,
      categorySlug: 'fashion',
      images: [
        'https://images.unsplash.com/photo-1539533018447-63fcce667823?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Heavyweight Organic Cotton Hoodie',
      slug: 'heavyweight-organic-cotton-hoodie',
      description: 'Pre-shrunk 450 GSM French terry cotton with ribbed side gussets, double-needle stitched seams, and a relaxed modern fit.',
      price: 85.00,
      compareAtPrice: 110.00,
      stock: 75,
      sku: 'FASH-HD-002',
      isFeatured: false,
      categorySlug: 'fashion',
      images: [
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Heritage Selvedge Denim Jeans (Slim Fit)',
      slug: 'heritage-selvedge-denim-jeans',
      description: 'Crafted on vintage shuttle looms from 14oz Japanese raw indigo denim. Copper hardware and chain-stitched hem.',
      price: 165.00,
      compareAtPrice: 195.00,
      stock: 30,
      sku: 'FASH-JEAN-003',
      isFeatured: false,
      categorySlug: 'fashion',
      images: [
        'https://images.unsplash.com/photo-1542272604-780c96856465?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Italian Leather Weekender Duffle Bag',
      slug: 'italian-leather-weekender-duffle-bag',
      description: 'Vegetable-tanned full-grain leather luggage with antique brass zippers, padded shoulder strap, and internal shoe compartment.',
      price: 320.00,
      compareAtPrice: 380.00,
      stock: 12,
      sku: 'FASH-BAG-004',
      isFeatured: true,
      categorySlug: 'fashion',
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Merino Wool Ribbed Beanie',
      slug: 'merino-wool-ribbed-beanie',
      description: 'Ultra-soft 100% extra-fine Merino wool. Naturally breathable, odor-resistant, and climate regulating for all-season comfort.',
      price: 38.00,
      compareAtPrice: 48.00,
      stock: 90,
      sku: 'FASH-BN-005',
      isFeatured: false,
      categorySlug: 'fashion',
      images: [
        'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Handcrafted Oxford Dress Shoes',
      slug: 'handcrafted-oxford-dress-shoes',
      description: 'Goodyear welted calfskin leather oxfords. Breathable leather lining and durable stacked leather heel for timeless sophistication.',
      price: 260.00,
      compareAtPrice: 310.00,
      stock: 20,
      sku: 'FASH-SH-006',
      isFeatured: false,
      categorySlug: 'fashion',
      images: [
        'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // Home & Living
    {
      name: 'Nordic Oak Lounge Armchair',
      slug: 'nordic-oak-lounge-armchair',
      description: 'Solid white oak frame inspired by mid-century Scandinavian aesthetics. Upholstered in high-density bouclé fabric.',
      price: 549.00,
      compareAtPrice: 650.00,
      stock: 8,
      sku: 'HOME-CHR-001',
      isFeatured: true,
      categorySlug: 'home-living',
      images: [
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Artisan Ceramic Pour-Over Coffee Set',
      slug: 'artisan-ceramic-pour-over-coffee-set',
      description: 'Handmade stoneware dripper and serving carafe with matte glaze finish. Designed for optimal thermal extraction.',
      price: 68.00,
      compareAtPrice: 85.00,
      stock: 40,
      sku: 'HOME-COF-002',
      isFeatured: false,
      categorySlug: 'home-living',
      images: [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Sculptural Brass Ambient Table Lamp',
      slug: 'sculptural-brass-ambient-table-lamp',
      description: 'Solid spun brass base with mouth-blown frosted glass sphere. Step-less touch dimming with warm 2700K LED illumination.',
      price: 185.00,
      compareAtPrice: 220.00,
      stock: 25,
      sku: 'HOME-LMP-003',
      isFeatured: true,
      categorySlug: 'home-living',
      images: [
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Pure French Linen Bedding Set (Queen)',
      slug: 'pure-french-linen-bedding-set-queen',
      description: '100% natural flax linen from Normandy. Pre-washed for lived-in softness that improves with every wash.',
      price: 240.00,
      compareAtPrice: 280.00,
      stock: 19,
      sku: 'HOME-LIN-004',
      isFeatured: false,
      categorySlug: 'home-living',
      images: [
        'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Cast Iron Enameled Dutch Oven 6-Qt',
      slug: 'cast-iron-enameled-dutch-oven-6qt',
      description: 'Heavyweight enameled cast iron delivering superior heat retention and uniform distribution for braises, stews, and bread.',
      price: 135.00,
      compareAtPrice: 160.00,
      stock: 28,
      sku: 'HOME-POT-005',
      isFeatured: false,
      categorySlug: 'home-living',
      images: [
        'https://images.unsplash.com/photo-1584990347449-397e59d991b5?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // Beauty & Wellness
    {
      name: 'Botanical Radiance Face Oil 50ml',
      slug: 'botanical-radiance-face-oil-50ml',
      description: 'Cold-pressed rosehip seed, jojoba, and squalane enriched with vitamins C and E to restore radiant, dewy complexion.',
      price: 54.00,
      compareAtPrice: 65.00,
      stock: 65,
      sku: 'BEAU-OIL-001',
      isFeatured: true,
      categorySlug: 'beauty-wellness',
      images: [
        'https://images.unsplash.com/photo-1608248597359-009c9103c2fa?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Hydrating Hyaluronic Acid Serum',
      slug: 'hydrating-hyaluronic-acid-serum',
      description: 'Multi-molecular weight hyaluronic complex penetrating deep epidermal layers for intense hydration and plumping.',
      price: 42.00,
      compareAtPrice: 50.00,
      stock: 80,
      sku: 'BEAU-SRM-002',
      isFeatured: false,
      categorySlug: 'beauty-wellness',
      images: [
        'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Aromatherapy Ultrasonic Stone Diffuser',
      slug: 'aromatherapy-ultrasonic-stone-diffuser',
      description: 'Hand-crafted ceramic stone cover with whisper-quiet ultrasonic technology. Includes LED ambient light and auto shut-off.',
      price: 88.00,
      compareAtPrice: 105.00,
      stock: 32,
      sku: 'BEAU-DIF-003',
      isFeatured: false,
      categorySlug: 'beauty-wellness',
      images: [
        'https://images.unsplash.com/photo-1602928321679-560bb453f190?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Sandalwood & Bergamot Eau de Parfum 100ml',
      slug: 'sandalwood-bergamot-eau-de-parfum',
      description: 'Rich woody fragrance with sparkling Italian bergamot top notes, cedarwood heart, and deep amber undertones.',
      price: 110.00,
      compareAtPrice: 130.00,
      stock: 40,
      sku: 'BEAU-PRF-004',
      isFeatured: true,
      categorySlug: 'beauty-wellness',
      images: [
        'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Natural Jade Facial Roller & Gua Sha Kit',
      slug: 'natural-jade-facial-roller-gua-sha-kit',
      description: '100% authentic Xiuyan jade roller designed to relieve facial tension, reduce morning puffiness, and enhance serum absorption.',
      price: 32.00,
      compareAtPrice: 45.00,
      stock: 110,
      sku: 'BEAU-JAD-005',
      isFeatured: false,
      categorySlug: 'beauty-wellness',
      images: [
        'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // Sports & Outdoors
    {
      name: 'AeroGrid Carbon Road Bike 54cm',
      slug: 'aerogrid-carbon-road-bike-54cm',
      description: 'Ultra-light Toray T800 carbon fiber monocoque frame equipped with Shimano 105 Di2 12-speed electronic groupset.',
      price: 2450.00,
      compareAtPrice: 2800.00,
      stock: 5,
      sku: 'SPRT-BIK-001',
      isFeatured: true,
      categorySlug: 'sports-outdoors',
      images: [
        'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'High-Density Non-Slip Yoga Mat 6mm',
      slug: 'high-density-non-slip-yoga-mat-6mm',
      description: 'Eco-friendly natural tree rubber with anti-microbial polyurethane surface. Laser-etched alignment system for precise poses.',
      price: 78.00,
      compareAtPrice: 95.00,
      stock: 50,
      sku: 'SPRT-YOG-002',
      isFeatured: false,
      categorySlug: 'sports-outdoors',
      images: [
        'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Summit Pro 45L Waterproof Backpack',
      slug: 'summit-pro-45l-waterproof-backpack',
      description: 'Rugged Cordura nylon shell, ergonomic ventilated lumbar support, hydration bladder compatible, and integrated rainfly.',
      price: 175.00,
      compareAtPrice: 210.00,
      stock: 25,
      sku: 'SPRT-BPK-003',
      isFeatured: false,
      categorySlug: 'sports-outdoors',
      images: [
        'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Adjustable Quick-Select Dumbbell Pair 50LB',
      slug: 'adjustable-quick-select-dumbbell-pair',
      description: 'Rapid turn-dial selector system replacing 15 sets of weights (5 to 50 lbs per dumbbell). Textured knurled steel grip.',
      price: 349.99,
      compareAtPrice: 399.99,
      stock: 14,
      sku: 'SPRT-DMB-004',
      isFeatured: true,
      categorySlug: 'sports-outdoors',
      images: [
        'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Thermal Insulated Stainless Steel Bottle 32oz',
      slug: 'thermal-insulated-stainless-steel-bottle',
      description: 'Double-wall vacuum insulation keeping drinks icy cold for 24 hours or steaming hot for 12 hours. Leak-proof straw lid.',
      price: 36.00,
      compareAtPrice: 44.00,
      stock: 120,
      sku: 'SPRT-BTL-005',
      isFeatured: false,
      categorySlug: 'sports-outdoors',
      images: [
        'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // Books & Stationery
    {
      name: 'Full-Grain Leather Bound Daily Journal',
      slug: 'full-grain-leather-bound-daily-journal',
      description: 'Hand-stitched Tuscan leather binding with 240 pages of 120 GSM fountain pen friendly acid-free ivory paper.',
      price: 48.00,
      compareAtPrice: 60.00,
      stock: 45,
      sku: 'BOOK-JRN-001',
      isFeatured: false,
      categorySlug: 'books-stationery',
      images: [
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Precision Brass Rollerball Pen',
      slug: 'precision-brass-rollerball-pen',
      description: 'Weight-balanced machined solid raw brass developing a rich natural patina over time. Takes standard Schmidt refills.',
      price: 52.00,
      compareAtPrice: 65.00,
      stock: 70,
      sku: 'BOOK-PEN-002',
      isFeatured: false,
      categorySlug: 'books-stationery',
      images: [
        'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Designing Data-Intensive Applications (Hardcover)',
      slug: 'designing-data-intensive-applications-hardcover',
      description: 'The definitive guide to the architecture, principles, and practicalities of building robust, scalable software systems.',
      price: 49.99,
      compareAtPrice: 59.99,
      stock: 60,
      sku: 'BOOK-DDIA-003',
      isFeatured: true,
      categorySlug: 'books-stationery',
      images: [
        'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Clean Code: A Handbook of Agile Craftsmanship',
      slug: 'clean-code-handbook-agile-craftsmanship',
      description: 'Robert C. Martin introduces best practices, code smells, and refactoring techniques to write readable, maintainable software.',
      price: 44.50,
      compareAtPrice: 52.00,
      stock: 50,
      sku: 'BOOK-CC-004',
      isFeatured: false,
      categorySlug: 'books-stationery',
      images: [
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      name: 'Minimalist Walnut Wood Desk Organizer Tray',
      slug: 'minimalist-walnut-wood-desk-organizer-tray',
      description: 'Carved from a single piece of American black walnut. Features slots for pens, mobile devices, and everyday essentials.',
      price: 64.00,
      compareAtPrice: 78.00,
      stock: 30,
      sku: 'BOOK-DSK-005',
      isFeatured: true,
      categorySlug: 'books-stationery',
      images: [
        'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=800&q=80',
      ],
    },
  ];

  console.log(`Creating ${productsData.length} products with images and sample reviews...`);

  for (const item of productsData) {
    const category = categories[item.categorySlug];
    if (!category) continue;

    const product = await prisma.product.create({
      data: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        price: item.price,
        compareAtPrice: item.compareAtPrice,
        stock: item.stock,
        sku: item.sku,
        isFeatured: item.isFeatured,
        categoryId: category.id,
        images: {
          create: item.images.map((url, idx) => ({
            url,
            isPrimary: idx === 0,
            alt: `${item.name} image ${idx + 1}`,
          })),
        },
      },
    });

    // Add sample review for featured products
    if (item.isFeatured) {
      await prisma.review.create({
        data: {
          productId: product.id,
          userId: customer.id,
          rating: 5,
          title: 'Absolutely fantastic quality!',
          comment: 'Exceeded my expectations in build quality, performance, and attention to detail. Fast delivery as well.',
        },
      });
    }
  }

  // 4. Create a sample completed order for customer
  const firstProduct = await prisma.product.findFirst({ where: { isFeatured: true } });
  const customerAddress = await prisma.address.findFirst({ where: { userId: customer.id } });

  if (firstProduct && customerAddress) {
    await prisma.order.create({
      data: {
        orderNumber: 'ORD-2026-00109',
        userId: customer.id,
        addressId: customerAddress.id,
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.COMPLETED,
        paymentMethod: PaymentMethod.STRIPE,
        stripePaymentIntentId: 'pi_test_3N82J45L99xX8910',
        subtotal: firstProduct.price,
        tax: 25.00,
        shippingCost: 0.00,
        total: Number(firstProduct.price) + 25.00,
        items: {
          create: [
            {
              productId: firstProduct.id,
              productName: firstProduct.name,
              productPrice: firstProduct.price,
              productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
              quantity: 1,
              total: firstProduct.price,
            },
          ],
        },
      },
    });
    console.log('Seeded sample customer order.');
  }

  console.log('--- Database Seeding Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
