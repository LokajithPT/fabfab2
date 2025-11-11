import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const deliveries = pgTable("deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  deliveryDate: timestamp("delivery_date"),
  deliveryAddress: jsonb("delivery_address"),
  deliveryStatus: text("delivery_status", { enum: ["pending", "in_transit", "delivered", "failed"] }).notNull().default("pending"),
  trackingNumber: text("tracking_number"),
  vehicleId: text("vehicle_id"),
  driverName: text("driver_name"),
  status: text("status", { enum: ["pending", "in_transit", "delivered", "failed"] }).notNull().default("pending"),
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderTransactions = pgTable("order_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  transactionType: text("transaction_type", { enum: ["payment", "refund", "adjustment"] }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  paymentMethod: text("payment_method"),
  status: text("status", { enum: ["pending", "completed", "failed"] }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  address: jsonb("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: text("duration"),
  category: text("category"),
  status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  reorderLevel: integer("reorder_level").notNull().default(10),
  supplier: text("supplier"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  status: text("status", { enum: ["pending", "processing", "completed", "cancelled", "in_store", "ready_for_transit", "out_for_delivery", "Quality Check", "Ready for Delivery"] }).notNull(), // pending, processing, completed, cancelled, in_store, ready_for_transit, out_for_delivery
  paymentStatus: text("payment_status", { enum: ["pending", "paid", "failed"] }).notNull().default("pending"), // pending, paid, failed
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  items: jsonb("items").notNull(), // Array of order items
  shippingAddress: jsonb("shipping_address"),
  pickupDate: timestamp("pickup_date"), // Scheduled pickup date
  transitOrderId: varchar("transit_order_id"), // Link to transit batch
  transitStatus: text("transit_status", { enum: ["pending", "in_transit", "delivered"] }), // Status within transit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transitOrders = pgTable("transit_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transitId: text("transit_id").notNull().unique(),
  type: text("type", { enum: ["store_to_factory", "factory_to_store"] }).notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  createdBy: text("created_by").notNull(),
  status: text("status", { enum: ["in_transit", "completed", "cancelled"] }).notNull().default("in_transit"),
  vehicleNumber: text("vehicle_number"),
  vehicleType: text("vehicle_type"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  driverLicense: text("driver_license"),
  employeeName: text("employee_name"),
  employeeId: text("employee_id"),
  employeeDesignation: text("employee_designation"),
  employeePhone: text("employee_phone"),
  totalOrders: integer("total_orders").default(0),
  totalItems: integer("total_items").default(0),
  totalWeight: decimal("total_weight", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transitOrderItems = pgTable("transit_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transitOrderId: varchar("transit_order_id").references(() => transitOrders.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  orderNumber: text("order_number").notNull(),
  customerName: text("customer_name").notNull(),
  itemCount: integer("item_count").default(0),
  status: text("status", { enum: ["pending", "in_transit", "delivered"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transitStatusHistory = pgTable("transit_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transitOrderId: varchar("transit_order_id").references(() => transitOrders.id).notNull(),
  status: text("status", { enum: ["in_transit", "completed", "cancelled"] }).notNull(),
  notes: text("notes"),
  location: text("location"),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderTransactionSchema = createInsertSchema(orderTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransitOrderSchema = createInsertSchema(transitOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransitOrderItemSchema = createInsertSchema(transitOrderItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransitStatusHistorySchema = createInsertSchema(transitStatusHistory).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveries.$inferSelect;

export type InsertOrderTransaction = z.infer<typeof insertOrderTransactionSchema>;
export type OrderTransaction = typeof orderTransactions.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertTransitOrder = z.infer<typeof insertTransitOrderSchema>;
export type TransitOrder = typeof transitOrders.$inferSelect;

export type InsertTransitOrderItem = z.infer<typeof insertTransitOrderItemSchema>;
export type TransitOrderItem = typeof transitOrderItems.$inferSelect;

export type InsertTransitStatusHistory = z.infer<typeof insertTransitStatusHistorySchema>;
export type TransitStatusHistory = typeof transitStatusHistory.$inferSelect;

// Alias for backward compatibility
export type PosTransaction = OrderTransaction;

// Custom Service Interface to match Flask-SQLAlchemy model
export interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  category?: string; // Make category optional as it might not always be present
  status: string;
  usage_count: number;
}
