import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  // Header image
  headerImage: {
    width: '100%',
    marginBottom: 10,
    objectFit: 'contain',
  },
  // Turquoise border
  turquoiseBorder: {
    borderBottomWidth: 3,
    borderBottomColor: '#00bfbf',
    marginBottom: 15,
  },
  // Recipient section (right aligned)
  recipientSection: {
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  recipientTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    marginBottom: 3,
  },
  recipientText: {
    fontSize: 7.5,
    color: '#000000',
    lineHeight: 1.5,
    textAlign: 'right',
  },
  // Client and document row
  clientDocumentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 20,
  },
  // Client box (grey border like reference)
  clientBox: {
    width: '45%',
    border: '1.5px solid #999999',
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
  },
  clientName: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    marginBottom: 5,
  },
  clientText: {
    fontSize: 8,
    color: '#000000',
    lineHeight: 1.6,
  },
  // Document title section (right)
  documentTitleSection: {
    alignItems: 'flex-end',
  },
  documentTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#00bfbf',
    marginBottom: 3,
  },
  documentDate: {
    fontSize: 9,
    color: '#000000',
  },
  // Table
  table: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#00bfbf',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#00bfbf',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  tableCell: {
    padding: 5,
    fontSize: 8,
    color: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tableCellHeader: {
    padding: 5,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  cellNo: { width: '8%', borderRightWidth: 1, borderRightColor: '#e0e0e0' },
  cellDescription: { width: '42%', borderRightWidth: 1, borderRightColor: '#e0e0e0' },
  cellQty: { width: '10%', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#e0e0e0' },
  cellPrice: { width: '15%', textAlign: 'right', borderRightWidth: 1, borderRightColor: '#e0e0e0' },
  cellTVA: { width: '10%', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#e0e0e0' },
  cellTotal: { width: '15%', textAlign: 'right' },
  cellHeaderNo: { width: '8%', borderRightWidth: 1, borderRightColor: '#00bfbf' },
  cellHeaderDescription: { width: '42%', borderRightWidth: 1, borderRightColor: '#00bfbf' },
  cellHeaderQty: { width: '10%', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#00bfbf' },
  cellHeaderPrice: { width: '15%', textAlign: 'right', borderRightWidth: 1, borderRightColor: '#00bfbf' },
  cellHeaderTVA: { width: '10%', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#00bfbf' },
  cellHeaderTotal: { width: '15%', textAlign: 'right' },
  // Totals
  totalsContainer: {
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  totalsBox: {
    width: 300,
    borderWidth: 2,
    borderColor: '#00bfbf',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '6 10',
    borderBottomWidth: 1,
    borderBottomColor: '#00bfbf',
    backgroundColor: '#ffffff',
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '7 10',
    backgroundColor: '#00bfbf',
  },
  totalLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  totalValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  totalLabelFinal: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  totalValueFinal: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  // Payment box (cyan/turquoise light background like reference)
  paymentBox: {
    padding: '9 10',
    backgroundColor: '#e0f7f7',
    borderWidth: 1,
    borderColor: '#00bfbf',
    marginBottom: 10,
    borderRadius: 4,
  },
  paymentTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  paymentText: {
    fontSize: 8,
    color: '#000000',
  },
  // Footer
  footer: {
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#00bfbf',
    marginTop: 10,
  },
  footerContent: {
    alignItems: 'center',
  },
  footerLogo: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  footerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
    width: '100%',
  },
  footerColumn: {
    flex: 1,
  },
  footerColumnTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#00bfbf',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  footerColumnText: {
    fontSize: 6.5,
    color: '#333333',
    lineHeight: 1.5,
    marginBottom: 1,
  },
  footerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginVertical: 6,
    width: '100%',
  },
  footerCopyright: {
    fontSize: 6,
    color: '#999999',
    textAlign: 'center',
    marginTop: 6,
  },
});

interface InvoiceQuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoicePDFDocumentProps {
  type: 'invoice' | 'quote';
  documentNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone?: string;
  issueDate: string;
  dueDate?: string;
  validityDate?: string;
  items: InvoiceQuoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  terms?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR');
};

const calculateDueDate = (issueDate: string, dueDate?: string) => {
  if (dueDate) return formatDate(dueDate);
  
  const issue = new Date(issueDate);
  issue.setDate(issue.getDate() + 30);
  return issue.toLocaleDateString('fr-FR');
};

export const InvoicePDFDocument: React.FC<InvoicePDFDocumentProps> = ({
  type,
  documentNumber,
  clientName,
  clientEmail,
  clientAddress,
  clientPhone,
  issueDate,
  dueDate,
  validityDate,
  items,
  subtotal,
  taxRate,
  taxAmount,
  totalAmount,
  notes,
  terms,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header Image - UPDATED URL */}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image 
        src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/en-tete-devis-1761985105615.png"
        style={styles.headerImage}
      />

      {/* Turquoise Border */}
      <View style={styles.turquoiseBorder} />

      {/* Recipient Info (Right Aligned) */}
      <View style={styles.recipientSection}>
        <Text style={styles.recipientTitle}>JHS ENTREPRISE</Text>
        <Text style={styles.recipientText}>
          3 Avenue Claude Monet{'\n'}
          13014 Marseille{'\n'}
          France
        </Text>
      </View>

      {/* Client Info and Document Title Row */}
      <View style={styles.clientDocumentRow}>
        {/* Left: Client Box */}
        <View style={styles.clientBox}>
          <Text style={styles.clientName}>{clientName}</Text>
          <Text style={styles.clientText}>
            {clientAddress}
            {clientEmail && `\n${clientEmail}`}
          </Text>
        </View>

        {/* Right: Document Title */}
        <View style={styles.documentTitleSection}>
          <Text style={styles.documentTitle}>
            {type === 'invoice' ? 'Facture' : 'Devis'} n° {documentNumber}
          </Text>
          <Text style={styles.documentDate}>
            En date du {formatDate(issueDate)}
          </Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        {/* Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellHeader, styles.cellHeaderNo]}>N°</Text>
          <Text style={[styles.tableCellHeader, styles.cellHeaderDescription]}>Désignation</Text>
          <Text style={[styles.tableCellHeader, styles.cellHeaderQty]}>Qté</Text>
          <Text style={[styles.tableCellHeader, styles.cellHeaderPrice]}>PU HT</Text>
          <Text style={[styles.tableCellHeader, styles.cellHeaderTVA]}>TVA</Text>
          <Text style={[styles.tableCellHeader, styles.cellHeaderTotal]}>Total HT</Text>
        </View>
        {/* Rows */}
        {items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.cellNo]}>{index + 1}</Text>
            <Text style={[styles.tableCell, styles.cellDescription]}>{item.description}</Text>
            <Text style={[styles.tableCell, styles.cellQty]}>{item.quantity}</Text>
            <Text style={[styles.tableCell, styles.cellPrice]}>{formatCurrency(item.unit_price)}</Text>
            <Text style={[styles.tableCell, styles.cellTVA]}>{taxRate} %</Text>
            <Text style={[styles.tableCell, styles.cellTotal]}>{formatCurrency(item.total)}</Text>
          </View>
        ))}
      </View>

      {/* Totals Box */}
      <View style={styles.totalsContainer}>
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA à {taxRate}%</Text>
            <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
          </View>
          <View style={styles.totalRowFinal}>
            <Text style={styles.totalLabelFinal}>Total TTC</Text>
            <Text style={styles.totalValueFinal}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>
      </View>

      {/* Payment Instructions */}
      <View style={styles.paymentBox}>
        <Text style={styles.paymentTitle}>
          À régler avant le {calculateDueDate(issueDate, dueDate)}
        </Text>
        <Text style={styles.paymentText}>
          À régler par chèque ou par virement bancaire.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Text style={styles.footerLogo}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>JHS</Text>
          </Text>
          <View style={styles.footerGrid}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>JHS Entreprise</Text>
              <Text style={styles.footerColumnText}>✉ : contact@jhsentreprise.fr</Text>
              <Text style={styles.footerColumnText}>http://www.jhsentreprise.fr</Text>
              <Text style={styles.footerColumnText}>3 Avenue Claude Monet</Text>
              <Text style={styles.footerColumnText}>✉ : jh.s@orange.fr</Text>
              <Text style={styles.footerColumnText}>http://www.jhs-renovation-13.fr</Text>
              <Text style={styles.footerColumnText}>13014 Marseille</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>SARL au capital de 7 771,90 €</Text>
              <Text style={styles.footerColumnText}>Certificat Qualibat RGE : E-E153759</Text>
              <Text style={styles.footerColumnText}>☎ : 0491631313</Text>
              <Text style={styles.footerColumnText}>SIRET : 37776777700024</Text>
              <Text style={styles.footerColumnText}>Assurance : AXA IARD 4496746004</Text>
              <Text style={styles.footerColumnText}>Code APE : 4399C</Text>
              <Text style={styles.footerColumnText}>TVA intra. : FR60377677777</Text>
              <Text style={styles.footerColumnText}>IBAN : FR76 3000 3031 9900 0202 2851 559</Text>
            </View>
          </View>
          <View style={styles.footerDivider} />
          <Text style={styles.footerCopyright}>
            © 2025 JHS Entreprise - Tous droits réservés
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);