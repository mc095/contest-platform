import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { type, fileName } = await req.json();

    if (!type || !fileName) {
      return NextResponse.json({ message: 'Missing type or fileName' }, { status: 400 });
    }

    // Determine the file path based on the type
    let filePath;
    switch (type) {
      case 'questions':
        filePath = path.join(process.cwd(), 'questions', fileName);
        break;
      case 'testcases':
        filePath = path.join(process.cwd(), 'testcases', fileName);
        break;
      case 'templates':
        filePath = path.join(process.cwd(), 'templates', fileName);
        break;
      case 'submissions':
        if (fileName !== 'submissions.txt') {
          return NextResponse.json({ message: 'Only submissions.txt is supported for this type' }, { status: 400 });
        }
        filePath = path.join(process.cwd(), 'submissions.txt');
        break;
      default:
        return NextResponse.json({ message: 'Invalid type' }, { status: 400 });
    }

    // Check if the file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    // Delete the file
    await fs.unlink(filePath);

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ 
      message: 'Error deleting file', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}