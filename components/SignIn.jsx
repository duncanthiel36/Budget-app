"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../lib/firebase";

export default function SignIn() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email || !password) {
      setError("Enter an email and password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setError("");
    setInfo("");
    if (!email) {
      setError("Enter your email above, then tap reset.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Password reset email sent.");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-2xl text-stone-800 mb-1 text-center">Monthly Budget</h1>
        <p className="text-sm text-stone-400 text-center mb-6">
          {mode === "signin" ? "Sign in to your account" : "Create an account"}
        </p>
        <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          {info && <p className="text-xs text-emerald-600">{info}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-stone-800 text-white rounded-xl py-2 text-sm font-medium disabled:opacity-60"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <div className="flex items-center justify-between mt-4 text-xs text-stone-400">
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
          {mode === "signin" && <button onClick={handleReset}>Forgot password?</button>}
        </div>
      </div>
    </div>
  );
}
