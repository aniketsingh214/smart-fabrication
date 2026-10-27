'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  generateMaterialCSVTemplate,
  parseAndValidateMaterialCSV,
  type CSVImportRow,
  type ImportSummary,
} from '@/features/materials/material-import-export';
import { PRELOADED_MATERIAL_CATALOG } from '@/features/materials/material-catalog-data';
import {
  Upload,
  Download,
  ArrowLeft,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  HelpCircle,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notify';

export default function BulkImportMaterialsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'duplicates' | 'errors'>('all');
  const [importing, setImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [importCompleted, setImportCompleted] = useState<boolean>(false);
  const [importedCount, setImportedCount] = useState<number>(0);

  // Parse CSV when text changes
  const summary: ImportSummary = useMemo(() => {
    if (!csvContent.trim()) {
      return {
        totalRows: 0,
        validRows: 0,
        errorRows: 0,
        duplicateRows: 0,
        items: [],
      };
    }
    return parseAndValidateMaterialCSV(csvContent, PRELOADED_MATERIAL_CATALOG);
  }, [csvContent]);

  // Filtered rows for the preview table
  const filteredRows = useMemo(() => {
    return summary.items.filter((item) => {
      if (filterTab === 'valid') return item.errors.length === 0 && !item.isDuplicate;
      if (filterTab === 'duplicates') return item.isDuplicate;
      if (filterTab === 'errors') return item.errors.length > 0;
      return true;
    });
  }, [summary.items, filterTab]);

  // Download template
  const handleDownloadTemplate = () => {
    const template = generateMaterialCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'GateWala_Material_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text || '');
      setImportCompleted(false);
    };
    reader.readAsText(file);
  };

  // Execute Import
  const handleExecuteImport = async () => {
    const rowsToImport = summary.items.filter((row) => {
      if (row.errors.length > 0) return false;
      if (skipDuplicates && row.isDuplicate) return false;
      return true;
    });

    if (rowsToImport.length === 0) {
      notify('इम्पोर्ट करने के लिए कोई मान्य रिकॉर्ड नहीं मिला।', 'error');
      return;
    }

    setImporting(true);
    setImportProgress({ current: 0, total: rowsToImport.length });
    let successCount = 0;

    try {
      for (let i = 0; i < rowsToImport.length; i++) {
        const row = rowsToImport[i];
        const payload = {
          code: row.code || `MAT-${Date.now().toString(36).toUpperCase()}-${i}`,
          name: row.name,
          category: row.category,
          unit: row.unit,
          thickness_mm: row.thickness_mm ?? 1.0,
          weight_kg_per_unit: row.weight_kg_per_unit ?? 1.0,
          reorder_level: row.reorder_level ?? 0,
        };

        const res = await fetch('/api/v1/admin/materials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          successCount++;
        }
        setImportProgress({ current: i + 1, total: rowsToImport.length });
      }

      setImportedCount(successCount);
      setImportCompleted(true);
      notify(`${successCount} मटेरियल सफलतापूर्वक इम्पोर्ट किए गए!`, 'success');
    } catch (err) {
      notify('इम्पोर्ट के दौरान तकनीकी त्रुटि हुई।', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <Link
            href="/admin/raw-materials"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 mb-1"
          >
            <ArrowLeft size={14} />
            वापस रॉ मटेरियल कैटलॉग (Back to Raw Materials)
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            बल्क मटेरियल इम्पोर्ट (Bulk Material CSV Import)
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            एक्सेल या CSV फ़ाइल के माध्यम से एक साथ सैकड़ों लोहे, पाइप, एंगल व हार्डवेयर आइटम जोड़ें।
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
            <Download size={16} />
            CSV टेम्पलेट डाउनलोड करें
          </Button>
        </div>
      </div>

      {/* Step Guide Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
              1
            </span>
            <h4 className="text-xs font-bold text-slate-900">टेम्पलेट डाउनलोड करें</h4>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            गेटवाला का पूर्व-निर्धारित CSV टेम्पलेट प्राप्त करें जिसमें सभी मानक कॉलम शामिल हैं।
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
              2
            </span>
            <h4 className="text-xs font-bold text-slate-900">फ़ाइल अपलोड करें या पेस्ट करें</h4>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            अपनी CSV फ़ाइल चुनें। सिस्टम स्वतः डुप्लीकेट व कॉलम त्रुटियों की जांच करेगा।
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
              3
            </span>
            <h4 className="text-xs font-bold text-slate-900">सत्यापन व सुरक्षित इम्पोर्ट</h4>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            प्रीव्यू तालिका में जांचें और एक क्लिक में सुरक्षित रूप से कैटलॉग में सहेजें।
          </p>
        </div>
      </div>

      {/* File Upload / Paste Area */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Upload size={22} />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                CSV फ़ाइल चुनें (Upload CSV)
              </h3>
              <p className="text-xs text-slate-500">
                {fileName ? `चयनित फ़ाइल: ${fileName}` : 'कंप्यूटर से .csv फ़ाइल का चयन करें'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <FileSpreadsheet size={16} />
              फ़ाइल चुनें (.CSV)
            </Button>
            {csvContent && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCsvContent('');
                  setFileName('');
                  setImportCompleted(false);
                }}
                className="text-slate-500"
              >
                हटाएं
              </Button>
            )}
          </div>
        </div>

        {/* Or direct paste textarea */}
        <div className="mt-4">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            या यहाँ सीधे CSV टेक्स्ट पेस्ट करें (Or Paste Raw CSV Data):
          </label>
          <textarea
            rows={4}
            value={csvContent}
            onChange={(e) => {
              setCsvContent(e.target.value);
              setImportCompleted(false);
            }}
            placeholder={`Material Code,English Name*,Hindi Name,Category ID*,Size,Gauge,Thickness (mm)*,Unit (piece/kg/sheet/m/litre)*,Weight per Unit (kg)*,Reorder Level,Brand,Grade,Local Aliases\n"PIPE-SQ-25-18G","MS Square Pipe 25x25 mm (1\\") 18G","एम एस चौकोर पाइप 1 इंच","ms_pipes","25x25 mm","18G","1.2","piece","5.4","20","APL Apollo","YSt 210","1 इंची पाइप"`}
            className="w-full font-mono text-xs rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-slate-800 placeholder:text-slate-400 focus:bg-white"
          />
        </div>
      </div>

      {/* Validation Summary & Preview */}
      {summary.totalRows > 0 && (
        <div className="space-y-4">
          {/* Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500">कुल रिकॉर्ड्स (Total Rows)</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{summary.totalRows}</p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-800">
                मान्य रिकॉर्ड्स (Valid Rows)
              </span>
              <p className="text-xl font-black text-emerald-700 mt-0.5">{summary.validRows}</p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 shadow-sm">
              <span className="text-[11px] font-bold text-amber-800">
                डुप्लीकेट सामग्री (Duplicates)
              </span>
              <p className="text-xl font-black text-amber-700 mt-0.5">{summary.duplicateRows}</p>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 shadow-sm">
              <span className="text-[11px] font-bold text-red-800">त्रुटियां (Errors)</span>
              <p className="text-xl font-black text-red-700 mt-0.5">{summary.errorRows}</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  filterTab === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                सभी ({summary.totalRows})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('valid')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  filterTab === 'valid'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                केवल मान्य ({summary.validRows - summary.duplicateRows})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('duplicates')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  filterTab === 'duplicates'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                डुप्लीकेट ({summary.duplicateRows})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('errors')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  filterTab === 'errors'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
                }`}
              >
                त्रुटियां ({summary.errorRows})
              </button>
            </div>

            {/* Execute Import Options */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                डुप्लीकेट छोड़ें (Skip Duplicates)
              </label>

              <Button
                type="button"
                onClick={handleExecuteImport}
                disabled={importing || summary.validRows === 0}
                className="gap-2 bg-teal-700 hover:bg-teal-800"
              >
                {importing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    इम्पोर्ट जारी... ({importProgress.current}/{importProgress.total})
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    मान्य मटेरियल इम्पोर्ट करें
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Success Banner */}
          {importCompleted && (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={24} className="text-emerald-700" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    इम्पोर्ट सफलतापूर्वक संपन्न हुआ!
                  </h4>
                  <p className="text-xs text-emerald-800">
                    {importedCount} नए मटेरियल डेटाबेस में जोड़ दिए गए हैं।
                  </p>
                </div>
              </div>
              <Button asChild size="sm" className="bg-emerald-800 hover:bg-emerald-900">
                <Link href="/admin/raw-materials">कैटलॉग में देखें</Link>
              </Button>
            </div>
          )}

          {/* Preview Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">पंक्ति (Row)</th>
                  <th className="px-3 py-2.5">स्थिति (Status)</th>
                  <th className="px-3 py-2.5">कोड (Code)</th>
                  <th className="px-3 py-2.5">मटेरियल नाम (Material Name)</th>
                  <th className="px-3 py-2.5">श्रेणी (Category)</th>
                  <th className="px-3 py-2.5">साइज / गेज</th>
                  <th className="px-3 py-2.5">मोटाई (mm)</th>
                  <th className="px-3 py-2.5">यूनिट</th>
                  <th className="px-3 py-2.5">वजन/यूनिट (kg)</th>
                  <th className="px-3 py-2.5">विवरण व त्रुटि</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={`hover:bg-slate-50/80 transition-all ${
                      row.errors.length > 0
                        ? 'bg-red-50/30'
                        : row.isDuplicate
                        ? 'bg-amber-50/30'
                        : ''
                    }`}
                  >
                    <td className="px-3 py-2.5 font-mono text-slate-400">#{row.rowNumber}</td>
                    <td className="px-3 py-2.5">
                      {row.errors.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                          <XCircle size={12} />
                          त्रुटि
                        </span>
                      ) : row.isDuplicate ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          <AlertTriangle size={12} />
                          डुप्लीकेट
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <CheckCircle2 size={12} />
                          मान्य
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-medium text-slate-600">
                      {row.code || 'Auto'}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-slate-900">{row.name}</div>
                      {row.name_hi && (
                        <div className="text-[11px] text-slate-500">{row.name_hi}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-700">{row.category}</td>
                    <td className="px-3 py-2.5">
                      {row.size || '—'} {row.gauge ? `(${row.gauge})` : ''}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">
                      {row.thickness_mm ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 font-bold uppercase text-teal-800">{row.unit}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">
                      {row.weight_kg_per_unit ?? '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.errors.length > 0 ? (
                        <span className="text-[11px] font-medium text-red-700">
                          {row.errors.join('; ')}
                        </span>
                      ) : row.isDuplicate ? (
                        <span className="text-[11px] font-medium text-amber-700">
                          कैटलॉग में समान मटेरियल पहले से मौजूद है
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-700">इम्पोर्ट के लिए तैयार</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
