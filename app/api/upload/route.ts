import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    // Parse the JSON body instead of FormData
    const { type, fileName, content } = await req.json();

    if (!content || !type || !fileName) {
      return NextResponse.json({ message: 'Missing content, type, or fileName' }, { status: 400 });
    }

    // Determine the appropriate folder based on the type
    let folder;
    switch (type) {
      case 'questions':
        folder = path.join(process.cwd(), 'questions');
        break;
      case 'testcases':
        folder = path.join(process.cwd(), 'testcases');
        break;
      case 'templates':
        folder = path.join(process.cwd(), 'templates');
        break;
      default:
        return NextResponse.json({ message: 'Invalid type' }, { status: 400 });
    }

    // Ensure the folder exists
    try {
      await fs.access(folder);
    } catch {
      // If the folder doesn't exist, create it
      await fs.mkdir(folder, { recursive: true });
    }

    // Create the file path
    const filePath = path.join(folder, fileName);
    
    // Write the content directly to the file
    await fs.writeFile(filePath, content, 'utf8');

    return NextResponse.json({ message: 'File uploaded successfully', path: filePath });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ message: 'Error uploading file', error: (error as Error).message }, { status: 500 });
  }
}