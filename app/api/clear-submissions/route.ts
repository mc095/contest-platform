import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST() {
  try {
    const filePath = path.join(process.cwd(), 'submissions.txt');

    // Check if the file exists
    try {
      await fs.access(filePath);
    } catch {
      // Create the file if it doesn't exist
      await fs.writeFile(filePath, '');
    }

    // Clear the contents by overwriting with an empty string
    await fs.writeFile(filePath, '');

    return NextResponse.json({ message: 'Submissions cleared successfully' });
  } catch (error) {
    console.error('Error clearing submissions:', error);
    return NextResponse.json({ 
      message: 'Error clearing submissions', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}