import { NextRequest, NextResponse } from 'next/server';
import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, rmSync, promises as fsPromises } from 'fs';
import { randomBytes } from 'crypto';
import { join } from 'path';

interface TestCase {
  input: string;
  expected: string;
}

interface EvaluationResult {
  input: string;
  output: string;
  expected: string;
  passed: boolean;
}

interface RequestBody {
  code: string;
  languageId: number;
  testCases: TestCase[];
  problemId: string;
  session: string;
  isAllCompleted: boolean;
}

interface SpawnOptions extends Omit<import('child_process').SpawnOptions, 'stdio'> {
  input?: string;
  shell?: boolean;
  stdio?: 'pipe' | [string, string, string];
}

const spawnPromise = promisify((command: string, args: string[], options: SpawnOptions, callback: (err: Error | null, result: { stdout: string; stderr: string }) => void) => {
  const child: ChildProcess = spawn(command, args, { ...options, stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  if (child.stdout) {
    child.stdout.on('data', (data: Buffer) => (stdout += data.toString()));
  }
  if (child.stderr) {
    child.stderr.on('data', (data: Buffer) => (stderr += data.toString()));
  }
  child.on('error', (err) => callback(err, { stdout, stderr }));
  child.on('close', (code) => {
    if (code !== 0) callback(new Error(`Process exited with code ${code}: ${stderr}`), { stdout, stderr });
    else callback(null, { stdout, stderr });
  });
  if (options.input) {
    child.stdin?.write(options.input);
    child.stdin?.end();
  }
});

export async function POST(req: NextRequest) {
  let outputFile: string | null = null;
  const tempDir: string = join(process.cwd(), 'tmp', randomBytes(4).toString('hex'));
  const submissionsFilePath = join(process.cwd(), 'submissions.txt');

  if (!existsSync('tmp')) {
    mkdirSync('tmp');
  }
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir);
  }
  try {
    const { code, languageId, testCases, problemId, session, isAllCompleted }: RequestBody = await req.json();
    console.log('Received request body:', { code, languageId, testCases, problemId, session, isAllCompleted }); // Debug log

    if (!tempDir) {
      throw new Error('Failed to create temporary directory');
    }

    outputFile = join(tempDir, `output_${randomBytes(4).toString('hex')}.exe`);
    const sourceFile = join(tempDir, `temp.${languageId === 54 ? 'cpp' : languageId === 62 ? 'py' : 'java'}`);

    let compileCommand: string | null = null;
    let execCommand: string;
    let execArgs: string[] = [];

    switch (languageId) {
      case 54: // C++
        compileCommand = `g++ -o ${outputFile} ${sourceFile}`;
        execCommand = outputFile || '';
        break;
      case 62: // Python
        execCommand = 'python';
        execArgs = [sourceFile];
        break;
      case 71: // Java
        compileCommand = `javac ${sourceFile}`;
        execCommand = 'java';
        execArgs = ['-cp', tempDir, 'temp']; // Run the compiled class
        break;
      default:
        throw new Error('Unsupported language');
    }

    writeFileSync(sourceFile, code);

    if (compileCommand) {
      const { stderr } = await spawnPromise('cmd', ['/c', compileCommand], { shell: true, cwd: tempDir });
      if (stderr) throw new Error(`Compilation failed: ${stderr}`);
    }

    const results: EvaluationResult[] = await Promise.all(testCases.map(async (testCase: TestCase) => {
      const { stdout, stderr } = await spawnPromise(execCommand, execArgs, { input: testCase.input, cwd: tempDir });
      const output = stdout.trim() || stderr.trim();
      const passed = output === testCase.expected;
      return { input: testCase.input, output, expected: testCase.expected, passed };
    }));

    const allPassed = results.every((result: EvaluationResult) => result.passed);
    const output = results.map((r: EvaluationResult) => r.output).join('\n');
    const detailedResults = results;

    // Only write to submissions.txt when all problems are completed
    if (isAllCompleted && allPassed) {
      try {
        if (!existsSync(submissionsFilePath)) {
          await fsPromises.writeFile(submissionsFilePath, '');
        }
        // Read current submissions atomically
        const currentSubmissions = await fsPromises.readFile(submissionsFilePath, 'utf8');
        const lines = currentSubmissions.split('\n').filter(line => line.trim());
        const now = new Date();
        const submissionEntry = `${session},${now.toISOString()}\n`;
        const isDuplicate = lines.some(line => {
          const [existingSession] = line.split(',');
          return existingSession === session;
        });

        if (!isDuplicate) {
          // Use a temporary file for atomic write
          const tempFilePath = `${submissionsFilePath}.tmp`;
          // Prepend the new submission at the beginning
          const newContent = submissionEntry + currentSubmissions;
          await fsPromises.writeFile(tempFilePath, newContent);
          await fsPromises.rename(tempFilePath, submissionsFilePath); // Atomic replace
          console.log(`Successfully wrote completion for ${session} to ${submissionsFilePath}`);
        } else {
          console.log(`Completion for ${session} already exists, skipping write`);
        }
      } catch (error) {
        console.error(`Failed to write to ${submissionsFilePath}:`, error);
      }
    }

    return NextResponse.json({
      passed: allPassed,
      output,
      expected: testCases.map((tc) => tc.expected).join('\n'),
      detailedResults,
    });
  } catch (e) {
    if (e instanceof Error) {
      console.error('Evaluation Error:', e.message);
      return NextResponse.json({ error: `Evaluation failed: ${e.message}` }, { status: 500 });
    } else {
      console.error('Unexpected Error:', e);
      return NextResponse.json({ error: 'Evaluation failed due to an unexpected error' }, { status: 500 });
    }
  } finally {
    if (tempDir && existsSync(tempDir)) {
      try {
        const files = readdirSync(tempDir);
        for (const file of files) {
          unlinkSync(join(tempDir, file));
        }
        rmSync(tempDir, { recursive: true, force: true });
      } catch (err) {
        console.error(`Failed to clean up ${tempDir}:`, err);
      }
    }
    const tmpDir = join(process.cwd(), 'tmp');
    if (existsSync(tmpDir)) {
      try {
        const remainingFiles = readdirSync(tmpDir);
        if (remainingFiles.length === 0) {
          rmSync(tmpDir, { recursive: true, force: true });
        }
      } catch (err) {
        console.error('Failed to clean up tmp directory:', err);
      }
    }
  }
}