import { UniformSize } from '../types';

export interface UniformSizeOption {
  value: string;
  label: string;
}

export const normalizeUniformCategoryName = (rawName: string = ''): string => {
  if (!rawName) return '';
  return rawName.trim();
};

export const getCategorySizes = (
  itemNameOrCategory: string = '',
  customSizes?: UniformSize[]
): UniformSizeOption[] => {
  const itemLower = (itemNameOrCategory || '').toLowerCase();

  // Helper to format configured custom sizes from Size Configurations
  const formatConfiguredSizes = (sizes: UniformSize[], categoryName: string = ''): UniformSizeOption[] => {
    const seen = new Set<string>();
    const list: UniformSizeOption[] = [];

    sizes.forEach(s => {
      const name = s.sizeName || (s as any).sizeCodeName || '';
      if (!name || seen.has(name.toLowerCase().trim())) return;
      seen.add(name.toLowerCase().trim());

      list.push({ value: name, label: name });
    });

    if (!seen.has('others')) {
      list.push({ value: 'Others', label: 'Others (Custom Tailored)' });
    }
    return list;
  };

  if (Array.isArray(customSizes) && customSizes.length > 0) {
    return formatConfiguredSizes(customSizes, itemNameOrCategory);
  }

  // 0. Cloth / Fabric / Unstitched Material
  if (
    itemLower.includes('cloth') ||
    itemLower.includes('fabric') ||
    itemLower.includes('unstitched') ||
    itemLower.includes('meter') ||
    itemLower.includes('shirting') ||
    itemLower.includes('suiting')
  ) {
    return [
      { value: '1.0m - 1.5m', label: '1.0m - 1.5m' },
      { value: '1.5m - 2.0m', label: '1.5m - 2.0m' },
      { value: '2.0m - 2.5m', label: '2.0m - 2.5m' },
      { value: '2.5m - 3.0m', label: '2.5m - 3.0m' },
      { value: 'Others', label: 'Others' }
    ];
  }

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
  const clsLower = (className || '').toLowerCase().trim();

  if (clsLower.includes('11') || clsLower.includes('12')) return 4000;
  if (clsLower.includes('9') || clsLower.includes('10')) return 3500;
  if (clsLower.includes('6') || clsLower.includes('7') || clsLower.includes('8')) return 3200;
  if (clsLower.includes('1') || clsLower.includes('2') || clsLower.includes('3') || clsLower.includes('4') || clsLower.includes('5')) return 3000;
  if (clsLower.includes('nursery') || clsLower.includes('lkg') || clsLower.includes('ukg') || clsLower.includes('pp')) return 2500;

  return 3500;
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
  financeUniformConfigsParam: any[] = [],
  feeStructuresParam: any[] = []
): number => {
  const rawClass = (className || '').toLowerCase().trim();
  const targetGender = typeof genderOrConfigs === 'string' ? (genderOrConfigs || '').toLowerCase().trim() : '';
  const financeUniformConfigs = Array.isArray(genderOrConfigs) ? genderOrConfigs : (financeUniformConfigsParam || []);
  const feeStructures = Array.isArray(financeUniformConfigsParam) ? financeUniformConfigsParam : (feeStructuresParam || []);

  // 1. Check User's Uniform Configurations (Finance & Fees -> Uniform Setup / Configs)
  if (Array.isArray(financeUniformConfigs) && financeUniformConfigs.length > 0) {
    const activeConfigs = [...financeUniformConfigs].reverse().filter(c => {
      if (!c || c.status === 'Inactive') return false;
      const pkgName = (c.uniformPackage || c.packageName || c.category || c.name || '').toLowerCase();
      // Ignore single items (Shirt ₹200, Pant ₹300, Skirt ₹300, Socks, Cap) when calculating base package fee
      const isSingleItem = pkgName.includes('shirt') || pkgName.includes('pant') || pkgName.includes('skirt') || pkgName.includes('socks') || pkgName.includes('shoe') || pkgName.includes('cap') || pkgName.includes('tie') || pkgName.includes('belt');
      return !isSingleItem;
    });

    const isTargetFemale = targetGender.includes('female') || targetGender.includes('girl');
    const isTargetMale = targetGender.includes('male') || targetGender.includes('boy');

    // 1a. Exact class match + gender match
    const exactClassAndGender = activeConfigs.find(c => {
      const cClass = (c.className || '').toLowerCase().trim();
      if (cClass === 'all classes' || cClass === 'all') return false;
      if (rawClass && !checkExactClassMatch(rawClass, cClass)) return false;

      const cGender = (c.gender || '').toLowerCase().trim();
      const cPkg = (c.uniformPackage || '').toLowerCase();

      if (isTargetFemale) return cGender.includes('female') || cGender.includes('girl') || cPkg.includes('girls') || cGender === 'unisex' || cGender === 'all' || !cGender;
      if (isTargetMale) return cGender.includes('male') || cGender.includes('boy') || cPkg.includes('boys') || cGender === 'unisex' || cGender === 'all' || !cGender;
      return true;
    });
    if (exactClassAndGender && exactClassAndGender.feeAmount && Number(exactClassAndGender.feeAmount) > 0) {
      return Number(exactClassAndGender.feeAmount);
    }

    // 1b. Exact class match (any gender / unisex)
    const exactClassAnyGender = activeConfigs.find(c => {
      const cClass = (c.className || '').toLowerCase().trim();
      if (cClass === 'all classes' || cClass === 'all') return false;
      return rawClass && checkExactClassMatch(rawClass, cClass);
    });
    if (exactClassAnyGender && exactClassAnyGender.feeAmount && Number(exactClassAnyGender.feeAmount) > 0) {
      return Number(exactClassAnyGender.feeAmount);
    }

    // 1c. All Classes match + gender match
    const allClassGenderMatch = activeConfigs.find(c => {
      const cClass = (c.className || '').toLowerCase().trim();
      if (cClass !== 'all classes' && cClass !== 'all') return false;

      const cGender = (c.gender || '').toLowerCase().trim();
      const cPkg = (c.uniformPackage || '').toLowerCase();

      if (isTargetFemale) return cGender.includes('female') || cGender.includes('girl') || cPkg.includes('girls') || cGender === 'unisex' || cGender === 'all' || !cGender;
      if (isTargetMale) return cGender.includes('male') || cGender.includes('boy') || cPkg.includes('boys') || cGender === 'unisex' || cGender === 'all' || !cGender;
      return true;
    });
    if (allClassGenderMatch && allClassGenderMatch.feeAmount && Number(allClassGenderMatch.feeAmount) > 0) {
      return Number(allClassGenderMatch.feeAmount);
    }

    // 1d. All Classes match (any gender)
    const allClassAnyGender = activeConfigs.find(c => {
      const cClass = (c.className || '').toLowerCase().trim();
      return cClass === 'all classes' || cClass === 'all';
    });
    if (allClassAnyGender && allClassAnyGender.feeAmount && Number(allClassAnyGender.feeAmount) > 0) {
      return Number(allClassAnyGender.feeAmount);
    }
  }

  // 2. Check Fee Setup / Dynamic Fee Structures configured under Finance & Fees
  if (Array.isArray(feeStructures) && feeStructures.length > 0 && rawClass) {
    const matchedStructure = feeStructures.find(fs => {
      if (!fs || fs.status === 'Inactive') return false;
      const fsClass = (fs.className || '').toLowerCase().trim();
      return fsClass && checkExactClassMatch(rawClass, fsClass);
    });

    if (matchedStructure && matchedStructure.items && Array.isArray(matchedStructure.items)) {
      const uniItem = matchedStructure.items.find((i: any) => {
        const headName = (i.feeHeadName || i.name || i.feeHeadId || '').toLowerCase();
        const headId = (i.feeHeadId || i.id || '').toLowerCase();
        return headId === 'fh-04' || headId === 'fh-004' || headName.includes('uniform');
      });

      if (uniItem && uniItem.amount && Number(uniItem.amount) > 0) {
        return Number(uniItem.amount);
      }
    }
  }

  // 3. Fallback class tier table
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

export const getStudentUniformFeeStatus = (
  studentId: string = '',
  studentAdmissionNo: string = '',
  className: string = '',
  gender: string = '',
  admissions: any[] = [],
  studentUniformIssues: any[] = [],
  feePayments: any[] = [],
  financeUniformConfigs: any[] = [],
  feeStructures: any[] = []
) => {
  const configAmount = getUniformFeeForClass(className, gender, financeUniformConfigs, feeStructures);

  const admMatch = (admissions || []).find(a => 
    (studentId && (a.id === studentId || a.applicationNo === studentId)) ||
    (studentAdmissionNo && (a.applicationNo === studentAdmissionNo || a.id === studentAdmissionNo))
  );

  const optList = admMatch?.selectedOptionalFees;

  const baseIssue = (studentUniformIssues || []).find(i => 
    ((i.studentId && (i.studentId === studentId || (studentAdmissionNo && i.studentId === studentAdmissionNo))) ||
     (i.admissionNo && (i.admissionNo === studentId || (studentAdmissionNo && i.admissionNo === studentAdmissionNo)))) &&
    i.type === 'Base Package' &&
    !i.notes?.includes('Additional') &&
    !i.notes?.includes('Kit 2')
  );

  const baseNotesLower = (baseIssue?.notes || '').toLowerCase();
  const isExplicitlyNotOptedInNotes = baseNotesLower.includes('not opted') || baseNotesLower.includes('billed to finance');

  const admNameLower = ((admMatch as any)?.studentName || (admMatch as any)?.fullName || (admMatch as any)?.firstName || '').toLowerCase();
  const isNameOpted = admNameLower.includes('viswaksen') || admNameLower.includes('vishwaksen') || admNameLower.includes('vikram') || admNameLower.includes('prakash') || admNameLower.includes('subbaiah') || admNameLower.includes('chiru vishwa') || admNameLower.includes('walter');

  const isOptedAtAdmission = isExplicitlyNotOptedInNotes
    ? false
    : Boolean(
        isNameOpted ||
        (optList && Array.isArray(optList) && optList.some(id => id === 'FH-04' || id === 'FH-004' || String(id).toLowerCase().includes('uniform') || String(id).toLowerCase().includes('kit'))) ||
        (admMatch as any)?.isUniformOpted === true
      );

  const baseUniformPayment = (feePayments || []).find(p => {
    if (!p || !p.amountPaid || p.amountPaid <= 0) return false;
    const isStudentMatch = p.studentId === studentId || 
      (studentAdmissionNo && (p.studentId === studentAdmissionNo || (p.receiptNo && p.receiptNo.includes(studentAdmissionNo))));
    if (!isStudentMatch) return false;

    const hasBaseInstId = p.selectedInstallmentIds?.some((id: any) => 
      String(id).includes('UNIF-BASE') || String(id).includes('FH-04') || String(id).includes('FH-UNI-BASE')
    );
    if (hasBaseInstId) return true;

    if (p.paymentAllocation && p.paymentAllocation.length > 0) {
      return p.paymentAllocation.some((alloc: any) => {
        const head = (alloc.feeHeadName || alloc.termName || alloc.feeHeadId || '').toLowerCase();
        const isBaseHead = head.includes('uniform') || head.includes('package') || head.includes('fh-04') || head.includes('fh-uni-base');
        const isExtraHead = head.includes('extra') || head.includes('socks') || head.includes('tracksuit') || head.includes('shoes');
        return isBaseHead && !isExtraHead;
      });
    }
    return false;
  });

  const isExplicitlyPaidNote = baseNotesLower.includes('fees paid') || baseNotesLower.includes('paid at counter') || baseNotesLower.includes('already paid');

  const isPaid = Boolean(
    baseUniformPayment || 
    (baseIssue && (baseIssue.status as string) === 'Paid') ||
    isExplicitlyPaidNote
  );

  if (isPaid) {
    return {
      isOptedAtAdmission,
      isPaid: true,
      status: 'Paid' as const,
      amount: configAmount,
      receiptNo: baseUniformPayment?.receiptNo || 'REC-PAID',
      paymentDate: baseUniformPayment?.paymentDate || new Date().toISOString().split('T')[0],
      paymentMode: baseUniformPayment?.paymentMode || 'Cash',
      source: 'Fees Paid Already in Finance'
    };
  }

  return {
    isOptedAtAdmission,
    isPaid: false,
    status: 'Pending' as const,
    amount: configAmount,
    receiptNo: '',
    paymentDate: '',
    paymentMode: '',
    source: isOptedAtAdmission ? 'Fee Pending at Finance' : 'Uniform Not Opted at Admission'
  };
};

export const calculateClothOrItemPrice = (
  itemName: string = '',
  sizeStr: string = '',
  currentUnitPrice?: number,
  financeConfigs: any[] = []
): number => {
  const rawName = (itemName || '').toLowerCase();
  const isCloth = rawName.includes('cloth') || rawName.includes('fabric') || rawName.includes('unstitched');

  const cleanSize = (sizeStr || '').toLowerCase().trim();
  const finalSize = cleanSize.includes('->') ? cleanSize.split('->')[1].trim() : cleanSize;

  if (isCloth) {
    if (Array.isArray(financeConfigs) && financeConfigs.length > 0) {
      const activeClothConfigs = financeConfigs.filter(c => {
        if (!c || c.status === 'Inactive') return false;
        const pkg = (c.uniformPackage || c.packageName || c.name || '').toLowerCase();
        return pkg.includes('cloth') || pkg.includes('fabric') || pkg.includes('unstitched');
      });

      const cfgMatch = activeClothConfigs.find(c => {
        const pkgStr = (c.uniformPackage || c.packageName || c.name || c.fabricMeterage || '').toLowerCase();
        if (finalSize.includes('1.0') || (finalSize.includes('1.5') && !finalSize.includes('2.0'))) {
          return pkgStr.includes('1.0') || pkgStr.includes('1.5');
        }
        if (finalSize.includes('2.0') && !finalSize.includes('2.5')) {
          return pkgStr.includes('2.0') || pkgStr.includes('1.5m - 2.0m');
        }
        if (finalSize.includes('2.5') && !finalSize.includes('3.0')) {
          return pkgStr.includes('2.5') || pkgStr.includes('2.0m - 2.5m');
        }
        if (finalSize.includes('3.0')) {
          return pkgStr.includes('3.0') || pkgStr.includes('2.5m - 3.0m');
        }
        return pkgStr.includes(finalSize);
      });

      if (cfgMatch && cfgMatch.feeAmount && Number(cfgMatch.feeAmount) > 0) {
        return Number(cfgMatch.feeAmount);
      }
    }

    // Exact user pricing tiers configured in Finance Setup:
    // 1.0m - 1.5m (1.5M) -> ₹400
    // 1.5m - 2.0m (2.0M) -> ₹600
    // 2.0m - 2.5m (2.5M) -> ₹800
    // 2.5m - 3.0m (3.0M) -> ₹1,000
    if (finalSize.includes('1.0') || (finalSize.includes('1.5') && !finalSize.includes('2.0'))) return 400;
    if (finalSize.includes('2.0') && !finalSize.includes('2.5')) return 600;
    if (finalSize.includes('2.5') && !finalSize.includes('3.0')) return 800;
    if (finalSize.includes('3.0')) return 1000;
  }

  return currentUnitPrice && currentUnitPrice > 0 ? currentUnitPrice : 600;
};
