export interface UniformSizeOption {
  value: string;
  label: string;
}

export const getCategorySizes = (itemNameOrCategory: string = ''): UniformSizeOption[] => {
  const itemLower = (itemNameOrCategory || '').toLowerCase();

  // 1. Footwear / Shoes
  if (
    itemLower.includes('shoe') ||
    itemLower.includes('footwear') ||
    itemLower.includes('boot') ||
    itemLower.includes('sneaker')
  ) {
    return [
      { value: '3', label: 'Size 3 (Footwear)' },
      { value: '4', label: 'Size 4 (Footwear)' },
      { value: '5', label: 'Size 5 (Footwear)' },
      { value: '6', label: 'Size 6 (Footwear)' },
      { value: '7', label: 'Size 7 (Footwear)' },
      { value: '8', label: 'Size 8 (Footwear)' },
      { value: '9', label: 'Size 9 (Footwear)' },
      { value: '10', label: 'Size 10 (Footwear)' },
      { value: '11', label: 'Size 11 (Footwear)' },
      { value: 'Others', label: 'Others (Custom Size)' }
    ];
  }

  // 2. Skirts / Trousers / Pants / Shorts / Bottomwear
  if (
    itemLower.includes('skirt') ||
    itemLower.includes('trouser') ||
    itemLower.includes('pant') ||
    itemLower.includes('short') ||
    itemLower.includes('bottom') ||
    itemLower.includes('lower') ||
    itemLower.includes('trackpant')
  ) {
    return [
      { value: '22', label: '22" Waist (Primary)' },
      { value: '24', label: '24" Waist (Primary)' },
      { value: '26', label: '26" Waist (Middle Wing)' },
      { value: '28', label: '28" Waist (Middle/Senior)' },
      { value: '30', label: '30" Waist (Senior Wing)' },
      { value: '32', label: '32" Waist (Senior Wing)' },
      { value: '34', label: '34" Waist (Large)' },
      { value: '36', label: '36" Waist (XL)' },
      { value: '38', label: '38" Waist (XXL)' },
      { value: '40', label: '40" Waist (3XL)' },
      { value: 'S', label: 'S (Small - 26"-28")' },
      { value: 'M', label: 'M (Medium - 30"-32")' },
      { value: 'L', label: 'L (Large - 34"-36")' },
      { value: 'XL', label: 'XL (Extra Large - 38"-40")' },
      { value: 'Others', label: 'Others (Custom Tailored)' }
    ];
  }

  // 3. Socks
  if (itemLower.includes('sock')) {
    return [
      { value: 'Free Size', label: 'Free Size (Universal)' },
      { value: 'Small', label: 'Small (Kids)' },
      { value: 'Medium', label: 'Medium (Juniors)' },
      { value: 'Large', label: 'Large (Seniors)' }
    ];
  }

  // 4. Tie, Crest, Ribbon, Badges
  if (
    itemLower.includes('tie') ||
    itemLower.includes('crest') ||
    itemLower.includes('ribbon') ||
    itemLower.includes('badge')
  ) {
    return [
      { value: 'Free Size', label: 'Free Size (Standard)' },
      { value: 'Small', label: 'Small (Junior)' },
      { value: 'Medium', label: 'Medium (Standard)' },
      { value: 'Large', label: 'Large (Senior)' }
    ];
  }

  // 5. Belts
  if (itemLower.includes('belt')) {
    return [
      { value: 'Free Size', label: 'Free Size (Adjustable)' },
      { value: 'S', label: 'S (Small - 24"-28" Waist)' },
      { value: 'M', label: 'M (Medium - 30"-34" Waist)' },
      { value: 'L', label: 'L (Large - 36"-40" Waist)' }
    ];
  }

  // 6. Default Tops / Shirts / Blazers / Sweaters / Packages
  return [
    { value: '28', label: '28" Chest (Kids)' },
    { value: '30', label: '30" Chest (Junior)' },
    { value: '32', label: '32" Chest' },
    { value: '34', label: '34" Chest' },
    { value: '36', label: '36" Chest' },
    { value: '38', label: '38" Chest' },
    { value: '40', label: '40" Chest' },
    { value: '42', label: '42" Chest' },
    { value: 'S', label: 'S (Small)' },
    { value: 'M', label: 'M (Medium)' },
    { value: 'L', label: 'L (Large)' },
    { value: 'XL', label: 'XL (Extra Large)' },
    { value: 'XXL', label: 'XXL (Double Extra Large)' },
    { value: 'Others', label: 'Others (Custom Tailored)' }
  ];
};
