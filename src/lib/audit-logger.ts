/**
 * Audit Logging Helper
 * Logs all user actions to the audit_logs table
 */

import { db } from '@/db';
import { auditLogs } from '@/db/schema';

export interface AuditLogData {
  userId?: number;
  action: string;
  resourceType: string;
  resourceId?: number;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
}

/**
 * Log an action to the audit logs
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: data.userId || null,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId || null,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details: data.details ? JSON.stringify(data.details) : null,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [AUDIT] Failed to log action:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Common audit actions
 */
export const AuditActions = {
  // Authentication
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  
  // Users
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  DISABLE_USER: 'DISABLE_USER',
  ENABLE_USER: 'ENABLE_USER',
  
  // Chantiers
  CREATE_CHANTIER: 'CREATE_CHANTIER',
  UPDATE_CHANTIER: 'UPDATE_CHANTIER',
  DELETE_CHANTIER: 'DELETE_CHANTIER',
  VIEW_CHANTIER: 'VIEW_CHANTIER',
  
  // Files
  UPLOAD_FILE: 'UPLOAD_FILE',
  DELETE_FILE: 'DELETE_FILE',
  DOWNLOAD_FILE: 'DOWNLOAD_FILE',
  
  // Stock
  CREATE_STOCK_MATERIAU: 'CREATE_STOCK_MATERIAU',
  UPDATE_STOCK_MATERIAU: 'UPDATE_STOCK_MATERIAU',
  DELETE_STOCK_MATERIAU: 'DELETE_STOCK_MATERIAU',
  CREATE_STOCK_MATERIEL: 'CREATE_STOCK_MATERIEL',
  UPDATE_STOCK_MATERIEL: 'UPDATE_STOCK_MATERIEL',
  DELETE_STOCK_MATERIEL: 'DELETE_STOCK_MATERIEL',
  CREATE_STOCK_MOVEMENT: 'CREATE_STOCK_MOVEMENT',
  
  // Invoices & Quotes
  CREATE_INVOICE: 'CREATE_INVOICE',
  UPDATE_INVOICE: 'UPDATE_INVOICE',
  DELETE_INVOICE: 'DELETE_INVOICE',
  CREATE_QUOTE: 'CREATE_QUOTE',
  UPDATE_QUOTE: 'UPDATE_QUOTE',
  DELETE_QUOTE: 'DELETE_QUOTE',
} as const;

/**
 * Resource types for audit logs
 */
export const ResourceTypes = {
  AUTH: 'auth',
  USER: 'user',
  CHANTIER: 'chantier',
  FILE: 'file',
  STOCK_MATERIAU: 'stock_materiau',
  STOCK_MATERIEL: 'stock_materiel',
  STOCK_MOVEMENT: 'stock_movement',
  INVOICE: 'invoice',
  QUOTE: 'quote',
} as const;
