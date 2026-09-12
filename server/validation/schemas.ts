import { z } from 'zod';

export const CreateTransactionSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().optional(),
      name: z.string().min(1, 'Item name is required'),
      quantity: z.number().int().positive('Quantity must be at least 1'),
      unitPrice: z.number().min(0, 'Unit price cannot be negative'),
    })
  ).min(1, 'At least one item is required in the transaction'),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'digital']).default('card'),
  notes: z.string().optional(),
});

export const AdjustStockSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantityDelta: z.number().int().optional(),
  newStock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  type: z.enum(['adjustment', 'restock', 'return', 'damage', 'internal_use']).default('adjustment'),
  reason: z.string().min(1, 'Reason for inventory change is required for audit trail'),
}).refine(data => data.quantityDelta !== undefined || data.newStock !== undefined, {
  message: 'Either quantityDelta or newStock must be provided',
});

export const RestockProductSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Restock quantity must be positive'),
  costPrice: z.number().min(0).optional(),
  vendor: z.string().optional(),
  recordExpense: z.boolean().default(true),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'digital']).default('card'),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  costPrice: z.number().min(0, 'Cost price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  currentStock: z.number().int().min(0, 'Initial stock cannot be negative').default(0),
  reorderPoint: z.number().int().min(0).default(5),
  reorderQuantity: z.number().int().positive().default(20),
  unit: z.string().min(1).default('unit'),
  supplier: z.string().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const CreateExpenseSchema = z.object({
  category: z.enum(['inventory', 'utilities', 'rent', 'supplies', 'payroll', 'marketing', 'maintenance', 'other']),
  amount: z.number().positive('Expense amount must be greater than zero'),
  vendor: z.string().min(1, 'Vendor or payee is required'),
  description: z.string().min(1, 'Description is required'),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'digital']).default('card'),
});

export const AddMembershipSchema = z.object({
  email: z.string().email('Valid email is required'),
  fullName: z.string().min(1, 'Full name is required').optional(),
  role: z.enum(['owner', 'manager', 'staff']).default('staff'),
});

export const CreateMemorySchema = z.object({
  fact: z.string().min(3, 'Fact must be at least 3 characters long'),
  type: z.enum(['customer_preference', 'operating_rhythm', 'supplier_pattern', 'seasonal_trend', 'constraint', 'general']).default('general'),
  confidence: z.number().min(0).max(1).default(0.85),
  source: z.enum(['manual', 'observation', 'conversation']).default('manual'),
  status: z.enum(['active', 'archived', 'disputed']).default('active'),
});

export const UpdateMemorySchema = CreateMemorySchema.partial();

export const CopilotChatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional(),
});

