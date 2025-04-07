"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster, toast } from "sonner";
import { Loader2, Trash2, Upload, LogOut, Plus, FileText, Code, TestTube, Moon, Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface FileInfo {
  name: string;
  path: string;
}

interface Submission {
  user: string;
  time: string;
}

export default function Admin() {
  const [questions, setQuestions] = useState<FileInfo[]>([]);
  const [testCases, setTestCases] = useState<FileInfo[]>([]);
  const [templates, setTemplates] = useState<FileInfo[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newTestCase, setNewTestCase] = useState('');
  const [newTemplate, setNewTemplate] = useState('');
  const [questionFileName, setQuestionFileName] = useState('');
  const [testCaseFileName, setTestCaseFileName] = useState('');
  const [templateFileName, setTemplateFileName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('cpp');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('questions');
  const [open, setOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const router = useRouter();

  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    if (!localStorage.getItem('isAdmin')) {
      router.push('/login');
      return;
    }
    fetchFiles();
    fetchSubmissions();
  }, [router]);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const [qRes, tcRes, tRes] = await Promise.all([
        fetch('/api/files?type=questions'),
        fetch('/api/files?type=testcases'),
        fetch('/api/files?type=templates'),
      ]);
      
      if (!qRes.ok || !tcRes.ok || !tRes.ok) {
        throw new Error('Failed to fetch files');
      }
      
      const qData = await qRes.json();
      const tcData = await tcRes.json();
      const tData = await tRes.json();
      
      setQuestions(qData.files || []);
      setTestCases(tcData.files || []);
      setTemplates(tData.files || []);
    } catch (error) {
      toast.error('Failed to fetch files');
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/get-submissions');
      if (response.ok) {
        const text = await response.text();
        const lines = text.trim().split('\n');
        const submissionList: Submission[] = lines
          .map((line) => {
            const [user, time] = line.split(',');
            if (!user || !time) return null;
            
            // Parse the ISO string date and convert to IST
            const parsedTime = new Date(time.trim());
            if (isNaN(parsedTime.getTime())) return null;
            
            return {
              user: user.trim(),
              time: parsedTime.toISOString()
            };
          })
          .filter((s): s is Submission => s !== null);
        
        setSubmissions(submissionList.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      setSubmissions([]);
    }
  };

  const refreshSubmissions = () => {
    fetchSubmissions();
  };

  const validateFileContent = (type: string, content: string): boolean => {
    if (!content.trim()) {
      toast.error('Content cannot be empty');
      return false;
    }
    
    if (type === 'testcases') {
      try {
        JSON.parse(content);
      } catch {
        toast.error('Invalid JSON format for test case');
        return false;
      }
    }
    
    return true;
  };

  const handleUpload = async (type: string, content: string, fileName: string) => {
    if (!fileName) {
      toast.error('Please enter a file name');
      return;
    }
    
    if (!validateFileContent(type, content)) {
      return;
    }
    
    setIsUploading(true);
    
    try {
      let finalFileName = fileName;
      if (type === 'templates') {
        const extension = { cpp: '.cpp', java: '.java', python: '.py' }[selectedLanguage] || '.cpp';
        finalFileName = `${fileName.replace(/\.[^.]+$/, '')}${extension}`;
      } else if (type === 'questions') {
        finalFileName = `${fileName.replace(/\.[^.]+$/, '')}.mdx`;
      } else if (type === 'testcases') {
        finalFileName = `${fileName.replace(/\.[^.]+$/, '')}.json`;
      }
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          fileName: finalFileName,
          content
        }),
      });
      
      const responseData = await res.json();
      
      if (res.ok) {
        toast.success(`${finalFileName} uploaded successfully`);
        
        if (type === 'questions') setNewQuestion('');
        if (type === 'testcases') setNewTestCase('');
        if (type === 'templates') setNewTemplate('');
        
        setQuestionFileName('');
        setTestCaseFileName('');
        setTemplateFileName('');
        setOpen(false);
        
        await fetchFiles();
      } else {
        toast.error(`Upload failed: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('Upload failed due to an error');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (type: string, fileName: string) => {
    setIsDeleting(fileName);
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, fileName }),
      });
      
      if (res.ok) {
        toast.success(`${fileName} deleted successfully`);
        await fetchFiles();
        if (fileName === 'submissions.txt') {
          await fetchSubmissions(); // Refresh submissions after deletion
        }
      } else {
        const data = await res.json();
        toast.error(`Delete failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('Delete operation failed');
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleClearSubmissions = async () => {
    setIsDeleting('submissions.txt'); // Reuse isDeleting state for loading indication
    try {
      const res = await fetch('/api/clear-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (res.ok) {
        toast.success('Submissions cleared successfully');
        await fetchSubmissions(); // Refresh submissions list
      } else {
        const data = await res.json();
        toast.error(`Clear failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('Clear operation failed');
      console.error('Clear error:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('isAdmin');
    router.push('/login');
  };

  const FileList = ({ files, type }: { files: FileInfo[], type: string }) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (files.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <FileText className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-center">No {type} available.</p>
          <p className="text-center text-sm">Click the button below to add a new one.</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {files.map((file) => (
          <motion.div
            key={file.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors duration-200">
              <CardContent className="flex justify-between items-center p-3">
                <span className="text-md font-medium text-zinc-300">{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(type, file.name)}
                  disabled={isDeleting === file.name}
                  className="h-8 w-8 rounded-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  {isDeleting === file.name ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  const Dashboard = () => (
    <Card className="bg-zinc-950 border-zinc-800 mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Submission Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Trophy className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">No submissions yet.</p>
          </div>
        ) : (
          <ScrollArea className="h-[30vh] pr-4">
            <table className="w-full text-sm text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="py-2 text-left pl-4">Rank</th>
                  <th className="py-2 text-left">User</th>
                  <th className="py-2 text-left">Time (IST)</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission, index) => (
                  <tr key={`${submission.user}-${submission.time}`} className="border-b border-zinc-800 hover:bg-zinc-900/50">
                    <td className="py-2 pl-4">{index + 1}</td>
                    <td className="py-2">{submission.user}</td>
                    <td className="py-2">
                      {new Date(submission.time).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        hour12: false,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }).replace(/\//g, '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
        <div className="mt-4 space-y-2">
          <Button
            variant="outline"
            onClick={handleClearSubmissions}
            disabled={isDeleting === 'submissions.txt'}
            className="w-full bg-red-800 hover:bg-red-700 text-white"
          >
            {isDeleting === 'submissions.txt' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Submissions
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderDialogContent = () => {
    const dialogProps = {
      questions: {
        title: "Create New Question",
        fileName: questionFileName,
        setFileName: setQuestionFileName,
        content: newQuestion,
        setContent: setNewQuestion,
        placeholder: "Enter MDX content...",
        fileNamePlaceholder: "e.g., TwoSum",
        labelContent: "MDX Content",
        type: "questions"
      },
      testcases: {
        title: "Create New Test Case",
        fileName: testCaseFileName,
        setFileName: setTestCaseFileName,
        content: newTestCase,
        setContent: setNewTestCase,
        placeholder: '{"cases": [{"input": "4\\n2 7 11 15\\n9", "output": "0 1"}]}',
        fileNamePlaceholder: "e.g., TwoSum",
        labelContent: "JSON Content",
        type: "testcases"
      },
      templates: {
        title: "Create New Template",
        fileName: templateFileName,
        setFileName: setTemplateFileName,
        content: newTemplate,
        setContent: setNewTemplate,
        placeholder: "Enter code...",
        fileNamePlaceholder: "e.g., TwoSum",
        labelContent: "Code",
        type: "templates"
      }
    };

    const currentProps = dialogProps[activeTab as keyof typeof dialogProps];

    return (
      <>
        <DialogHeader>
          <DialogTitle>{currentProps.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-sm font-medium col-span-4">
              File Name
              <Input
                value={currentProps.fileName}
                onChange={(e) => currentProps.setFileName(e.target.value)}
                placeholder={currentProps.fileNamePlaceholder}
                className="mt-1 bg-zinc-900 border-zinc-800"
              />
            </label>
          </div>
          
          {activeTab === 'templates' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium col-span-4">
                Language
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="mt-1 bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-sm font-medium col-span-4">
              {currentProps.labelContent}
              <Textarea
                value={currentProps.content}
                onChange={(e) => currentProps.setContent(e.target.value)}
                placeholder={currentProps.placeholder}
                className="mt-1 min-h-28 bg-zinc-900 border-zinc-800"
              />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={() => handleUpload(currentProps.type, currentProps.content, currentProps.fileName)}
            disabled={isUploading}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="border-b border-zinc-800 sticky top-0 z-10 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
        <div className="max-w-5xl mx-auto flex justify-between items-center h-14 px-4">
          <h1 className="text-xl font-bold flex items-center">
            <Moon className="h-5 w-5 mr-2 text-purple-400" />
            Admin Dashboard
          </h1>
          <Button variant="outline" onClick={logout} className="gap-2 border-zinc-800 hover:bg-zinc-900 text-zinc-300">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-6 px-4">
        <Button onClick={refreshSubmissions} className="mb-4">Refresh Leaderboard</Button>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList className="grid grid-cols-3 w-full max-w-md bg-zinc-900">
              <TabsTrigger value="questions" className="flex items-center data-[state=active]:bg-zinc-800">
                <FileText className="mr-2 h-4 w-4" />
                Questions
              </TabsTrigger>
              <TabsTrigger value="testcases" className="flex items-center data-[state=active]:bg-zinc-800">
                <TestTube className="mr-2 h-4 w-4" />
                Test Cases
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center data-[state=active]:bg-zinc-800">
                <Code className="mr-2 h-4 w-4" />
                Templates
              </TabsTrigger>
            </TabsList>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1 bg-purple-700 hover:bg-purple-600 text-white">
                  <Plus className="h-4 w-4" />
                  Add {activeTab === 'questions' ? 'Question' : activeTab === 'testcases' ? 'Test Case' : 'Template'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800">
                {renderDialogContent()}
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="questions" className="mt-0 border-none p-0">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-purple-400" />
                  Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[50vh] pr-4">
                  <FileList files={questions} type="questions" />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testcases" className="mt-0 border-none p-0">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TestTube className="h-5 w-5 text-purple-400" />
                  Test Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[50vh] pr-4">
                  <FileList files={testCases} type="testcases" />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-0 border-none p-0">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Code className="h-5 w-5 text-purple-400" />
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[50vh] pr-4">
                  <FileList files={templates} type="templates" />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dashboard />
      </main>

      <Toaster position="top-center" toastOptions={{
        style: {
          background: "#27272a",
          color: "#e4e4e7",
          border: "1px solid #3f3f46"
        },
      }} />
    </div>
  );
}