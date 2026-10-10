import React, { useState } from 'react';
import { X, CheckCircle, Sparkles, Plus } from 'lucide-react';

interface OcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrescriptionVerified: (rxId: string) => void;
  onAddProductById: (productId: string) => void;
}

export const OcrModal: React.FC<OcrModalProps> = ({
  isOpen,
  onClose,
  onPrescriptionVerified,
  onAddProductById
}) => {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    extracted_text: string;
    candidate_matches: { productId: string; productName: string; confidence: number }[];
  } | null>(null);

  const simulateScan = async (sampleType: 'betnovate' | 'dolo') => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/v1/prescriptions/rx-sim-1/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: sampleType === 'betnovate' 
            ? 'https://medcure.in/rx/betnovate-sample.jpg' 
            : 'https://medcure.in/rx/dolo-sample.jpg'
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.ocr_result);
        onPrescriptionVerified('RX-GKP-VERIFIED-981');
      }
    } catch {
      // Fallback local OCR simulation
      const sampleResult = sampleType === 'betnovate' ? {
        extracted_text: "Dr. R. K. Mishra (MBBS, MD - Gorakhpur)\nRx: Betnovate-N Cream 25g - Apply twice daily\nBoroline Antiseptic cream as needed",
        candidate_matches: [
          { productId: 'prd-betnovate-n', productName: 'Betnovate N Tube Of 25gm Cream', confidence: 0.94 },
          { productId: 'prd-boroline-20g', productName: 'Boroline Ayurvedic Antiseptic Cream', confidence: 0.88 }
        ]
      } : {
        extracted_text: "Gorakhpur Clinic\nRx: Dolo 650mg 1 tab TDS x 3 days\nHansaplast Washproof Bandage",
        candidate_matches: [
          { productId: 'prd-dolo-650', productName: 'Dolo 650mg Tablet', confidence: 0.96 },
          { productId: 'prd-hansaplast-20', productName: 'Hansaplast Washproof Anti-Septic Adhesive Bandage', confidence: 0.91 }
        ]
      };
      setResult(sampleResult);
      onPrescriptionVerified('RX-GKP-VERIFIED-981');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-lg p-6 text-white shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Assistive Prescription OCR</h3>
            <p className="text-xs text-zinc-400">Instant AI extraction for Schedule H medicines in Gorakhpur</p>
          </div>
        </div>

        {/* Scan Actions */}
        <div className="space-y-3 mb-6">
          <p className="text-xs text-zinc-300">
            Select a sample prescription to simulate instant camera OCR scanning:
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={loading}
              onClick={() => simulateScan('betnovate')}
              className="p-3 bg-zinc-900 border border-zinc-700 hover:border-emerald-500 rounded-xl text-left transition-all group"
            >
              <span className="text-xs font-bold text-white block group-hover:text-emerald-400">
                📄 Betnovate-N Prescription
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                Skin & Derma sample Rx
              </span>
            </button>

            <button
              disabled={loading}
              onClick={() => simulateScan('dolo')}
              className="p-3 bg-zinc-900 border border-zinc-700 hover:border-emerald-500 rounded-xl text-left transition-all group"
            >
              <span className="text-xs font-bold text-white block group-hover:text-emerald-400">
                📄 Dolo-650 & First Aid Rx
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                Fever & Dressing sample Rx
              </span>
            </button>
          </div>
        </div>

        {loading && (
          <div className="py-8 text-center text-xs text-emerald-400 animate-pulse">
            Scanning prescription text and fuzzy-matching Gorakhpur pharmacy catalogue...
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>Prescription Validated & Attached to Session!</span>
            </div>

            {/* Extracted Text */}
            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-[11px] text-zinc-300 font-mono">
              <p className="font-sans font-bold text-zinc-400 mb-1 text-[10px] uppercase">Extracted Clinical Text:</p>
              <pre className="whitespace-pre-wrap">{result.extracted_text}</pre>
            </div>

            {/* Candidate Matches */}
            <div>
              <p className="text-xs font-bold text-white mb-2">Detected Catalogue Medicines:</p>
              <div className="space-y-2">
                {result.candidate_matches.map(m => (
                  <div 
                    key={m.productId}
                    className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{m.productName}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        Confidence: {(m.confidence * 100).toFixed(0)}% match
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onAddProductById(m.productId);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
