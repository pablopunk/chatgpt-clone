import React from 'react';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export default function CustomModal({ isOpen, onClose, message }: CustomModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-80">
        <h2 className="text-lg font-bold mb-4">Notice</h2>
        <p className="mb-4">{message}</p>
        <button
          onClick={onClose}
          className="mt-4 w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
