/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Share2,
  Settings,
  FolderOpen,
  Copy,
  Check,
  AlertCircle,
  Percent,
  ShoppingBag,
  Smartphone,
  Edit3,
  X,
  Save,
  Info,
  CheckCircle2
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  phone?: string;
}

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number | '';
  alert_quantity: number | '';
  purchase_price: number | '';
  sale_price: number | '';
  profit_margin: number | '';
  supplier: string;
  barcode: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  date: string;
  supplier: string;
  items: InvoiceItem[];
}

const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: '1', name: 'مصنع الأجيال للملابس' },
  { id: '2', name: 'شركة التميز للأقمشة' },
  { id: '3', name: 'مؤسسة النور للتجارة' },
];

export default function App() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('cashier_suppliers');
    return saved ? JSON.parse(saved) : DEFAULT_SUPPLIERS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('cashier_invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentInvoiceId, setCurrentInvoiceId] = useState<string>(() => 'inv_' + Date.now());
  const [invoiceNumber, setInvoiceNumber] = useState<string>('FAT-' + Math.floor(1000 + Math.random() * 9000));
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>(() => suppliers[0]?.name || '');
  
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [globalMargin, setGlobalMargin] = useState<number | ''>(0);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);

  const [newSupplierName, setNewSupplierName] = useState('');
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingSupplierName, setEditingSupplierName] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('cashier_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('cashier_invoices', JSON.stringify(invoices));
  }, [invoices]);

  const generateUniqueBarcode = (): string => {
    const existingBarcodes = new Set<string>();
    invoices.forEach(inv => inv.items.forEach(it => existingBarcodes.add(it.barcode)));
    items.forEach(it => existingBarcodes.add(it.barcode));

    let code = '';
    do {
      const rand = Math.floor(1000 + Math.random() * 9000);
      code = `INV-${rand}`;
    } while (existingBarcodes.has(code));

    return code;
  };

  useEffect(() => {
    if (items.length === 0) {
      addNewRow();
    }
  }, []);

  const addNewRow = () => {
    const newItem: InvoiceItem = {
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      name: '',
      quantity: '',
      alert_quantity: '',
      purchase_price: '',
      sale_price: '',
      profit_margin: globalMargin,
      supplier: selectedSupplier,
      barcode: generateUniqueBarcode(),
    };
    setItems(prev => [...prev, newItem]);
  };

  const deleteRow = (id: string) => {
    if (items.length <= 1) {
      setItems([{
        id: 'item_' + Math.random().toString(36).substring(2, 9),
        name: '',
        quantity: '',
        alert_quantity: '',
        purchase_price: '',
        sale_price: '',
        profit_margin: globalMargin,
        supplier: selectedSupplier,
        barcode: generateUniqueBarcode(),
      }]);
      return;
    }
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItemField = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item };

      if (field === 'name' || field === 'supplier' || field === 'barcode') {
        (updated as any)[field] = value;
      } else {
        if (value === '' || isNaN(Number(value))) {
          (updated as any)[field] = '';
        } else {
          const numVal = Number(value);
          (updated as any)[field] = numVal;

          if (field === 'purchase_price') {
            const margin = updated.profit_margin === '' ? 0 : Number(updated.profit_margin);
            if (margin > 0) {
              updated.sale_price = Math.round(numVal * (1 + margin / 100) * 100) / 100;
            }
          } else if (field === 'profit_margin') {
            const margin = numVal;
            const pPrice = updated.purchase_price === '' ? 0 : Number(updated.purchase_price);
            if (margin > 0 && pPrice > 0) {
              updated.sale_price = Math.round(pPrice * (1 + margin / 100) * 100) / 100;
            }
          } else if (field === 'sale_price') {
            const pPrice = updated.purchase_price === '' ? 0 : Number(updated.purchase_price);
            if (pPrice > 0) {
              updated.profit_margin = Math.round(((numVal - pPrice) / pPrice) * 100 * 10) / 10;
            } else {
              updated.profit_margin = '';
            }
          }
        }
      }

      return updated;
    }));
  };

  const handleSupplierChange = (newSupplier: string) => {
    setSelectedSupplier(newSupplier);
    setItems(prev => prev.map(item => ({ ...item, supplier: newSupplier })));
  };

  const applyGlobalMargin = (marginVal: number | '') => {
    setGlobalMargin(marginVal);
    const validMargin = marginVal === '' || marginVal <= 0 ? 0 : Number(marginVal);
    setItems(prev => prev.map(item => {
      const pPrice = item.purchase_price === '' ? 0 : Number(item.purchase_price);
      const sPrice = validMargin > 0 && pPrice > 0 ? Math.round(pPrice * (1 + validMargin / 100) * 100) / 100 : item.sale_price;
      return {
        ...item,
        profit_margin: marginVal,
        sale_price: sPrice
      };
    }));
  };

  const totalInvoiceSum = items.reduce((sum, item) => {
    const q = item.quantity === '' ? 0 : Number(item.quantity);
    const p = item.purchase_price === '' ? 0 : Number(item.purchase_price);
    return sum + (q * p);
  }, 0);

  const totalItemsCount = items.reduce((sum, item) => {
    const q = item.quantity === '' ? 0 : Number(item.quantity);
    return sum + q;
  }, 0);

  const handleSaveInvoice = () => {
    const validItems = items.filter(it => it.name.trim() !== '');
    if (validItems.length === 0) {
      alert('الرجاء إدخال صنف واحد على الأقل باسم صحيح.');
      return;
    }

    const invoiceData: Invoice = {
      id: currentInvoiceId,
      invoice_number: invoiceNumber,
      date: invoiceDate,
      supplier: selectedSupplier,
      items: validItems
    };

    setInvoices(prev => {
      const exists = prev.findIndex(inv => inv.id === currentInvoiceId);
      if (exists >= 0) {
        const copy = [...prev];
        copy[exists] = invoiceData;
        return copy;
      } else {
        return [invoiceData, ...prev];
      }
    });

    alert('تم حفظ الفاتورة بنجاح!');
  };

  const handleNewInvoice = () => {
    setCurrentInvoiceId('inv_' + Date.now());
    setInvoiceNumber('FAT-' + Math.floor(1000 + Math.random() * 9000));
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setItems([{
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      name: '',
      quantity: '',
      alert_quantity: '',
      purchase_price: '',
      sale_price: '',
      profit_margin: globalMargin,
      supplier: selectedSupplier,
      barcode: generateUniqueBarcode(),
    }]);
  };

  const handleLoadInvoice = (inv: Invoice) => {
    setCurrentInvoiceId(inv.id);
    setInvoiceNumber(inv.invoice_number);
    setInvoiceDate(inv.date);
    setSelectedSupplier(inv.supplier);
    setItems(inv.items);
    setShowInvoicesModal(false);
  };

  const handleDeleteInvoice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة المحفوظة؟')) {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    }
  };

  const getExportJson = () => {
    const validItems = items.filter(it => it.name.trim() !== '');
    const exportData = validItems.map(it => ({
      name: it.name || '',
      quantity: it.quantity === '' ? 0 : Number(it.quantity),
      alert_quantity: it.alert_quantity === '' ? 0 : Number(it.alert_quantity),
      purchase_price: it.purchase_price === '' ? 0 : Number(it.purchase_price),
      sale_price: it.sale_price === '' ? 0 : Number(it.sale_price),
      supplier: it.supplier || selectedSupplier || '',
      barcode: it.barcode || 'INV-9180'
    }));
    return JSON.stringify(exportData, null, 2);
  };

  const handleDownloadJson = () => {
    const jsonStr = getExportJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${invoiceNumber}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(getExportJson());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareJson = async () => {
    const jsonStr = getExportJson();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `فاتورة مخزون ${invoiceNumber}`,
          text: jsonStr,
        });
        return;
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    }
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent("بيانات فواتير المخزون JSON:\n" + jsonStr)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;
    const newSup: Supplier = {
      id: 'sup_' + Date.now(),
      name: newSupplierName.trim()
    };
    const updatedSuppliers = [...suppliers, newSup];
    setSuppliers(updatedSuppliers);
    localStorage.setItem('cashier_suppliers', JSON.stringify(updatedSuppliers));
    if (!selectedSupplier) {
      handleSupplierChange(newSup.name);
    }
    setNewSupplierName('');
  };

  const handleUpdateSupplier = (id: string) => {
    if (!editingSupplierName.trim()) return;
    const updatedSuppliers = suppliers.map(s => s.id === id ? { ...s, name: editingSupplierName.trim() } : s);
    setSuppliers(updatedSuppliers);
    localStorage.setItem('cashier_suppliers', JSON.stringify(updatedSuppliers));
    setEditingSupplierId(null);
    setEditingSupplierName('');
  };

  const handleDeleteSupplier = (id: string) => {
    if (suppliers.length <= 1) {
      alert('يجب أن يكون هناك مورد واحد على الأقل.');
      return;
    }
    const targetSup = suppliers.find(s => s.id === id);
    if (!targetSup) return;

    if (window.confirm('حذف المورد؟')) {
      const updatedSuppliers = suppliers.filter(s => s.id !== id);
      setSuppliers(updatedSuppliers);
      localStorage.setItem('cashier_suppliers', JSON.stringify(updatedSuppliers));
      console.log('Suppliers remaining:', updatedSuppliers.length);

      if (selectedSupplier === targetSup.name && updatedSuppliers.length > 0) {
        setSelectedSupplier(updatedSuppliers[0].name);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none" dir="rtl">
      
      {/* Top Header / App Bar */}
      <header className="bg-indigo-700 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20 shadow-inner">
              <ShoppingBag className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
                مساعد كاشير ملابس
                <span className="text-xs bg-indigo-600 px-2 py-0.5 rounded-full font-normal border border-indigo-400/40">سند شراء وفواتير</span>
              </h1>
              <p className="text-xs text-indigo-200">إدخال فواتير الموردين وتصدير المخزون (JSON)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleNewInvoice}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-medium px-3 py-2 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>فاتورة جديدة</span>
            </button>

            <button
              onClick={() => setShowInvoicesModal(true)}
              className="bg-indigo-800 hover:bg-indigo-900 active:scale-95 text-white text-xs font-medium px-3 py-2 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer border border-indigo-600"
            >
              <FolderOpen className="w-4 h-4 text-indigo-300" />
              <span>الفواتير السابقة ({invoices.length})</span>
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="bg-indigo-800 hover:bg-indigo-900 active:scale-95 text-white text-xs font-medium px-3 py-2 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer border border-indigo-600"
            >
              <Settings className="w-4 h-4 text-indigo-300" />
              <span>الموردين والإعدادات</span>
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-900 text-xs font-bold px-3 py-2 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تصدير JSON</span>
            </button>

            <button
              onClick={() => setShowApkModal(true)}
              className="bg-indigo-900 hover:bg-indigo-950 text-indigo-200 hover:text-white text-xs font-medium px-2.5 py-2 rounded-lg border border-indigo-700 transition flex items-center gap-1 cursor-pointer"
              title="خطوات بناء APK"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">دليل APK</span>
            </button>
          </div>

        </div>
      </header>

      {/* Invoice Meta Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">رقم الفاتورة:</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold w-28 focus:outline-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">التاريخ:</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs w-32 focus:outline-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">مورد الفاتورة:</label>
              <select
                value={selectedSupplier}
                onChange={e => handleSupplierChange(e.target.value)}
                className="bg-indigo-50 border border-indigo-300 text-indigo-900 font-medium rounded px-3 py-1 text-xs focus:outline-indigo-500"
              >
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.name}>{sup.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Global Profit Margin Helper */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            <Percent className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-medium text-slate-600">نسبة ربح موحدة:</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              max="500"
              value={globalMargin}
              placeholder="0"
              onFocus={e => {
                e.target.select();
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              onChange={e => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                setGlobalMargin(isNaN(Number(val)) ? '' : val);
                applyGlobalMargin(isNaN(Number(val)) ? '' : val);
              }}
              className="w-20 bg-white border border-slate-400 focus:border-indigo-700 rounded-lg py-0 px-2 text-[22px] font-semibold text-black text-center font-mono focus:outline-hidden shadow-2xs"
              style={{ height: '56px', direction: 'ltr' }}
            />
            <span className="text-xs text-slate-500">%</span>
            <button
              onClick={() => applyGlobalMargin(globalMargin)}
              className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded cursor-pointer transition"
            >
              تطبيق على الكل
            </button>
          </div>

        </div>
      </div>

      {/* Main Excel-like Grid Area (Single Screen) with Horizontal ScrollView */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 flex flex-col">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-700">جدول أصناف الفاتورة (خلايا قابلة للتعديل المباشر)</h2>
            </div>
            <span className="text-xs text-slate-500">عدد الأصناف: <strong className="text-indigo-600 font-mono">{items.length}</strong></span>
          </div>

          {/* Horizontal ScrollView wrapper for full grid protection */}
          <div className="overflow-x-auto flex-1 w-full" tabIndex={0} style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-right border-collapse min-w-[1050px]">
              <thead className="sticky top-0 z-10 bg-slate-100 text-slate-800 border-b-2 border-slate-300 font-bold select-none">
                <tr>
                  <th className="p-3 w-12 text-center border-l border-slate-300 text-base">#</th>
                  <th className="p-3 w-[180px] min-w-[180px] border-l border-slate-300 text-base">اسم الصنف *</th>
                  <th className="p-3 w-[110px] min-w-[110px] border-l border-slate-300 text-center text-base">الكمية</th>
                  <th className="p-3 w-[110px] min-w-[110px] border-l border-slate-300 text-center text-base">كمية الإنذار</th>
                  <th className="p-3 w-[130px] min-w-[130px] border-l border-slate-300 text-center text-base">سعر الشراء</th>
                  <th className="p-3 w-[190px] min-w-[190px] border-l border-slate-300 text-center text-base">
                    <div className="flex items-center justify-center gap-1">
                      <span>سعر البيع</span>
                      <span className="text-xs text-indigo-700 font-normal">(ربح %)</span>
                    </div>
                  </th>
                  <th className="p-3 w-[160px] min-w-[160px] border-l border-slate-300 text-base">المورد</th>
                  <th className="p-3 w-[140px] min-w-[140px] border-l border-slate-300 text-center text-base">الكود (Barcode)</th>
                  <th className="p-3 w-16 text-center text-base">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, index) => {
                  const qty = item.quantity === '' ? 0 : Number(item.quantity);
                  const alertQty = item.alert_quantity === '' ? 0 : Number(item.alert_quantity);
                  const isLowStock = item.quantity !== '' && qty <= alertQty;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-indigo-50/40 transition-colors ${isLowStock ? 'bg-rose-50/40' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                      style={{ height: '64px' }}
                    >
                      {/* Row Index */}
                      <td className="p-3 text-center border-l border-slate-200 text-slate-400 font-mono text-sm">
                        {index + 1}
                      </td>

                      {/* Item Name */}
                      <td className="p-2 border-l border-slate-200" style={{ width: '180px', minWidth: '180px' }}>
                        <input
                          type="text"
                          value={item.name}
                          placeholder="أدخل اسم الصنف..."
                          onFocus={e => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                          onChange={e => updateItemField(item.id, 'name', e.target.value)}
                          className="w-full bg-white border border-slate-300 focus:border-indigo-600 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-hidden transition shadow-2xs"
                          style={{ height: '48px' }}
                        />
                      </td>

                      {/* Quantity */}
                      <td className="p-2 border-l border-slate-200" style={{ width: '110px', minWidth: '110px' }}>
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            value={item.quantity}
                            placeholder="0"
                            onFocus={e => {
                              e.target.select();
                              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            onChange={e => updateItemField(item.id, 'quantity', e.target.value)}
                            className={`w-full bg-white border-[1.5px] rounded-lg text-center font-mono font-semibold text-black focus:outline-hidden transition shadow-2xs ${isLowStock ? 'border-rose-500 text-rose-700' : 'border-slate-400 focus:border-indigo-700 focus:ring-2 focus:ring-indigo-600/30'}`}
                            style={{
                              height: '56px',
                              minWidth: '110px',
                              fontSize: '22px',
                              fontWeight: '600',
                              color: '#000',
                              backgroundColor: '#fff',
                              borderWidth: '1.5px',
                              textAlign: 'center',
                              padding: '0 8px',
                              direction: 'ltr'
                            }}
                          />
                          {isLowStock && (
                            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" title="الكمية وصلت أو قلّت عن حد الإنذار"></span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Alert Quantity */}
                      <td className="p-2 border-l border-slate-200" style={{ width: '110px', minWidth: '110px' }}>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={item.alert_quantity}
                          placeholder="0"
                          onFocus={e => {
                            e.target.select();
                            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          onChange={e => updateItemField(item.id, 'alert_quantity', e.target.value)}
                          className="w-full bg-white border-[1.5px] border-slate-400 focus:border-indigo-700 focus:ring-2 focus:ring-indigo-600/30 rounded-lg text-center font-mono font-semibold text-black focus:outline-hidden transition shadow-2xs"
                          style={{
                            height: '56px',
                            minWidth: '110px',
                            fontSize: '22px',
                            fontWeight: '600',
                            color: '#000',
                            backgroundColor: '#fff',
                            borderWidth: '1.5px',
                            textAlign: 'center',
                            padding: '0 8px',
                            direction: 'ltr'
                          }}
                        />
                      </td>

                      {/* Purchase Price */}
                      <td className="p-2 border-l border-slate-200" style={{ width: '130px', minWidth: '130px' }}>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          min="0"
                          value={item.purchase_price}
                          placeholder="0"
                          onFocus={e => {
                            e.target.select();
                            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          onChange={e => updateItemField(item.id, 'purchase_price', e.target.value)}
                          className="w-full bg-white border-[1.5px] border-slate-400 focus:border-indigo-700 focus:ring-2 focus:ring-indigo-600/30 rounded-lg text-center font-mono font-semibold text-emerald-800 focus:outline-hidden transition shadow-2xs"
                          style={{
                            height: '56px',
                            minWidth: '130px',
                            fontSize: '22px',
                            fontWeight: '600',
                            color: '#065f46',
                            backgroundColor: '#fff',
                            borderWidth: '1.5px',
                            textAlign: 'center',
                            padding: '0 8px',
                            direction: 'ltr'
                          }}
                        />
                      </td>

                      {/* Sale Price & Profit Margin */}
                      <td className="p-2 border-l border-slate-200 bg-indigo-50/20" style={{ width: '190px', minWidth: '190px' }}>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.5"
                            min="0"
                            value={item.sale_price}
                            placeholder="0"
                            onFocus={e => {
                              e.target.select();
                              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            onChange={e => updateItemField(item.id, 'sale_price', e.target.value)}
                            className="w-[110px] min-w-[110px] bg-white border-[1.5px] border-slate-400 focus:border-indigo-700 focus:ring-2 focus:ring-indigo-600/30 rounded-lg text-center font-mono font-semibold text-indigo-800 focus:outline-hidden transition shadow-2xs"
                            style={{
                              height: '56px',
                              fontSize: '22px',
                              fontWeight: '600',
                              color: '#3730a3',
                              backgroundColor: '#fff',
                              borderWidth: '1.5px',
                              textAlign: 'center',
                              padding: '0 6px',
                              direction: 'ltr'
                            }}
                            title="سعر البيع"
                          />
                          <div className="w-[70px] min-w-[70px] flex items-center justify-end gap-0.5">
                            <input
                              type="number"
                              inputMode="decimal"
                              value={item.profit_margin}
                              placeholder="0"
                              onFocus={e => {
                                e.target.select();
                                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }}
                              onChange={e => updateItemField(item.id, 'profit_margin', e.target.value)}
                              className="w-full bg-white border border-indigo-300 focus:border-indigo-600 rounded-lg text-center font-mono font-bold text-indigo-700 focus:outline-hidden shadow-2xs"
                              style={{
                                height: '44px',
                                fontSize: '15px',
                                direction: 'ltr'
                              }}
                              title="نسبة الربح %"
                            />
                            <span className="text-[10px] text-indigo-500 font-bold">%</span>
                          </div>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="p-2 border-l border-slate-200" style={{ width: '160px', minWidth: '160px' }}>
                        <select
                          value={item.supplier}
                          onChange={e => {
                            const val = e.target.value;
                            setItems(prev => prev.map(it => it.id === item.id ? { ...it, supplier: val } : it));
                          }}
                          className="w-full bg-white border border-slate-300 focus:border-indigo-600 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-hidden shadow-2xs"
                          style={{ height: '48px' }}
                        >
                          {suppliers.map(sup => (
                            <option key={sup.id} value={sup.name}>{sup.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Barcode / Code */}
                      <td className="p-2 border-l border-slate-200" style={{ width: '140px', minWidth: '140px' }}>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={item.barcode}
                            onFocus={e => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                            onChange={e => updateItemField(item.id, 'barcode', e.target.value)}
                            className="w-full bg-white border border-slate-300 focus:border-indigo-600 rounded-lg px-2 py-2 text-xs font-mono font-bold text-slate-800 text-center focus:outline-hidden transition shadow-2xs"
                            style={{ height: '48px', direction: 'ltr' }}
                          />
                          <button
                            onClick={() => updateItemField(item.id, 'barcode', generateUniqueBarcode())}
                            className="text-[10px] text-slate-600 hover:text-indigo-600 px-1.5 py-1 rounded bg-slate-100 hover:bg-indigo-50 border border-slate-200 shrink-0"
                            title="توليد كود جديد"
                          >
                            جديد
                          </button>
                        </div>
                      </td>

                      {/* Delete Row Button */}
                      <td className="p-2 text-center" style={{ width: '64px', minWidth: '64px' }}>
                        <button
                          onClick={() => deleteRow(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer mx-auto block"
                          title="حذف الصف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Grid Actions & Add Row */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              onClick={addNewRow}
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة صف جديد</span>
            </button>

            <div className="flex items-center gap-6">
              <div className="text-xs text-slate-600">
                إجمالي الكميات: <strong className="font-mono text-indigo-700">{totalItemsCount}</strong> قطعة
              </div>
              <button
                onClick={handleSaveInvoice}
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ الفاتورة الحالية</span>
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* Static Footer Total Bar */}
      <footer className="bg-slate-900 text-white shadow-lg sticky bottom-0 z-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">إجمالي فاتورة الشراء:</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {totalInvoiceSum.toLocaleString()} <span className="text-xs font-normal text-slate-300">ج.م</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 border-r border-slate-700 pr-6">
              <span className="text-xs text-slate-400">المورد الحالي:</span>
              <span className="text-xs font-semibold text-indigo-300">{selectedSupplier}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExportModal(test => !test)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs px-4 py-2 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>معاينة وتصدير JSON للمخزون</span>
            </button>
          </div>

        </div>
      </footer>

      {/* --- MODALS --- */}

      {/* 1. Suppliers & Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-indigo-700 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-200" />
                <h3 className="font-bold text-sm">إدارة الموردين والإعدادات</h3>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-indigo-200 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              
              {/* Add Supplier Form */}
              <form onSubmit={handleAddSupplier} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="text-xs font-bold text-slate-700 block">إضافة مورد جديد:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="اسم المورد أو الشركة..."
                    value={newSupplierName}
                    onChange={e => setNewSupplierName(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-indigo-500"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة</span>
                  </button>
                </div>
              </form>

              {/* Suppliers List with clear delete button and confirmation */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-600">قائمة الموردين الحاليين ({suppliers.length}):</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {suppliers.map(sup => (
                    <div key={sup.id} className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2.5 rounded-lg shadow-2xs">
                      {editingSupplierId === sup.id ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            value={editingSupplierName}
                            onChange={e => setEditingSupplierName(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs focus:outline-indigo-500"
                          />
                          <button
                            onClick={() => handleUpdateSupplier(sup.id)}
                            className="bg-emerald-600 text-white px-2.5 py-1 rounded text-xs"
                          >
                            حفظ
                          </button>
                          <button
                            onClick={() => setEditingSupplierId(null)}
                            className="bg-slate-300 text-slate-700 px-2.5 py-1 rounded text-xs"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-800">{sup.name}</span>
                      )}

                      {editingSupplierId !== sup.id && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingSupplierId(sup.id);
                              setEditingSupplierName(sup.name);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                            title="تعديل"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(sup.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer min-w-[44px] min-h-[44px] items-center justify-center"
                            title="حذف المورد"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>حذف</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. Past Invoices Modal */}
      {showInvoicesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-indigo-700 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-200" />
                <h3 className="font-bold text-sm">الفواتير السابقة المحفوظة محلياً</h3>
              </div>
              <button 
                onClick={() => setShowInvoicesModal(false)}
                className="text-indigo-200 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {invoices.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  لا توجد فواتير محفوظة بعد. انقر على "حفظ الفاتورة الحالية" لحفظ الفاتورة هنا.
                </div>
              ) : (
                <div className="space-y-2">
                  {invoices.map(inv => {
                    const invTotal = inv.items.reduce((s, it) => s + ((it.quantity === '' ? 0 : Number(it.quantity)) * (it.purchase_price === '' ? 0 : Number(it.purchase_price))), 0);
                    return (
                      <div
                        key={inv.id}
                        onClick={() => handleLoadInvoice(inv)}
                        className="bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 p-3.5 rounded-xl cursor-pointer transition flex items-center justify-between shadow-2xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-xs text-indigo-700 font-mono">{inv.invoice_number}</span>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{inv.date}</span>
                            <span className="text-xs font-medium text-slate-800">{inv.supplier}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            عدد الأصناف: <strong className="font-mono text-slate-700">{inv.items.length}</strong> | الإجمالي: <strong className="font-mono text-emerald-600">{invTotal.toLocaleString()} ج.م</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleDeleteInvoice(inv.id, e)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="حذف الفاتورة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowInvoicesModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. Export JSON Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-amber-500 text-slate-900 px-5 py-4 flex items-center justify-between font-bold">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-slate-900" />
                <h3 className="text-sm">تصدير ملف JSON للاستيراد في المخزون الأصلي</h3>
              </div>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-slate-900 hover:text-black p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-600">
                هذا هو الكود الناتج بالصيغة المطلوبة تماماً (متوافق مع شاشة استيراد المخزون في نظام الكاشير):
              </p>

              <div className="relative">
                <pre className="bg-slate-900 text-emerald-300 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72 border border-slate-800" dir="ltr">
                  {getExportJson()}
                </pre>
                <button
                  onClick={handleCopyJson}
                  className="absolute top-3 left-3 bg-slate-800 hover:bg-slate-700 text-white text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 border border-slate-600 shadow transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-800 leading-relaxed">
                  ملاحظة: يمكنك حفظ هذا الملف بصيغة <code>.json</code> ورفعه مباشرة في نظام الكاشير أو مشاركته عبر واتساب أو البلوتوث مع جهاز الاستقبال.
                </div>
              </div>
            </div>

            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadJson}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل ملف JSON</span>
                </button>

                <button
                  onClick={handleShareJson}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة (واتساب / نظامي)</span>
                </button>
              </div>

              <button
                onClick={() => setShowExportModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. APK Build Guide Modal */}
      {showApkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            
            <div className="bg-indigo-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-300" />
                <h3 className="font-bold text-sm">خطوات تحويل هذا التطبيق إلى APK أندرويد</h3>
              </div>
              <button 
                onClick={() => setShowApkModal(false)}
                className="text-indigo-200 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700 leading-relaxed">
              <p>
                لبناء ملف APK لهذا التطبيق في سطرين بكل سهولة عبر أدوات الويب المحمولة (مثل PWA Builder أو Capacitor):
              </p>

              <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] space-y-2" dir="ltr">
                <div className="text-amber-400"># 1. تثبيت أدوات بناء Capacitor (أو رفع رابط الويب لـ PWA Builder):</div>
                <div>npm install @capacitor/core @capacitor/cli</div>
                <div className="text-amber-400"># 2. إضافة منصة أندرويد وبناء APK مباشرة:</div>
                <div>npx cap add android && npx cap build android</div>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-900">
                  أو يمكنك بكل سهولة فتح هذا الموقع من متصفح هاتف الأندرويد واختيار (إضافة إلى الشاشة الرئيسية) للحصول على تطبيق PWA سريع وسلس يعمل بدون إنترنت!
                </p>
              </div>
            </div>

            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowApkModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
              >
                فهمت، شكراً
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
