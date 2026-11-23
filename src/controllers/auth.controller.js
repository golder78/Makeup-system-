import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
import { parseFields } from "../utils/helpers.js";
import { errorHandler } from "../middleware/error-handler.js";

const loginFields = {
  email: (v) => typeof v === "string" && v.trim() !== "",
  password: (v) => typeof v === "string" && v.length > 0,
};

export async function login(req, res, next) {
  const result = parseFields(req.body, loginFields, {
    required: ["email", "password"],
  });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const { email, password } = result.data;
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    // Always compare to avoid user-enumeration timing differences.
    const hash =
      user?.passwordHash ??
      "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
    const ok = await bcrypt.compare(password, hash);

    if (!user || !ok) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // must match JWT_EXPIRES_IN
      path: "/",
    });

    res.json({ id: user.id, email: user.email });
  } catch (error) {
    errorHandler(error, res, next);
  }
}

export async function logout(req, res) {
  res.clearCookie("token", { path: "/" });
  res.status(204).end();
}

export function me(req, res) {
  res.json({ id: req.user.sub, email: req.user.email });
}
