from dataclasses import dataclass
from datetime import datetime
import math
from typing import Dict, Iterable, List, Optional, Set


ORIGIN_LAT = 10.8231
ORIGIN_LNG = 106.6458
URBAN_ROAD_CIRCUITY_FACTOR = 1.35
EARTH_RADIUS_KM = 6371.0
DAILY_AI_TRYON_QUOTA = 20


def calculate_urban_road_distance_km(
    dest_lat: float,
    dest_lng: float,
    origin_lat: float = ORIGIN_LAT,
    origin_lng: float = ORIGIN_LNG,
) -> float:
    if not (-90 <= dest_lat <= 90 and -180 <= dest_lng <= 180):
        raise ValueError("Invalid destination coordinates")
    phi1, phi2 = math.radians(origin_lat), math.radians(dest_lat)
    d_phi = math.radians(dest_lat - origin_lat)
    d_lambda = math.radians(dest_lng - origin_lng)

    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    # Multiply straight-line Haversine distance by 1.35 to approximate Vietnam urban road routes
    return round(EARTH_RADIUS_KM * c * URBAN_ROAD_CIRCUITY_FACTOR, 2)


def get_shipping_fee_by_distance(distance_km: float) -> int:
    if distance_km < 0 or math.isnan(distance_km):
        raise ValueError("Distance must be a non-negative number")
    if distance_km <= 3.0:
        return 0
    if distance_km <= 10.0:
        return 25000
    if distance_km <= 20.0:
        return 45000
    return 70000


@dataclass(frozen=True)
class VoucherUsageRecord:
    code: str
    user_id: str
    email: str
    phone: str
    used_year: int


class PromotionEngine:
    @staticmethod
    def validate_voucher(
        code: str,
        subtotal: int,
        total_quantity: int,
        user_id: str,
        email: str,
        phone: str,
        usage_history: Iterable[VoucherUsageRecord],
        current_date: Optional[datetime] = None,
    ) -> dict:
        now = current_date or datetime.now()
        normalized = code.strip().upper() if code else ""
        if normalized == "ROSE10":
            normalized = "EYEWEAR10"

        auto_discount = 0
        applied_rule = "NONE"
        if subtotal >= 2_000_000:
            auto_discount = round(subtotal * 0.15)
            applied_rule = "VIP_15"
        elif total_quantity >= 2:
            auto_discount = round(subtotal * 0.10)
            applied_rule = "BULK_10"

        if not normalized:
            return {
                "valid": True,
                "discount": auto_discount,
                "code": None,
                "applied_rule": applied_rule,
            }

        supported = {
            "EYEWEAR10": {"percent": 10, "lifetime": True, "holiday": False},
            "TET2026": {"percent": 20, "lifetime": False, "holiday": True},
            "HOLIDAY20": {"percent": 20, "lifetime": False, "holiday": True},
        }
        if normalized not in supported:
            raise ValueError("INVALID_VOUCHER")

        rule = supported[normalized]
        email_norm = email.strip().lower()
        phone_norm = phone.strip()

        for record in usage_history:
            rec_code = "EYEWEAR10" if record.code.upper() == "ROSE10" else record.code.upper()
            if rec_code != normalized:
                continue
            same_identity = (
                (user_id and record.user_id == user_id)
                or (email_norm and record.email.lower() == email_norm)
                or (phone_norm and record.phone == phone_norm)
            )
            if not same_identity:
                continue
            if rule["lifetime"]:
                raise ValueError("LIFETIME_VOUCHER_USED")
            if rule["holiday"] and record.used_year == now.year:
                raise ValueError(f"HOLIDAY_VOUCHER_USED_{now.year}")

        voucher_discount = round(subtotal * (rule["percent"] / 100))
        best_discount = max(voucher_discount, auto_discount)
        return {
            "valid": True,
            "discount": best_discount,
            "code": normalized,
            "applied_rule": "VOUCHER_" + str(rule["percent"]) if voucher_discount >= auto_discount else applied_rule,
        }


class AITryOnService:
    @staticmethod
    def check_and_log_quota(is_authenticated: bool, used_today_count: int) -> dict:
        if not is_authenticated:
            raise PermissionError("AUTH_REQUIRED")
        if used_today_count >= DAILY_AI_TRYON_QUOTA:
            raise RuntimeError("QUOTA_EXCEEDED")
        return {
            "allowed": True,
            "used": used_today_count + 1,
            "remaining": DAILY_AI_TRYON_QUOTA - (used_today_count + 1),
        }


def check_ai_tryon_quota(is_authenticated: bool, used_today_count: int) -> None:
    AITryOnService.check_and_log_quota(is_authenticated, used_today_count)


class OrderService:
    @staticmethod
    def approve_qr_payment(actor_role: str, current_payment_status: str, order_code: str = "KINH-0001") -> dict:
        if actor_role != "ADMIN":
            raise PermissionError("ADMIN_ONLY")
        if current_payment_status == "PAID":
            raise ValueError("ALREADY_PAID")
        return {
            "payment_status": "PAID",
            "order_status": "ARRANGING",
            "notifications_dispatched": ["FCM_PUSH", "GMAIL_RECEIPT"],
            "order_code": order_code,
        }


def approve_qr_payment(actor_role: str, current_payment_status: str) -> dict:
    return OrderService.approve_qr_payment(actor_role, current_payment_status)


@dataclass
class ReviewRecord:
    id: str
    user_id: str
    order_code: str
    product_id: str
    rating: int
    comment: str
    status: str = "APPROVED"


class ReviewService:
    def __init__(self) -> None:
        self._existing_reviews: Set[str] = set()

    def create_review(
        self,
        user_id: str,
        order_code: str,
        product_id: str,
        order_status: str,
        purchased_product_ids: List[str],
        rating: int,
        comment: str,
    ) -> ReviewRecord:
        # User must have completed order containing this product
        if order_status != "COMPLETED":
            raise PermissionError("ORDER_NOT_COMPLETED")
        if product_id not in purchased_product_ids:
            raise PermissionError("PRODUCT_NOT_PURCHASED")
        if not (1 <= rating <= 5):
            raise ValueError("INVALID_RATING")

        review_key = f"{order_code}:{product_id}"
        if review_key in self._existing_reviews:
            raise ValueError("DUPLICATE_REVIEW")

        self._existing_reviews.add(review_key)
        return ReviewRecord(
            id=f"rev_{len(self._existing_reviews)}",
            user_id=user_id,
            order_code=order_code,
            product_id=product_id,
            rating=rating,
            comment=comment,
            status="APPROVED",
        )
