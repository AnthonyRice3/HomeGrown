import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sagahRegisterUser, sagahGetUserByEmail } from "@/lib/sagah";

const BCRYPT_ROUNDS = 12;

// Password policy: min 8 chars, at least one letter and one number
function isStrongPassword(pw: string): boolean {
  return pw.length >= 8 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { mode, email, name, password } = body as {
    mode?: string;
    email?: string;
    name?: string;
    password?: string;
  };

  // ── Input validation ────────────────────────────────────────────────────────
  if (!["signup", "signin"].includes(mode ?? "")) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // ── Sign-Up ─────────────────────────────────────────────────────────────────
  if (mode === "signup") {
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!isStrongPassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters and contain a letter and a number." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await sagahRegisterUser({
      email: normalizedEmail,
      name: name.trim(),
      metadata: { source: "homegrown_fitness", passwordHash },
    });

    if (!result?.userId) {
      return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 502 });
    }

    // If the user already existed (isNew: false), they must sign in instead
    if (result.isNew === false) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      userId: result.userId,
      name: name.trim(),
      email: normalizedEmail,
    });
  }

  // ── Sign-In ─────────────────────────────────────────────────────────────────
  const user = await sagahGetUserByEmail(normalizedEmail);

  if (!user) {
    // Use a generic message to avoid user-enumeration attacks
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const storedHash = user.metadata?.passwordHash;
  if (!storedHash || typeof storedHash !== "string") {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const passwordMatch = await bcrypt.compare(password, storedHash);
  if (!passwordMatch) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  return NextResponse.json({
    userId: user.userId,
    name: user.name,
    email: user.email,
  });
}

