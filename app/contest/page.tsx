"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import { ChevronRight, Code, CheckCircle } from "lucide-react";

interface FileInfo {
  name: string;
  path: string;
}

export default function Contest() {
  const [questions, setQuestions] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let session = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userSession="))
      ?.split("=")[1];
    const usedNames = new Set(JSON.parse(localStorage.getItem("usedNames") || "[]"));
    const tabSwitchCount = parseInt(localStorage.getItem(`tabSwitchCount_${session}`) || "0");

    if (!session) {
      let newSession: string;
      do {
        newSession = prompt("Please enter your name to join the contest (unique name required)") || "anonymous";
        if (usedNames.has(newSession)) {
          toast.error("This name is already taken. Please use a different name.");
          newSession = "";
        }
      } while (!newSession);
      
      session = newSession;
      usedNames.add(session);
      localStorage.setItem("usedNames", JSON.stringify(Array.from(usedNames)));
      document.cookie = `userSession=${session}; path=/; max-age=86400`; // 24-hour expiration
      toast.success(`Welcome, ${session}!`);
    } else if (tabSwitchCount > 5) {
      toast.error("You have exceeded the maximum number of tab switches. Please use a different name.");
      document.cookie = "userSession=; Max-Age=0; path=/";
      localStorage.removeItem(`tabSwitchCount_${session}`);
      router.push("/");
      return;
    } else if (!usedNames.has(session)) {
      toast.error("Session name mismatch. Please restart with a new name.");
      document.cookie = "userSession=; Max-Age=0; path=/";
      localStorage.removeItem("usedNames");
      router.push("/contest");
      return;
    }

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/files?type=questions");
        if (!res.ok) throw new Error("Failed to fetch questions");
        const data = await res.json();
        setQuestions(data.files || []);
      } catch (error) {
        toast.error("Failed to load questions");
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();

    // Load or initialize completed problems for this session
    if (session) {
      const completed = new Set(JSON.parse(localStorage.getItem(`completed_${session}`) || "[]"));
      localStorage.setItem(`completed_${session}`, JSON.stringify(Array.from(completed)));
    }
  }, [router]);

  const handleNavigate = (id: string) => {
    const problemId = id.replace(".mdx", "");
    router.push(`/problem/${problemId}`);
  };

  const getDescription = (name: string) => {
    const problemId = name.replace(".mdx", "");
    const descriptions: Record<string, string> = {};
    if (descriptions[problemId]) return descriptions[problemId];
    return "Solve this coding challenge to test your skills";
  };

  const isCompleted = (problemId: string) => {
    const session = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userSession="))
      ?.split("=")[1];
    if (!session) return false;
    return new Set(JSON.parse(localStorage.getItem(`completed_${session}`) || "[]")).has(problemId);
  };

  return (
    <div className="min-h-screen bg-[#09090b]">
      <header className="border-b border-gray-800 bg-[#1a1a1a] p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Code className="mr-2 h-6 w-6 text-blue-500" />
            CodeArena
          </h1>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Contest Problems</h2>
          <p className="text-gray-400">
            Solve these problems to improve your coding skills and earn points
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : questions.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Code className="h-12 w-12 text-gray-500 mb-4" />
              <p className="text-gray-400 text-center">
                No problems available right now.
              </p>
              <p className="text-gray-500 text-sm text-center mt-2">
                Check back later for challenges
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {questions.map((question) => {
              const problemId = question.name.replace(".mdx", "");
              const completed = isCompleted(problemId);

              return (
                <Card
                  key={question.name}
                  className={`bg-[#1a1a1a] border-gray-800 hover:border-gray-700 transition-all ${
                    completed ? "bg-gradient-to-r from-green-900/50 to-green-900/20" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl text-white">
                        {problemId}
                      </CardTitle>
                      {completed && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <CardDescription className="text-gray-400">
                      {getDescription(question.name)}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0">
                    <Button
                      onClick={() => handleNavigate(question.name)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                    >
                      Solve Problem
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Toaster position="top-right" />
    </div>
  );
}