import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const fileName = url.searchParams.get('fileName');

    if (!type || !fileName) {
      return NextResponse.json({ message: 'Missing type or fileName' }, { status: 400 });
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

    const filePath = path.join(folderPath, fileName);

    // Check if the file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    // Read and return the file content
    const content = await fs.readFile(filePath, 'utf8');
    return new NextResponse(content, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ message: 'Error serving file', error: (error as Error).message }, { status: 500 });
  }
}