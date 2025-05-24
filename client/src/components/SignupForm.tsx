import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupUser } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const { signup } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupUser>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupUser) => {
    setIsLoading(true);
    try {
      await signup.mutateAsync(data);
      toast({
        title: "Account created successfully!",
        description: "Please sign in to continue",
      });
      onSwitchToLogin();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "An error occurred during signup",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-gradient-to-br from-[#075E54] to-[#128C7E]">
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <UserPlus className="text-[#075E54] w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Join Schat</h1>
        <p className="text-green-100">Create your account to get started</p>
      </div>

      <Card className="bg-white/10 backdrop-blur-sm border-0">
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                className="bg-white/90 border-0 focus:ring-2 focus:ring-[#25D366]"
                {...form.register("username")}
              />
              {form.formState.errors.username && (
                <p className="text-red-200 text-sm">{form.formState.errors.username.message}</p>
              )}
            </div>

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
                placeholder="Choose a password"
                className="bg-white/90 border-0 focus:ring-2 focus:ring-[#25D366]"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-red-200 text-sm">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                className="bg-white/90 border-0 focus:ring-2 focus:ring-[#25D366]"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-red-200 text-sm">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#25D366] hover:bg-[#20c55e] text-white py-4 text-lg font-semibold"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="text-center mt-6">
            <span className="text-green-100">Already have an account? </span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-white font-semibold underline hover:text-green-100 transition-colors"
            >
              Sign In
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
