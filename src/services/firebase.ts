import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  AppNotification,
  OrderRecord,
  PaymentMethod,
  PaymentStatus,
  Product,
  ReviewRecord,
  StoreSettings,
  UserProfile,
  UserRole,
  OrderStatus,
} from '../types/eyewear';
import { VoucherUsageHistoryItem } from '../utils/voucher';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const ADMIN_BOOTSTRAP_EMAIL = 'nguyenthiendoan2@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) ?? [],
    },
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testFirestoreConnection();

function resolveIsoString(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

export async function resolveUserRole(fbUser: FirebaseUser): Promise<UserRole> {
  if (fbUser.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL && fbUser.emailVerified) {
    return UserRole.ADMIN;
  }
  try {
    const adminDoc = await getDoc(doc(db, 'admins', fbUser.uid));
    if (adminDoc.exists()) return UserRole.ADMIN;
    const staffDoc = await getDoc(doc(db, 'staff', fbUser.uid));
    if (staffDoc.exists()) return UserRole.STAFF;
  } catch {
    // Non-privileged accounts default to CUSTOMER
  }
  return UserRole.CUSTOMER;
}

export async function syncUserProfile(fbUser: FirebaseUser): Promise<UserProfile> {
  const userPath = `users/${fbUser.uid}`;
  const role = await resolveUserRole(fbUser);

  try {
    const userRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: fbUser.uid,
        email: fbUser.email ?? '',
        displayName: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'Customer',
        role: 'CUSTOMER',
        createdAt: serverTimestamp(),
      });
    }
    const fresh = await getDoc(userRef);
    const data = fresh.data() ?? {};
    return {
      uid: fbUser.uid,
      email: typeof data.email === 'string' ? data.email : fbUser.email ?? '',
      displayName:
        typeof data.displayName === 'string'
          ? data.displayName
          : fbUser.displayName ?? 'Customer',
      phone: typeof data.phone === 'string' ? data.phone : '',
      photoURL: fbUser.photoURL ?? undefined,
      role,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function signInWithGoogle(): Promise<UserProfile> {
  const credential = await signInWithPopup(auth, googleProvider);
  return syncUserProfile(credential.user);
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const path = 'store_settings/default';
  try {
    const snap = await getDoc(doc(db, 'store_settings', 'default'));
    if (!snap.exists()) {
      return {
        bankId: 'MB',
        accountNo: '0901234567',
        accountName: 'LUMINA OPTICS STORE',
        customQrUrl: '',
        updatedAt: new Date().toISOString(),
      };
    }
    const d = snap.data();
    return {
      bankId: String(d.bankId ?? 'MB'),
      accountNo: String(d.accountNo ?? '0901234567'),
      accountName: String(d.accountName ?? 'LUMINA OPTICS STORE'),
      customQrUrl: String(d.customQrUrl ?? ''),
      updatedAt: resolveIsoString(d.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveStoreSettings(settings: Omit<StoreSettings, 'updatedAt'>): Promise<void> {
  const path = 'store_settings/default';
  try {
    await setDoc(doc(db, 'store_settings', 'default'), {
      bankId: settings.bankId,
      accountNo: settings.accountNo,
      accountName: settings.accountName,
      customQrUrl: settings.customQrUrl,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createOrderInFirestore(
  order: Omit<OrderRecord, 'id' | 'createdAt' | 'updatedAt' | 'items'>
): Promise<OrderRecord> {
  const path = `orders/${order.orderCode}`;
  try {
    const orderRef = doc(db, 'orders', order.orderCode);
    await setDoc(orderRef, {
      orderCode: order.orderCode,
      userId: order.userId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      distanceKm: order.distanceKm,
      shippingFee: order.shippingFee,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      ...(order.voucherCode ? { voucherCode: order.voucherCode } : {}),
      paymentMethod: order.paymentMethod,
      paymentStatus: PaymentStatus.UNPAID,
      orderStatus: OrderStatus.PENDING,
      itemsCount: order.itemsCount,
      itemsSummary: order.itemsSummary.slice(0, 990),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (order.voucherCode) {
      const usageId = `${order.orderCode}_${order.voucherCode}`;
      await setDoc(doc(db, 'voucher_usages', usageId), {
        voucherCode: order.voucherCode,
        userId: order.userId,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        usedYear: new Date().getFullYear(),
        orderCode: order.orderCode,
        createdAt: serverTimestamp(),
      });
    }

    const notifId = `notif_${order.orderCode}_admin`;
    await setDoc(doc(db, 'notifications', notifId), {
      userId: order.userId,
      targetRole: UserRole.ADMIN,
      titleVi: `Đơn hàng mới #${order.orderCode}`,
      titleEn: `New Order #${order.orderCode}`,
      bodyVi:
        order.paymentMethod === PaymentMethod.QR_CODE
          ? `Khách ${order.customerName} vừa đặt đơn (${order.totalAmount.toLocaleString('vi-VN')}₫) đang chờ duyệt QR.`
          : `Khách ${order.customerName} vừa đặt đơn COD (${order.totalAmount.toLocaleString('vi-VN')}₫).`,
      bodyEn:
        order.paymentMethod === PaymentMethod.QR_CODE
          ? `${order.customerName} placed a QR order (${order.totalAmount.toLocaleString('vi-VN')}₫) awaiting verification.`
          : `${order.customerName} placed a COD order (${order.totalAmount.toLocaleString('vi-VN')}₫).`,
      orderCode: order.orderCode,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    const nowIso = new Date().toISOString();
    return {
      ...order,
      id: order.orderCode,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchOrdersForRole(
  userId: string,
  role: UserRole
): Promise<OrderRecord[]> {
  const path = 'orders';
  try {
    const ordersRef = collection(db, 'orders');
    const q =
      role === UserRole.ADMIN || role === UserRole.STAFF
        ? query(ordersRef, orderBy('createdAt', 'desc'))
        : query(ordersRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        orderCode: String(data.orderCode ?? d.id),
        userId: String(data.userId ?? ''),
        customerName: String(data.customerName ?? ''),
        customerEmail: String(data.customerEmail ?? ''),
        customerPhone: String(data.customerPhone ?? ''),
        shippingAddress: String(data.shippingAddress ?? ''),
        distanceKm: Number(data.distanceKm ?? 0),
        shippingFee: Number(data.shippingFee ?? 0),
        subtotal: Number(data.subtotal ?? 0),
        discountAmount: Number(data.discountAmount ?? 0),
        totalAmount: Number(data.totalAmount ?? 0),
        voucherCode: typeof data.voucherCode === 'string' ? data.voucherCode : undefined,
        paymentMethod: data.paymentMethod as PaymentMethod,
        paymentStatus: data.paymentStatus as PaymentStatus,
        orderStatus: data.orderStatus as OrderStatus,
        itemsCount: Number(data.itemsCount ?? 1),
        itemsSummary: String(data.itemsSummary ?? ''),
        createdAt: resolveIsoString(data.createdAt),
        updatedAt: resolveIsoString(data.updatedAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function approveQrOrderInFirestore(order: OrderRecord): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    await updateDoc(doc(db, 'orders', order.id), {
      paymentStatus: PaymentStatus.PAID,
      orderStatus: OrderStatus.ARRANGING,
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'notifications', `notif_${order.orderCode}_paid_customer`), {
      userId: order.userId,
      targetRole: UserRole.CUSTOMER,
      titleVi: `Thanh toán QR thành công #${order.orderCode}`,
      titleEn: `QR Payment Confirmed #${order.orderCode}`,
      bodyVi: 'Kính của bạn đã được xác nhận thanh toán và chuyển vào xưởng kỹ thuật gia công.',
      bodyEn: 'Your QR payment is confirmed and your frame has entered our optical lab.',
      orderCode: order.orderCode,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'notifications', `notif_${order.orderCode}_staff`), {
      userId: order.userId,
      targetRole: UserRole.STAFF,
      titleVi: `Đơn mới cần mài lắp #${order.orderCode}`,
      titleEn: `New Lab Job #${order.orderCode}`,
      bodyVi: `${order.itemsSummary}`,
      bodyEn: `${order.itemsSummary}`,
      orderCode: order.orderCode,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateOrderStatusInFirestore(
  order: OrderRecord,
  nextStatus: OrderStatus
): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    await updateDoc(doc(db, 'orders', order.id), {
      orderStatus: nextStatus,
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'notifications', `notif_${order.orderCode}_${nextStatus}`), {
      userId: order.userId,
      targetRole: UserRole.CUSTOMER,
      titleVi: `Cập nhật đơn #${order.orderCode}`,
      titleEn: `Order #${order.orderCode} Update`,
      bodyVi: `Trạng thái đơn hàng hiện tại: ${nextStatus}`,
      bodyEn: `Your order status is now: ${nextStatus}`,
      orderCode: order.orderCode,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchVoucherUsagesForUser(
  userId: string
): Promise<VoucherUsageHistoryItem[]> {
  const path = 'voucher_usages';
  try {
    const q = query(collection(db, 'voucher_usages'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        voucherCode: String(data.voucherCode ?? ''),
        userId: String(data.userId ?? ''),
        customerEmail: String(data.customerEmail ?? ''),
        customerPhone: String(data.customerPhone ?? ''),
        usedYear: Number(data.usedYear ?? new Date().getFullYear()),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchReviewsByProduct(
  productId: string,
  includeAllForAdmin: boolean = false
): Promise<ReviewRecord[]> {
  const path = 'reviews';
  try {
    const q = includeAllForAdmin
      ? query(collection(db, 'reviews'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'reviews'),
          where('productId', '==', productId),
          where('status', '==', 'APPROVED')
        );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        productId: String(data.productId ?? ''),
        orderId: String(data.orderId ?? ''),
        userId: String(data.userId ?? ''),
        authorName: String(data.authorName ?? 'Customer'),
        rating: Number(data.rating ?? 5),
        comment: String(data.comment ?? ''),
        status: (data.status as ReviewRecord['status']) ?? 'PENDING',
        createdAt: resolveIsoString(data.createdAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function submitProductReview(params: {
  productId: string;
  orderId: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const reviewId = `rev_${params.orderId}_${params.productId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `reviews/${reviewId}`;
  try {
    await setDoc(doc(db, 'reviews', reviewId), {
      productId: params.productId,
      orderId: params.orderId,
      userId: params.userId,
      authorName: params.authorName.slice(0, 100),
      rating: Math.min(5, Math.max(1, Math.round(params.rating))),
      comment: params.comment.trim().slice(0, 1000),
      status: 'PENDING',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function moderateReviewInFirestore(
  reviewId: string,
  status: 'APPROVED' | 'HIDDEN'
): Promise<void> {
  const path = `reviews/${reviewId}`;
  try {
    await updateDoc(doc(db, 'reviews', reviewId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchNotificationsForUser(
  userId: string,
  role: UserRole
): Promise<AppNotification[]> {
  const path = 'notifications';
  try {
    const q =
      role === UserRole.ADMIN
        ? query(collection(db, 'notifications'), orderBy('createdAt', 'desc'))
        : role === UserRole.STAFF
          ? query(
              collection(db, 'notifications'),
              where('targetRole', '==', UserRole.STAFF),
              orderBy('createdAt', 'desc')
            )
          : query(
              collection(db, 'notifications'),
              where('userId', '==', userId),
              orderBy('createdAt', 'desc')
            );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: String(data.userId ?? ''),
        targetRole: (data.targetRole as UserRole) ?? UserRole.CUSTOMER,
        titleVi: String(data.titleVi ?? ''),
        titleEn: String(data.titleEn ?? ''),
        bodyVi: String(data.bodyVi ?? ''),
        bodyEn: String(data.bodyEn ?? ''),
        orderCode: typeof data.orderCode === 'string' ? data.orderCode : undefined,
        isRead: Boolean(data.isRead),
        createdAt: resolveIsoString(data.createdAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function markNotificationReadInFirestore(id: string): Promise<void> {
  const path = `notifications/${id}`;
  try {
    await updateDoc(doc(db, 'notifications', id), { isRead: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function upsertProductInFirestore(product: Product): Promise<void> {
  const path = `products/${product.id}`;
  try {
    await setDoc(doc(db, 'products', product.id), {
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      nameVi: product.nameVi,
      nameEn: product.nameEn,
      descriptionVi: product.descriptionVi,
      descriptionEn: product.descriptionEn,
      price: product.price,
      stock: Math.round(product.stock),
      frameStyle: product.frameStyle,
      material: product.material,
      gender: product.gender,
      colorTone: product.colorTone,
      suitableFaces: product.suitableFaces,
      imageUrl: product.imageUrl,
      isActive: product.isActive,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
