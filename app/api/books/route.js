import fs from 'fs/promises';
import path from 'path';

async function getRandomAuthors(count) {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    const users = await response.json();
    // Shuffle array and take required number of authors
    return users
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map(user => user.name);
  } catch (error) {
    console.error('Error fetching authors:', error);
    return Array(count).fill('Unknown Author');
  }
}

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    const files = await fs.readdir(uploadsDir);
    
    const epubFiles = files.filter(file => file.endsWith('.epub'));
    const authors = await getRandomAuthors(epubFiles.length);
    
    const books = epubFiles.map((file, index) => ({
      id: file.replace('.epub', ''),
      title: file.replace('.epub', '').split('-').join(' '),
      author: authors[index],
      coverImage: `https://picsum.photos/250/300?random=${Math.random()}`,
      url: `/uploads/${file}`
    }));

    return Response.json(books);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}