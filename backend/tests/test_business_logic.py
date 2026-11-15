from datetime import datetime
import pytest
from apps.core.services import (
    AITryOnService,
    OrderService,
    PromotionEngine,
    ReviewService,
    VoucherUsageRecord,
    approve_qr_payment,
    calculate_urban_road_distance_km,
    check_ai_tryon_quota,
    get_shipping_fee_by_distance,
)


def test_shipping_fee_tiers():
    # <= 3.0 km -> 0 VND (Freeship)
    assert get_shipping_fee_by_distance(0.0) == 0
    assert get_shipping_fee_by_distance(3.0) == 0

    # 3.01 km - 10.0 km -> 25,000 VND
    assert get_shipping_fee_by_distance(3.01) == 25000
    assert get_shipping_fee_by_distance(10.0) == 25000

    # 10.01 km - 20.0 km -> 45,000 VND
    assert get_shipping_fee_by_distance(10.01) == 45000
    assert get_shipping_fee_by_distance(20.0) == 45000

    # > 20.0 km -> 70,000 VND
    assert get_shipping_fee_by_distance(20.01) == 70000
    assert get_shipping_fee_by_distance(150.0) == 70000

    # Negative or invalid distance -> ValueError
    with pytest.raises(ValueError):
        get_shipping_fee_by_distance(-1.0)


def test_urban_distance_calculations_and_invalid_coords():
    # Distance to origin itself must be 0
    dist = calculate_urban_road_distance_km(10.8231, 106.6458)
    assert dist == 0.0

    # Valid destination in central HCMC applies 1.35 factor
    dist_d1 = calculate_urban_road_distance_km(10.7769, 106.7009)
    assert 7.0 <= dist_d1 <= 15.0

    # Invalid coordinates
    with pytest.raises(ValueError):
        calculate_urban_road_distance_km(120.0, 106.0)
    with pytest.raises(ValueError):
        calculate_urban_road_distance_km(10.0, 200.0)


def test_voucher_anti_abuse_and_calendar_year_unlock():
    history = [
        VoucherUsageRecord("EYEWEAR10", "u1", "a@gmail.com", "0901112223", 2026),
        VoucherUsageRecord("TET2026", "u1", "a@gmail.com", "0901112223", 2026),
    ]

    # Non-existent voucher -> raises ValueError
    with pytest.raises(ValueError, match="INVALID_VOUCHER"):
        PromotionEngine.validate_voucher(
            "UNKNOWN99", 1_000_000, 1, "u9", "c@gmail.com", "0900000000", history
        )

    # EYEWEAR10 / ROSE10: 1st time valid for new user
    valid_first = PromotionEngine.validate_voucher(
        "EYEWEAR10", 1_000_000, 1, "u_new", "new@gmail.com", "0999999999", history
    )
    assert valid_first["valid"] is True
    assert valid_first["discount"] == 100000

    # EYEWEAR10 / ROSE10 reuse with matching phone -> rejected
    with pytest.raises(ValueError, match="LIFETIME_VOUCHER_USED"):
        PromotionEngine.validate_voucher(
            "ROSE10", 1_000_000, 1, "u2", "b@gmail.com", "0901112223", history
        )

    # Holiday voucher reuse in 2026 -> rejected
    with pytest.raises(ValueError, match="HOLIDAY_VOUCHER_USED_2026"):
        PromotionEngine.validate_voucher(
            "TET2026", 1_000_000, 1, "u1", "a@gmail.com", "0901112223",
            history, current_date=datetime(2026, 11, 15)
        )

    # Calendar year rollover to 2027-01-01 -> automatically unlocks!
    unlocked = PromotionEngine.validate_voucher(
        "TET2026", 1_000_000, 1, "u1", "a@gmail.com", "0901112223",
        history, current_date=datetime(2027, 1, 1)
    )
    assert unlocked["discount"] == 200000


def test_bulk_and_vip_automatic_discounts():
    # >= 2 items -> 10% auto discount
    bulk = PromotionEngine.validate_voucher(
        "", 1_500_000, 2, "u1", "a@gmail.com", "0901112223", []
    )
    assert bulk["applied_rule"] == "BULK_10"
    assert bulk["discount"] == 150000

    # >= 2,000,000 VND -> 15% VIP auto discount
    vip = PromotionEngine.validate_voucher(
        "", 2_000_000, 1, "u1", "a@gmail.com", "0901112223", []
    )
    assert vip["applied_rule"] == "VIP_15"
    assert vip["discount"] == 300000


def test_ai_tryon_quota_enforcement():
    # Anonymous -> 401 Unauthorized (PermissionError)
    with pytest.raises(PermissionError, match="AUTH_REQUIRED"):
        AITryOnService.check_and_log_quota(False, 0)

    # 1st to 20th usage -> Allowed
    res1 = AITryOnService.check_and_log_quota(True, 0)
    assert res1["allowed"] is True
    assert res1["remaining"] == 19

    res20 = AITryOnService.check_and_log_quota(True, 19)
    assert res20["allowed"] is True
    assert res20["remaining"] == 0

    # 21st usage -> 429 Too Many Requests (RuntimeError)
    with pytest.raises(RuntimeError, match="QUOTA_EXCEEDED"):
        AITryOnService.check_and_log_quota(True, 20)


def test_order_admin_qr_approval_and_role_security():
    # Customer or Staff role cannot approve QR payments -> 403 Forbidden
    with pytest.raises(PermissionError, match="ADMIN_ONLY"):
        OrderService.approve_qr_payment("CUSTOMER", "UNPAID")
    with pytest.raises(PermissionError, match="ADMIN_ONLY"):
        OrderService.approve_qr_payment("STAFF", "UNPAID")

    # Admin role approves pending QR payment
    res = OrderService.approve_qr_payment("ADMIN", "UNPAID", "KINH-889921")
    assert res["payment_status"] == "PAID"
    assert res["order_status"] == "ARRANGING"
    assert "FCM_PUSH" in res["notifications_dispatched"]
    assert "GMAIL_RECEIPT" in res["notifications_dispatched"]

    # Approving already paid order -> ValueError
    with pytest.raises(ValueError, match="ALREADY_PAID"):
        OrderService.approve_qr_payment("ADMIN", "PAID")


def test_review_service_verified_purchase_and_anti_duplicate():
    service = ReviewService()

    # User whose order is still SHIPPING cannot review -> 403 Forbidden
    with pytest.raises(PermissionError, match="ORDER_NOT_COMPLETED"):
        service.create_review(
            user_id="u1",
            order_code="KINH-101",
            product_id="prod_kyoto",
            order_status="SHIPPING",
            purchased_product_ids=["prod_kyoto"],
            rating=5,
            comment="Gọng rất nhẹ và đẹp",
        )

    # User attempts to review a product not in their order -> 403 Forbidden
    with pytest.raises(PermissionError, match="PRODUCT_NOT_PURCHASED"):
        service.create_review(
            user_id="u1",
            order_code="KINH-102",
            product_id="prod_unbought",
            order_status="COMPLETED",
            purchased_product_ids=["prod_kyoto"],
            rating=5,
            comment="Chưa mua",
        )

    # Valid verified purchase review
    rev = service.create_review(
        user_id="u1",
        order_code="KINH-103",
        product_id="prod_kyoto",
        order_status="COMPLETED",
        purchased_product_ids=["prod_kyoto"],
        rating=5,
        comment="Đeo rất êm tai, hoàn thiện cao cấp!",
    )
    assert rev.status == "APPROVED"
    assert rev.rating == 5

    # Duplicate review for the same product in the same order -> Rejected
    with pytest.raises(ValueError, match="DUPLICATE_REVIEW"):
        service.create_review(
            user_id="u1",
            order_code="KINH-103",
            product_id="prod_kyoto",
            order_status="COMPLETED",
            purchased_product_ids=["prod_kyoto"],
            rating=5,
            comment="Review lại",
        )
