require("dotenv").config();

const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

const PORT = Number(process.env.PORT || 3000);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const MONGODB_DB = process.env.MONGODB_DB || "toyimbor";
const TODAY = process.env.APP_TODAY || "2026-04-04";
const CLOUDINARY_ENABLED = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);
const DEFAULT_MONTH = TODAY.slice(0, 7);
const SITE_DIR = path.join(__dirname, "public");

if (CLOUDINARY_ENABLED) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(SITE_DIR));

let mongoClient = null;
let mongoDb = null;
let databaseMode = "memory";
let memoryStore = createSeedState();
const otpStore = new Map();

function createSeedState() {
  return {
    users: [
      {
        _id: "usr-demo-customer",
        role: "customer",
        fullName: "Aziza Karimova",
        phone: "+998901234567",
        email: "aziza@example.com",
        city: "Toshkent",
        weddingDate: "2026-09-12",
        budget: 120000000,
        guestCount: 250,
        style: "zamonaviy",
        favoriteServiceIds: [
          "svc-venue-silk-garden",
          "svc-decor-silk-road",
          "svc-planner-lola",
        ],
        createdAt: "2026-03-12T08:00:00.000Z",
        updatedAt: "2026-04-04T08:00:00.000Z",
      },
      {
        _id: "usr-vendor-silk",
        role: "vendor",
        fullName: "Silk Garden Admin",
        phone: "+998971112233",
        email: "admin@silkgarden.uz",
        city: "Toshkent",
        venueName: "Silk Garden Hall",
        favoriteServiceIds: [],
        createdAt: "2026-02-12T08:00:00.000Z",
        updatedAt: "2026-04-04T08:00:00.000Z",
      },
      {
        _id: "usr-customer-sevara",
        role: "customer",
        fullName: "Sevara Karimova",
        phone: "+998933334455",
        email: "sevara@example.com",
        city: "Toshkent",
        weddingDate: "2026-05-18",
        budget: 85000000,
        guestCount: 180,
        style: "milliy",
        favoriteServiceIds: ["svc-venue-royal-legacy"],
        createdAt: "2026-02-18T09:10:00.000Z",
        updatedAt: "2026-04-04T08:00:00.000Z",
      },
      {
        _id: "usr-customer-jamshid",
        role: "customer",
        fullName: "Jamshid Qodirov",
        phone: "+998998887766",
        email: "jamshid@example.com",
        city: "Toshkent",
        weddingDate: "2026-10-09",
        budget: 140000000,
        guestCount: 320,
        style: "luxe",
        favoriteServiceIds: [],
        createdAt: "2026-03-02T12:00:00.000Z",
        updatedAt: "2026-04-04T08:00:00.000Z",
      },
    ],
    services: [
      {
        _id: "svc-venue-silk-garden",
        vendorId: "usr-vendor-silk",
        type: "venue",
        category: "To'yxona",
        slug: "silk-garden-hall",
        name: "Silk Garden Hall",
        city: "Toshkent",
        district: "Yunusobod",
        address: "Bog'ishamol ko'chasi, 12-uy",
        badge: "Premium",
        verified: true,
        featured: true,
        rating: 4.9,
        reviews: 127,
        capacity: 450,
        pricePerGuest: 320000,
        basePrice: 0,
        shortDescription:
          "Editorial uslubdagi premium to'yxona, keng zal, VIP kutish hududi va jonli sahna bilan.",
        description:
          "Silk Garden Hall zamonaviy editoral kompozitsiya va milliy hashamatni uyg'unlashtirgan premium maskan. Katta sahna, valet parking, ikki qavatli welcome zona va shaxsiy event manager bilan xizmat ko'rsatadi.",
        heroImage:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuA0wsUBro6agLh-YFlMR6wHvRLL-a40KnFZKvGsaqkZgviDqWSPQkl6l4HJcRs3Oiiu0XtGpz0sYBJ1rA5a1a5lmR98JwiGYvviu0Z4oQVaaaLz53jBXh46phKjJvWWrrH03ZgDz2xbnutX92u6OTCynON6yaimV_Y_Sb3tbgLkETlult9Brw2Cb_1IGzmdfmZ-Wt4tKmw0pQeufXJjS6UoAG44VgeCJVozSY37U_Jj_T8a1Ddd3iu2zSEn5mX_8uUsDtOXiXnXz_Yr",
        gallery: [
          {
            url: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0wsUBro6agLh-YFlMR6wHvRLL-a40KnFZKvGsaqkZgviDqWSPQkl6l4HJcRs3Oiiu0XtGpz0sYBJ1rA5a1a5lmR98JwiGYvviu0Z4oQVaaaLz53jBXh46phKjJvWWrrH03ZgDz2xbnutX92u6OTCynON6yaimV_Y_Sb3tbgLkETlult9Brw2Cb_1IGzmdfmZ-Wt4tKmw0pQeufXJjS6UoAG44VgeCJVozSY37U_Jj_T8a1Ddd3iu2zSEn5mX_8uUsDtOXiXnXz_Yr",
          },
          {
            url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBEY6ZFeZwlFQero4_k-UnCpu2hJsktnYGnbxYZu4eI8VkfwO7PIJfdF_YuU-VSUeUdttTZoMezZEhxiKmBjKbY6WCI6xNR1HVzgkYtybjV-JU071RDQi2oE8FjfiCWCArisWC1cxvi3fcuFNAr5tQzqkhIf7HBZJRH5mwsx27Uk0mt9rGlsRmQ1luSBcxFxmy5TKceo2s-Iqt5sV_2O-QbgNAZPP4qRTOdQyN7PgVtaI60aGsZ9BmzY3T6yRvUuEAY43z_3h1EYHkk",
          },
          {
            url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBds0OY7WhCAGE98EMsDJ_dH_5mrxZqAOY2Mudbu83p0FGx7cbVokA6WxPoXmirUmxL1RCw1PO4to3xGJSn41t5oDAu5dHUXNLpMNP-xo33GoPpCwNqJ1f_r-dkDgJg7BeHY-PR8B6BfFABsdqwiogv9bmrUWIKWcYoIRTeaLT1sUlYrTk1Zl1-Sn7M0tMEZsK1VHyV7NkaQ1yNVqmMHOoXoiFcxIfYFNu59j0BQuk2rmd2leBhLkIL-lwRNj-obegdtoTV1k8c7jNz",
          },
        ],
        amenities: [
          "VIP kutish hududi",
          "Avtoturargoh",
          "Jonli sahna",
          "Valet xizmat",
          "Kelinsalom kirish yo'lagi",
        ],
        styles: ["luxe", "zamonaviy", "milliy"],
        maxDailyBookings: 3,
        createdAt: "2026-02-12T08:00:00.000Z",
        updatedAt: "2026-04-04T08:00:00.000Z",
      },
      {
        _id: "svc-venue-royal-legacy",
        vendorId: "usr-vendor-silk",
        type: "venue",
        category: "To'yxona",
        slug: "royal-legacy-hall",
        name: "Royal Legacy Hall",
        city: "Toshkent",
        district: "Shayxontohur",
        address: "Labzak ko'chasi, 87-uy",
        badge: "Verified",
        verified: true,
        featured: true,
        rating: 4.8,
        reviews: 91,
        capacity: 380,
        pricePerGuest: 270000,
        basePrice: 0,
        shortDescription:
          "Shahar markazidagi klassik zal, ko'p mehmonli marosim va nahor to'ylari uchun mos.",
        description:
          "Royal Legacy Hall qulay logistika, baland shift va yumshoq yoritilgan interyer bilan oilaviy marosimlardan tortib katta tantanalargacha moslashadi.",
        heroImage:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCwfTf4d6foo01t2sm3OJadPTESvbZe_dqvArdGrKc3c3HXBbUQ5HFrVrpNGKp8QCUa4J0LvqUM1LJlYLcu_CzZc0pQFlNrSnGvRBoq_onBdB0axFlYcfKKxIHKcApvpuoromU-D0Je6RE3-EWiwnXwLtojHQj8qOCIZD5uUR_i68bNQX8UNxTzTjSpRN9_y0fevHUVmn5_J6zlkFIvyJfkwEUQzijDUmsTJre1ZQyrSTg2Uj3xaLmwm1-YTsPubPsOlXinpS08sOK6",
        gallery: [
          {
            url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwfTf4d6foo01t2sm3OJadPTESvbZe_dqvArdGrKc3c3HXBbUQ5HFrVrpNGKp8QCUa4J0LvqUM1LJlYLcu_CzZc0pQFlNrSnGvRBoq_onBdB0axFlYcfKKxIHKcApvpuoromU-D0Je6RE3-EWiwnXwLtojHQj8qOCIZD5uUR_i68bNQX8UNxTzTjSpRN9_y0fevHUVmn5_J6zlkFIvyJfkwEUQzijDUmsTJre1ZQyrSTg2Uj3xaLmwm1-YTsPubPsOlXinpS08sOK6",
          },
          {
            url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgNz0XGQD7Sekj_OuODc8xW47vmCR4mfuWXZo26Sy34xmQ6evGC7Bw_A1Co3094lS-ppSUCCExE1xOcBOGuFqHAvERv8FP3ET_jJt5LTN3TVrIiN_cOtkLPwRQAB9uoRNcJ39Cm9wLQfNLHBP5ARrEFuhMvXr8Qgo3IkZaFsP2-miiK5or-BwircC6D4wif3FZsuO14kXXoAhmZgXE7QEqX9vdDeqTli-MaTFIyMW6ODRAaB97R698fZI89iPKezLF0zK-AEazaxP-",
          },
        ],
        amenities: ["Nahor slot", "Parking", "LED ekran", "Foto zona"],
        styles: ["milliy", "zamonaviy"],
        maxDailyBookings: 3,
        createdAt: "2026-02-20T10:00:00.000Z",
        updatedAt: "2026-04-04T08:00:00.000Z",
      },
      {
        _id: "svc-decor-silk-road",
        vendorId: "usr-vendor-silk",
        type: "decor",
        category: "Dekor",
        slug: "silk-road-decor",
        name: "Silk Road Decor",
        city: "Toshkent",
        district: "Mirobod",
        address: "Avliyo ota ko'chasi, 15-uy",
        badge: "Premium",
        verified: true,
        featured: true,
        rating: 5,
        reviews: 64,
        capacity: 0,
        pricePerGuest: 0,
        basePrice: 18000000,
        shortDescription:
          "Silk matolar, oltin aksentlar va gullar bilan editorial darajadagi sahna dizayni.",
        description:
          "Dekor jamoasi to'yga xos rang palitrasi, stage design, guest table styling va kelin-kuyov yo'lagi dizaynini to'liq tayyorlaydi.",
        heroImage:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDdZsZfMcbPhNwLY1EqQQDqvXAEcSYeCiYocvh2nDr-R5EmezHyXxZhshOr7LmVINsTfA0OvqbUhCN7aYucu_J-uEIURlxDbc9ArTy_K0LcBxFKGvhMJdwTbpdNK3IGHsdxMqSbJV5oiaOpk_lBbdywNr8ctQW7_WIAnl5Y4f40dYnb59_iW4KpPGbXNKnzpP6fUbZ_1H-bp_xOLasBwIC14EeUsOhsXXlxGXFM7MY5A5iXfClnmezGG1TsuQHUNTXbPJi-8JqsisFv",
        gallery: [
          {
            url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdZsZfMcbPhNwLY1EqQQDqvXAEcSYeCiYocvh2nDr-R5EmezHyXxZhshOr7LmVINsTfA0OvqbUhCN7aYucu_J-uEIURlxDbc9ArTy_K0LcBxFKGvhMJdwTbpdNK3IGHsdxMqSbJV5oiaOpk_lBbdywNr8ctQW7_WIAnl5Y4f40dYnb59_iW4KpPGbXNKnzpP6fUbZ_1H-bp_xOLasBwIC14EeUsOhsXXlxGXFM7MY5A5iXfClnmezGG1TsuQHUNTXbPJi-8JqsisFv",
          },
          {
            url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyM4OzLN53FNSgjl8sXVDhRnqOXvb20DFwYuW05I6Be376V2Yb-nZmDTUppn3UM0l1mURpjQYt0Q6mxzzxfs44r7ePCqMh5dksZaIaMUdUQJG0ZlCnbPoj946pemt_tlJSnr_xTBMEnEU8Rxwyb4V3Ir35PG__T1oWIkKFGiAHzGN6pWOzzt2DEmsZ9A3WlcWAq7WFJZPTmAPrAboD_L_HYWmSGo5lriK0smRRclqJFD2GkGVxOq6oh4nutfJtmqdOu5viKgrAVSRh",
          },
        ],
        amenities: ["Stage design", "Photo zone", "Welcome arch", "Floral styling"],
        styles: ["luxe", "minimal", "zamonaviy"],
        maxDailyBookings: 2,
        createdAt: "2026-02-25T10:00:00.000Z",
        updatedAt: "2026-04-04T08:00:00.000Z",
      },
      {
        _id: "svc-photo-dilshod",
        vendorId: "usr-vendor-silk",
        type: "media",
        category: "Foto & Video",
        slug: "dilshod-pro-media",
        name: "Dilshod Pro Media",
        city: "Toshkent",
        district: "Yunusobod",
        address: "Ahmad Donish ko'chasi, 3A",
        badge: "Verified",
        verified: true,
        featured: false,
        rating: 4.8,
        reviews: 52,
        capacity: 0,
        pricePerGuest: 0,
        basePrice: 9500000,
        shortDescription:
          "Drone, reels va cinematic montaj bilan to'liq foto-video paket.",
        description:
          "Jamoa wedding day timeline asosida foto, video, reels va aftermovie tayyorlaydi. Drone va color grade xizmatlari paketga kiradi.",
        heroImage:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCFo31RLBbaLhUHLWdIBK2OY-ASSTIVu_XHrbLKS_GF7DNzX_8GN4dfv6P2ccRkUybTIVJCvshi1J24y3kmDaHUlZDPOk5oo0FFNbQVaicc9izCIQprvZ9lg8QbxThCZA-BjFwkBt_b2NDyGphFoERpLDH1pYv21mxSsMqO-RbMtvlABJQv3no3WOSWBpt62HVFOkXBl6whJc4-I75hgqA099r5YGS6Gdf-RciHaV99JgHOfZC1bMZ05N28ITygYZ9HomcaAHSevO3i",
        gallery: [
          {
            url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFo31RLBbaLhUHLWdIBK2OY-ASSTIVu_XHrbLKS_GF7DNzX_8GN4dfv6P2ccRkUybTIVJCvshi1J24y3kmDaHUlZDPOk5oo0FFNbQVaicc9izCIQprvZ9lg8QbxThCZA-BjFwkBt_b2NDyGphFoERpLDH1pYv21mxSsMqO-RbMtvlABJQv3no3WOSWBpt62HVFOkXBl6whJc4-I75hgqA099r5YGS6Gdf-RciHaV99JgHOfZC1bMZ05N28ITygYZ9HomcaAHSevO3i",
          },
          {
            url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAA7xCa_yC7tPJh4zQsUt4cmNVvmsYc-Oci8_3-wdDBHo3SLphQzAaUOvCBo262DBozXaZF1I5sr2e3ZUy_dfuun8A6q04JKx21mg_pMcLmTrRr0Y7F3R4lqvBWomElymFpmq_q-zKEpoEA2rLVUGkoLOm0ue7LFf3ahQk9UHS1JXG6I1iR-6Bz2QX4aHlZ4uybvM3kz_Iv_BFLLMZwvypQtYycmsQkHj-Y1NymaO36s7NfTQB3jyuA6tKELt-Sh1lzk4dn5-WIQZA6",
          },
        ],
        amenities: ["Drone", "Reels", "Aftermovie", "2 operator"],
        styles: ["zamonaviy", "minimal", "luxe"],
        maxDailyBookings: 2,
        createdAt: "2026-02-28T10:00:00.000Z",
        updatedAt: "2026-04-04T08:00:00.000Z",
      },
      {
        _id: "svc-catering-lazzat",
        vendorId: "usr-vendor-silk",
        type: "catering",
        category: "Catering",
        slug: "lazzat-catering",
        name: "Lazzat Catering",
        city: "Toshkent",
        district: "Mirzo Ulug'bek",
        address: "Buyuk Ipak Yo'li, 21",
        badge: "Recommended",
        verified: true,
        featured: false,
        rating: 4.7,
        reviews: 38,
        capacity: 1000,
        pricePerGuest: 140000,
        basePrice: 0,
        shortDescription:
          "Milliy va Yevropa menyusi, premium desert stoli va live stationlar bilan.",
        description:
          "Lazzat Catering oshpazlari custom menu, desert zoning va mehmon oqimiga mos servis logistikasini tayyorlaydi.",
        heroImage:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDuHrgrbIOKOn6IDoCjU5StpAO2l2-njbBuRzMzduFwRnbFO7Fl7_NU0NavMurblQoZCzRhcYx2m384XwJ24ROogzn3nxJxjKqCDiVC99wE6vJD0E5wbBXK5mVNUUDnpoi_OXQcQvEuUH0frCLXvayQ9yHs-QRgYng9oelpCdJ-_wUm_05lLJqbHW-3BCrYkE5uN6pH-whXrbRLQFr9n12Yi17fL_libbe_6d4LgC1_i3x2yPO_2StUBw1WTzpRlX0CKD8MrO_0wAdb",
        gallery: [
          {
            url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDuHrgrbIOKOn6IDoCjU5StpAO2l2-njbBuRzMzduFwRnbFO7Fl7_NU0NavMurblQoZCzRhcYx2m384XwJ24ROogzn3nxJxjKqCDiVC99wE6vJD0E5wbBXK5mVNUUDnpoi_OXQcQvEuUH0frCLXvayQ9yHs-QRgYng9oelpCdJ-_wUm_05lLJqbHW-3BCrYkE5uN6pH-whXrbRLQFr9n12Yi17fL_libbe_6d4LgC1_i3x2yPO_2StUBw1WTzpRlX0CKD8MrO_0wAdb",
          },
        ],
        amenities: ["Custom menu", "Dessert station", "Live station", "Service team"],
        styles: ["milliy", "zamonaviy"],
        maxDailyBookings: 3,
        createdAt: "2026-02-22T10:00:00.000Z",
        updatedAt: "2026-04-04T08:00:00.000Z",
      },
      {
        _id: "svc-planner-lola",
        vendorId: "usr-vendor-silk",
        type: "planner",
        category: "Tashkilotchi",
        slug: "lola-concierge",
        name: "Lola Ismoilova Concierge",
        city: "Toshkent",
        district: "Shayxontohur",
        address: "Bunyodkor shoh ko'chasi, 4B",
        badge: "Concierge",
        verified: true,
        featured: true,
        rating: 5,
        reviews: 81,
        capacity: 0,
        pricePerGuest: 0,
        basePrice: 15000000,
        shortDescription:
          "Timeline, vendor coordination va wedding day concierge boshqaruvi.",
        description:
          "Lola jamoasi event masterplan, vendor briefing, guest flow va sahna rejasi bo'yicha to'liq boshqaruv beradi.",
        heroImage:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCRr9eKX-C2b0xaja-g-sAgNbepsArpvQyPtTuNklCfdLPjZxhFyZU6hzQBhfetfzbYt8ParSmisvxDR5WquMHMu65_XMsE6B6zpJdD9r5wTbYLF-HLjrrT7HnUSXWSaeNmms8-gFfm6n060h4ZWrR0377nTW-2M6tUzjO8sqcynocFnB_qdlrZUNmlG1sH8Om85lyaeRqg_9Q8zLgAGRie1wiEEFfDbH_rp7IWQhT769aB1fsgoy0c72pv4wv4KuyQOapXs7Wdf1YJ",
        gallery: [
          {
            url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRr9eKX-C2b0xaja-g-sAgNbepsArpvQyPtTuNklCfdLPjZxhFyZU6hzQBhfetfzbYt8ParSmisvxDR5WquMHMu65_XMsE6B6zpJdD9r5wTbYLF-HLjrrT7HnUSXWSaeNmms8-gFfm6n060h4ZWrR0377nTW-2M6tUzjO8sqcynocFnB_qdlrZUNmlG1sH8Om85lyaeRqg_9Q8zLgAGRie1wiEEFfDbH_rp7IWQhT769aB1fsgoy0c72pv4wv4KuyQOapXs7Wdf1YJ",
          },
        ],
        amenities: ["Masterplan", "Vendor coordination", "Guest flow", "Wedding day support"],
        styles: ["luxe", "zamonaviy", "milliy"],
        maxDailyBookings: 2,
        createdAt: "2026-02-24T10:00:00.000Z",
        updatedAt: "2026-04-04T08:00:00.000Z",
      },
      {
        _id: "svc-music-navo",
        vendorId: "usr-vendor-silk",
        type: "music",
        category: "Musiqa",
        slug: "navo-live-band",
        name: "Navo Live Band",
        city: "Toshkent",
        district: "Chilonzor",
        address: "Bunyodkor, 109",
        badge: "Live",
        verified: true,
        featured: false,
        rating: 4.7,
        reviews: 29,
        capacity: 0,
        pricePerGuest: 0,
        basePrice: 12000000,
        shortDescription:
          "Jonli ansambl, DJ set va marosim uchun ovoz texnikasi bilan.",
        description:
          "Navo Live Band mehmonlar oqimi va marosim ritmiga qarab jonli repertuar va DJ blokni moslashtirib beradi.",
        heroImage:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuB_i2cMt9RtSbl3Mu131O6vVDXEEcGUHGC9t-JHUyhqYvGcEoKSAZVz9yOfMNRa3bFmBpyqF9BLQt9XG1VALQdgynHNXanFh0JHJGyUWD5xSgHJbmSoVLw5HvxoXJattbQVPnUfCCR4KS1VCcrPUHjHnmkvQT1X7oWuHJhExwniKka62ZTaKA3NJYoA-UyUmSb1nIKRbNkq1lT1jMIGUuot_MJV6r5_hmGhsnlJ57GaPWX4dCkO7ehXcci5m9c2zNoBKtkHVzNazuOK",
        gallery: [
          {
            url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_i2cMt9RtSbl3Mu131O6vVDXEEcGUHGC9t-JHUyhqYvGcEoKSAZVz9yOfMNRa3bFmBpyqF9BLQt9XG1VALQdgynHNXanFh0JHJGyUWD5xSgHJbmSoVLw5HvxoXJattbQVPnUfCCR4KS1VCcrPUHjHnmkvQT1X7oWuHJhExwniKka62ZTaKA3NJYoA-UyUmSb1nIKRbNkq1lT1jMIGUuot_MJV6r5_hmGhsnlJ57GaPWX4dCkO7ehXcci5m9c2zNoBKtkHVzNazuOK",
          },
        ],
        amenities: ["DJ", "Live band", "Sound check", "Ceremony cueing"],
        styles: ["milliy", "zamonaviy", "minimal"],
        maxDailyBookings: 2,
        createdAt: "2026-02-21T10:00:00.000Z",
        updatedAt: "2026-04-04T08:00:00.000Z",
      },
    ],
    bookings: [
      {
        _id: "bkg-1001",
        userId: "usr-demo-customer",
        vendorId: "usr-vendor-silk",
        serviceId: "svc-venue-silk-garden",
        customerName: "Aziza Karimova",
        phone: "+998901234567",
        eventDate: "2026-09-12",
        slot: "kechki",
        guestCount: 250,
        note: "Sahna yonida live band joyi kerak.",
        status: "confirmed",
        paymentStatus: "deposit-paid",
        total: 80000000,
        createdAt: "2026-03-20T10:00:00.000Z",
        updatedAt: "2026-04-01T10:00:00.000Z",
      },
      {
        _id: "bkg-1002",
        userId: "usr-demo-customer",
        vendorId: "usr-vendor-silk",
        serviceId: "svc-photo-dilshod",
        customerName: "Aziza Karimova",
        phone: "+998901234567",
        eventDate: "2026-09-12",
        slot: "kun-bo'yi",
        guestCount: 250,
        note: "Reels va drone ham kerak.",
        status: "pending",
        paymentStatus: "awaiting",
        total: 9500000,
        createdAt: "2026-03-22T10:00:00.000Z",
        updatedAt: "2026-03-22T10:00:00.000Z",
      },
      {
        _id: "bkg-1003",
        userId: "usr-demo-customer",
        vendorId: "usr-vendor-silk",
        serviceId: "svc-catering-lazzat",
        customerName: "Aziza Karimova",
        phone: "+998901234567",
        eventDate: "2026-09-12",
        slot: "kechki",
        guestCount: 250,
        note: "Dessert station alohida bezatilsin.",
        status: "confirmed",
        paymentStatus: "partial",
        total: 35000000,
        createdAt: "2026-03-25T11:00:00.000Z",
        updatedAt: "2026-03-28T09:00:00.000Z",
      },
      {
        _id: "bkg-2001",
        userId: "usr-customer-sevara",
        vendorId: "usr-vendor-silk",
        serviceId: "svc-venue-royal-legacy",
        customerName: "Sevara Karimova",
        phone: "+998933334455",
        eventDate: "2026-04-04",
        slot: "nahor",
        guestCount: 180,
        note: "Family zone va bolalar uchun alohida stol.",
        status: "confirmed",
        paymentStatus: "paid",
        total: 48600000,
        createdAt: "2026-03-01T09:00:00.000Z",
        updatedAt: "2026-03-20T09:00:00.000Z",
      },
      {
        _id: "bkg-2002",
        userId: "usr-customer-jamshid",
        vendorId: "usr-vendor-silk",
        serviceId: "svc-venue-silk-garden",
        customerName: "Jamshid Qodirov",
        phone: "+998998887766",
        eventDate: "2026-04-04",
        slot: "kechki",
        guestCount: 320,
        note: "Kirish yo'lagi gullar bilan bezatilsin.",
        status: "confirmed",
        paymentStatus: "deposit-paid",
        total: 102400000,
        createdAt: "2026-03-05T13:00:00.000Z",
        updatedAt: "2026-03-30T12:00:00.000Z",
      },
      {
        _id: "bkg-2003",
        userId: "usr-customer-jamshid",
        vendorId: "usr-vendor-silk",
        serviceId: "svc-venue-silk-garden",
        customerName: "Jamshid Qodirov",
        phone: "+998998887766",
        eventDate: "2026-04-06",
        slot: "nahor",
        guestCount: 300,
        note: "",
        status: "pending",
        paymentStatus: "awaiting",
        total: 96000000,
        createdAt: "2026-03-12T08:00:00.000Z",
        updatedAt: "2026-03-12T08:00:00.000Z",
      },
      {
        _id: "bkg-2004",
        userId: "usr-customer-sevara",
        vendorId: "usr-vendor-silk",
        serviceId: "svc-venue-silk-garden",
        customerName: "Sevara Karimova",
        phone: "+998933334455",
        eventDate: "2026-04-10",
        slot: "kechki",
        guestCount: 210,
        note: "",
        status: "confirmed",
        paymentStatus: "partial",
        total: 67200000,
        createdAt: "2026-03-08T14:00:00.000Z",
        updatedAt: "2026-03-21T12:00:00.000Z",
      },
      {
        _id: "bkg-2005",
        userId: "usr-customer-sevara",
        vendorId: "usr-vendor-silk",
        serviceId: "svc-decor-silk-road",
        customerName: "Sevara Karimova",
        phone: "+998933334455",
        eventDate: "2026-04-10",
        slot: "kechki",
        guestCount: 210,
        note: "Champagne palette",
        status: "confirmed",
        paymentStatus: "deposit-paid",
        total: 18000000,
        createdAt: "2026-03-10T14:00:00.000Z",
        updatedAt: "2026-03-21T12:00:00.000Z",
      },
      {
        _id: "bkg-2006",
        userId: "usr-customer-jamshid",
        vendorId: "usr-vendor-silk",
        serviceId: "svc-venue-silk-garden",
        customerName: "Jamshid Qodirov",
        phone: "+998998887766",
        eventDate: "2026-04-18",
        slot: "kechki",
        guestCount: 350,
        note: "",
        status: "cancelled",
        paymentStatus: "refunded",
        total: 112000000,
        createdAt: "2026-03-07T10:00:00.000Z",
        updatedAt: "2026-03-16T12:00:00.000Z",
      },
      {
        _id: "bkg-2007",
        userId: "usr-customer-sevara",
        vendorId: "usr-vendor-silk",
        serviceId: "svc-venue-silk-garden",
        customerName: "Sevara Karimova",
        phone: "+998933334455",
        eventDate: "2026-04-22",
        slot: "nahor",
        guestCount: 190,
        note: "",
        status: "confirmed",
        paymentStatus: "paid",
        total: 60800000,
        createdAt: "2026-03-14T11:00:00.000Z",
        updatedAt: "2026-03-24T11:00:00.000Z",
      },
      {
        _id: "bkg-2008",
        userId: "usr-customer-jamshid",
        vendorId: "usr-vendor-silk",
        serviceId: "svc-venue-royal-legacy",
        customerName: "Jamshid Qodirov",
        phone: "+998998887766",
        eventDate: "2026-04-24",
        slot: "kechki",
        guestCount: 280,
        note: "",
        status: "pending",
        paymentStatus: "awaiting",
        total: 75600000,
        createdAt: "2026-03-18T10:00:00.000Z",
        updatedAt: "2026-03-18T10:00:00.000Z",
      },
    ],
  };
}

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  return structuredClone(value);
}

function normalisePhone(phone = "") {
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("998")) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  return `+${digits}`;
}

function toSlug(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

async function connectDatabase() {
  try {
    mongoClient = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 1500,
    });
    await mongoClient.connect();
    mongoDb = mongoClient.db(MONGODB_DB);
    await mongoDb.command({ ping: 1 });
    databaseMode = "mongo";
    await ensureSeedData();
    console.log(`[db] MongoDB connected: ${MONGODB_URI}/${MONGODB_DB}`);
  } catch (error) {
    databaseMode = "memory";
    memoryStore = createSeedState();
    console.warn(`[db] MongoDB unavailable, fallback memory mode: ${error.message}`);
  }
}

async function ensureSeedData() {
  if (databaseMode !== "mongo" || !mongoDb) return;
  const seed = createSeedState();
  for (const name of Object.keys(seed)) {
    const collection = mongoDb.collection(name);
    const count = await collection.countDocuments();
    if (count === 0) {
      await collection.insertMany(seed[name]);
    }
  }
}

async function readCollection(name) {
  if (databaseMode === "mongo" && mongoDb) {
    return mongoDb.collection(name).find({}).toArray();
  }
  return clone(memoryStore[name]);
}

async function findById(name, id) {
  if (databaseMode === "mongo" && mongoDb) {
    return mongoDb.collection(name).findOne({ _id: id });
  }
  return clone(memoryStore[name].find((item) => item._id === id) || null);
}

async function upsertRecord(name, record) {
  if (databaseMode === "mongo" && mongoDb) {
    await mongoDb.collection(name).updateOne(
      { _id: record._id },
      { $set: record },
      { upsert: true },
    );
    return record;
  }

  const index = memoryStore[name].findIndex((item) => item._id === record._id);
  if (index === -1) {
    memoryStore[name].push(clone(record));
  } else {
    memoryStore[name][index] = clone(record);
  }
  return record;
}

async function listServices(filters = {}) {
  const services = await readCollection("services");
  const bookings = await readCollection("bookings");
  const q = String(filters.q || "").trim().toLowerCase();
  const city = String(filters.city || "").trim().toLowerCase();
  const category = String(filters.category || "").trim().toLowerCase();
  const vendorId = String(filters.vendorId || "").trim();

  let filtered = services.filter((service) => {
    const searchHaystack = [
      service.name,
      service.category,
      service.type,
      service.city,
      service.district,
      service.shortDescription,
      service.description,
    ]
      .join(" ")
      .toLowerCase();

    if (q && !searchHaystack.includes(q)) return false;
    if (city && !service.city.toLowerCase().includes(city)) return false;
    if (category && !service.category.toLowerCase().includes(category)) return false;
    if (vendorId && service.vendorId !== vendorId) return false;
    if (filters.featured && !service.featured) return false;
    return true;
  });

  filtered = filtered
    .sort((a, b) => {
      const aFeatured = a.featured ? 1 : 0;
      const bFeatured = b.featured ? 1 : 0;
      if (aFeatured !== bFeatured) return bFeatured - aFeatured;
      return b.rating - a.rating;
    })
    .map((service) => enrichService(service, bookings));

  const limit = toNumber(filters.limit, 0);
  return limit > 0 ? filtered.slice(0, limit) : filtered;
}

function enrichService(service, bookings) {
  const relevantBookings = bookings.filter(
    (booking) =>
      booking.serviceId === service._id &&
      booking.status !== "cancelled" &&
      booking.eventDate >= TODAY,
  );

  const nextOpenDates = [];
  const maxDailyBookings = service.maxDailyBookings || 3;
  let cursor = new Date(`${TODAY}T00:00:00`);

  while (nextOpenDates.length < 3) {
    const isoDate = cursor.toISOString().slice(0, 10);
    const count = relevantBookings.filter((booking) => booking.eventDate === isoDate).length;
    if (count < maxDailyBookings) {
      nextOpenDates.push({
        date: isoDate,
        slotsLeft: maxDailyBookings - count,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.toISOString().slice(0, 10) > "2026-12-31") break;
  }

  return {
    ...service,
    image: service.heroImage || service.gallery?.[0]?.url || "",
    nextOpenDates,
  };
}

async function getServiceDetail(serviceId, month = DEFAULT_MONTH) {
  const service = await findById("services", serviceId);
  if (!service) return null;
  const bookings = await readCollection("bookings");
  return {
    ...enrichService(service, bookings),
    availability: buildAvailability(service, bookings, month),
  };
}

function buildAvailability(service, bookings, month) {
  const [year, monthIndex] = month.split("-").map(Number);
  const maxDailyBookings = service.maxDailyBookings || 3;
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const items = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(monthIndex).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const count = bookings.filter(
      (booking) =>
        booking.serviceId === service._id &&
        booking.status !== "cancelled" &&
        booking.eventDate === date,
    ).length;

    let status = "free";
    if (count >= maxDailyBookings) status = "full";
    else if (count > 0) status = "partial";

    items.push({
      date,
      day,
      bookingCount: count,
      slotsLeft: Math.max(0, maxDailyBookings - count),
      status,
    });
  }

  return {
    month,
    maxDailyBookings,
    days: items,
  };
}

async function getUserWithFavorites(userId) {
  const user = await findById("users", userId);
  if (!user) return null;
  const services = await readCollection("services");
  const favorites = services
    .filter((service) => user.favoriteServiceIds?.includes(service._id))
    .map((service) => ({
      ...service,
      image: service.heroImage || service.gallery?.[0]?.url || "",
    }));
  return {
    ...user,
    favorites,
  };
}

async function getBookings(filters = {}) {
  const [bookings, services] = await Promise.all([
    readCollection("bookings"),
    readCollection("services"),
  ]);

  const serviceMap = new Map(services.map((service) => [service._id, service]));
  const items = bookings
    .filter((booking) => {
      if (filters.userId && booking.userId !== filters.userId) return false;
      if (filters.vendorId && booking.vendorId !== filters.vendorId) return false;
      if (filters.status && booking.status !== filters.status) return false;
      if (filters.month && !booking.eventDate.startsWith(filters.month)) return false;
      return true;
    })
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .map((booking) => {
      const service = serviceMap.get(booking.serviceId);
      return {
        ...booking,
        serviceName: service?.name || "Noma'lum xizmat",
        serviceCategory: service?.category || "",
        serviceImage: service?.heroImage || service?.gallery?.[0]?.url || "",
        city: service?.city || "",
      };
    });

  const limit = toNumber(filters.limit, 0);
  return limit > 0 ? items.slice(0, limit) : items;
}

async function createOrGetUserByPhone(phone) {
  const normalized = normalisePhone(phone);
  const users = await readCollection("users");
  const existing = users.find((user) => normalisePhone(user.phone) === normalized);
  if (existing) return existing;

  const user = {
    _id: buildId("usr"),
    role: "customer",
    fullName: "Yangi foydalanuvchi",
    phone: normalized,
    email: "",
    city: "Toshkent",
    weddingDate: "",
    budget: 0,
    guestCount: 180,
    style: "zamonaviy",
    favoriteServiceIds: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await upsertRecord("users", user);
  return user;
}

function createOtpCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function statusLabel(status) {
  const labels = {
    confirmed: "Tasdiqlangan",
    pending: "Kutishda",
    cancelled: "Bekor qilingan",
  };
  return labels[status] || status;
}

async function computePlatformStats() {
  const [users, services, bookings] = await Promise.all([
    readCollection("users"),
    readCollection("services"),
    readCollection("bookings"),
  ]);

  const confirmedRevenue = bookings
    .filter((booking) => booking.status === "confirmed")
    .reduce((sum, booking) => sum + toNumber(booking.total), 0);

  return {
    serviceCount: services.length,
    customerCount: users.filter((user) => user.role === "customer").length,
    bookingCount: bookings.length,
    revenue: confirmedRevenue,
  };
}

async function getDashboardBootstrap(userId) {
  const [user, bookings, services] = await Promise.all([
    getUserWithFavorites(userId),
    getBookings({ userId }),
    listServices({ featured: true, limit: 4 }),
  ]);

  return {
    user,
    bookings,
    featuredServices: services,
  };
}

async function getVendorSummary(vendorId) {
  const [vendorBookings, vendorServices] = await Promise.all([
    getBookings({ vendorId }),
    listServices({ vendorId }),
  ]);
  const totalRevenue = vendorBookings
    .filter((booking) => booking.status === "confirmed")
    .reduce((sum, booking) => sum + toNumber(booking.total), 0);
  const pendingCount = vendorBookings.filter((booking) => booking.status === "pending").length;

  return {
    bookingCount: vendorBookings.length,
    pendingCount,
    revenue: totalRevenue,
    serviceCount: vendorServices.length,
    occupancyRate:
      vendorBookings.length === 0
        ? 0
        : Math.round(
            (vendorBookings.filter((booking) => booking.status === "confirmed").length /
              vendorBookings.length) *
              100,
          ),
  };
}

async function getAdminBootstrap(vendorId, month = DEFAULT_MONTH, serviceId = "") {
  const [summary, vendor, services, bookings] = await Promise.all([
    getVendorSummary(vendorId),
    findById("users", vendorId),
    listServices({ vendorId }),
    getBookings({ vendorId }),
  ]);

  const activeServiceId = serviceId || services.find((service) => service.type === "venue")?._id || services[0]?._id || "";
  const activeService = activeServiceId ? await getServiceDetail(activeServiceId, month) : null;

  return {
    vendor,
    summary,
    services,
    bookings,
    activeService,
    month,
    cloudinaryEnabled: CLOUDINARY_ENABLED,
  };
}

function scoreService(service, input, targetType) {
  let score = 0;
  if (service.type === targetType) score += 25;
  if (service.city === input.location) score += 10;
  if (service.styles?.includes(input.style)) score += 10;
  if (service.featured) score += 6;
  score += Math.round((service.rating || 0) * 4);
  return score;
}

function selectBestService(services, input, type, strategy) {
  const candidates = services
    .filter((service) => service.type === type)
    .map((service) => {
      const price =
        type === "venue" || type === "catering"
          ? toNumber(service.pricePerGuest) * input.guestCount
          : toNumber(service.basePrice);
      let score = scoreService(service, input, type);
      if (strategy === "budget" && price <= input.budget * 0.25) score += 12;
      if (strategy === "premium" && price >= input.budget * 0.1) score += 8;
      if (strategy === "balanced" && price <= input.budget * 0.18) score += 6;
      return { service, price, score };
    })
    .sort((a, b) => b.score - a.score);
  return candidates[0] || null;
}

async function buildRecommendations(input) {
  const services = await listServices({ city: input.location });
  const templates = [
    {
      id: "signature",
      title: "Silk Signature",
      mood: "Editorial hashamat va to'liq concierge boshqaruv",
      strategy: "premium",
      stack: ["venue", "decor", "planner", "media", "music"],
    },
    {
      id: "balanced",
      title: "Muvozanatli Paket",
      mood: "Narx va sifat balansi, eng kerakli vendorlar jamlanmasi",
      strategy: "balanced",
      stack: ["venue", "decor", "media", "music"],
    },
    {
      id: "intimate",
      title: "Nazokatli Marosim",
      mood: "Ixchamroq, ammo nafis ko'rinishga ega kompozitsiya",
      strategy: "budget",
      stack: ["venue", "media", "music"],
    },
  ];

  return templates.map((template) => {
    const selected = template.stack
      .map((type) => selectBestService(services, input, type, template.strategy))
      .filter(Boolean);
    const selectedIds = new Set();
    const items = selected.filter((entry) => {
      if (selectedIds.has(entry.service._id)) return false;
      selectedIds.add(entry.service._id);
      return true;
    });
    const total = items.reduce((sum, item) => sum + item.price, 0);
    return {
      id: template.id,
      title: template.title,
      mood: template.mood,
      total,
      withinBudget: total <= input.budget,
      coverage: items.length,
      services: items.map((item) => ({
        _id: item.service._id,
        name: item.service.name,
        category: item.service.category,
        image: item.service.image,
        city: item.service.city,
        price: item.price,
      })),
    };
  });
}

function validateRequired(fields) {
  const missing = Object.entries(fields)
    .filter(([, value]) => value === undefined || value === null || value === "")
    .map(([key]) => key);
  return missing;
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    databaseMode,
    cloudinaryEnabled: CLOUDINARY_ENABLED,
    today: TODAY,
  });
});

app.get("/api/config", async (req, res) => {
  res.json({
    databaseMode,
    cloudinaryEnabled: CLOUDINARY_ENABLED,
    demoCustomerId: "usr-demo-customer",
    demoVendorId: "usr-vendor-silk",
    today: TODAY,
    defaultMonth: DEFAULT_MONTH,
  });
});

app.get("/api/home", async (req, res, next) => {
  try {
    const [featuredServices, stats] = await Promise.all([
      listServices({ featured: true, limit: 3 }),
      computePlatformStats(),
    ]);
    res.json({ featuredServices, stats });
  } catch (error) {
    next(error);
  }
});

app.get("/api/services", async (req, res, next) => {
  try {
    const items = await listServices(req.query);
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

app.get("/api/services/:id", async (req, res, next) => {
  try {
    const item = await getServiceDetail(req.params.id, req.query.month || DEFAULT_MONTH);
    if (!item) {
      return res.status(404).json({ message: "Xizmat topilmadi." });
    }
    return res.json(item);
  } catch (error) {
    return next(error);
  }
});

app.post("/api/services", async (req, res, next) => {
  try {
    const vendorId = req.body.vendorId || "usr-vendor-silk";
    const name = req.body.name || "Yangi xizmat";
    const service = {
      _id: buildId("svc"),
      vendorId,
      type: req.body.type || "venue",
      category: req.body.category || "To'yxona",
      slug: toSlug(name),
      name,
      city: req.body.city || "Toshkent",
      district: req.body.district || "",
      address: req.body.address || "",
      badge: req.body.badge || "Draft",
      verified: false,
      featured: false,
      rating: 0,
      reviews: 0,
      capacity: toNumber(req.body.capacity),
      pricePerGuest: toNumber(req.body.pricePerGuest),
      basePrice: toNumber(req.body.basePrice),
      shortDescription: req.body.shortDescription || "",
      description: req.body.description || "",
      heroImage: req.body.heroImage || "",
      gallery: [],
      amenities: [],
      styles: [],
      maxDailyBookings: 3,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await upsertRecord("services", service);
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
});

app.put("/api/services/:id", async (req, res, next) => {
  try {
    const existing = await findById("services", req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Xizmat topilmadi." });
    }

    const gallery = Array.isArray(req.body.gallery)
      ? req.body.gallery
      : Array.isArray(existing.gallery)
        ? existing.gallery
        : [];

    const updated = {
      ...existing,
      name: req.body.name ?? existing.name,
      slug: toSlug(req.body.name ?? existing.name),
      category: req.body.category ?? existing.category,
      type: req.body.type ?? existing.type,
      city: req.body.city ?? existing.city,
      district: req.body.district ?? existing.district,
      address: req.body.address ?? existing.address,
      badge: req.body.badge ?? existing.badge,
      featured: typeof req.body.featured === "boolean" ? req.body.featured : existing.featured,
      verified: typeof req.body.verified === "boolean" ? req.body.verified : existing.verified,
      capacity: toNumber(req.body.capacity, existing.capacity),
      pricePerGuest: toNumber(req.body.pricePerGuest, existing.pricePerGuest),
      basePrice: toNumber(req.body.basePrice, existing.basePrice),
      shortDescription: req.body.shortDescription ?? existing.shortDescription,
      description: req.body.description ?? existing.description,
      heroImage: req.body.heroImage ?? existing.heroImage,
      amenities: Array.isArray(req.body.amenities) ? req.body.amenities : existing.amenities,
      styles: Array.isArray(req.body.styles) ? req.body.styles : existing.styles,
      maxDailyBookings: toNumber(req.body.maxDailyBookings, existing.maxDailyBookings),
      gallery,
      updatedAt: nowIso(),
    };

    await upsertRecord("services", updated);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.post("/api/services/:id/images", upload.single("image"), async (req, res, next) => {
  try {
    const service = await findById("services", req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Xizmat topilmadi." });
    }

    let imageUrl = String(req.body.imageUrl || "").trim();
    let publicId = "";

    if (!imageUrl && req.file) {
      if (!CLOUDINARY_ENABLED) {
        return res.status(400).json({
          message:
            "Cloudinary sozlanmagan. Fayl upload uchun CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY va CLOUDINARY_API_SECRET kerak.",
        });
      }

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "toyimbor/services",
            resource_type: "image",
            transformation: [{ width: 1600, crop: "limit" }],
          },
          (error, uploadResult) => {
            if (error) return reject(error);
            return resolve(uploadResult);
          },
        );
        stream.end(req.file.buffer);
      });

      imageUrl = result.secure_url;
      publicId = result.public_id;
    }

    if (!imageUrl) {
      return res.status(400).json({ message: "Rasm URL yoki fayl yuboring." });
    }

    const updated = {
      ...service,
      heroImage: service.heroImage || imageUrl,
      gallery: [...(service.gallery || []), { url: imageUrl, publicId }],
      updatedAt: nowIso(),
    };
    await upsertRecord("services", updated);
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

app.post("/api/auth/request-code", async (req, res, next) => {
  try {
    const phone = normalisePhone(req.body.phone);
    if (!phone) {
      return res.status(400).json({ message: "Telefon raqami kiriting." });
    }
    const user = await createOrGetUserByPhone(phone);
    const code = createOtpCode();
    otpStore.set(phone, {
      code,
      userId: user._id,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return res.json({
      ok: true,
      phone,
      message: "SMS kod yuborildi.",
      demoCode: process.env.NODE_ENV === "production" ? undefined : code,
    });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/auth/verify-code", async (req, res, next) => {
  try {
    const phone = normalisePhone(req.body.phone);
    const code = String(req.body.code || "").trim();
    const session = otpStore.get(phone);

    if (!session || session.expiresAt < Date.now() || session.code !== code) {
      return res.status(400).json({ message: "Kod noto'g'ri yoki muddati o'tgan." });
    }

    const user = await getUserWithFavorites(session.userId);
    otpStore.delete(phone);
    return res.json({ ok: true, user });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/users/:id", async (req, res, next) => {
  try {
    const user = await getUserWithFavorites(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi." });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/users/:id", async (req, res, next) => {
  try {
    const user = await findById("users", req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi." });
    }
    const updated = {
      ...user,
      fullName: req.body.fullName ?? user.fullName,
      email: req.body.email ?? user.email,
      city: req.body.city ?? user.city,
      phone: req.body.phone ? normalisePhone(req.body.phone) : user.phone,
      weddingDate: req.body.weddingDate ?? user.weddingDate,
      budget: toNumber(req.body.budget, user.budget),
      guestCount: toNumber(req.body.guestCount, user.guestCount),
      style: req.body.style ?? user.style,
      updatedAt: nowIso(),
    };
    await upsertRecord("users", updated);
    res.json(await getUserWithFavorites(updated._id));
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/:id/favorites", async (req, res, next) => {
  try {
    const user = await findById("users", req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi." });
    }
    const serviceId = req.body.serviceId;
    if (!serviceId) {
      return res.status(400).json({ message: "Xizmat ID kerak." });
    }

    const current = new Set(user.favoriteServiceIds || []);
    if (current.has(serviceId)) current.delete(serviceId);
    else current.add(serviceId);

    const updated = {
      ...user,
      favoriteServiceIds: Array.from(current),
      updatedAt: nowIso(),
    };
    await upsertRecord("users", updated);
    res.json(await getUserWithFavorites(updated._id));
  } catch (error) {
    next(error);
  }
});

app.get("/api/bookings", async (req, res, next) => {
  try {
    const items = await getBookings(req.query);
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

app.post("/api/bookings", async (req, res, next) => {
  try {
    const missing = validateRequired({
      userId: req.body.userId,
      serviceId: req.body.serviceId,
      eventDate: req.body.eventDate,
      guestCount: req.body.guestCount,
      slot: req.body.slot,
    });
    if (missing.length) {
      return res.status(400).json({
        message: `Majburiy maydonlar yetishmayapti: ${missing.join(", ")}`,
      });
    }

    const [user, service] = await Promise.all([
      findById("users", req.body.userId),
      findById("services", req.body.serviceId),
    ]);
    if (!user || !service) {
      return res.status(404).json({ message: "Foydalanuvchi yoki xizmat topilmadi." });
    }

    const guestCount = toNumber(req.body.guestCount);
    const total =
      service.type === "venue" || service.type === "catering"
        ? toNumber(service.pricePerGuest) * guestCount
        : toNumber(service.basePrice);

    const booking = {
      _id: buildId("bkg"),
      userId: user._id,
      vendorId: service.vendorId,
      serviceId: service._id,
      customerName: user.fullName,
      phone: user.phone,
      eventDate: req.body.eventDate,
      slot: req.body.slot,
      guestCount,
      note: req.body.note || "",
      status: "pending",
      paymentStatus: "awaiting",
      total,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    await upsertRecord("bookings", booking);
    res.status(201).json({
      ...booking,
      serviceName: service.name,
      statusLabel: statusLabel(booking.status),
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/bookings/:id", async (req, res, next) => {
  try {
    const booking = await findById("bookings", req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Bron topilmadi." });
    }

    const updated = {
      ...booking,
      status: req.body.status ?? booking.status,
      paymentStatus: req.body.paymentStatus ?? booking.paymentStatus,
      note: req.body.note ?? booking.note,
      updatedAt: nowIso(),
    };
    await upsertRecord("bookings", updated);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.post("/api/recommendations", async (req, res, next) => {
  try {
    const payload = {
      location: req.body.location || "Toshkent",
      budget: toNumber(req.body.budget, 90000000),
      guestCount: toNumber(req.body.guestCount, 220),
      eventDate: req.body.eventDate || TODAY,
      style: req.body.style || "zamonaviy",
    };
    const packages = await buildRecommendations(payload);
    res.json({ input: payload, packages });
  } catch (error) {
    next(error);
  }
});

app.get("/api/dashboard/bootstrap", async (req, res, next) => {
  try {
    const userId = req.query.userId || "usr-demo-customer";
    const data = await getDashboardBootstrap(userId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/bootstrap", async (req, res, next) => {
  try {
    const vendorId = req.query.vendorId || "usr-vendor-silk";
    const month = req.query.month || DEFAULT_MONTH;
    const serviceId = req.query.serviceId || "";
    const data = await getAdminBootstrap(vendorId, month, serviceId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

const pageRoutes = {
  "/": "index.html",
  "/catalog": "catalog.html",
  "/booking": "booking.html",
  "/dashboard": "dashboard.html",
  "/profile": "profile.html",
  "/admin": "admin.html",
};

for (const [route, file] of Object.entries(pageRoutes)) {
  app.get(route, (req, res) => {
    res.sendFile(path.join(SITE_DIR, file));
  });
}

app.use((req, res) => {
  res.status(404).json({ message: "Sahifa topilmadi." });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    message: "Serverda kutilmagan xatolik yuz berdi.",
    details: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
});

async function start() {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`[server] http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("[startup]", error);
  process.exit(1);
});
