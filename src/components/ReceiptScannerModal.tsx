import React, { useState } from 'react';
import {
  X,
  Upload,
  Camera,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Receipt,
  DollarSign,
  Calendar,
  FileText,
} from 'lucide-react';
import { scanReceiptWithAI } from '../services/api';
import { ParsedReceipt, Transaction } from '../types/finance';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

// Pre-packaged realistic sample receipt images generated via SVG data-uri
const SAMPLE_RECEIPTS = [
  {
    name: 'Trader Joe’s Groceries',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" fill="%23fff"><rect width="400" height="500" fill="%23f8fafc" stroke="%23cbd5e1"/><text x="200" y="40" font-family="monospace" font-size="20" font-weight="bold" text-anchor="middle" fill="%230f172a">TRADER JOE\'S</text><text x="200" y="65" font-family="monospace" font-size="12" text-anchor="middle" fill="%2364748b">Store %23402 - Market St.</text><text x="200" y="85" font-family="monospace" font-size="12" text-anchor="middle" fill="%2364748b">2026-10-14 14:22</text><line x1="40" y1="105" x2="360" y2="105" stroke="%2394a3b8" stroke-dasharray="4"/><text x="50" y="140" font-family="monospace" font-size="13" fill="%230f172a">ORGANIC HONEYCRISP APPLES</text><text x="350" y="140" font-family="monospace" font-size="13" text-anchor="end" fill="%230f172a">4.99</text><text x="50" y="170" font-family="monospace" font-size="13" fill="%230f172a">ALMOND MILK UNSWEETENED</text><text x="350" y="170" font-family="monospace" font-size="13" text-anchor="end" fill="%230f172a">3.49</text><text x="50" y="200" font-family="monospace" font-size="13" fill="%230f172a">COLD BREW CONCENTRATE</text><text x="350" y="200" font-family="monospace" font-size="13" text-anchor="end" fill="%230f172a">7.99</text><text x="50" y="230" font-family="monospace" font-size="13" fill="%230f172a">WILD ATLANTIC SALMON</text><text x="350" y="230" font-family="monospace" font-size="13" text-anchor="end" fill="%230f172a">12.99</text><text x="50" y="260" font-family="monospace" font-size="13" fill="%230f172a">DARK CHOCOLATE ALMONDS</text><text x="350" y="260" font-family="monospace" font-size="13" text-anchor="end" fill="%230f172a">5.49</text><line x1="40" y1="300" x2="360" y2="300" stroke="%2394a3b8"/><text x="50" y="330" font-family="monospace" font-size="13" fill="%2364748b">SUBTOTAL</text><text x="350" y="330" font-family="monospace" font-size="13" text-anchor="end" fill="%230f172a">34.95</text><text x="50" y="355" font-family="monospace" font-size="13" fill="%2364748b">TAX (8.5%25)</text><text x="350" y="355" font-family="monospace" font-size="13" text-anchor="end" fill="%230f172a">2.97</text><text x="50" y="390" font-family="monospace" font-size="17" font-weight="bold" fill="%230f172a">TOTAL</text><text x="350" y="390" font-family="monospace" font-size="17" font-weight="bold" text-anchor="end" fill="%230f172a">$37.92</text><text x="200" y="440" font-family="monospace" font-size="11" text-anchor="middle" fill="%2394a3b8">PAID VIA VISA *4920</text><text x="200" y="465" font-family="monospace" font-size="12" text-anchor="middle" fill="%230f172a">THANK YOU FOR SHOPPING!</text></svg>',
  },
  {
    name: 'Trattoria Bistro Dinner',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" fill="%23fff"><rect width="400" height="500" fill="%23fafaf9" stroke="%23e7e5e4"/><text x="200" y="45" font-family="serif" font-size="22" font-weight="bold" text-anchor="middle" fill="%231c1917">BELLA TRATTORIA</text><text x="200" y="70" font-family="sans-serif" font-size="11" text-anchor="middle" fill="%2378716c">Gourmet Italian Cucina</text><text x="200" y="90" font-family="monospace" font-size="12" text-anchor="middle" fill="%2378716c">Table 12 - 2026-10-15</text><line x1="40" y1="110" x2="360" y2="110" stroke="%23d6d3d1"/><text x="50" y="145" font-family="monospace" font-size="13" fill="%231c1917">1x Truffle Tagliatelle</text><text x="350" y="145" font-family="monospace" font-size="13" text-anchor="end" fill="%231c1917">28.00</text><text x="50" y="175" font-family="monospace" font-size="13" fill="%231c1917">1x Margherita Pizza</text><text x="350" y="175" font-family="monospace" font-size="13" text-anchor="end" fill="%231c1917">22.00</text><text x="50" y="205" font-family="monospace" font-size="13" fill="%231c1917">2x Chianti Classico</text><text x="350" y="205" font-family="monospace" font-size="13" text-anchor="end" fill="%231c1917">26.00</text><text x="50" y="235" font-family="monospace" font-size="13" fill="%231c1917">1x Tiramisu Al Caffe</text><text x="350" y="235" font-family="monospace" font-size="13" text-anchor="end" fill="%231c1917">12.00</text><line x1="40" y1="270" x2="360" y2="270" stroke="%23d6d3d1"/><text x="50" y="300" font-family="monospace" font-size="13" fill="%2378716c">SUBTOTAL</text><text x="350" y="300" font-family="monospace" font-size="13" text-anchor="end" fill="%231c1917">88.00</text><text x="50" y="325" font-family="monospace" font-size="13" fill="%2378716c">TAX &amp; SERVICE (18%25)</text><text x="350" y="325" font-family="monospace" font-size="13" text-anchor="end" fill="%231c1917">15.84</text><text x="50" y="360" font-family="monospace" font-size="17" font-weight="bold" fill="%231c1917">TOTAL DUE</text><text x="350" y="360" font-family="monospace" font-size="17" font-weight="bold" text-anchor="end" fill="%231c1917">$103.84</text><text x="200" y="420" font-family="sans-serif" font-size="12" text-anchor="middle" fill="%231c1917">GRAZIE E ARRIVEDERCI</text></svg>',
  },
];

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(SAMPLE_RECEIPTS[0].dataUrl);
  const [mimeType, setMimeType] = useState<string>('image/svg+xml');
  const [isScanning, setIsScanning] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedReceipt | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setParsedData(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof SAMPLE_RECEIPTS[0]) => {
    setSelectedImage(sample.dataUrl);
    setMimeType('image/svg+xml');
    setParsedData(null);
  };

  const handleScan = async () => {
    if (!selectedImage) return;
    setIsScanning(true);
    try {
      const result = await scanReceiptWithAI(selectedImage, mimeType);
      setParsedData(result);
    } catch (err: any) {
      console.error(err);
      alert('Failed to scan receipt: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmAdd = () => {
    if (!parsedData) return;
    onAddTransaction({
      type: 'expense',
      amount: parsedData.amount,
      merchant: parsedData.merchant,
      category: parsedData.category,
      date: parsedData.date || new Date().toISOString().split('T')[0],
      paymentMethod: parsedData.paymentMethod || 'Credit Card',
      notes: parsedData.notes || 'Scanned via Gemini AI receipt vision',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Smart Receipt Scanner</h2>
              <p className="text-xs text-slate-400">Gemini 3.8 Flash extracts line items, totals, and categories</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload or Sample Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Choose a receipt to scan:</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Quick Test Samples:</span>
              {SAMPLE_RECEIPTS.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className={`text-[11px] px-2 py-0.5 rounded font-medium transition ${
                    selectedImage === s.dataUrl
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {s.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div className="border-2 border-dashed border-slate-700/80 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-950/50 hover:border-emerald-500/60 transition group relative">
            {selectedImage ? (
              <div className="space-y-3 text-center">
                <div className="max-h-56 max-w-xs mx-auto overflow-hidden rounded-xl border border-slate-700 shadow-md">
                  <img
                    src={selectedImage}
                    alt="Receipt Preview"
                    className="w-full h-full object-contain bg-white"
                  />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <label className="text-xs text-slate-400 hover:text-emerald-400 cursor-pointer font-medium">
                    <span>Upload different image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center p-6 space-y-2">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 transition" />
                <span className="text-xs font-semibold text-white">Click or drag receipt photo</span>
                <span className="text-[11px] text-slate-500">JPG, PNG, or SVG receipt snapshot</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Scan Trigger */}
        {!parsedData && (
          <button
            onClick={handleScan}
            disabled={!selectedImage || isScanning}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gemini Vision is parsing receipt data...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Scan with Gemini AI</span>
              </>
            )}
          </button>
        )}

        {/* Parsed Results Review */}
        {parsedData && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Receipt Successfully Parsed</span>
              </span>
              <span className="text-base font-black text-white">
                ${parsedData.amount.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Merchant:</span>
                <div className="font-semibold text-white mt-0.5">{parsedData.merchant}</div>
              </div>
              <div>
                <span className="text-slate-400">Category:</span>
                <div className="font-semibold text-emerald-400 mt-0.5">{parsedData.category}</div>
              </div>
              <div>
                <span className="text-slate-400">Date:</span>
                <div className="font-semibold text-white mt-0.5">{parsedData.date}</div>
              </div>
              <div>
                <span className="text-slate-400">Payment:</span>
                <div className="font-semibold text-white mt-0.5">{parsedData.paymentMethod}</div>
              </div>
            </div>

            {/* Line items if detected */}
            {parsedData.lineItems && parsedData.lineItems.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">Itemized Breakdown:</div>
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {parsedData.lineItems.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-300">
                      <span className="truncate pr-2">{item.name}</span>
                      <span className="font-mono text-slate-400 shrink-0">${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setParsedData(null)}
                className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium"
              >
                Rescan
              </button>
              <button
                onClick={handleConfirmAdd}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition"
              >
                Add to Transactions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
