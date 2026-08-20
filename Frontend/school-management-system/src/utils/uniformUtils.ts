import { UniformSize } from '../types';

export interface UniformSizeOption {
  value: string;
  label: string;
}

export const getCategorySizes = (
  itemNameOrCategory: string = '',
  customSizes?: UniformSize[]
): UniformSizeOption[] => {
  const itemLower = (itemNameOrCategory || '').toLowerCase();

  // Helper to format configured custom sizes from Size Configurations
  const formatConfiguredSizes = (sizes: UniformSize[], categoryName: string = ''): UniformSizeOption[] => {
    const itemLow = categoryName.toLowerCase();
    const isTop = itemLow.includes('shirt') || itemLow.includes('blazer') || itemLow.includes('sweater') || itemLow.includes('t-shirt') || itemLow.includes('jacket') || itemLow.includes('top') || itemLow.includes('package') || !itemLow;
    const isBottom = itemLow.includes('pant') || itemLow.includes('trouser') || itemLow.includes('skirt') || itemLow.includes('short') || itemLow.includes('lower');

    const seen = new Set<string>();
    const list: UniformSizeOption[] = [];

    sizes.forEach(s => {
      const name = s.sizeName || (s as any).sizeCodeName || '';
      if (!name || seen.has(name.toLowerCase().trim())) return;
      seen.add(name.toLowerCase().trim());

      const specs: string[] = [];
      if (isTop && s.chest) specs.push(`Chest: ${s.chest}`);
      if (isBottom && s.waist) specs.push(`Waist: ${s.waist}`);
      if (isTop && s.shoulder) specs.push(`Shoulder: ${s.shoulder}`);
      if (s.ageGroup) specs.push(s.ageGroup);

      const specStr = specs.length > 0 ? ` (${specs.join(', ')})` : '';
      list.push({ value: name, label: `${name}${specStr}` });
    });

    if (!seen.has('others')) {
      list.push({ value: 'Others', label: 'Others (Custom Tailored)' });
    }
    return list;
  };

  // 1. Cap / Hat / Headwear
  if (
    itemLower.includes('cap') ||
    itemLower.includes('hat') ||
    itemLower.includes('headwear')
  ) {
    return [
      { value: 'Free Size', label: 'Free Size (Adjustable Cap)' },
      { value: 'Small', label: 'Small (Kids Cap)' },
      { value: 'Medium', label: 'Medium (Junior Cap)' },
      { value: 'Large', label: 'Large (Senior Cap)' }
    ];
  }

  // 2. Footwear / Shoes
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

  // 3. Skirts / Trousers / Pants / Shorts / Bottomwear
  if (
    itemLower.includes('skirt') ||
    itemLower.includes('trouser') ||
    itemLower.includes('pant') ||
    itemLower.includes('short') ||
    itemLower.includes('bottom') ||
    itemLower.includes('lower') ||
    itemLower.includes('trackpant')
  ) {
    if (Array.isArray(customSizes) && customSizes.length > 0) {
      return formatConfiguredSizes(customSizes, itemNameOrCategory);
    }
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

  // 4. Socks
  if (itemLower.includes('sock')) {
    return [
      { value: 'Free Size', label: 'Free Size (Universal)' },
      { value: 'Small', label: 'Small (Kids)' },
      { value: 'Medium', label: 'Medium (Juniors)' },
      { value: 'Large', label: 'Large (Seniors)' }
    ];
  }

  // 5. Tie, Crest, Ribbon, Badges
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

  // 6. Belts
  if (itemLower.includes('belt')) {
    return [
      { value: 'Free Size', label: 'Free Size (Adjustable)' },
      { value: 'S', label: 'S (Small - 24"-28" Waist)' },
      { value: 'M', label: 'M (Medium - 30"-34" Waist)' },
      { value: 'L', label: 'L (Large - 36"-40" Waist)' }
    ];
  }

  // 6. Unstitched Uniform Cloth / Fabric Material
  if (
    itemLower.includes('cloth') ||
    itemLower.includes('fabric') ||
    itemLower.includes('material') ||
    itemLower.includes('unstitched')
  ) {
    return [
      { value: '2.5 Meters', label: '2.5 Meters (Shirt/Trouser Length)' },
      { value: '3.0 Meters', label: '3.0 Meters (Suit/Pants Length)' },
      { value: '4.0 Meters', label: '4.0 Meters (Full Uniform Fabric Set)' },
      { value: '5.0 Meters', label: '5.0 Meters (Suit & Blazer Set Fabric)' },
      { value: 'Unstitched Roll', label: 'Unstitched Roll / Standard Cut' }
    ];
  }

  // 7. Default Tops / Shirts / Blazers / Sweaters / Packages
  if (Array.isArray(customSizes) && customSizes.length > 0) {
    return formatConfiguredSizes(customSizes, itemNameOrCategory);
  }

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

export const getUniformPackageFeeByClass = (className: string = ''): number => {
  return 2000;
};

const checkExactClassMatch = (targetClass: string, configClass: string): boolean => {
  const tClass = (targetClass || '').toLowerCase().trim();
  const cClass = (configClass || '').toLowerCase().trim();

  if (!cClass || cClass === 'all classes' || cClass === 'all') return true;
  if (!tClass) return true;

  const tClean = tClass.replace(/[^a-z0-9]/g, '');
  const cClean = cClass.replace(/[^a-z0-9]/g, '');

  if (tClean === cClean) return true;

  const tNumMatch = tClass.match(/\b(?:class|grade|std)?\s*(\d+)\b/i) || tClass.match(/\b(\d+)\b/);
  const cNumMatch = cClass.match(/\b(?:class|grade|std)?\s*(\d+)\b/i) || cClass.match(/\b(\d+)\b/);

  const tNum = tNumMatch ? tNumMatch[1] : '';
  const cNum = cNumMatch ? cNumMatch[1] : '';

  if (tNum && cNum) {
    return tNum === cNum;
  }

  return tClean === cClean;
};

export const getUniformFeeForClass = (
  className: string = '',
  genderOrConfigs: any = '',
  financeUniformConfigsParam: any[] = []
): number => {
  let gender = '';
  let financeUniformConfigs: any[] = [];

  if (Array.isArray(genderOrConfigs)) {
    financeUniformConfigs = genderOrConfigs;
  } else {
    gender = String(genderOrConfigs || '');
    financeUniformConfigs = financeUniformConfigsParam;
  }

  if (Array.isArray(financeUniformConfigs) && financeUniformConfigs.length > 0) {
    const rawClass = (className || '').toLowerCase().trim();
    const targetGender = (gender || '').toLowerCase().trim();
    const activeConfigs = [...financeUniformConfigs].reverse().filter(c => c && c.status !== 'Inactive');

    const isTargetFemale = targetGender.includes('female') || targetGender.includes('girl');
    const isTargetMale = targetGender.includes('male') || targetGender.includes('boy');

    // 1. Try EXACT gender match first (Male/Boys or Female/Girls)
    const exactGenderMatch = activeConfigs.find(c => {
      if (!checkExactClassMatch(rawClass, c.className)) return false;
      const cGender = (c.gender || '').toLowerCase().trim();
      const cPkg = (c.uniformPackage || '').toLowerCase();

      if (isTargetFemale) {
        return cGender.includes('female') || cGender.includes('girl') || cPkg.includes('girls');
      }
      if (isTargetMale) {
        return (cGender.includes('male') || cGender.includes('boy') || cPkg.includes('boys')) && !cGender.includes('female') && !cPkg.includes('girls');
      }
      return false;
    });

    if (exactGenderMatch && exactGenderMatch.feeAmount && Number(exactGenderMatch.feeAmount) > 0) {
      return Number(exactGenderMatch.feeAmount);
    }

    // 2. Fallback to Unisex or General class match
    const fallbackMatch = activeConfigs.find(c => {
      if (!checkExactClassMatch(rawClass, c.className)) return false;
      const cGender = (c.gender || '').toLowerCase().trim();
      return !cGender || cGender === 'unisex' || cGender === 'all';
    });

    if (fallbackMatch && fallbackMatch.feeAmount && Number(fallbackMatch.feeAmount) > 0) {
      return Number(fallbackMatch.feeAmount);
    }
  }

  return getUniformPackageFeeByClass(className);
};

export const getItemFeeFromFinanceConfig = (
  className: string = '',
  itemName: string = '',
  gender: string = '',
  financeUniformConfigs: any[] = [],
  fallbackPrice?: number
): number => {
  if (Array.isArray(financeUniformConfigs) && financeUniformConfigs.length > 0 && itemName) {
    const targetClassLower = (className || '').toLowerCase().trim();
    const targetItemLower = (itemName || '')
      .toLowerCase()
      .replace(/\(extra\)/gi, '')
      .replace(/\(extra purchase\)/gi, '')
      .trim();
    const targetGenderLower = (gender || '').toLowerCase().trim();

    const activeConfigs = [...financeUniformConfigs].reverse().filter(c => c && c.status !== 'Inactive');

    const match = activeConfigs.find(c => {
      const cClass = (c.className || '').toLowerCase().trim();
      const cPkg = (c.uniformPackage || c.name || '').toLowerCase().trim();
      const cGender = (c.gender || '').toLowerCase().trim();

      const isClassMatch = checkExactClassMatch(targetClassLower, cClass);

      if (!isClassMatch) return false;

      let isItemMatch =
        cPkg === targetItemLower ||
        cPkg.includes(targetItemLower) ||
        targetItemLower.includes(cPkg);

      if (!isItemMatch) {
        if ((targetItemLower.includes('shoe') && cPkg.includes('shoe')) ||
            (targetItemLower.includes('sock') && cPkg.includes('sock')) ||
            (targetItemLower.includes('tie') && cPkg.includes('tie')) ||
            (targetItemLower.includes('belt') && cPkg.includes('belt')) ||
            ((targetItemLower.includes('pant') || targetItemLower.includes('trouser')) && (cPkg.includes('pant') || cPkg.includes('trouser'))) ||
            (targetItemLower.includes('skirt') && cPkg.includes('skirt')) ||
            (targetItemLower.includes('shirt') && cPkg.includes('shirt')) ||
            (targetItemLower.includes('cap') && cPkg.includes('cap'))) {
          isItemMatch = true;
        }
      }

      if (!isItemMatch) return false;

      if (!targetGenderLower || cGender === 'unisex' || !cGender) return true;

      const isFemale = targetGenderLower.includes('female') || targetGenderLower.includes('girl');
      if (isFemale) return cGender.includes('female') || cGender.includes('girl') || cPkg.includes('girls') || cGender === 'unisex';

      return cGender.includes('male') || cGender.includes('boy') || cPkg.includes('boys') || cGender === 'unisex';
    });

    if (match && match.feeAmount && Number(match.feeAmount) > 0) {
      return Number(match.feeAmount);
    }
  }

  if (fallbackPrice && fallbackPrice > 0 && fallbackPrice !== 85) {
    return fallbackPrice;
  }

  return 350;
};

export const getItemPriceFromConfig = (
  itemName: string = '',
  financeUniformConfigs: any[] = [],
  className: string = '',
  gender: string = ''
): number => {
  return getItemFeeFromFinanceConfig(className, itemName, gender, financeUniformConfigs);
};
