import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('book');

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    const filePath = path.join(uploadsDir, `${bookId}.epub`);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Return the file path relative to public directory
    return NextResponse.json({ 
      success: true,
      bookPath: `/uploads/${bookId}.epub`
    });
  } catch (error) {
    console.error('Error reading book:', error);
    return NextResponse.json({ error: 'Failed to read book' }, { status: 500 });
  }
}