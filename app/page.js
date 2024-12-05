'use client';

import Image from "next/image";
import { useRef, useState } from "react";
import BookGrid from './components/BookGrid';

export default function Home() {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [bookGridKey, setBookGridKey] = useState(0);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Refresh the book grid by changing its key
      setBookGridKey(prev => prev + 1);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <div className="text-sm sm:text-base md:text-lg text-center pt-2 sm:pt-3 md:pt-4 pb-4 sm:pb-5 md:pb-6">
        {uploading ? 'Uploading...' : 'UPLOAD EPUB'}
      </div>
      <Image
        src="img/book_upload.svg"
        alt="upload epub"
        className={`mx-auto w-[60px] sm:w-[80px] md:w-[100px] h-auto cursor-pointer transition-transform duration-300 hover:scale-110 ${uploading ? '' : 'animate-blink hover:animate-none'}`}
        width={60}
        height={60}
        priority
        onClick={handleImageClick}
      />
      <input
        type="file"
        accept=".epub"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={uploading}
      />
      <BookGrid key={bookGridKey} />
    </>
  );
}