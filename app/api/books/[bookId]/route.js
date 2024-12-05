import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  const { bookId } = params;
  const filePath = path.join(process.cwd(), 'public', 'uploads', `${bookId}.epub`);

  try {
    const fileBuffer = await fs.promises.readFile(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': `inline; filename="${bookId}.epub"`,
      },
    });
  } catch (error) {
    console.error('Error reading EPUB file:', error);
    return new NextResponse('File not found', { status: 404 });
  }
}