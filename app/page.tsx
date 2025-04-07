"use client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (name) {
      document.cookie = `userSession=${encodeURIComponent(name)}; path=/`; // Simple session
      router.push('/contest');
    } else {
      alert('Please enter your name');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gray-800 bg-[#1a1a1a] shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center text-white">CodeArena</CardTitle>
          <CardDescription className="text-center text-gray-400">Enter your name to join the contest</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-200">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="bg-[#2a2a2a] border-gray-700 text-white focus:border-blue-600 focus:ring-blue-600"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Join Contest
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-gray-800 pt-4">
          <p className="text-sm text-gray-400">Solve challenging problems and improve your coding skills</p>
        </CardFooter>
      </Card>
    </div>
  );
}