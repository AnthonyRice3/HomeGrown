import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
      {/* Brand */}
      <a href="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
          <span className="text-black font-black text-sm">HG</span>
        </div>
        <span className="font-bold text-white text-lg tracking-tight">
          Home<span className="text-amber-400">Grown</span>
        </span>
      </a>

      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
