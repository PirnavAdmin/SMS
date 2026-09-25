/**
 * Converts a number into Indian English words format (e.g. 177820 -> "One Lakh Seventy-Seven Thousand Eight Hundred Twenty Only")
 */
export function numberToWords(num: number): string {
  if (num === null || num === undefined || isNaN(num) || num === 0) {
    return 'Zero Only';
  }

  const rounded = Math.floor(Math.abs(num));
  if (rounded === 0) return 'Zero Only';

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return units[n];
    const t = Math.floor(n / 10);
    const u = n % 10;
    return tens[t] + (u > 0 ? '-' + units[u] : '');
  }

  function convertThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    let str = '';
    if (h > 0) {
      str += units[h] + ' Hundred';
    }
    if (remainder > 0) {
      str += (str ? ' ' : '') + convertTwoDigits(remainder);
    }
    return str;
  }

  let crore = Math.floor(rounded / 10000000);
  let remainderAfterCrore = rounded % 10000000;

  let lakh = Math.floor(remainderAfterCrore / 100000);
  let remainderAfterLakh = remainderAfterCrore % 100000;

  let thousand = Math.floor(remainderAfterLakh / 1000);
  let hundred = remainderAfterLakh % 1000;

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(convertThreeDigits(crore) + ' Crore');
  }
  if (lakh > 0) {
    parts.push(convertTwoDigits(lakh) + ' Lakh');
  }
  if (thousand > 0) {
    parts.push(convertTwoDigits(thousand) + ' Thousand');
  }
  if (hundred > 0) {
    parts.push(convertThreeDigits(hundred));
  }

  return parts.join(' ') + ' Only';
}
