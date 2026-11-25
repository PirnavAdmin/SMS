"""Decimal-safe arithmetic and programmatic calculation verification helpers."""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Iterable

ZERO = Decimal("0.00")
HUNDRED = Decimal("100")


def dec(val: Any) -> Decimal:
    """Safely converts numbers/strings/None to quantized Decimal(0.01)."""
    if val is None or val == "":
        return ZERO
    if isinstance(val, Decimal):
        return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def safe_pct(numerator: Decimal | int | float, denominator: Decimal | int | float) -> float:
    num = Decimal(str(numerator or 0))
    den = Decimal(str(denominator or 0))
    if den <= Decimal("0"):
        return 0.0
    return float(((num / den) * HUNDRED).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def verify_fee_row_arithmetic(rows: Iterable[dict[str, Any]], tolerance: Decimal = Decimal("0.05")) -> list[str]:
    """Programmatically checks TotalAmount - PaidAmount == DueAmount on retrieved assignments."""
    anomalies: list[str] = []
    for row in rows:
        total = dec(row.get("TotalAmount"))
        paid = dec(row.get("PaidAmount"))
        due = dec(row.get("DueAmount"))
        diff = abs((total - paid) - due)
        if diff > tolerance:
            anomalies.append(
                f"Assignment #{row.get('Id')} (StudentId={row.get('StudentId')}): "
                f"Total({total}) - Paid({paid}) = {total - paid} != Due({due})."
            )
    return anomalies
