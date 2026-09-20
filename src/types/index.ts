export type UserRole = 'admin' | 'buyer' | 'approver' | 'collaborator' | 'stock_manager';
export type UserStatus = 'active' | 'approved' | 'pending' | 'inactive' | 'rejected';

export interface User {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  department: string;
  approvalLimit: number; // Max approval amount in BRL (0 = no approval authority)
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type RequestUrgency = 'low' | 'medium' | 'high' | 'urgent';

export type RequestStatus =
  | 'draft'
  | 'pending_quote'
  | 'quoting'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'ordered'
  | 'completed'
  | 'cancelled';

export interface RequestItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  stockItemId?: string;
  notes?: string;
}

export interface PurchaseRequest {
  id: string;
  code: string; // e.g. "SOL-2026-001"
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  department: string;
  justification: string;
  urgency: RequestUrgency;
  status: RequestStatus;
  estimatedTotal: number;
  items: RequestItem[];
  quoteId?: string;
  orderId?: string;
  approvalComment?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierProposalItem {
  itemId: string;
  description?: string;
  quantity?: number;
  unit?: string;
  unitPrice: number;
  totalPrice?: number;
  brand?: string;
  deliveryDays?: number;
  availableQuantity?: number;
}

export interface SupplierProposal {
  id: string;
  supplierId: string;
  supplierName: string;
  cnpj?: string;
  supplierCnpj?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  deliveryTimeDays?: number;
  deliveryDays?: number;
  paymentTerms: string;
  freightAmount?: number;
  freightCost?: number;
  items: SupplierProposalItem[];
  totalAmount: number;
  notes?: string;
}

export interface QuoteItemPrice {
  itemId: string;
  unitPrice: number;
  availableQuantity: number;
  brand?: string;
  deliveryDays: number;
}

export interface SupplierBid {
  supplierId: string;
  supplierName: string;
  supplierCnpj: string;
  itemPrices: Record<string, QuoteItemPrice>;
  paymentTerms: string;
  freightCost: number;
  validUntil: string;
  notes?: string;
}

export type QuoteStatus =
  | 'draft'
  | 'in_progress'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'converted_to_order'
  | 'ordered';

export interface Quote {
  id: string;
  code: string; // e.g. "COT-2026-001"
  requestId?: string;
  requestCode?: string;
  requestCodes?: string[];
  buyerId: string;
  buyerName: string;
  status: QuoteStatus;
  items?: RequestItem[];
  proposals?: SupplierProposal[];
  bids?: SupplierBid[];
  winnerSupplierId?: string;
  winnerSupplierName?: string;
  selectedSupplierId?: string;
  awardedMode?: 'total' | 'by_item';
  awardedItems?: Record<string, string>;
  totalAmount: number;
  estimatedTotal: number;
  savingAmount: number;
  savingPercent: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'draft'
  | 'issued'
  | 'sent'
  | 'confirmed'
  | 'partially_received'
  | 'partial_received'
  | 'received'
  | 'cancelled';

export interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  receivedQuantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  stockItemId?: string;
}

export interface OrderInvoice {
  number: string;
  accessKey?: string;
  receivedAt: string;
  receivedBy: string;
  receivedByName: string;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  code?: string; // e.g. "PED-2026-001"
  orderNumber?: string;
  quoteId?: string;
  requestId?: string;
  supplierId: string;
  supplierName: string;
  supplierCnpj: string;
  supplierEmail: string;
  supplierPhone: string;
  supplierContact?: string;
  buyerId: string;
  buyerName: string;
  approverId?: string;
  approverName?: string;
  approvedByName?: string;
  status: OrderStatus;
  totalAmount: number;
  freightAmount?: number;
  freightCost?: number;
  paymentTerms: string;
  deliveryDeadline: string;
  deliveryAddress: string;
  invoices?: OrderInvoice[];
  invoiceNumber?: string;
  invoiceKey?: string;
  invoiceDate?: string;
  items: OrderItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockItem {
  id: string;
  code?: string; // e.g. "MAT-001"
  sku?: string;
  description?: string;
  name?: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  averageCost?: number;
  avgCost?: number;
  location: string;
  lastRestockDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'entry' | 'exit' | 'in' | 'out' | 'adjustment';
export type ReferenceType = 'purchase_order' | 'requisition' | 'inventory_count' | 'donation' | 'order';

export interface StockMovement {
  id: string;
  stockItemId?: string;
  itemId?: string;
  itemCode?: string;
  description?: string;
  itemName?: string;
  type: MovementType;
  quantity: number;
  previousStock?: number;
  newStock?: number;
  referenceType?: ReferenceType;
  referenceId?: string;
  invoiceNumber?: string;
  userId?: string;
  userName?: string;
  performedBy?: string;
  performedByName?: string;
  reason?: string;
  department?: string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name?: string;
  corporateName?: string;
  tradeName?: string;
  cnpj: string;
  email: string;
  phone: string;
  contactName?: string;
  contactPerson?: string;
  category: string;
  address?: string;
  city?: string;
  state?: string;
  rating: number; // 1 to 5
  active: boolean;
  paymentTermsDefault?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  action: string;
  entityType?: string;
  entity?: string;
  entityId: string;
  entityCode?: string;
  details: string;
  timestamp?: string;
  createdAt?: string;
}

export interface ApprovalRule {
  id: string;
  levelName: string;
  maxAmount: number;
  requiredRole: UserRole;
  description: string;
}

export type AppRoute =
  | 'dashboard'
  | 'requests'
  | 'quotes'
  | 'approvals'
  | 'orders'
  | 'stock'
  | 'suppliers'
  | 'users'
  | 'audit';
