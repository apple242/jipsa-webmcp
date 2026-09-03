import type { Store } from "./types";

const baseSizes = ["Mini · serves 2", "Small · serves 4", "Medium · serves 6", "Large · serves 10"];
const baseColors = ["White", "Lavender", "Light pink", "Butter yellow"];
const baseStyles = ["Classic piping", "Vintage heart", "Minimal floral", "Ribbon"];

const cakeSeeds = [
  ["mellow-cake", "Mellow Cake", "Seongsu", 1.2, 38000, "Soft vintage cakes finished by hand", ["14:00", "16:00", "17:30"], true],
  ["dear-cake", "Dear Cake", "Ttukseom", 2.1, 40000, "Playful ribbon cakes for small celebrations", ["13:30", "16:30", "18:00"], true],
  ["cake-forest", "Cake Forest", "Seoul Forest", 2.8, 43000, "Botanical cakes with seasonal fruit", ["12:00", "17:00"], true],
  ["butter-note", "Butter Note", "Seongsu", 0.8, 52000, "French buttercream and quiet, modern details", ["14:30", "16:00"], true],
  ["maison-onda", "Maison Onda", "Konkuk", 1.7, 47000, "Graphic celebration cakes in subtle colors", ["13:00", "17:30"], false],
  ["peach-room", "Peach Room", "Songjeong", 2.4, 36000, "Tiny cakes, bows, and bright seasonal flavors", ["15:30", "18:00"], true],
  ["studio-sunday", "Studio Sunday", "Seongsu", 3.4, 41000, "Relaxed cakes inspired by weekend tables", ["12:30", "16:00"], true],
  ["little-cloud", "Little Cloud", "Jayang", 2.9, 34000, "Airy sponge cakes with cloudlike cream", ["11:00", "14:00"], true],
  ["flour-letter", "Flour Letter", "Wangsimni", 3.8, 39000, "Message cakes with careful hand lettering", ["16:00", "19:00"], true],
  ["berry-table", "Berry Table", "Guui", 4.2, 44000, "Fruit-forward cakes made to share", ["13:00", "17:00"], true],
  ["atelier-bom", "Atelier Bom", "Hwayang", 2.6, 58000, "Sculptural buttercream for milestone days", ["12:00", "15:00"], false],
  ["honey-crumb", "Honey & Crumb", "Majang", 3.1, 32000, "Home-style sponge with honeyed cream", ["10:30", "14:30"], true],
  ["june-bakes", "June Bakes", "Seongsu", 1.5, 49000, "Painterly floral cakes in muted palettes", ["11:30", "18:30"], true],
  ["slow-frost", "Slow Frost", "Hannam", 5.6, 54000, "Low-sugar cream and restrained decoration", ["13:30", "16:30"], false],
  ["picnic-cake", "Picnic Cake", "Children's Grand Park", 3.7, 35000, "Cheerful cakes made for park gatherings", ["12:00", "15:30"], true],
  ["vanilla-archive", "Vanilla Archive", "Sindang", 4.8, 61000, "Elegant layered cakes with archival recipes", ["14:00", "17:00"], false],
  ["tiny-wish", "Tiny Wish", "Ttukseom", 2.2, 30000, "Bento cakes for intimate birthday wishes", ["13:00", "18:00"], true],
  ["olive-whisk", "Olive Whisk", "Geumho", 4.4, 46000, "Earthy colors and fragrant tea flavors", ["12:30", "16:30"], true],
  ["cotton-day", "Cotton Day", "Junggok", 3.3, 37000, "Soft pastel cakes with cloud piping", ["14:00", "17:30"], true],
  ["clove-cake-club", "Clove Cake Club", "Eungbong", 2.7, 42000, "Spiced sponge and contemporary decoration", ["11:00", "15:00"], true],
] as const;

const alternateFlavors = [
  ["Vanilla", "Chocolate", "Earl Grey"],
  ["Vanilla", "Lemon", "Strawberry"],
  ["Chocolate", "Matcha", "Vanilla"],
  ["Earl Grey", "Carrot", "Chocolate"],
];

export const cakeStores: Store[] = cakeSeeds.map((seed, index) => {
  const [id, name, neighborhood, distanceKm, basePrice, description, pickupSlots, lettering] = seed;
  const showcase = index < 3;
  const flavors = showcase ? ["Vanilla", "Chocolate", "Strawberry"] : alternateFlavors[index % alternateFlavors.length];
  const fillings = showcase ? ["Fresh strawberry", "Raspberry jam", "Vanilla cream"] : ["Vanilla cream", index % 2 ? "Lemon curd" : "Chocolate ganache"];
  const creamColors = showcase ? baseColors : baseColors.filter((_, colorIndex) => colorIndex !== index % baseColors.length);

  return {
    id,
    name,
    neighborhood,
    distanceKm,
    rating: Number((4.6 + (index % 4) * 0.1).toFixed(1)),
    reviewCount: 38 + index * 13,
    priceRange: [basePrice, basePrice + 44000],
    description,
    imageIndex: index % 8,
    sameDay: index % 3 === 0,
    rush: index % 4 !== 1,
    pickupSlots: [...pickupSlots],
    tags: [index % 2 ? "Made to order" : "Local favorite", index % 3 ? "Pickup" : "Same day"],
    product: {
      id: `${id}-signature`,
      name: index === 0 ? "Strawberry Letter Cake" : `${name} Signature Cake`,
      basePrice,
      sizes: baseSizes,
      servings: [2, 4, 6, 10],
      flavors: [...flavors],
      fillings,
      ingredients: showcase ? ["Strawberry", "Dairy", "Egg", "Wheat"] : [index % 2 ? "Lemon" : "Chocolate", "Dairy", "Egg", "Wheat"],
      creamColors,
      designStyles: baseStyles,
      lettering,
      extras: [
        { name: "Fresh berry crown", price: 6000 },
        { name: "Handmade candles", price: 3000 },
        { name: "Gift box", price: 2500 },
      ],
    },
  };
});

export const categorySchemas = {
  cakes: ["size", "servings", "flavor", "filling", "creamColor", "lettering", "pickupTime"],
} as const;

export function getStore(storeId: string) {
  return cakeStores.find((store) => store.id === storeId);
}

export function imagePosition(index: number) {
  const safeIndex = ((index % 8) + 8) % 8;
  const column = safeIndex % 4;
  const row = Math.floor(safeIndex / 4);
  return `${(column / 3) * 100}% ${row * 100}%`;
}

export function imageIndexForColor(color: string, fallback: number) {
  const colorMap: Record<string, number> = {
    White: 0,
    Ivory: 4,
    Lavender: 1,
    "Light pink": 2,
    Sage: 5,
    "Butter yellow": 6,
    "Sky blue": 7,
  };
  return colorMap[color] ?? fallback;
}
