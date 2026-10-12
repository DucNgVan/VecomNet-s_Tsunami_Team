// ============================================================================
// NÉT BACKEND MODULE (BỘ ĐIỀU HÀNH TOÀN DIỆN MÁY CHỦ BACKEND)
// ============================================================================

// 1. Models & Types
export * from "./models";

// 2. Database Repositories
export { ProductRepository } from "./database/productRepo";
export { OrderRepository } from "./database/orderRepo";
export { InventoryRepository } from "./database/inventoryRepo";

// 3. Business Services
export { ProductService } from "./services/productService";
export { OrderService } from "./services/orderService";
export { PaymentService } from "./services/paymentService";
export { PassportService } from "./services/passportService";

// 4. API Controllers
export { ProductController } from "./controllers/productController";
export { OrderController } from "./controllers/orderController";
export { PaymentController } from "./controllers/paymentController";
export { PassportController } from "./controllers/passportController";

// 5. Config
export { adminDb, adminAuth } from "./config/firebaseAdmin";
