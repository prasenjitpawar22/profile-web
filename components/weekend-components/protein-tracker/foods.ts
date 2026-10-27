/* ============================================================
   Everyday Indian food, with the protein in one typical serving.
   Values are rounded home-cooked estimates, not lab numbers:
   good enough to see the shape of a day, which is the point.
   ============================================================ */

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

/** Shown with the Indian food-label marks: green dot, amber egg, red triangle */
export type Diet = 'veg' | 'egg' | 'nonveg'

export type Food = {
  id: string
  name: string
  serving: string
  protein: number
  diet: Diet
  meals: Meal[]
  /** Other names people search by: roti/chapati, anda, dahi… */
  aka?: string
}

export const MEALS: { id: Meal; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snacks', label: 'Snacks' },
]

const B: Meal[] = ['breakfast']
const BS: Meal[] = ['breakfast', 'snacks']
const M: Meal[] = ['lunch', 'dinner']
const S: Meal[] = ['snacks']
const ANY: Meal[] = ['breakfast', 'lunch', 'dinner', 'snacks']

const f = (
  id: string,
  name: string,
  serving: string,
  protein: number,
  diet: Diet,
  meals: Meal[],
  aka?: string,
): Food => ({ id, name, serving, protein, diet, meals, aka })

export const FOODS: Food[] = [
  // Breakfast
  f('poha', 'Poha', '1 plate', 6, 'veg', BS, 'pohe flattened rice'),
  f('upma', 'Upma', '1 bowl', 6, 'veg', B, 'rava sooji'),
  f('idli', 'Idli', '2 pieces', 4, 'veg', B),
  f('dosa', 'Plain dosa', '1 dosa', 4, 'veg', B),
  f('masala-dosa', 'Masala dosa', '1 dosa', 6, 'veg', BS),
  f('rava-dosa', 'Rava dosa', '1 dosa', 4, 'veg', B),
  f('uttapam', 'Onion uttapam', '1 piece', 6, 'veg', B),
  f('medu-vada', 'Medu vada', '2 pieces', 6, 'veg', BS, 'vadai'),
  f('pongal', 'Ven pongal', '1 bowl', 7, 'veg', B),
  f('aloo-paratha', 'Aloo paratha', '1 paratha', 6, 'veg', B),
  f('paneer-paratha', 'Paneer paratha', '1 paratha', 11, 'veg', B),
  f('thepla', 'Methi thepla', '2 thepla', 6, 'veg', BS),
  f('besan-chilla', 'Besan chilla', '2 chillas', 12, 'veg', B, 'cheela pudla gram flour'),
  f('moong-chilla', 'Moong dal chilla', '2 chillas', 14, 'veg', B, 'cheela pesarattu'),
  f('sabudana', 'Sabudana khichdi', '1 bowl', 4, 'veg', B, 'sago'),
  f('misal-pav', 'Misal pav', '1 plate', 14, 'veg', BS, 'usal'),
  f('puri-bhaji', 'Puri bhaji', '3 puris', 8, 'veg', B, 'poori'),
  f('dhokla', 'Khaman dhokla', '4 pieces', 8, 'veg', BS),
  f('oats-milk', 'Oats with milk', '1 bowl', 10, 'veg', B, 'porridge'),
  f('pintola-oats', 'Pintola high protein oats', '1 bowl, 50 g', 12.5, 'veg', B, 'oats porridge'),
  f('plain-oats', 'Plain oats', '1 bowl, 40 g', 5, 'veg', B, 'porridge'),
  f('besan-paratha', 'Besan paratha', '1 paratha', 6, 'veg', B, 'gram flour'),
  f('plain-paratha', 'Plain paratha', '1 paratha', 4, 'veg', ['breakfast', 'lunch', 'dinner']),
  f('bread', 'Bread', '1 slice', 3, 'veg', BS, 'toast pav'),
  f('boiled-eggs', 'Boiled eggs', '2 eggs', 12, 'egg', ANY, 'anda'),
  f('omelette', 'Masala omelette', '2 eggs', 13, 'egg', B, 'anda omlet'),
  f('egg-bhurji', 'Egg bhurji', '2 eggs', 13, 'egg', ['breakfast', 'dinner'], 'anda bhurji scrambled'),
  f('bread-omelette', 'Bread omelette', '2 eggs, 2 slices', 17, 'egg', BS),
  f('egg-whites', 'Egg whites', '3 whites', 11, 'egg', ANY, 'anda'),

  // Breads & rice
  f('roti', 'Roti', '1 roti', 3, 'veg', M, 'chapati phulka'),
  f('bhakri', 'Jowar bhakri', '1 bhakri', 3, 'veg', M, 'jowar roti millet'),
  f('bati', 'Bati', '1 bati', 4, 'veg', M, 'baati dal bati'),
  f('naan', 'Butter naan', '1 naan', 8, 'veg', M),
  f('rice', 'Steamed rice', '1 cup', 4, 'veg', M, 'chawal'),
  f('jeera-rice', 'Jeera rice', '1 cup', 4, 'veg', M),
  f('curd-rice', 'Curd rice', '1 bowl', 7, 'veg', M, 'dahi chawal thayir sadam'),
  f('khichdi', 'Dal khichdi', '1 bowl', 8, 'veg', M),

  // Dal & sabzi
  f('dal-tadka', 'Dal tadka', '1 bowl', 9, 'veg', M, 'dal fry toor'),
  f('dal-makhani', 'Dal makhani', '1 bowl', 9, 'veg', M),
  f('moong-dal', 'Moong dal', '1 bowl', 9, 'veg', M),
  f('rajma', 'Rajma', '1 bowl', 10, 'veg', M, 'kidney beans'),
  f('chole', 'Chole', '1 bowl', 11, 'veg', M, 'chana masala chickpeas'),
  f('kadhi', 'Kadhi', '1 bowl', 6, 'veg', M),
  f('sambar', 'Sambar', '1 bowl', 6, 'veg', ['breakfast', 'lunch', 'dinner']),
  f('rasam', 'Rasam', '1 bowl', 2, 'veg', M),
  f('matki-usal', 'Matki usal', '1 bowl', 10, 'veg', M, 'moth beans sprouts'),
  f('soya-curry', 'Soya chunks curry', '50 g dry', 26, 'veg', M, 'nutrela meal maker'),
  f('aloo-gobi', 'Aloo gobi', '1 bowl', 4, 'veg', M),
  f('bhindi', 'Bhindi masala', '1 bowl', 3, 'veg', M, 'okra lady finger'),
  f('baingan', 'Baingan bharta', '1 bowl', 3, 'veg', M, 'brinjal vangi'),
  f('mix-veg', 'Mixed veg sabzi', '1 bowl', 4, 'veg', M),
  f('palak-paneer', 'Palak paneer', '1 bowl', 14, 'veg', M),
  f('paneer-butter', 'Paneer butter masala', '1 bowl', 14, 'veg', M),
  f('matar-paneer', 'Matar paneer', '1 bowl', 12, 'veg', M),
  f('paneer-bhurji', 'Paneer bhurji', '100 g paneer', 18, 'veg', ['breakfast', 'lunch', 'dinner']),
  f('tofu-bhurji', 'Tofu bhurji', '100 g tofu', 10, 'veg', ANY),
  f('veg-biryani', 'Veg biryani', '1 plate', 9, 'veg', M, 'pulao'),
  f('veg-thali', 'Veg thali', '1 thali', 20, 'veg', M),

  // Non-veg
  f('chicken-curry', 'Chicken curry', '1 bowl', 27, 'nonveg', M),
  f('butter-chicken', 'Butter chicken', '1 bowl', 25, 'nonveg', M, 'murgh makhani'),
  f('chicken-biryani', 'Chicken biryani', '1 plate', 25, 'nonveg', M),
  f('tandoori', 'Tandoori chicken', '2 leg pieces', 32, 'nonveg', M),
  f('chicken-tikka', 'Chicken tikka', '6 pieces', 30, 'nonveg', ['lunch', 'dinner', 'snacks']),
  f('chicken-breast', 'Grilled chicken breast', '150 g', 46, 'nonveg', M),
  f('chicken-65', 'Chicken 65', '1 bowl', 22, 'nonveg', S),
  f('egg-curry', 'Egg curry', '2 eggs', 13, 'egg', M, 'anda curry'),
  f('egg-fried-rice', 'Egg fried rice', '1 plate', 12, 'egg', M, 'anda'),
  f('mutton-curry', 'Mutton curry', '1 bowl', 25, 'nonveg', M, 'gosht'),
  f('mutton-biryani', 'Mutton biryani', '1 plate', 24, 'nonveg', M),
  f('keema', 'Keema', '1 bowl', 22, 'nonveg', M, 'kheema mince'),
  f('fish-curry', 'Fish curry', '1 bowl', 22, 'nonveg', M, 'machli'),
  f('fish-fry', 'Fish fry', '1 piece', 18, 'nonveg', M, 'surmai pomfret rava fry'),
  f('prawn-masala', 'Prawn masala', '1 bowl', 20, 'nonveg', M, 'kolambi jhinga shrimp'),

  // Snacks & street food
  f('samosa', 'Samosa', '1 piece', 4, 'veg', S),
  f('vada-pav', 'Vada pav', '1 piece', 6, 'veg', S),
  f('kachori', 'Kachori', '1 piece', 4, 'veg', S),
  f('pav-bhaji', 'Pav bhaji', '1 plate', 10, 'veg', ['snacks', 'dinner']),
  f('bhel', 'Bhel puri', '1 plate', 5, 'veg', S),
  f('pani-puri', 'Pani puri', '6 puris', 3, 'veg', S, 'golgappa puchka'),
  f('pakora', 'Onion pakora', '1 plate', 4, 'veg', S, 'bhaji bhajiya'),
  f('veg-momos', 'Veg momos', '6 pieces', 6, 'veg', S),
  f('chicken-momos', 'Chicken momos', '6 pieces', 14, 'nonveg', S),
  f('paneer-tikka', 'Paneer tikka', '6 pieces', 20, 'veg', ['snacks', 'dinner']),
  f('sprouts', 'Sprouts chaat', '1 bowl', 9, 'veg', BS, 'moong salad'),
  f('roasted-chana', 'Roasted chana', '30 g', 6, 'veg', S, 'chickpeas'),
  f('peanuts', 'Roasted peanuts', '30 g', 8, 'veg', S, 'shengdana moongphali'),
  f('makhana', 'Roasted makhana', '30 g', 3, 'veg', S, 'fox nuts'),
  f('peanut-butter', 'Peanut butter', '1 tbsp', 4, 'veg', BS),
  f('almonds', 'Almonds', '20 almonds', 5, 'veg', S, 'badam'),
  f('chikki', 'Peanut chikki', '1 piece', 3, 'veg', S),
  f('banana', 'Banana', '1 banana', 1, 'veg', BS),

  // Dairy & supplements
  f('milk', 'Milk', '1 glass, 250 ml', 8, 'veg', ANY, 'doodh'),
  f('curd', 'Curd', '1 bowl, 150 g', 5, 'veg', ANY, 'dahi yogurt'),
  f('hung-curd', 'Hung curd', '100 g', 10, 'veg', ANY, 'greek yogurt'),
  f('chaas', 'Chaas', '1 glass', 3, 'veg', ANY, 'buttermilk mattha'),
  f('lassi', 'Sweet lassi', '1 glass', 7, 'veg', S),
  f('paneer', 'Paneer', '100 g', 18, 'veg', ANY, 'cottage cheese'),
  f('cheese-slice', 'Cheese slice', '1 slice', 4, 'veg', BS),
  f('masala-chai', 'Masala chai', '1 cup', 3, 'veg', BS, 'tea'),
  f('whey', 'Whey protein', '1 scoop', 24, 'veg', ANY, 'shake'),
  f('protein-bar', 'Protein bar', '1 bar', 20, 'veg', S),
]
