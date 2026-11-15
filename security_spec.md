# Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. A user document `/users/{userId}` can only be created with `role == 'CUSTOMER'` unless performed by an admin; self-escalation to `ADMIN` or `STAFF` is strictly denied.
2. An order `/orders/{orderId}` must be created with `paymentStatus == 'UNPAID'`, `orderStatus == 'PENDING'`, and `userId == request.auth.uid`.
3. Only `ADMIN` may transition `paymentStatus` from `UNPAID` to `PAID` via QR approval.
4. Only `STAFF` or `ADMIN` may transition `orderStatus` through workshop Kanban states (`ARRANGING` -> `READY` -> `SHIPPING` -> `COMPLETED`).
5. Completed or cancelled orders are terminal-locked against non-admin mutations.
6. Product reviews `/reviews/{reviewId}` must belong to `request.auth.uid` and reference an existing order owned by the user (`exists(...)`).
7. AI Try-On logs `/ai_tryon_logs/{logId}` require authenticated verified users and strict field allowlists.

## 2. Dirty Dozen Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated order create**: `auth = null` creating `/orders/o1`.
2. **Self-assigned ADMIN role**: User creating `/users/{uid}` with `role: "ADMIN"`.
3. **Shadow field on user update**: Updating `/users/{uid}` with `{ displayName: "A", isAdmin: true }`.
4. **Fake PAID order on create**: Customer creating `/orders/o2` with `paymentStatus: "PAID"`.
5. **Customer approving own QR payment**: Customer updating `/orders/{id}` `paymentStatus: "PAID"`.
6. **Staff deleting a product**: Staff calling `delete` on `/products/{id}`.
7. **PII Blanket Read**: Customer A reading `/users/{customerB}` or listing `/orders` without `userId == auth.uid`.
8. **ID Poisoning**: Creating `/orders/` with 500-char ID or invalid characters (`$`, `/`).
9. **Value Poisoning**: Updating order `totalAmount` to `-50000` or string `"free"`.
10. **Unverified email spoofing**: Auth token with `email == 'nguyenthiendoan2@gmail.com'` and `email_verified == false`.
11. **Post-terminal mutation**: Customer updating `/orders/{id}` after `orderStatus == 'COMPLETED'`.
12. **Review spoofing**: Creating `/reviews/{id}` with `userId` set to another user's UID or `status: 'APPROVED'` directly by customer.
