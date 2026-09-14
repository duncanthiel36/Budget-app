"use client";

import { useAuth } from "../lib/AuthProvider";
import SignIn from "../components/SignIn";
import BudgetApp from "../components/BudgetApp";

export default function Page() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-400 text-sm">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <SignIn />;
  }

  return <BudgetApp />;
}
