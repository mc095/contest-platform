import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'submissions.txt');

    // Check if the file exists
    await fs.access(filePath);
    const content = await fs.readFile(filePath, 'utf8');

    return new NextResponse(content, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Error reading submissions.txt:', error);
    return new NextResponse('File not found or error reading file', {
      status: 404,
    });
  }
}