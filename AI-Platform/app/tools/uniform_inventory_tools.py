"""Uniform catalog, distributions, payments, and general inventory tools."""

from __future__ import annotations

from pydantic import BaseModel

from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.chat import VisualArtifact
from app.schemas.security import AiSecurityContext
from app.tools.base import BaseErpTool, ToolOutput


class UniformInventoryTool(BaseErpTool):
    name = "uniform_inventory"
    description = (
        "Retrieves uniform types, stock levels, low-stock reorder alerts, student uniform distributions, "
        "uniform fee configurations, and general inventory items."
    )
    module = "uniform"
    allowed_roles = ("Super Admin", "Admin", "Principal", "Accountant", "HR")

    async def _run(self, ctx: AiSecurityContext, params: BaseModel) -> ToolOutput:
        mysql = get_mysql_reader()
        tid = ctx.tenant_id

        types = await mysql.fetch_all(
            """
            SELECT UniformTypeId, ItemName, Gender, SchoolWing, Size, CategoryName, UnitPrice,
                   OpeningStock, AvailableStock, MinThreshold, ReorderPoint, Status
            FROM uniform_types
            WHERE TenantId = :tid
            """,
            {"tid": tid},
        )
        distributions = await mysql.fetch_all(
            """
            SELECT DistributionId, StudentId, AdmissionNo, StudentName, ClassName,
                   TransactionType, ItemName, SizeSpec, Quantity, TotalAmount, PaymentStatus, Status, DistributionDate
            FROM student_uniform_distributions
            WHERE TenantId = :tid
            ORDER BY DistributionDate DESC
            """,
            {"tid": tid},
        )
        fee_configs = await mysql.fetch_all(
            "SELECT Id, AcademicYear, Branch, ClassName, PackageOrItemName, FeePlan, FeeAmount, Status FROM uniform_fee_configs WHERE TenantId = :tid",
            {"tid": tid},
        )
        inventory = await mysql.fetch_all(
            "SELECT InventoryItemId, ItemName, Category, Quantity, UnitPrice, Location, Status FROM inventory_items WHERE TenantId = :tid",
            {"tid": tid},
        )

        low_stock = [t for t in types if int(t.get("AvailableStock") or 0) <= int(t.get("ReorderPoint") or 0)]
        total_revenue = sum(float(d.get("TotalAmount") or 0) for d in distributions)

        return ToolOutput(
            success=True,
            module=self.module,
            source_type="LIVE_ERP",
            record_count=len(types) + len(distributions),
            summary=(
                f"Uniform catalog: {len(types)} item types ({len(low_stock)} at/below reorder point), "
                f"{len(distributions)} student distribution(s) totaling INR {total_revenue:,.2f}, "
                f"{len(inventory)} general inventory item(s)."
            ),
            data={
                "uniform_types": types,
                "low_stock_items": low_stock,
                "distributions": distributions,
                "uniform_fee_configs": fee_configs,
                "general_inventory": inventory,
                "total_distribution_revenue": round(total_revenue, 2),
            },
            visuals=[VisualArtifact(visual_type="table", title="Uniform Stock & Reorder Status", data={"rows": types})],
        )
