'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Toaster, toast } from 'sonner';
import { Lock, User, ShieldAlert } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('isAdmin', 'true');
        toast.success('Login successful!');
        router.push('/admin');
      } else {
        toast.error('Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-4">
      <Toaster position="top-center" richColors />
      
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
            <ShieldAlert size={28} />
          </div>
        </div>
        
        <Card className="border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-2xl font-bold text-white text-center">Admin Portal</CardTitle>
            <CardDescription className="text-zinc-400 text-center">
              Secure administrator access only
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-zinc-300 text-sm font-medium">Username</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-zinc-500">
                    <User size={16} />
                  </span>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-blue-600 focus-visible:ring-offset-zinc-900"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300 text-sm font-medium">Password</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-zinc-500">
                    <Lock size={16} />
                  </span>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-blue-600 focus-visible:ring-offset-zinc-900"
                    required
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4 pt-2 pb-6">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium" 
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Sign In'}
              </Button>
              
              <div className="flex items-center justify-center w-full">
                <div className="h-px w-full bg-zinc-800"></div>
                <span className="px-2 text-xs text-zinc-500 whitespace-nowrap">PROTECTED AREA</span>
                <div className="h-px w-full bg-zinc-800"></div>
              </div>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-xs text-zinc-600 text-center mt-4">
          This system is monitored. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}