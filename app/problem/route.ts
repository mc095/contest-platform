import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface TestCase {
  input: string;
  output: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const questionPath = path.join(process.cwd(), 'questions', `${id}.mdx`);
  const testCasePath = path.join(process.cwd(), 'testcases', `${id}.json`);
  const templatePaths = {
    cpp: path.join(process.cwd(), 'templates', `${id}.cpp`),
    java: path.join(process.cwd(), 'templates', `${id}.java`),
    python: path.join(process.cwd(), 'templates', `${id}.py`),
  };

  try {
    const content = await fs.readFile(questionPath, 'utf-8');
    const testCasesRaw = await fs.readFile(testCasePath, 'utf-8');
    const testCases: TestCase[] = JSON.parse(testCasesRaw).cases || [];

    // Fetch all templates, default to empty string if not found
    const template = {
      cpp: await fs.readFile(templatePaths.cpp, 'utf-8').catch(() => ''),
      java: await fs.readFile(templatePaths.java, 'utf-8').catch(() => ''),
      python: await fs.readFile(templatePaths.python, 'utf-8').catch(() => ''),
    };

    return NextResponse.json({
      content,
      title: `Problem ${id}`, // Dynamically determine title from MDX if needed
      difficulty: 'Medium', // Dynamically determine from MDX if needed
      testCases,
      template,
    });
  } catch (error) {
    console.error('Error fetching problem:', error);
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }
}