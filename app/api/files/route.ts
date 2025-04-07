import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: Request) {
  try {
    // Get the type from the query parameter
    const url = new URL(req.url);
    const type = url.searchParams.get('type');

    if (!type) {
      return NextResponse.json({ message: 'Type parameter is required' }, { status: 400 });
    }

    // Determine the folder path based on the type
    let folderPath;
    switch (type) {
      case 'questions':
        folderPath = path.join(process.cwd(), 'questions');
        break;
      case 'testcases':
        folderPath = path.join(process.cwd(), 'testcases');
        break;
      case 'templates':
        folderPath = path.join(process.cwd(), 'templates');
        break;
      default:
        return NextResponse.json({ message: 'Invalid type' }, { status: 400 });
    }

    // Ensure the folder exists
    try {
      await fs.access(folderPath);
    } catch  {
      // If the folder doesn't exist, create it and return empty array
      await fs.mkdir(folderPath, { recursive: true });
      return NextResponse.json({ files: [] });
    }

    // Read the directory
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    
    // Filter only files (not directories) and create file info objects
    const files = entries
      .filter(entry => entry.isFile())
      .map(entry => ({
        name: entry.name,
        path: path.join(folderPath, entry.name).replace(process.cwd(), '')
      }));

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error getting files:', error);
    return NextResponse.json({ message: 'Error getting files', error: (error as Error).message }, { status: 500 });
  }
}