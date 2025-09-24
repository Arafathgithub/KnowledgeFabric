import React, { useRef, useState, ChangeEvent } from 'react';
import { UploadIcon, DocumentIcon, LoadingSpinner, TrashIcon } from './icons';

interface FileUploadProps {
  onFileUpload: (content: string) => void;
  isLoading: boolean;
  isGraphSaved: boolean;
  onClearStorage: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading, isGraphSaved, onClearStorage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onFileUpload(text);
      };
      reader.readAsText(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearClick = () => {
    onClearStorage();
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = async () => {
    if (isLoading) return;
    try {
      const response = await fetch('/sample-document.txt');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const text = await response.text();
      setFileName('sample-document.txt');
      onFileUpload(text);
    } catch (error) {
      console.error("Failed to load sample document:", error);
      // You could add some user-facing error state here
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div>
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Controls</h2>
        <div className="flex flex-col space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".txt"
          />
          <button
            onClick={handleButtonClick}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-500 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="w-5 h-5"/>
                Processing...
              </>
            ) : (
              <>
                <UploadIcon className="w-5 h-5"/>
                Upload Document
              </>
            )}
          </button>
          {fileName && !isLoading && (
              <p className="text-sm text-center text-slate-400 truncate">
                  File: {fileName}
              </p>
          )}
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-slate-700">
        <div className="mb-6">
          <h3 className="font-semibold text-gray-300 mb-2">Don't have a file?</h3>
          <p className="text-sm text-slate-400 mb-4">
            Load our sample document to see how it works.
          </p>
          <button
            onClick={handleLoadSample}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-gray-200 rounded-lg font-semibold hover:bg-slate-600 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            <DocumentIcon className="w-5 h-5" />
            Load Sample Document
          </button>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-300 mb-2">Manage Storage</h3>
          <button
            onClick={handleClearClick}
            disabled={!isGraphSaved || isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-800/80 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            <TrashIcon className="w-5 h-5" />
            Clear Saved Graph
          </button>
        </div>
      </div>
    </div>
  );
};