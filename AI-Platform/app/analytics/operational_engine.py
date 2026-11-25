"""Operational analytics for Hostel, Transport, Enrollment Trends, and School-Wide Management Reporting."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

import pandas as pd

from app.analytics.cross_module_engine import reconcile_admissions_and_students
from app.analytics.financial_engine import compute_school_financial_health
from app.integrations.mysql_reader import get_mysql_reader
from app.schemas.security import AiSecurityContext


async def analyze_hostel_occupancy_and_revenue(ctx: AiSecurityContext) -> dict[str, Any]:
    mysql = get_mysql_reader()
    tid = ctx.tenant_id

    blocks = await mysql.fetch_all(
        "SELECT HostelId, HostelName, HostelType, WardenName, Status, TotalFloors FROM hostel_blocks WHERE TenantId = :tid",
        {"tid": tid},
    )
    rooms = await mysql.fetch_all(
        """
        SELECT rm.RoomId, rm.HostelId, rm.RoomNumber, rm.FloorLevel, rm.Status,
               rtc.RoomTypeSpecification, rtc.BedCapacity, rtc.AcType
        FROM room_masters rm
        LEFT JOIN room_type_configs rtc ON rtc.RoomTypeId = rm.RoomTypeId
        WHERE rm.TenantId = :tid
        """,
        {"tid": tid},
    )
    allocs = await mysql.fetch_all(
        "SELECT AllocationId, RegistrationNo, StudentName, StudentId, HostelId, RoomId, BedNumber, Status, JoiningDate FROM student_bed_allocations WHERE TenantId = :tid",
        {"tid": tid},
    )
    fee_configs = await mysql.fetch_all(
        "SELECT HostelId, HostelName, FeePlan, HostelFee, SecurityDeposit, Status FROM hostel_fee_configs WHERE TenantId = :tid AND Status = 'Active'",
        {"tid": tid},
        preserve_decimal=True,
    )

    rooms_df = pd.DataFrame(rooms)
    allocs_df = pd.DataFrame(allocs)
    blocks_df = pd.DataFrame(blocks)

    active_allocs = allocs_df[allocs_df["Status"] == "Active"] if not allocs_df.empty else allocs_df
    block_rows: list[dict[str, Any]] = []
    for _, blk in blocks_df.iterrows():
        hid = blk["HostelId"]
        blk_rooms = rooms_df[rooms_df["HostelId"] == hid] if not rooms_df.empty else rooms_df
        blk_active = active_allocs[active_allocs["HostelId"] == hid] if not active_allocs.empty else active_allocs
        total_cap = int(blk_rooms["BedCapacity"].fillna(0).sum()) if not blk_rooms.empty else 0
        occ = int(len(blk_active))
        vac = max(total_cap - occ, 0)
        cfg_fees = [float(fc["HostelFee"] or 0) for fc in fee_configs if fc.get("HostelId") == hid]
        avg_fee = round(sum(cfg_fees) / len(cfg_fees), 2) if cfg_fees else 0.0
        block_rows.append(
            {
                "HostelId": int(hid),
                "HostelName": blk["HostelName"],
                "HostelType": blk["HostelType"],
                "TotalRooms": int(len(blk_rooms)),
                "TotalBeds": total_cap,
                "OccupiedBeds": occ,
                "VacantBeds": vac,
                "OccupancyPct": round((occ / total_cap) * 100.0, 2) if total_cap > 0 else 0.0,
                "AvgConfiguredAnnualFee": avg_fee,
                "EstimatedOccupiedAnnualRunRate": round(occ * avg_fee, 2),
                "FullCapacityAnnualPotential": round(total_cap * avg_fee, 2),
            }
        )

    total_beds = sum(b["TotalBeds"] for b in block_rows)
    total_occ = sum(b["OccupiedBeds"] for b in block_rows)
    return {
        "summary": {
            "hostel_blocks": len(block_rows),
            "total_rooms": sum(b["TotalRooms"] for b in block_rows),
            "total_beds": total_beds,
            "occupied_beds": total_occ,
            "vacant_beds": max(total_beds - total_occ, 0),
            "occupancy_pct": round((total_occ / total_beds) * 100.0, 2) if total_beds > 0 else 0.0,
            "vacated_or_historical_allocations": int(len(allocs_df) - len(active_allocs)) if not allocs_df.empty else 0,
            "estimated_occupied_annual_runrate_inr": round(sum(b["EstimatedOccupiedAnnualRunRate"] for b in block_rows), 2),
            "full_capacity_annual_potential_inr": round(sum(b["FullCapacityAnnualPotential"] for b in block_rows), 2),
        },
        "blocks": block_rows,
    }


async def analyze_transport_usage_and_compliance(ctx: AiSecurityContext) -> dict[str, Any]:
    mysql = get_mysql_reader()
    tid = ctx.tenant_id

    routes = await mysql.fetch_all(
        "SELECT RouteId, RouteCode, RouteName, DistanceKm, MonthlyFee, Status FROM transport_routes WHERE TenantId = :tid AND IsDeleted = 0",
        {"tid": tid},
    )
    vehicles = await mysql.fetch_all(
        "SELECT VehicleId, VehicleNumber, VehicleName, Capacity, InsuranceExpiry, PollutionExpiry, FitnessExpiry, Status FROM transport_vehicles WHERE TenantId = :tid AND IsDeleted = 0",
        {"tid": tid},
    )
    assignments = await mysql.fetch_all(
        "SELECT StudentTransportAssignmentId, StudentId, RouteId, Status FROM student_transport_assignments WHERE TenantId = :tid AND IsDeleted = 0",
        {"tid": tid},
    )
    maint = await mysql.fetch_all(
        "SELECT maintenance_id, vehicle_id, service_type, service_date, cost, status FROM transport_vehicle_maintenances WHERE TenantId = :tid AND is_deleted = 0",
        {"tid": tid},
    )

    today = date.today()
    soon = today + timedelta(days=30)
    compliance_alerts: list[dict[str, Any]] = []
    for v in vehicles:
        for field in ("InsuranceExpiry", "PollutionExpiry", "FitnessExpiry"):
            raw = v.get(field)
            if not raw:
                continue
            try:
                exp = datetime.fromisoformat(str(raw).split("T")[0]).date()
                if exp <= soon:
                    compliance_alerts.append(
                        {
                            "VehicleNumber": v["VehicleNumber"],
                            "Document": field,
                            "ExpiryDate": exp.isoformat(),
                            "Status": "EXPIRED" if exp < today else "EXPIRING_WITHIN_30_DAYS",
                        }
                    )
            except Exception:
                pass

    routes_df = pd.DataFrame(routes)
    assign_df = pd.DataFrame(assignments)
    if not assign_df.empty:
        assign_df["is_active"] = assign_df["Status"].astype(str).isin({"1", "Active", "active", "True", "true"})
    else:
        assign_df = pd.DataFrame(columns=["RouteId", "is_active"])

    route_stats: list[dict[str, Any]] = []
    if not routes_df.empty:
        for _, r in routes_df.iterrows():
            rid = r["RouteId"]
            sub = assign_df[assign_df["RouteId"] == rid]
            act_cnt = int(sub["is_active"].sum()) if not sub.empty else 0
            hist_cnt = int(len(sub))
            mfee = float(r.get("MonthlyFee") or 0)
            route_stats.append(
                {
                    "RouteId": int(rid),
                    "RouteName": r["RouteName"],
                    "MonthlyFee": mfee,
                    "ActiveRiders": act_cnt,
                    "TotalAssignmentRows": hist_cnt,
                    "MonthlyRevenueRunRate": round(act_cnt * mfee, 2),
                }
            )

    total_cap = sum(int(v.get("Capacity") or 0) for v in vehicles)
    total_active_riders = sum(r["ActiveRiders"] for r in route_stats)
    total_maint_cost = round(sum(float(m.get("cost") or 0) for m in maint), 2)

    return {
        "summary": {
            "routes_count": len(routes),
            "vehicles_count": len(vehicles),
            "total_fleet_seat_capacity": total_cap,
            "active_student_riders": total_active_riders,
            "total_assignment_rows": len(assignments),
            "fleet_utilization_pct": round((total_active_riders / total_cap) * 100.0, 2) if total_cap > 0 else 0.0,
            "monthly_transport_revenue_runrate_inr": round(sum(r["MonthlyRevenueRunRate"] for r in route_stats), 2),
            "maintenance_spend_total_inr": total_maint_cost,
            "compliance_alerts_count": len(compliance_alerts),
        },
        "route_stats": route_stats,
        "compliance_alerts": compliance_alerts,
    }


async def generate_executive_school_report(ctx: AiSecurityContext) -> dict[str, Any]:
    """Combines all verified modules into one coherent executive management report."""
    mysql = get_mysql_reader()
    tid = ctx.tenant_id

    fin = await compute_school_financial_health(ctx)
    adm = await reconcile_admissions_and_students(ctx)
    hostel = await analyze_hostel_occupancy_and_revenue(ctx)
    transport = await analyze_transport_usage_and_compliance(ctx)

    staff_row = await mysql.fetch_one(
        "SELECT COUNT(*) AS total_staff, SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) AS active_staff FROM staff WHERE TenantId = :tid",
        {"tid": tid},
    )
    att_row = await mysql.fetch_one(
        """
        SELECT COUNT(DISTINCT sess.AttendanceSessionId) AS sessions,
               COUNT(sa.Id) AS total_marks,
               ROUND(100.0 * SUM(CASE WHEN LOWER(sa.Status) = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(sa.Id), 0), 2) AS overall_pct
        FROM student_attendance_sessions sess
        LEFT JOIN student_attendances sa ON sa.AttendanceSessionId = sess.AttendanceSessionId
        WHERE sess.TenantId = :tid
        """,
        {"tid": tid},
    )
    exam_row = await mysql.fetch_one(
        """
        SELECT COUNT(DISTINCT exam_id) AS exams_evaluated,
               ROUND(AVG(percentage), 2) AS avg_percentage,
               ROUND(100.0 * SUM(CASE WHEN LOWER(result_status) = 'pass' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) AS pass_rate_pct
        FROM new_student_exam_results
        WHERE TenantId = :tid
        """,
        {"tid": tid},
    )

    contradictions = list(fin.get("contradictions", [])) + list(adm.get("contradictions", []))
    return {
        "executive_kpis": {
            "active_students": adm["counts"]["students_active"],
            "active_staff": int((staff_row or {}).get("active_staff") or 0),
            "attendance_sessions": int((att_row or {}).get("sessions") or 0),
            "overall_attendance_pct": float((att_row or {}).get("overall_pct") or 0.0),
            "total_fee_billed_inr": fin["metrics"]["total_billed_demand_inr"],
            "actual_fee_collected_inr": fin["metrics"]["actual_receipts_collected_inr"],
            "outstanding_fee_receivable_inr": fin["metrics"]["outstanding_receivables_inr"],
            "hostel_occupancy_pct": hostel["summary"]["occupancy_pct"],
            "transport_utilization_pct": transport["summary"]["fleet_utilization_pct"],
            "exam_pass_rate_pct": float((exam_row or {}).get("pass_rate_pct") or 0.0),
            "exam_avg_percentage": float((exam_row or {}).get("avg_percentage") or 0.0),
        },
        "finance": fin,
        "admissions_reconciliation": adm,
        "hostel": hostel,
        "transport": transport,
        "contradictions": contradictions,
    }
