import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginUser } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginUser>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginUser) => {
    setIsLoading(true);
    try {
      await login.mutateAsync(data);
      toast({
        title: "Login successful!",
        description: "Welcome back to Schat",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "An error occurred during login",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-gradient-to-br from-[#075E54] to-[#128C7E]">
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <MessageCircle className="text-[#075E54] w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Schat</h1>
        <p className="text-green-100">Connect with friends instantly</p>
      </div>

      <Card className="bg-white/10 backdrop-blur-sm border-0">
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="bg-white/90 border-0 focus:ring-2 focus:ring-[#25D366]"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-red-200 text-sm">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="bg-white/90 border-0 focus:ring-2 focus:ring-[#25D366]"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-red-200 text-sm">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#25D366] hover:bg-[#20c55e] text-white py-4 text-lg font-semibold"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center mt-6">
            <span className="text-green-100">Don't have an account? </span>
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-white font-semibold underline hover:text-green-100 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
