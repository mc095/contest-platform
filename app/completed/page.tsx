"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Completed() {
  const router = useRouter();

  const handleExit = () => {
    document.cookie = "userSession=; Max-Age=0; path=/";
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
      <div className="text-center p-6 bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-4">Congratulations!</h1>
        <p className="text-lg mb-6">
          You have successfully completed all the problems. You can now exit the
          browser or start a new session.
        </p>
        <Button
          onClick={handleExit}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Exit
        </Button>
      </div>
    </div>
  );
}