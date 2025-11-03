'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Download,
  Save,
  Loader2,
  X,
  Eye,
  Edit as EditIcon,
  FileText,
  User,
  Calendar,
  ShoppingCart,
  Calculator,
  FileCheck,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { InvoicePDFDocument } from '@/components/invoice-pdf-document';
import { STORAGE_BUCKETS } from '@/lib/supabase';
import Image from 'next/image';

interface InvoiceQuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoiceQuote {
  id?: number;
  type: 'invoice' | 'quote';
  documentNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone?: string;
  chantierId?: number;
  issueDate: string;
  dueDate?: string;
  validityDate?: string;
  status: string;
  items: InvoiceQuoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  terms?: string;
}

interface InvoiceEditorProps {
  document?: InvoiceQuote | null;
  onClose: () => void;
  viewMode?: boolean;
  initialType?: 'invoice' | 'quote';
}

export function InvoiceEditor({ document, onClose, viewMode: initialViewMode = false, initialType }: InvoiceEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState(initialViewMode);
  const previewRef = useRef<HTMLDivElement>(null);

  // Form state
  const [type, setType] = useState<'invoice' | 'quote'>(document?.type || initialType || 'invoice');
  const [documentNumber, setDocumentNumber] = useState(document?.documentNumber || '');
  const [clientName, setClientName] = useState(document?.clientName || '');
  const [clientEmail, setClientEmail] = useState(document?.clientEmail || '');
  const [clientAddress, setClientAddress] = useState(document?.clientAddress || '');
  const [clientPhone, setClientPhone] = useState(document?.clientPhone || '');
  const [issueDate, setIssueDate] = useState(
    document?.issueDate ? document.issueDate.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(document?.dueDate ? document.dueDate.split('T')[0] : '');
  const [validityDate, setValidityDate] = useState(
    document?.validityDate ? document.validityDate.split('T')[0] : ''
  );
  const [status, setStatus] = useState(document?.status || 'draft');
  const [items, setItems] = useState<InvoiceQuoteItem[]>(
    document?.items || [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
  );
  const [taxRate, setTaxRate] = useState(document?.taxRate || 20);
  const [notes, setNotes] = useState(document?.notes || '');
  const [terms, setTerms] = useState(document?.terms || '');

  // Calculated values
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Fetch next document number on mount for new documents
  useEffect(() => {
    if (!document) {
      fetchNextDocumentNumber();
    }
  }, [type, document]);

  // Recalculate totals when items or tax rate change
  useEffect(() => {
    calculateTotals();
  }, [items, taxRate]);

  const fetchNextDocumentNumber = async () => {
    try {
      const response = await fetch(`/api/invoices-quotes/next-number?type=${type}`);
      if (!response.ok) throw new Error('Failed to fetch next number');
      const data = await response.json();
      setDocumentNumber(data.nextNumber);
    } catch (error) {
      console.error('Error fetching next number:', error);
      toast.error('Erreur lors de la récupération du numéro de document');
    }
  };

  const calculateTotals = () => {
    const sub = items.reduce((sum, item) => sum + item.total, 0);
    const tax = (sub * taxRate) / 100;
    const total = sub + tax;

    setSubtotal(sub);
    setTaxAmount(tax);
    setTotalAmount(total);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.error('Au moins un article est requis');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceQuoteItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate total for the item
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }

    setItems(newItems);
  };

  const handleSave = async () => {
    // Validation
    if (!documentNumber.trim()) {
      toast.error('Le numéro de document est requis');
      return;
    }
    if (!clientName.trim()) {
      toast.error('Le nom du client est requis');
      return;
    }
    if (!clientEmail.trim()) {
      toast.error("L'email du client est requis");
      return;
    }
    if (!clientAddress.trim()) {
      toast.error("L'adresse du client est requise");
      return;
    }
    if (!issueDate) {
      toast.error("La date d'émission est requise");
      return;
    }
    if (items.some((item) => !item.description.trim())) {
      toast.error('Tous les articles doivent avoir une description');
      return;
    }

    setIsSaving(true);
    let pdfUrl: string | undefined;

    try {
      // ✅ STEP 1: Generate and upload PDF to Supabase Storage
      const savingToast = toast.loading('📄 Génération du PDF...');
      
      const pdfDoc = (
        <InvoicePDFDocument
          type={type}
          documentNumber={documentNumber}
          clientName={clientName}
          clientEmail={clientEmail}
          clientAddress={clientAddress}
          clientPhone={clientPhone}
          issueDate={issueDate}
          dueDate={dueDate}
          validityDate={validityDate}
          items={items}
          subtotal={subtotal}
          taxRate={taxRate}
          taxAmount={taxAmount}
          totalAmount={totalAmount}
          notes={notes}
          terms={terms}
        />
      );

      const blob = await pdf(pdfDoc).toBlob();
      
      // Convert blob to File object for upload
      const fileName = `${documentNumber}_${new Date().getTime()}.pdf`;
      const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

      toast.loading('☁️ Upload du PDF vers Supabase...', { id: savingToast });

      // Upload to Supabase Storage
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('bucket', STORAGE_BUCKETS.CHANTIER_FILES);
      formData.append('fileType', type === 'invoice' ? 'facture_client' : 'devis');

      const uploadResponse = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Échec de l\'upload du PDF');
      }

      const uploadData = await uploadResponse.json();
      pdfUrl = uploadData.url;

      toast.loading('💾 Sauvegarde du document...', { id: savingToast });

      // ✅ STEP 2: Save to database with pdfUrl
      const payload = {
        type,
        documentNumber: documentNumber.trim(),
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientAddress: clientAddress.trim(),
        clientPhone: clientPhone.trim() || undefined,
        issueDate: new Date(issueDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        validityDate: validityDate ? new Date(validityDate).toISOString() : undefined,
        status,
        items,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
        pdfUrl, // ✅ Include PDF URL
      };

      console.log('Saving document with payload:', payload);

      const url = document ? `/api/invoices-quotes?id=${document.id}` : '/api/invoices-quotes';
      const method = document ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Server response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save document');
      }

      toast.success(
        document
          ? `${type === 'invoice' ? 'Facture' : 'Devis'} modifié avec succès`
          : `${type === 'invoice' ? 'Facture' : 'Devis'} créé avec succès`,
        { id: savingToast }
      );
      
      // Small delay to ensure toast is visible before closing
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error: any) {
      console.error('Error saving document:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde du document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsLoading(true);
    let progressToast: string | number | undefined;

    try {
      progressToast = toast.loading('📄 Génération du PDF...');
      
      // Create PDF document using @react-pdf/renderer
      const pdfDoc = (
        <InvoicePDFDocument
          type={type}
          documentNumber={documentNumber}
          clientName={clientName}
          clientEmail={clientEmail}
          clientAddress={clientAddress}
          clientPhone={clientPhone}
          issueDate={issueDate}
          dueDate={dueDate}
          validityDate={validityDate}
          items={items}
          subtotal={subtotal}
          taxRate={taxRate}
          taxAmount={taxAmount}
          totalAmount={totalAmount}
          notes={notes}
          terms={terms}
        />
      );

      toast.loading('💾 Préparation du téléchargement...', { id: progressToast });
      
      // Generate blob
      const blob = await pdf(pdfDoc).toBlob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const filename = `${documentNumber || 'document'}_${new Date().getTime()}.pdf`;
      
      // Check if we're in an iframe
      const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
      
      if (isInIframe) {
        // In iframe, send message to parent or open in new tab
        try {
          window.open(url, '_blank');
          toast.success('✅ PDF ouvert dans un nouvel onglet !', { 
            id: progressToast,
            duration: 4000 
          });
        } catch (e) {
          // Fallback: send message to parent window
          window.parent.postMessage({ 
            type: 'DOWNLOAD_PDF', 
            url: url, 
            filename: filename 
          }, '*');
          toast.success('✅ Téléchargement préparé !', { 
            id: progressToast,
            duration: 4000 
          });
        }
      } else {
        // Normal browser environment - use download link
        try {
          const link = window.document.createElement('a');
          link.href = url;
          link.download = filename;
          
          // Append to document body
          window.document.body.appendChild(link);
          
          // Trigger download
          link.click();
          
          // Cleanup
          setTimeout(() => {
            if (window.document.body.contains(link)) {
              window.document.body.removeChild(link);
            }
            URL.revokeObjectURL(url);
          }, 100);
          
          toast.success('✅ PDF téléchargé avec succès !', { 
            id: progressToast,
            duration: 4000 
          });
        } catch (e) {
          console.error('Direct download failed, trying window.open', e);
          // Fallback to opening in new tab
          window.open(url, '_blank');
          toast.success('✅ PDF ouvert dans un nouvel onglet !', { 
            id: progressToast,
            duration: 4000 
          });
        }
      }
      
    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast.error(`❌ Erreur: ${error.message || 'Impossible de générer le PDF'}`, { 
        id: progressToast,
        duration: 6000 
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Action Buttons - Much more prominent and styled */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-br from-zinc-900/80 via-zinc-800/60 to-zinc-900/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border-2 border-primary/30 shadow-2xl shadow-primary/20">
        {/* Toggle View/Edit Mode - ONLY VISIBLE ON MOBILE */}
        {document && (
          <div className="flex gap-2 bg-white/5 backdrop-blur-sm rounded-xl p-1.5 w-full sm:w-auto border border-white/10 md:hidden">
            <Button
              onClick={() => setViewMode(true)}
              variant={viewMode ? 'default' : 'ghost'}
              size="lg"
              className={`gap-2 flex-1 sm:flex-none rounded-lg transition-all duration-300 h-11 ${
                viewMode 
                  ? 'bg-gradient-to-r from-primary to-cyan-500 text-white shadow-lg shadow-primary/40 scale-105' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-semibold">Visualiser</span>
            </Button>
            <Button
              onClick={() => setViewMode(false)}
              variant={!viewMode ? 'default' : 'ghost'}
              size="lg"
              className={`gap-2 flex-1 sm:flex-none rounded-lg transition-all duration-300 h-11 ${
                !viewMode 
                  ? 'bg-gradient-to-r from-primary to-cyan-500 text-white shadow-lg shadow-primary/40 scale-105' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <EditIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-semibold">Modifier</span>
            </Button>
          </div>
        )}
        
        <div className="flex gap-3 w-full sm:w-auto">
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            size="lg"
            className="gap-3 bg-gradient-to-r from-primary via-cyan-500 to-primary bg-[length:200%_100%] hover:bg-right flex-1 sm:flex-none h-12 rounded-xl shadow-2xl shadow-primary/50 hover:shadow-primary/70 hover:scale-105 transition-all duration-300 border border-primary/50 font-bold"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Enregistrer</span>
              </>
            )}
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isLoading}
            size="lg"
            className="gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/20 hover:border-primary/50 flex-1 sm:flex-none h-12 rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>Télécharger PDF</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* SIDE BY SIDE LAYOUT ON TABLET/DESKTOP */}
      <div className="grid gap-6 lg:gap-10 xl:gap-16 grid-cols-1 md:grid-cols-2">
        {/* Form Section - Hidden on mobile when viewMode=true, always visible on md+ */}
        <div className={`space-y-8 max-h-[calc(90vh-220px)] overflow-y-auto pr-2 lg:pr-4 xl:pr-6 custom-scrollbar ${viewMode ? 'hidden md:block' : 'block'}`}>
          {/* Section 1: Informations générales - Much more stylish */}
          <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-800/60 to-zinc-900/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-8 sm:p-10 border-2 border-primary/30 shadow-2xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-500 group">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-primary/20">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/30 to-cyan-500/30 backdrop-blur-sm border border-primary/40 shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Informations générales
              </h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-white font-semibold text-base flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Type de document
                </Label>
                <Select value={type} onValueChange={(value: any) => setType(value)} disabled={!!document}>
                  <SelectTrigger className="bg-white/5 border-2 border-white/20 text-white h-14 text-base rounded-xl backdrop-blur-sm hover:border-primary/50 focus:border-primary transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Facture</SelectItem>
                    <SelectItem value="quote">Devis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-white font-semibold text-base flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Numéro
                  </Label>
                  <Input
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="INV-0001"
                    className="bg-white/5 border-2 border-white/20 text-white placeholder:text-white/40 h-14 text-base rounded-xl backdrop-blur-sm hover:border-primary/50 focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-white font-semibold text-base flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Statut
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="bg-white/5 border-2 border-white/20 text-white h-14 text-base rounded-xl backdrop-blur-sm hover:border-primary/50 focus:border-primary transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="sent">Envoyé</SelectItem>
                      {type === 'invoice' ? (
                        <>
                          <SelectItem value="paid">Payée</SelectItem>
                          <SelectItem value="cancelled">Annulée</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="accepted">Accepté</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-white font-semibold text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Date d'émission
                  </Label>
                  <Input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="bg-white/5 border-2 border-white/20 text-white h-14 text-base rounded-xl backdrop-blur-sm hover:border-primary/50 focus:border-primary transition-all"
                  />
                </div>
                {type === 'invoice' ? (
                  <div className="space-y-3">
                    <Label className="text-white font-semibold text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Date d'échéance
                    </Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="bg-white/5 border-2 border-white/20 text-white h-14 text-base rounded-xl backdrop-blur-sm hover:border-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label className="text-white font-semibold text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Date de validité
                    </Label>
                    <Input
                      type="date"
                      value={validityDate}
                      onChange={(e) => setValidityDate(e.target.value)}
                      className="bg-white/5 border-2 border-white/20 text-white h-14 text-base rounded-xl backdrop-blur-sm hover:border-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Informations client - Much more stylish */}
          <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-800/60 to-zinc-900/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-8 sm:p-10 border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-500 group">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-cyan-500/20">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-teal-500/30 backdrop-blur-sm border border-cyan-500/40 shadow-lg shadow-cyan-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <User className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Informations client
              </h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-white font-semibold text-base flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  Nom du client *
                </Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="bg-white/5 border-2 border-white/20 text-white placeholder:text-white/40 h-14 text-base rounded-xl backdrop-blur-sm hover:border-cyan-500/50 focus:border-cyan-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-white font-semibold text-base flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-cyan-400" />
                    Email *
                  </Label>
                  <Input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="email@exemple.fr"
                    className="bg-white/5 border-2 border-white/20 text-white placeholder:text-white/40 h-14 text-base rounded-xl backdrop-blur-sm hover:border-cyan-500/50 focus:border-cyan-500 transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-white font-semibold text-base flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-cyan-400" />
                    Téléphone
                  </Label>
                  <Input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="bg-white/5 border-2 border-white/20 text-white placeholder:text-white/40 h-14 text-base rounded-xl backdrop-blur-sm hover:border-cyan-500/50 focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-white font-semibold text-base flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  Adresse *
                </Label>
                <Textarea
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="123 Rue Example, 75001 Paris"
                  rows={3}
                  className="bg-white/5 border-2 border-white/20 text-white placeholder:text-white/40 text-base rounded-xl backdrop-blur-sm hover:border-cyan-500/50 focus:border-cyan-500 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Articles - Much more stylish */}
          <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-800/60 to-zinc-900/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-8 sm:p-10 border-2 border-green-500/30 shadow-2xl shadow-green-500/20 hover:shadow-green-500/30 transition-all duration-500 group">
            <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-green-500/20">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 backdrop-blur-sm border border-green-500/40 shadow-lg shadow-green-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <ShoppingCart className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                  Articles
                </h3>
              </div>
              <Button 
                onClick={addItem} 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-11 rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all font-semibold"
              >
                <Plus className="h-5 w-5" />
                Ajouter
              </Button>
            </div>

            <div className="space-y-5">
              {items.map((item, index) => (
                <div 
                  key={index} 
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 space-y-5 border-2 border-white/10 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-5">
                      <div className="space-y-2">
                        <Label className="text-white/80 text-sm font-medium">Description *</Label>
                        <Input
                          placeholder="Description de l'article"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="bg-white/5 border border-white/20 text-white placeholder:text-white/40 h-12 rounded-lg hover:border-green-500/50 focus:border-green-500 transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-5">
                        <div className="space-y-2">
                          <Label className="text-white/70 text-xs font-medium">Quantité</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, 'quantity', parseFloat(e.target.value) || 1)
                            }
                            className="bg-white/5 border border-white/20 text-white h-11 rounded-lg hover:border-green-500/50 focus:border-green-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white/70 text-xs font-medium">Prix unitaire</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                            }
                            className="bg-white/5 border border-white/20 text-white h-11 rounded-lg hover:border-green-500/50 focus:border-green-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white/70 text-xs font-medium">Total</Label>
                          <Input 
                            value={formatCurrency(item.total)} 
                            disabled 
                            className="bg-green-500/10 border border-green-500/30 text-green-300 font-semibold h-11 rounded-lg" 
                          />
                        </div>
                      </div>
                    </div>
                    {items.length > 1 && (
                      <Button
                        size="lg"
                        variant="ghost"
                        onClick={() => removeItem(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 border-2 border-transparent hover:border-red-500/50 h-11 w-11 p-0 rounded-xl transition-all mt-6"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-5 pt-8 border-t-2 border-green-500/20 mt-8">
              <div className="flex justify-between items-center p-5 bg-white/5 rounded-xl border border-white/10">
                <span className="text-white/70 font-medium text-base">Sous-total</span>
                <span className="font-bold text-white text-lg">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center p-5 bg-white/5 rounded-xl border border-white/10">
                <span className="text-white/70 font-medium text-base">TVA</span>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-24 h-11 text-right bg-white/5 border border-white/20 text-white hover:border-green-500/50 focus:border-green-500 rounded-lg transition-all"
                  />
                  <span className="text-white/60 text-base">%</span>
                  <span className="font-bold text-white text-lg min-w-[120px] text-right">{formatCurrency(taxAmount)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border-2 border-green-500/40 shadow-lg shadow-green-500/20">
                <span className="text-white font-bold text-xl">Total</span>
                <span className="text-green-400 font-black text-2xl">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Informations complémentaires - Much more stylish */}
          <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-800/60 to-zinc-900/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-8 sm:p-10 border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-500 group">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-blue-500/20">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 backdrop-blur-sm border border-blue-500/40 shadow-lg shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Info className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Informations complémentaires
              </h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-white font-semibold text-base flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-400" />
                  Notes
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes additionnelles..."
                  rows={3}
                  className="bg-white/5 border-2 border-white/20 text-white placeholder:text-white/40 text-base rounded-xl backdrop-blur-sm hover:border-blue-500/50 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-white font-semibold text-base flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-400" />
                  Conditions
                </Label>
                <Textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Conditions de paiement, garanties, etc."
                  rows={3}
                  className="bg-white/5 border-2 border-white/20 text-white placeholder:text-white/40 text-base rounded-xl backdrop-blur-sm hover:border-blue-500/50 focus:border-blue-500 transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section - Hidden on mobile when viewMode=false, always visible on md+ */}
        <div className={`md:sticky md:top-4 md:self-start ${!viewMode ? 'hidden md:block' : 'block'}`}>
          <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-800/60 to-zinc-900/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-primary/30 shadow-2xl shadow-primary/20">
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-primary/20">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/30 to-cyan-500/30 backdrop-blur-sm border border-primary/40 shadow-lg shadow-primary/20">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Aperçu du document</h3>
                  <p className="text-sm text-white/60">Prévisualisation en temps réel</p>
                </div>
              </div>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 rounded-xl hover:bg-red-500/20 hover:border-red-500/50 border-2 border-white/10 text-white/70 hover:text-red-300 transition-all group"
                title="Fermer"
              >
                <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              </Button>
            </div>
            
            {/* Preview container with better styling */}
            <div className="relative">
              <div
                ref={previewRef}
                className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 max-h-[600px] sm:max-h-[700px] overflow-y-auto custom-scrollbar"
                style={{ 
                  backgroundColor: '#ffffff',
                  color: '#000000',
                }}
              >
                {/* PDF Preview Content - EXACT DESIGN FROM REFERENCE */}
                <div style={{ padding: '2rem', backgroundColor: '#ffffff' }}>
                  {/* Header with Logo and Company Info */}
                  <div style={{ marginBottom: '1rem' }}>
                    {/* En-tête complet avec image */}
                    <div style={{ marginBottom: '1rem' }}>
                      <img 
                        src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/en-tete-devis-1761940859706.png"
                        alt="JHS Entreprise En-tête"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                      />
                    </div>

                    {/* Bordure turquoise sous l'en-tête */}
                    <div style={{ borderBottom: '3px solid #00bfbf', marginBottom: '1.5rem' }}></div>

                    {/* Recipient Info - Right aligned */}
                    <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                      <p style={{ fontSize: '0.75rem', color: '#000000', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                        JHS ENTREPRISE
                      </p>
                      <p style={{ fontSize: '0.7rem', color: '#000000', lineHeight: '1.5', marginBottom: 0 }}>
                        3 Avenue Claude Monet<br/>
                        13014 Marseille<br/>
                        France
                      </p>
                    </div>
                  </div>

                  {/* Client Info and Document Number Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '2rem' }}>
                    {/* Left: Client Info - Grey border */}
                    <div style={{ flex: '0 0 45%' }}>
                      <div style={{ border: '1.5px solid #999999', padding: '0.75rem', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#000000', marginBottom: '0.5rem' }}>
                          {clientName || 'Nom du client'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#000000', lineHeight: '1.6', marginBottom: 0 }}>
                          {clientAddress || 'Adresse du client'}
                        </p>
                        {clientEmail && (
                          <p style={{ fontSize: '0.75rem', color: '#000000', marginTop: '0.25rem', marginBottom: 0 }}>
                            {clientEmail}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Document Title */}
                    <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00bfbf', marginBottom: '0.3rem' }}>
                        {type === 'invoice' ? 'Facture' : 'Devis'} n° {documentNumber || 'FAC-0013'}
                      </h2>
                      <p style={{ fontSize: '0.85rem', color: '#000000', marginBottom: 0 }}>
                        En date du {issueDate ? formatDate(issueDate) : formatDate(new Date().toISOString())}
                      </p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div style={{ width: '100%', marginBottom: '1.5rem', border: '1px solid #00bfbf' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#00bfbf' }}>
                          <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#ffffff', width: '8%', borderRight: '1px solid #00bfbf' }}>N°</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#ffffff', width: '42%', borderRight: '1px solid #00bfbf' }}>Désignation</th>
                          <th style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#ffffff', width: '10%', borderRight: '1px solid #00bfbf' }}>Qté</th>
                          <th style={{ textAlign: 'right', padding: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#ffffff', width: '15%', borderRight: '1px solid #00bfbf' }}>PU HT</th>
                          <th style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#ffffff', width: '10%', borderRight: '1px solid #00bfbf' }}>TVA</th>
                          <th style={{ textAlign: 'right', padding: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#ffffff', width: '15%' }}>Total HT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={index} style={{ backgroundColor: '#ffffff' }}>
                            <td style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#000000', borderRight: '1px solid #e0e0e0', borderTop: '1px solid #e0e0e0' }}>{index + 1}</td>
                            <td style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#000000', borderRight: '1px solid #e0e0e0', borderTop: '1px solid #e0e0e0' }}>{item.description || '-'}</td>
                            <td style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.75rem', color: '#000000', borderRight: '1px solid #e0e0e0', borderTop: '1px solid #e0e0e0' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', fontSize: '0.75rem', color: '#000000', borderRight: '1px solid #e0e0e0', borderTop: '1px solid #e0e0e0' }}>
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.75rem', color: '#000000', borderRight: '1px solid #e0e0e0', borderTop: '1px solid #e0e0e0' }}>{taxRate} %</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', fontSize: '0.75rem', color: '#000000', fontWeight: '500', borderTop: '1px solid #e0e0e0' }}>
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Box - Right aligned */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                    <div style={{ width: '300px', border: '2px solid #00bfbf', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid #00bfbf', backgroundColor: '#ffffff' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#000000' }}>Total HT</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#000000' }}>{formatCurrency(subtotal)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid #00bfbf', backgroundColor: '#ffffff' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#000000' }}>TVA à {taxRate}%</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#000000' }}>{formatCurrency(taxAmount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 1rem', backgroundColor: '#00bfbf' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#ffffff' }}>Total TTC</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#ffffff' }}>{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Instructions Box - AFTER TOTALS (RED TOP ZONE) */}
                  <div style={{ padding: '0.9rem 1rem', backgroundColor: '#e0f7f7', border: '1px solid #00bfbf', borderRadius: '4px', marginBottom: '1.5rem' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#000000', marginBottom: '0.4rem' }}>
                      À régler avant le {dueDate ? formatDate(dueDate) : 
                        formatDate(new Date(new Date(issueDate).setDate(new Date(issueDate).getDate() + 30)).toISOString())
                      }
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#000000', marginBottom: 0 }}>
                      À régler par chèque ou par virement bancaire.
                    </p>
                  </div>

                  {/* Footer professionnel JHS */}
                  <div style={{ paddingTop: '1rem', borderTop: '3px solid #00bfbf', marginTop: '2rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      {/* Logo JHS */}
                      <div style={{ marginBottom: '0.8rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00bfbf' }}>JHS</span>
                      </div>
                      
                      {/* Grille d'informations sur 2 colonnes */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '0.8rem', textAlign: 'left' }}>
                        {/* Colonne 1 : Contact & Adresse */}
                        <div>
                          <p style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#00bfbf', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                            JHS Entreprise
                          </p>
                          <p style={{ fontSize: '0.6rem', color: '#333333', lineHeight: '1.6', marginBottom: 0 }}>
                            ✉ : contact@jhsentreprise.fr<br/>
                            http://www.jhsentreprise.fr<br/>
                            3 Avenue Claude Monet<br/>
                            ✉ : jh.s@orange.fr<br/>
                            http://www.jhs-renovation-13.fr<br/>
                            13014 Marseille
                          </p>
                        </div>
                        
                        {/* Colonne 2 : Informations légales */}
                        <div>
                          <p style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#00bfbf', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                            SARL au capital de 7 771,90 €
                          </p>
                          <p style={{ fontSize: '0.6rem', color: '#333333', lineHeight: '1.6', marginBottom: 0 }}>
                            Certificat Qualibat RGE : E-E153759<br/>
                            ☎ : 04 91 63 13 13<br/>
                            SIRET : 377 767 777 000 24<br/>
                            Assurance : AXA IARD 4496746004<br/>
                            Code APE : 4399C<br/>
                            TVA intra. : FR60377677777<br/>
                            IBAN : FR76 3000 3031 9900 0202 2851 559
                          </p>
                        </div>
                      </div>
                      
                      {/* Séparateur */}
                      <div style={{ borderBottom: '1px solid #e0e0e0', marginBottom: '0.5rem' }}></div>
                      
                      {/* Copyright */}
                      <p style={{ fontSize: '0.55rem', color: '#999999', textAlign: 'center', marginBottom: 0 }}>
                        © 2023 JHS Entreprise - Tous droits réservés
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom action buttons for mobile */}
              <div className="flex gap-3 mt-6 sm:hidden">
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isLoading}
                  size="lg"
                  className="flex-1 gap-3 bg-gradient-to-r from-primary to-cyan-500 text-white h-14 rounded-xl shadow-2xl shadow-primary/40 font-bold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      <span>Télécharger</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleClose}
                  size="lg"
                  className="gap-2 bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-primary/50 text-white h-14 rounded-xl px-8 font-semibold"
                >
                  <X className="h-5 w-5" />
                  <span>Fermer</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgb(0, 191, 191) 0%, rgb(0, 166, 166) 100%);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgb(0, 220, 220) 0%, rgb(0, 191, 191) 100%);
        }
      `}</style>
    </div>
  );
}