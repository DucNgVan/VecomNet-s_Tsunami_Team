"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { CartItem, AppliedVoucherInfo, Voucher } from "@/types";
import {
  getVoucherByCode,
  validateAndCalculateVoucher,
  checkIsNewCustomer,
} from "@/lib/voucherStorage";

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "cartItemId">) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  totalPlasticOffsetKg: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  // Voucher support
  appliedVoucher: AppliedVoucherInfo | null;
  voucherDiscount: number;
  isFreeShipping: boolean;
  applyVoucher: (
    voucher: Voucher,
    isNewCustomer?: boolean
  ) => { success: boolean; message: string; discountAmount?: number };
  applyVoucherByCode: (
    code: string,
    isNewCustomer?: boolean
  ) => { success: boolean; message: string; discountAmount?: number };
  removeVoucher: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucherInfo | null>(null);
  const [rawVoucher, setRawVoucher] = useState<Voucher | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState<number>(0);
  const [isFreeShipping, setIsFreeShipping] = useState<boolean>(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("net_cart_v1");
      if (stored) {
        setItems(JSON.parse(stored));
      }
      const storedVoucher = localStorage.getItem("net_applied_voucher_v1");
      if (storedVoucher) {
        const parsed = JSON.parse(storedVoucher);
        if (parsed?.voucher && parsed?.info) {
          setRawVoucher(parsed.voucher);
          setAppliedVoucher(parsed.info);
          setVoucherDiscount(parsed.info.discountAmount || 0);
          setIsFreeShipping(Boolean(parsed.info.isFreeShipping));
        }
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart items to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("net_cart_v1", JSON.stringify(items));
      } catch (e) {
        console.error("Failed to save cart to localStorage", e);
      }
    }
  }, [items, isLoaded]);

  // Recalculate voucher discount when items change
  useEffect(() => {
    if (!rawVoucher || items.length === 0) {
      if (items.length === 0 && appliedVoucher) {
        setAppliedVoucher(null);
        setRawVoucher(null);
        setVoucherDiscount(0);
        setIsFreeShipping(false);
        try {
          localStorage.removeItem("net_applied_voucher_v1");
        } catch (_) {}
      }
      return;
    }

    const currentSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const result = validateAndCalculateVoucher(rawVoucher, {
      items,
      subtotal: currentSubtotal,
      shippingFee: 30000,
    });

    if (result.eligible) {
      setVoucherDiscount(result.discountAmount);
      setIsFreeShipping(result.isFreeShipping);
      const updatedInfo: AppliedVoucherInfo = {
        code: rawVoucher.code,
        title: rawVoucher.title,
        discountType: rawVoucher.discountType,
        discountValue: rawVoucher.discountValue,
        discountAmount: result.discountAmount,
        isFreeShipping: result.isFreeShipping,
      };
      setAppliedVoucher(updatedInfo);
      try {
        localStorage.setItem(
          "net_applied_voucher_v1",
          JSON.stringify({ voucher: rawVoucher, info: updatedInfo })
        );
      } catch (_) {}
    } else {
      // Condition no longer met after item change
      setAppliedVoucher(null);
      setRawVoucher(null);
      setVoucherDiscount(0);
      setIsFreeShipping(false);
      try {
        localStorage.removeItem("net_applied_voucher_v1");
      } catch (_) {}
    }
  }, [items, rawVoucher]);

  const applyVoucher = useCallback(
    (voucher: Voucher, isNewCustomer?: boolean): { success: boolean; message: string; discountAmount?: number } => {
      const currentSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const result = validateAndCalculateVoucher(voucher, {
        items,
        subtotal: currentSubtotal,
        shippingFee: 30000,
        isNewCustomer,
      });

      if (!result.eligible) {
        return {
          success: false,
          message: result.reason || "Voucher không đủ điều kiện áp dụng cho giỏ hàng hiện tại.",
        };
      }

      const info: AppliedVoucherInfo = {
        code: voucher.code,
        title: voucher.title,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        discountAmount: result.discountAmount,
        isFreeShipping: result.isFreeShipping,
      };

      setRawVoucher(voucher);
      setAppliedVoucher(info);
      setVoucherDiscount(result.discountAmount);
      setIsFreeShipping(result.isFreeShipping);

      try {
        localStorage.setItem("net_applied_voucher_v1", JSON.stringify({ voucher, info }));
      } catch (_) {}

      return {
        success: true,
        message: `Đã áp dụng mã "${voucher.code}" thành công!`,
        discountAmount: result.discountAmount,
      };
    },
    [items]
  );

  const applyVoucherByCode = useCallback(
    (code: string, isNewCustomer?: boolean): { success: boolean; message: string; discountAmount?: number } => {
      if (!code || !code.trim()) {
        return { success: false, message: "Vui lòng nhập mã voucher!" };
      }
      const matched = getVoucherByCode(code);
      if (!matched) {
        return { success: false, message: `Mã giảm giá "${code.trim().toUpperCase()}" không tồn tại hoặc đã hết hạn.` };
      }
      return applyVoucher(matched, isNewCustomer);
    },
    [applyVoucher]
  );

  const removeVoucher = useCallback(() => {
    setAppliedVoucher(null);
    setRawVoucher(null);
    setVoucherDiscount(0);
    setIsFreeShipping(false);
    try {
      localStorage.removeItem("net_applied_voucher_v1");
    } catch (_) {}
  }, []);

  const addToCart = (newItem: Omit<CartItem, "cartItemId">) => {
    const cartItemId = `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullItem: CartItem = { ...newItem, cartItemId };

    // For standard bags or individual charms, if identical exists, increment quantity
    if (newItem.type === "base_bag" || newItem.type === "charm_single" || newItem.type === "combo") {
      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (i) => i.title === newItem.title && i.type === newItem.type && i.details?.colorName === newItem.details?.colorName
        );
        if (existingIndex > -1) {
          const updated = [...prev];
          const newQty = updated[existingIndex].quantity + newItem.quantity;
          const maxStock = updated[existingIndex].stockCount ?? newItem.stockCount;
          if (maxStock !== undefined && maxStock > 0 && newQty > maxStock) {
            updated[existingIndex].quantity = maxStock;
          } else {
            updated[existingIndex].quantity = newQty;
          }
          return updated;
        }
        return [...prev, fullItem];
      });
    } else {
      // For custom bags, each is a unique piece of art
      setItems((prev) => [...prev, fullItem]);
    }
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.cartItemId !== cartItemId) return i;
        if (i.stockCount !== undefined && i.stockCount > 0 && quantity > i.stockCount) {
          return { ...i, quantity: i.stockCount };
        }
        return { ...i, quantity };
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    removeVoucher();
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalPlasticOffsetKg = items.reduce(
    (sum, item) => sum + item.plasticOffsetKg * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCount,
        subtotal,
        totalPlasticOffsetKg,
        isCartOpen,
        setIsCartOpen,
        appliedVoucher,
        voucherDiscount,
        isFreeShipping,
        applyVoucher,
        applyVoucherByCode,
        removeVoucher,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
