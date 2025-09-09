"use client";

import { useApiAce } from "@/hooks/use-api-ace";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, LogOut } from "lucide-react";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { useState } from "react";
import { Separator } from "../ui/separator";

export function AuthDialog() {
  const { state, logout } = useApiAce();
  const [isOpen, setIsOpen] = useState(false);

  if (state.user) {
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 text-sm truncate">
            <User className="h-4 w-4" />
            <span className="truncate">{state.user.email}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <User className="mr-2 h-4 w-4" />
          Login / Register
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>
            Login or create an account to save and sync your collections across devices.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm onLogin={() => setIsOpen(false)} />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm onRegister={() => setIsOpen(false)} />
          </TabsContent>
        </Tabs>
        <Separator className="my-2" />
         <Button variant="link" onClick={() => setIsOpen(false)}>
            Continue as Guest
          </Button>
      </DialogContent>
    </Dialog>
  );
}
