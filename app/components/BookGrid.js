'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const CACHE_KEY = 'book_cache';

function getCache() {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch {
    return {};
  }
}

function updateCache(books) {
  try {
    const bookData = books.reduce((acc, book) => {
      acc[book.id] = {
        coverImage: book.coverImage,
        title: book.title,
        author: book.author
      };
      return acc;
    }, {});
    localStorage.setItem(CACHE_KEY, JSON.stringify(bookData));
  } catch (error) {
    console.error('Error updating cache:', error);
  }
}

export default function BookGrid() {
  const router = useRouter();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUsingCache, setIsUsingCache] = useState(false);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch('/api/books');
        if (!response.ok) throw new Error('Failed to fetch books');
        
        const data = await response.json();
        updateCache(data);
        setBooks(data);
        setIsUsingCache(false);
      } catch (error) {
        console.error('Error fetching books:', error);
        const cache = getCache();
        const cachedBooks = Object.entries(cache).map(([id, data]) => ({
          id,
          ...data,
          url: `/uploads/${id}.epub`
        }));
        if (cachedBooks.length > 0) {
          setBooks(cachedBooks);
          setIsUsingCache(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleBookClick = async (bookId) => {
    try {
      const response = await fetch(`/api/read?book=${bookId}`);
      if (!response.ok) throw new Error('Failed to load book');
      
      const data = await response.json();
      if (data.success) {
        router.push(`/reader/${bookId}`);
      }
    } catch (error) {
      console.error('Error opening book:', error);
      alert('Failed to open book. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading books...</div>;
  }

  return (
    <div className="mt-8 px-4">
      {isUsingCache && (
        <div className="text-center mb-4 text-amber-600">
          Showing cached data. Some information might be outdated.
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {books.map((book) => (
          <div 
            key={book.id} 
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleBookClick(book.id)}
          >
            <div className="relative w-full aspect-[3/4]">
              <Image
                src={book.coverImage}
                alt={book.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover rounded-md"
                unoptimized
              />
            </div>
            <h3 className="mt-2 font-semibold text-lg truncate">{book.title}</h3>
            <p className="text-gray-600 text-sm">{book.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
}