import { create } from 'zustand';
import { getCartAccountId } from '../utils/authStorage';
import { getMyCartAPI, replaceMyCartAPI, mergeMyCartAPI } from '../api/cart';
import {
  migrateLegacyCartStorage,
  readCartItemsForKey,
  writeCartSnapshot,
  persistCurrentCartForUserId,
} from '../utils/cartStorage';

migrateLegacyCartStorage();

/** JWT `id` 우선 — user JSON과 어긋나도 계정별로 장바구니 분리 */
function currentUserId() {
  return getCartAccountId();
}

function loadItems() {
  return readCartItemsForKey(currentUserId());
}

function saveItems(items) {
  writeCartSnapshot(currentUserId(), items);
}

function normalizeServerCartItems(items) {
  return (items || [])
    .map((item) => {
      const productId = item?.product?._id || item?.product?.id || item?.product;
      const id = productId ? String(productId) : null;
      if (!id) return null;
      return {
        _id: id,
        name: item.name || '',
        price: Number(item.price) || 0,
        image: item.image || '',
        quantity: Math.max(1, Number(item.quantity) || 1),
      };
    })
    .filter(Boolean);
}

function toServerItemsPayload(items) {
  return (items || []).map((item) => ({
    _id: item?._id,
    quantity: Math.max(1, Number(item?.quantity) || 1),
  }));
}

const useCartStore = create((set, get) => ({
  /** 초기값은 빈 배열 — CartBootstrap에서 JWT·user 반영 후 reloadFromStorage로 채움 */
  items: [],

  /** 내부: 상태 + localStorage 동시 반영 */
  _replaceItems: (items, options = {}) => {
    const { syncServer = true } = options;
    const next = Array.isArray(items) ? items : [];
    set({ items: next });
    saveItems(next);
    if (syncServer && currentUserId()) {
      get().syncServerCart(next);
    }
  },

  addItem: (product, quantity = 1) => {
    const items = get().items;
    const existing = items.find((i) => i._id === product._id);
    let next;
    if (existing) {
      next = items.map((i) =>
        i._id === product._id ? { ...i, quantity: i.quantity + quantity } : i
      );
    } else {
      next = [...items, { ...product, quantity }];
    }
    get()._replaceItems(next, { syncServer: true });
  },

  removeItem: (id) => {
    get()._replaceItems(
      get().items.filter((i) => i._id !== id),
      { syncServer: true }
    );
  },

  removeItemsByIds: (ids) => {
    const setIds = new Set(ids);
    get()._replaceItems(
      get().items.filter((i) => !setIds.has(i._id)),
      { syncServer: true }
    );
  },

  updateQuantity: (id, quantity) => {
    if (quantity < 1) return;
    get()._replaceItems(
      get().items.map((i) => (i._id === id ? { ...i, quantity } : i)),
      { syncServer: true }
    );
  },

  clearCart: () => {
    get()._replaceItems([], { syncServer: true });
  },

  /**
   * 로그인 상태에서 로컬 변경을 서버로 반영한 뒤, 서버 기준으로 재확정
   */
  syncServerCart: async (sourceItems) => {
    const uid = getCartAccountId();
    if (!uid) return;
    try {
      const payload = toServerItemsPayload(sourceItems ?? get().items);
      const { data } = await replaceMyCartAPI(payload);
      const serverItems = normalizeServerCartItems(data.items || []);
      set({ items: serverItems });
      writeCartSnapshot(uid, serverItems);
    } catch {
      /* 네트워크 오류 시 로컬 상태 유지 */
    }
  },

  /**
   * 로그인/회원가입 직후:
   * 1) 게스트 장바구니를 서버 장바구니와 병합
   * 2) 결과를 서버 기준으로 확정
   */
  hydrateCartAfterAuth: async () => {
    const uid = getCartAccountId();
    if (!uid) return;
    const fromGuest = readCartItemsForKey(null);
    try {
      const payload = toServerItemsPayload(fromGuest);
      const { data } = await mergeMyCartAPI(payload);
      const merged = normalizeServerCartItems(data.items || []);
      set({ items: merged });
      writeCartSnapshot(uid, merged);
      writeCartSnapshot(null, []);
    } catch {
      // 서버 통신 실패 시 기존 로컬 분리 로직으로 안전 폴백
      const savedForUser = readCartItemsForKey(uid);
      const merged = [...savedForUser];
      const map = new Map(merged.map((i) => [String(i._id), { ...i }]));
      for (const item of fromGuest) {
        const key = String(item?._id || '');
        if (!key) continue;
        const prev = map.get(key);
        const q = Math.max(1, Number(item.quantity) || 1);
        if (prev) map.set(key, { ...prev, quantity: prev.quantity + q });
        else map.set(key, { ...item, quantity: q });
      }
      const fallback = Array.from(map.values());
      set({ items: fallback });
      writeCartSnapshot(uid, fallback);
      writeCartSnapshot(null, []);
    }
  },

  /** 로그아웃 직전: 현재 목록을 로그인 중인 사용자 키에 확실히 기록 */
  beforeLogoutPersist: () => {
    const uid = getCartAccountId();
    if (uid) {
      persistCurrentCartForUserId(uid, get().items);
      get().syncServerCart(get().items);
    }
  },

  /**
   * 로그아웃 직후:
   * 이전 로그인 사용자의 카트가 다음 사용자(또는 게스트)로 이어지지 않도록 게스트 카트를 비움.
   */
  loadGuestCart: () => {
    set({ items: [] });
    writeCartSnapshot(null, []);
  },

  /**
   * 앱이 다른 탭에서 user를 바꾼 경우 등 — 필요 시 새로고침 없이 동기화
   * (선택: 페이지 포커스 시 호출 가능)
   */
  reloadFromStorage: () => {
    const localItems = loadItems();
    set({ items: localItems });
    if (currentUserId()) {
      getMyCartAPI()
        .then(({ data }) => {
          const serverItems = normalizeServerCartItems(data.items || []);
          set({ items: serverItems });
          saveItems(serverItems);
        })
        .catch(() => {
          /* ignore */
        });
    }
  },
}));

export default useCartStore;
