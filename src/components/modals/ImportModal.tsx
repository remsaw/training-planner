import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { ConflictReport } from '../../types';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { downloadCsv } from '../../utils/csvUtils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const { importPeopleData, importCoursesData, importTrainingData } = usePlanner();

  const [activeTab, setActiveTab] = useState<'people' | 'courses' | 'training'>('people');
  const [csvContent, setCsvContent] = useState('');
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: string[];
    conflicts?: ConflictReport[];
  } | null>(null);

  if (!isOpen) return null;

  const samplePeopleCsv = `ID,Name,Employee ID,Department,Role,Email,Phone,Active
person_101,Dr. Tamer Fawzy,EMP-1011,Health Informatics,Lecturer,tamer@hospital.org,+20 100 111 2222,true
person_102,Dr. Nourhan Adel,EMP-2011,Clinical Analytics,Supervisor,nourhan@hospital.org,+20 100 333 4444,true
person_103,Eng. Hany Samir,EMP-3011,Simulation IT,Technical,hany@hospital.org,+20 100 555 6666,true`;

  const sampleCoursesCsv = `Course ID,Course Name,Course Code,Category,Description,Default Duration Days,Active
course_101,Advanced Healthcare Informatics,AHI-501,Health Informatics,Advanced hospital IT and HL7,5,true
course_102,Clinical Epidemiology Workshop,EPI-202,Research,Clinical trial statistical design,3,true`;

  const sampleTrainingCsv = `Training ID,Course ID,Start Date,End Date,Start Time,End Time,Location,Lecturer IDs,Supervisor IDs,Technical IDs,Notes
training_201,course_001,2026-11-16,2026-11-20,09:00,14:00,Auditorium B,person_001,person_005,person_008,November ICD-11 session`;

  const handleLoadSample = () => {
    if (activeTab === 'people') setCsvContent(samplePeopleCsv);
    else if (activeTab === 'courses') setCsvContent(sampleCoursesCsv);
    else setCsvContent(sampleTrainingCsv);
  };

  const handleDownloadTemplate = () => {
    if (activeTab === 'people') downloadCsv('people_template.csv', samplePeopleCsv);
    else if (activeTab === 'courses') downloadCsv('courses_template.csv', sampleCoursesCsv);
    else downloadCsv('training_template.csv', sampleTrainingCsv);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvContent((event.target?.result as string) || '');
      };
      reader.readAsText(file);
    }
  };

  const handleImport = () => {
    if (!csvContent.trim()) return;

    if (activeTab === 'people') {
      const res = importPeopleData(csvContent);
      setImportResult({ imported: res.imported, errors: res.errors });
    } else if (activeTab === 'courses') {
      const res = importCoursesData(csvContent);
      setImportResult({ imported: res.imported, errors: res.errors });
    } else {
      const res = importTrainingData(csvContent);
      setImportResult({
        imported: res.imported,
        errors: res.errors,
        conflicts: res.conflicts,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl max-h-[92dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Import CSV Data</h2>
              <p className="text-[11px] sm:text-xs text-gray-500">
                Bulk upload people, courses, or training sessions with auto-validation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-semibold px-4 sm:px-6 pt-2 overflow-x-auto shrink-0">
          {(['people', 'courses', 'training'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setImportResult(null);
                setCsvContent('');
              }}
              className={`px-3 sm:px-4 py-2.5 border-b-2 capitalize transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-700 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab === 'training' ? 'Training Sessions' : tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Upload CSV File</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer font-medium"
              >
                Load Sample Data
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              CSV Text Content
            </label>
            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              rows={7}
              placeholder="Paste comma-separated CSV text here..."
              className="w-full font-mono text-[11px] p-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Import Result Notice */}
          {importResult && (
            <div className="p-3.5 rounded-xl border bg-gray-50 space-y-2">
              <div className="flex items-center gap-2">
                {importResult.imported > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                <span className="font-bold text-gray-900">
                  Imported {importResult.imported} records successfully.
                </span>
              </div>

              {importResult.errors.length > 0 && (
                <div className="text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                  <span className="font-bold block mb-1">Parsing Errors:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {importResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.conflicts && importResult.conflicts.length > 0 && (
                <div className="text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200 text-xs">
                  <span className="font-bold block mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Conflict Engine Report: {importResult.conflicts.length} conflict(s) detected!
                  </span>
                  <div className="max-h-24 overflow-y-auto space-y-1 text-[11px]">
                    {importResult.conflicts.map((c) => (
                      <div key={c.id}>• {c.description}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-white transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!csvContent.trim()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
          >
            Process &amp; Import
          </button>
        </div>
      </div>
    </div>
  );
};
