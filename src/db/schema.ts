import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  status: text('status').notNull().default('active'),
  phone: text('phone'),
  address: text('address'),
  photoUrl: text('photo_url'),
  authUserId: text('auth_user_id'),
  createdAt: text('created_at').notNull(),
  lastLogin: text('last_login'),
});

// Chantiers table
export const chantiers = sqliteTable('chantiers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  clientId: integer('client_id').references(() => users.id),
  responsableId: integer('responsable_id').references(() => users.id),
  status: text('status').notNull(),
  startDate: text('start_date'),
  endDate: text('end_date'),
  address: text('address').notNull(),
  description: text('description'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Chantier Files table
export const chantierFiles = sqliteTable('chantier_files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  chantierId: integer('chantier_id').references(() => chantiers.id),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  uploadedAt: text('uploaded_at').notNull(),
});

// Stock Materiaux table
export const stockMateriaux = sqliteTable('stock_materiaux', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull().default(0),
  unit: text('unit').notNull(),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Stock Materiels table
export const stockMateriels = sqliteTable('stock_materiels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull().default(0),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Stock Movements table
export const stockMovements = sqliteTable('stock_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itemType: text('item_type').notNull(),
  itemId: integer('item_id').notNull(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  quantity: integer('quantity').notNull(),
  date: text('date').notNull(),
  notes: text('notes'),
});

// Invoices and Quotes table
export const invoicesQuotes = sqliteTable('invoices_quotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),
  documentNumber: text('document_number').notNull().unique(),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  clientAddress: text('client_address').notNull(),
  clientPhone: text('client_phone'),
  chantierId: integer('chantier_id').references(() => chantiers.id),
  issueDate: text('issue_date').notNull(),
  dueDate: text('due_date'),
  validityDate: text('validity_date'),
  status: text('status').notNull(),
  items: text('items', { mode: 'json' }).notNull(),
  subtotal: real('subtotal').notNull(),
  taxRate: real('tax_rate').notNull(),
  taxAmount: real('tax_amount').notNull(),
  totalAmount: real('total_amount').notNull(),
  notes: text('notes'),
  terms: text('terms'),
  pdfUrl: text('pdf_url'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: integer('resource_id'),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent').notNull(),
  details: text('details'),
  createdAt: text('created_at').notNull(),
});