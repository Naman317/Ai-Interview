import { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';

const LANGUAGES = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
  { label: 'SQL', value: 'sql' },
  { label: 'HTML/CSS', value: 'html' },
];

export default function CodingSheet({ isOpen, onClose }) {
  const [code, setCode] = useState('// Write your notes or code here\n\n');
  const [language, setLanguage] = useState('javascript');

  const downloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `notes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        ></div>
      )}

      {/* Side Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex justify-between items-center">
          <h2 className="font-bold text-lg">📝 Notes & Code</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 p-2 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Language Selector */}
        <div className="border-b p-4 space-y-2">
          <label className="text-sm font-semibold text-slate-700">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Code Editor */}
        <div className="flex-1 overflow-hidden">
          <MonacoEditor
            height="100%"
            language={language}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        {/* Footer Actions */}
        <div className="border-t p-4 space-y-2 bg-slate-50">
          <button
            onClick={downloadCode}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition text-sm"
          >
            💾 Download Notes
          </button>
          <button
            onClick={() => setCode('// Clear notes?\n\n')}
            className="w-full bg-red-100 text-red-700 py-2 rounded-lg font-semibold hover:bg-red-200 transition text-sm"
          >
            🗑️ Clear
          </button>
        </div>
      </div>
    </>
  );
}
