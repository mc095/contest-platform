"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-tomorrow_night";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster, toast } from "sonner";
import { useMDXComponents } from "@/app/mdx-components";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Code,
  Play,
  RefreshCw,
  X,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface FileInfo {
  name: string;
  path: string;
}

interface TestCase {
  input: string;
  output: string;
}

interface TestResult {
  input: string;
  output: string;
  expected: string;
  passed: boolean;
}

interface Problem {
  title: string;
  difficulty: string;
  mdxSource: MDXRemoteSerializeResult | null;
  templates: { [key: string]: string };
  testCases: TestCase[] | null;
  isCompleted: boolean;
}

const difficultyMap: Record<string, { color: string; label: string }> = {
  Easy: { color: "bg-green-600", label: "Easy" },
  Medium: { color: "bg-yellow-600", label: "Medium" },
  Hard: { color: "bg-red-600", label: "Hard" },
};

export default function Problem() {
  const [code, setCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("c_cpp");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [session, setSession] = useState<string>("anonymous");
  const mdxComponents = useMDXComponents({});
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [completedProblems, setCompletedProblems] = useState<Set<string>>(new Set());
  const editorRef = useRef<AceEditor | null>(null);

  useEffect(() => {
    const cookieSession = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userSession="))
      ?.split("=")[1] || "anonymous";
    setSession(cookieSession);
    setCompletedProblems(new Set(JSON.parse(localStorage.getItem(`completed_${cookieSession}`) || "[]")));
  }, []);

  useEffect(() => {
    if (!id || !session) {
      toast.error("Please enter your name and join the contest");
      router.push("/contest");
      return;
    }

    const fetchProblemData = async () => {
      setLoading(true);
      try {
        const mdxRes = await fetch("/api/files?type=questions");
        if (!mdxRes.ok) throw new Error("Failed to fetch questions");
        const mdxData = await mdxRes.json();
        const mdxFile = mdxData.files.find(
          (file: FileInfo) => file.name === `${id}.mdx`
        );
        if (!mdxFile) throw new Error("Problem not found");

        const mdxContentRes = await fetch(
          `/api/get-file?type=questions&fileName=${encodeURIComponent(mdxFile.name)}`
        );
        if (!mdxContentRes.ok)
          throw new Error("Failed to fetch problem description");
        const mdxContent = await mdxContentRes.text();
        const mdxSource = await serialize(mdxContent);

        const templatesRes = await fetch("/api/files?type=templates");
        if (!templatesRes.ok) throw new Error("Failed to fetch templates");
        const templatesData = await templatesRes.json();

        const templates: { [key: string]: string } = {
          c_cpp: "",
          java: "",
          python: "",
        };

        const filteredTemplates = templatesData.files.filter((file: FileInfo) =>
          file.name.startsWith(`${id}.`)
        );

        for (const template of filteredTemplates) {
          try {
            const fileExtension = template.name.split(".").pop() || "";
            let languageKey = "";
            if (fileExtension === "cpp") languageKey = "c_cpp";
            else if (fileExtension === "java") languageKey = "java";
            else if (fileExtension === "py") languageKey = "python";

            if (languageKey) {
              const url = `/api/get-file?type=templates&fileName=${encodeURIComponent(template.name)}`;
              const contentRes = await fetch(url);
              if (contentRes.ok) {
                const content = await contentRes.text();
                templates[languageKey] = content;
              }
            }
          } catch (error) {
            console.error(`Error fetching template ${template.name}:`, error);
          }
        }

        const testCasesRes = await fetch("/api/files?type=testcases");
        if (!testCasesRes.ok) throw new Error("Failed to fetch test cases");
        const testCasesData = await testCasesRes.json();
        const testCaseFile = testCasesData.files.find(
          (file: FileInfo) => file.name === `${id}.json`
        );
        let testCases: TestCase[] | null = null;
        if (testCaseFile) {
          const testCaseRes = await fetch(
            `/api/get-file?type=testcases&fileName=${encodeURIComponent(testCaseFile.name)}`
          );
          if (testCaseRes.ok) {
            const testCaseContent = await testCaseRes.text();
            const parsedTestCases = JSON.parse(testCaseContent);
            testCases = parsedTestCases.cases || [];
          }
        }

        let difficulty = "Medium";
        if (id.toLowerCase().includes("easy")) difficulty = "Easy";
        if (id.toLowerCase().includes("hard")) difficulty = "Hard";

        const isCompleted = completedProblems.has(id);
        const newProblem: Problem = {
          title: id,
          difficulty,
          mdxSource,
          templates,
          testCases,
          isCompleted,
        };

        setProblem(newProblem);

        if (templates[selectedLanguage]) {
          setCode(templates[selectedLanguage]);
        }
      } catch (error) {
        toast.error(
          `Failed to load problem: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblemData();
  }, [id, router, selectedLanguage, session, completedProblems]);

  useEffect(() => {
    if (!problem) return;

    if (problem.templates[selectedLanguage]) {
      setCode(problem.templates[selectedLanguage]);
    }
  }, [selectedLanguage, problem]);

  useEffect(() => {
    let tabSwitchCount = parseInt(localStorage.getItem(`tabSwitchCount_${session}`) || "0");
    console.log("Initial tabSwitchCount:", tabSwitchCount); // Debug log
    const handleVisibilityChange = () => {
      console.log("Visibility changed, document.hidden:", document.hidden); // Debug log
      if (document.hidden) {
        tabSwitchCount++;
        console.log("Incremented tabSwitchCount to:", tabSwitchCount); // Debug log
        localStorage.setItem(`tabSwitchCount_${session}`, tabSwitchCount.toString());
        toast.warning(`Tab switched ${tabSwitchCount} time(s). Maximum 5 allowed.`);
        if (tabSwitchCount > 5) {
          document.cookie = "userSession=; Max-Age=0; path=/";
          localStorage.removeItem(`completed_${session}`);
          localStorage.removeItem(`completions`);
          localStorage.removeItem(`tabSwitchCount_${session}`);
          router.push("/"); // Redirect to homepage instead of /contest
          toast.error("Tab switched more than 5 times. Session terminated.");
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [router, session]);

  useEffect(() => {
    setCompletedProblems(new Set(JSON.parse(localStorage.getItem(`completed_${session}`) || "[]")));
  }, [session]);

  // Add an effect to disable copy-paste in the editor
  useEffect(() => {
    const preventPaste = (e: Event) => {
      e.preventDefault();
      toast.warning("Copy-paste is disabled to encourage original coding.");
    };

    document.addEventListener('paste', preventPaste);
    return () => document.removeEventListener('paste', preventPaste);
  }, []);

  useEffect(() => {
    const preventPaste = (e: Event) => {
      e.preventDefault();
      toast.warning("Copy-paste is disabled to encourage original coding.");
    };

    const editor = editorRef.current;
    if (!editor?.editor?.container) return;

    const editorNode = editor.editor.container;
    editorNode.addEventListener('paste', preventPaste);
    return () => editorNode.removeEventListener('paste', preventPaste);
  }, []);

  // Prevent keyboard shortcuts for paste
  useEffect(() => {
    const preventCopyPaste = (e: KeyboardEvent) => {
      // Check for Ctrl+V (paste)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        toast.warning("Copy-paste is disabled to encourage original coding.");
      }
    };

    document.addEventListener('keydown', preventCopyPaste);
    
    return () => {
      document.removeEventListener('keydown', preventCopyPaste);
    };
  }, []);

  const handleReset = () => {
    if (problem) {
      const newCode = problem.templates[selectedLanguage] || "";
      setCode(newCode);
      toast.info("Code reset to template");
    }
  };

  const handleSubmit = async () => {
    if (!problem?.testCases || !session) return;

    setIsSubmitting(true);
    toast.info("Submitting solution...");

    const testCases = problem.testCases.map((tc) => ({
      input: tc.input,
      expected: tc.output,
    }));

    try {
      const allProblemsRes = await fetch("/api/files?type=questions");
      if (!allProblemsRes.ok) throw new Error("Failed to fetch problems");
      const allProblemsData = await allProblemsRes.json();
      const allProblems = allProblemsData.files.map((f: FileInfo) => f.name.replace(".mdx", ""));
      const newCompleted = new Set(completedProblems);
      newCompleted.add(id);
      const isAllCompleted = newCompleted.size === allProblems.length;

      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          languageId: { "c_cpp": 54, "python": 62, "java": 71 }[selectedLanguage],
          testCases,
          problemId: id,
          session,
          isAllCompleted,
        }),
      });

      const result = (await res.json()) as {
        passed: boolean;
        output: string;
        expected: string;
        detailedResults: TestResult[];
        error?: string;
      };

      if (result.error) {
        toast.error(result.error);
      } else if (result.passed) {
        setCompletedProblems(newCompleted);
        localStorage.setItem(`completed_${session}`, JSON.stringify(Array.from(newCompleted)));

        if (isAllCompleted) {
          localStorage.clear(); // Clear all localStorage on contest completion
          router.push("/completed");
        } else {
          setShowSuccessDialog(true);
          setTestResults(result.detailedResults || []);
          toast.success("All test cases passed!");
        }
      } else {
        toast.error("Some test cases failed");
        setTestResults(result.detailedResults || []);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(
        `Error submitting solution: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRun = async () => {
    if (!problem?.testCases || !session) return;

    setIsRunning(true);
    toast.info("Running code...");

    const testCases = problem.testCases.map((tc) => ({
      input: tc.input,
      expected: tc.output,
    }));

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          languageId: { "c_cpp": 54, "python": 62, "java": 71 }[selectedLanguage],
          testCases,
          problemId: id,
          session, // Include session (username) in the payload
          isAllCompleted: false,
        }),
      });

      const result = (await res.json()) as {
        passed: boolean;
        output: string;
        expected: string;
        detailedResults: TestResult[];
        error?: string;
      };

      if (result.error) {
        toast.error(result.error);
      } else {
        setTestResults(result.detailedResults || []);
        if (result.passed) {
          toast.success("All test cases passed!");
        } else {
          toast.error("Some test cases failed");
        }
      }
    } catch (error) {
      console.error("Run error:", error);
      toast.error(
        `Error running code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#09090b] text-white flex flex-col ${
        problem?.isCompleted ? "bg-gradient-to-r from-green-900/50 to-green-900/20" : ""
      } transition-all duration-300`}
    >
      <header className="bg-[#1a1a1a] border-b border-gray-800 px-4 py-3 flex items-center shadow-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/contest")}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <Separator orientation="vertical" className="mx-4 h-6 bg-gray-800" />

        <div className="text-lg font-medium">{problem?.title || id}</div>

        {problem?.difficulty && (
          <div className="ml-3">
            <Badge
              className={`${difficultyMap[problem.difficulty]?.color || "bg-yellow-600"}`}
            >
              {problem.difficulty}
            </Badge>
          </div>
        )}

        {loading && (
          <div className="ml-auto flex items-center text-sm text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
            Loading...
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-full lg:w-1/2 border-r border-gray-800 flex flex-col overflow-hidden">
          <Tabs defaultValue="description" className="flex flex-col h-full">
            <div className="bg-[#1a1a1a] border-b border-gray-800">
              <TabsList className="bg-transparent h-12">
                <TabsTrigger
                  value="description"
                  className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-[#2a2a2a] h-full"
                >
                  Problem Description
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent
              value="description"
              className="flex-1 overflow-y-auto p-6 bg-[#09090b]"
            >
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : problem?.mdxSource ? (
                <div className="prose prose-invert max-w-none">
                  <MDXRemote {...problem.mdxSource} components={mdxComponents} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <AlertCircle className="h-12 w-12 text-gray-500 mb-4" />
                  <p className="text-gray-400">Problem description not available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col overflow-hidden">
          <div className="bg-[#1a1a1a] border-b border-gray-800 p-3 flex items-center">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger
                className="w-[150px] bg-[#2a2a2a] border-gray-700 text-white"
              >
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] border-gray-700">
                <SelectGroup>
                  <SelectLabel className="text-gray-400">
                    Programming Language
                  </SelectLabel>
                  <SelectItem
                    value="c_cpp"
                    className="text-white hover:bg-[#3a3a3a]"
                  >
                    C++
                  </SelectItem>
                  <SelectItem
                    value="java"
                    className="text-white hover:bg-[#3a3a3a]"
                  >
                    Java
                  </SelectItem>
                  <SelectItem
                    value="python"
                    className="text-white hover:bg-[#3a3a3a]"
                  >
                    Python
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="sm"
                    className="ml-2 text-gray-300 border-gray-700 bg-[#2a2a2a] hover:bg-[#3a3a3a] hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Reset
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  className="bg-[#2a2a2a] text-white border-gray-700"
                >
                  Reset code to template
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex-1 overflow-hidden">
            <AceEditor
              ref={editorRef}
              mode={selectedLanguage}
              theme="tomorrow_night"
              onChange={setCode}
              value={code}
              name="code-editor"
              editorProps={{ $blockScrolling: true }}
              width="100%"
              height="100%"
              fontSize={14}
              showPrintMargin={true}
              showGutter={true}
              highlightActiveLine={true}
              setOptions={{
                useWorker: false,
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showLineNumbers: true,
                tabSize: 2,
              }}
              style={{ border: "1px solid #333", borderRadius: 0 }}
            />
          </div>

          <div className="bg-[#1a1a1a] border-t border-gray-800 flex-none">
            <Tabs defaultValue="testcase" className="w-full">
              <div className="border-b border-gray-800">
                <TabsList className="bg-transparent h-12 w-full justify-start">
                  <TabsTrigger
                    value="testcase"
                    className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-[#2a2a2a] px-6"
                  >
                    Test Cases
                  </TabsTrigger>
                  <TabsTrigger
                    value="result"
                    className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-[#2a2a2a] px-6"
                  >
                    Results
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="testcase" className="p-4 max-h-[200px] overflow-y-auto">
                {problem?.testCases?.length ? (
                  <div className="space-y-4">
                    {problem.testCases.slice(0, 2).map((tc, index) => (
                      <div
                        key={index}
                        className="border border-gray-700 rounded-md overflow-hidden"
                      >
                        <div className="bg-[#2a2a2a] p-2 flex justify-between items-center border-b border-gray-700">
                          <span className="text-sm font-medium text-gray-300">
                            Test Case {index + 1}
                          </span>
                        </div>
                        <div className="p-3 space-y-3">
                          <div>
                            <div className="text-xs text-gray-400 mb-1 font-medium">
                              Input:
                            </div>
                            <div className="p-2 bg-[#2a2a2a] rounded-md text-sm font-mono text-gray-300 whitespace-pre overflow-x-auto">
                              {tc.input}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 mb-1 font-medium">
                              Expected Output:
                            </div>
                            <div className="p-2 bg-[#2a2a2a] rounded-md text-sm font-mono text-gray-300 whitespace-pre overflow-x-auto">
                              {tc.output}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 text-gray-400">
                    <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No test cases available</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="result" className="p-4 max-h-[200px] overflow-y-auto">
                {testResults.length > 0 ? (
                  <div className="space-y-4">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={`border rounded-md overflow-hidden ${
                          result.passed
                            ? "border-green-700 bg-green-900/10"
                            : "border-red-700 bg-red-900/10"
                        }`}
                      >
                        <div
                          className={`p-2 flex justify-between items-center border-b ${
                            result.passed
                              ? "border-green-700 bg-green-900/20"
                              : "border-red-700 bg-red-900/20"
                          }`}
                        >
                          <div className="flex items-center">
                            {result.passed ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <X className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span className="text-sm font-medium">
                              Test Case {index + 1}
                            </span>
                          </div>
                          <Badge
                            variant={result.passed ? "outline" : "destructive"}
                            className={
                              result.passed ? "border-green-500 text-green-500" : ""
                            }
                          >
                            {result.passed ? "Passed" : "Failed"}
                          </Badge>
                        </div>
                        <div className="p-3 space-y-3">
                          <div>
                            <div className="text-xs text-gray-400 mb-1 font-medium">
                              Your Output:
                            </div>
                            <div className="p-2 bg-[#2a2a2a] rounded-md text-sm font-mono text-gray-300 whitespace-pre overflow-x-auto">
                              {result.output || "(empty)"}
                            </div>
                          </div>
                          {!result.passed && (
                            <div>
                              <div className="text-xs text-gray-400 mb-1 font-medium">
                                Expected Output:
                              </div>
                              <div className="p-2 bg-[#2a2a2a] rounded-md text-sm font-mono text-gray-300 whitespace-pre overflow-x-auto">
                                {result.expected || "(empty)"}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 text-gray-400">
                    <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Run your code to see results</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="bg-[#1a1a1a] border-t border-gray-800 p-4 flex items-center justify-between">
            <div className="flex space-x-3">
              <Button
                onClick={handleRun}
                variant="outline"
                className="bg-[#2a2a2a] text-white border-gray-700 hover:bg-[#3a3a3a] hover:border-gray-600 hover:text-white"
                disabled={isRunning || loading}
              >
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" /> Run Code
                  </>
                )}
              </Button>

              <Button
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" /> Submit Solution
                  </>
                )}
              </Button>
            </div>

            <div className="text-sm text-gray-400">
              {selectedLanguage === "c_cpp"
                ? "C++ 17"
                : selectedLanguage === "python"
                ? "Python 3"
                : "Java 11"}
            </div>
          </div>
        </div>
      </div>

      <Toaster position="top-right" />

      <Dialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
      >
        <DialogContent className="bg-[#1a1a1a] border border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
              <span>Solution Accepted!</span>
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400 mt-2">
              Congratulations! All test cases have passed successfully.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 my-4">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-1">
                  {testResults.filter((result) => result.passed).length}/
                  {testResults.length}
                </div>
                <div className="text-sm text-gray-300">Test Cases Passed</div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-2">
            <Button
              onClick={() => setShowSuccessDialog(false)}
              variant="outline"
              className="border-gray-700 text-black hover:bg-gray-800"
            >
              Review Solution
            </Button>
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                router.push("/contest");
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Back to Problems
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}