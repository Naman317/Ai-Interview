import { useState } from 'react';
import api from '../utils/api';

export default function CVUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
      }
      setFile(selectedFile);
      setPreview(selectedFile.name);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('cv', file);

    setLoading(true);
    try {
      const response = await api.post(
        `/api/users/upload-cv`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setFile(null);
      setPreview(null);
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
      alert('CV uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload CV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">📄 Upload Your CV</h3>

      <div className="space-y-4">
        <label className="block">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-4xl mb-2">📎</div>
            <p className="text-sm text-slate-600">
              {preview ? preview : 'Click to upload PDF or drag and drop'}
            </p>
            <p className="text-xs text-slate-400 mt-2">PDF up to 10MB</p>
          </div>
        </label>

        {file && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">✓ {file.name} selected</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Uploading...' : 'Upload CV'}
        </button>
      </div>
    </div>
  );
}
