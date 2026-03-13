import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import ProductLegacy from "@/models/Product";
import ProductV2 from "@/models/v2/Product";
import User from "@/models/User";
import { escapeRegex } from "@/lib/rateLimit";

type ChatbotPayload = {
  message?: string;
};

const SHIPPING_INFO =
  "Shipping is handled via Shiprocket, and tracking is available once your order ships. Visit the My Orders page to view tracking details.";

const RETURN_POLICY =
  "Returns are accepted within 7 days of delivery. Items must be unused, unwashed, and in original packaging with tags intact. Refunds are processed within 5-7 business days after approval. Custom design orders are non-returnable.";

const ORDER_TRACKING =
  "You can track your order from the My Orders page. Open /my-orders to view shipment status and tracking updates.";

const CONTACT_INFO =
  "You can reach support at sparrowsports@gmail.com or call +91 89408 85505. You can also use the contact form at /contact.";

const productIntentKeywords = [
  "do you have",
  "available",
  "buy",
  "looking for",
  "product",
  "products",
  "show products",
  "sell",
  "in stock"
];

const productKeywords = [
  "shorts",
  "tshirt",
  "t-shirt",
  "pant",
  "pants",
  "jacket",
  "jersey",
  "hoodie",
  "tracksuit",
  "football",
  "cricket",
  "basketball",
  "tennis",
  "badminton"
];

const shippingKeywords = ["shipping", "delivery", "shiprocket", "courier"];
const returnKeywords = ["return", "refund", "exchange"];
const trackingKeywords = [
  "tracking",
  "track",
  "track order",
  "order status",
  "where is my order",
  "my orders",
  "orders"
];
const contactKeywords = ["contact", "support", "help", "email", "phone", "call"];
const wishlistKeywords = ["liked", "wishlist", "favorites", "favourites", "saved items"];

const stopWords = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "do",
  "you",
  "have",
  "i",
  "we",
  "to",
  "for",
  "of",
  "in",
  "on",
  "with",
  "my",
  "your",
  "about",
  "buy",
  "looking",
  "available",
  "product",
  "products",
  "show",
  "stock"
]);

const categoryLabelsFallback = ["Jerseys", "Jackets", "Shorts", "T-shirts", "Pants", "Hoodies"];

const includesAny = (message: string, keywords: string[]) =>
  keywords.some((keyword) => message.includes(keyword));

const extractSearchTokens = (message: string) => {
  const cleaned = message.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  return cleaned
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopWords.has(token));
};

const buildTokenRegexes = (tokens: string[]) =>
  tokens.map((token) => new RegExp(escapeRegex(token), "i"));

const buildProductQuery = (regexes: RegExp[]) => ({
  $or: regexes.flatMap((regex) => [{ name: regex }, { category: regex }])
});

const fetchLegacyProducts = async (regexes: RegExp[]) => {
  return (ProductLegacy as any)
    .find(buildProductQuery(regexes))
    .select("name price offerPrice slug")
    .limit(3)
    .lean();
};

const fetchV2Products = async (regexes: RegExp[]) => {
  const pipeline = (matchStage: Record<string, unknown>) => [
    { $match: matchStage },
    {
      $lookup: {
        from: "product_variants_v2",
        let: { productId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$productId", "$$productId"] } } },
          { $match: { visibility: { $ne: "hidden" } } }
        ],
        as: "variants"
      }
    },
    {
      $addFields: {
        minOfferPrice: { $min: "$variants.offerPrice" }
      }
    },
    { $sort: { minOfferPrice: 1 } },
    { $limit: 3 },
    { $project: { name: 1, slug: 1, minOfferPrice: 1 } }
  ];

  const activeResults = await (ProductV2 as any).aggregate(
    pipeline({ status: "active", ...buildProductQuery(regexes) })
  );

  if (activeResults.length) {
    return activeResults;
  }

  const fallbackResults = await (ProductV2 as any).aggregate(
    pipeline(buildProductQuery(regexes))
  );

  return fallbackResults || [];
};

const fetchWishlistProductNames = async (favoriteIds: string[]) => {
  if (!favoriteIds.length) {
    return [] as string[];
  }

  const [legacyProducts, v2Products] = await Promise.all([
    (ProductLegacy as any).find({ _id: { $in: favoriteIds } }).select("name").lean(),
    (ProductV2 as any).find({ _id: { $in: favoriteIds } }).select("name").lean()
  ]);

  const names = [...legacyProducts, ...v2Products]
    .map((product) => product?.name)
    .filter(Boolean);

  return Array.from(new Set(names));
};

const fetchCategories = async () => {
  const legacyCategories = await (ProductLegacy as any).distinct("category");
  const v2Categories = await (ProductV2 as any).distinct("category");
  const combined = [...legacyCategories, ...v2Categories]
    .map((category) => (category || "").toString().trim())
    .filter(Boolean);
  const unique = Array.from(new Set(combined));
  return unique.length ? unique : categoryLabelsFallback;
};

const expandTokens = (tokens: string[]) => {
  const expanded = new Set(tokens);
  tokens.forEach((token) => {
    if (token === "tshirt") {
      expanded.add("t-shirt");
      expanded.add("t shirt");
    }
    if (token.endsWith("s") && token.length > 3) {
      expanded.add(token.slice(0, -1));
    }
  });
  return Array.from(expanded);
};

const shouldListCategories = (message: string) => {
  const normalized = message.toLowerCase();
  return (
    normalized === "products" ||
    normalized.includes("show products") ||
    normalized.includes("all products") ||
    normalized.includes("/all-products")
  );
};

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ChatbotPayload;
    const message = payload?.message?.trim();

    if (!message) {
      return NextResponse.json({ reply: "Please share a question so I can help." }, { status: 400 });
    }

    const normalized = message.toLowerCase();

    if (includesAny(normalized, shippingKeywords)) {
      return NextResponse.json({ reply: SHIPPING_INFO });
    }

    if (includesAny(normalized, returnKeywords)) {
      return NextResponse.json({ reply: RETURN_POLICY });
    }

    if (includesAny(normalized, trackingKeywords)) {
      return NextResponse.json({ reply: ORDER_TRACKING });
    }

    if (includesAny(normalized, contactKeywords)) {
      return NextResponse.json({ reply: CONTACT_INFO });
    }

    if (includesAny(normalized, wishlistKeywords)) {
      const { userId } = getAuth(request);
      if (!userId) {
        return NextResponse.json({
          reply: "Please sign in to view your wishlist."
        });
      }

      await connectDB();
      const user = await (User as any).findById(userId).select("favorites").lean();
      const favorites = (user?.favorites || []) as string[];

      if (!favorites.length) {
        return NextResponse.json({
          reply: "Your wishlist is empty. Add products to your wishlist to see them here."
        });
      }

      const productNames = await fetchWishlistProductNames(favorites);
      if (!productNames.length) {
        return NextResponse.json({
          reply: "I could not find your wishlist items. Please open /wishlist to view them."
        });
      }

      const list = productNames.map((name) => `• ${name}`).join("\n");
      return NextResponse.json({
        reply: `Here are your liked products:\n\n${list}`
      });
    }

    if (shouldListCategories(normalized)) {
      await connectDB();
      const categories = await fetchCategories();
      return NextResponse.json({
        reply: `You can browse products by category: ${categories.join(", ")}.`
      });
    }

    if (includesAny(normalized, productIntentKeywords) || includesAny(normalized, productKeywords)) {
      await connectDB();

      const tokens = extractSearchTokens(normalized);
      const expandedTokens = expandTokens(tokens.length ? tokens : [normalized]);
      const regexes = buildTokenRegexes(expandedTokens);
      const currency = process.env.NEXT_PUBLIC_CURRENCY || "Rs. ";

      // Example MongoDB query for product search
      // ProductLegacy.find({ $or: [{ name: /query/i }, { category: /query/i }] }).select("name price offerPrice slug").limit(3)
      let matches = await fetchLegacyProducts(regexes);

      if (!matches.length) {
        matches = await fetchV2Products(regexes);
      }

      if (!matches.length) {
        const categories = await fetchCategories();
        return NextResponse.json({
          reply: `I could not find matching products. Try a different keyword or browse categories like: ${categories.join(", ")}. If you meant a category like pants, try related terms such as shorts or jacket.`
        });
      }

      const names = matches
        .map((product) => {
          const priceValue = Number(
            product.offerPrice || product.price || product.minOfferPrice || 0
          );
          const priceLabel = priceValue ? `${currency}${priceValue}` : "Price unavailable";
          const slugPath = product.slug ? ` /product/${product.slug}` : "";
          return `• ${product.name} - ${priceLabel}${slugPath ? ` (${slugPath})` : ""}`;
        })
        .join("\n");
      return NextResponse.json({
        reply: `We found these products:\n\n${names}\n\nView all products at /all-products.`
      });
    }

    return NextResponse.json({
      reply:
        "I can help with products, shipping, returns, order tracking, or contact info. Try asking about one of those."
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    return NextResponse.json({ reply: "Something went wrong. Please try again." }, { status: 500 });
  }
}
