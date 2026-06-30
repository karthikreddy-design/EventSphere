import supabase from "../supabase/supabase";
import { getAuthEmailRedirectUrl } from "../utils/siteUrl";

const isExistingConfirmedUser = (data) =>
  Boolean(
    data?.user &&
      Array.isArray(data.user.identities) &&
      data.user.identities.length === 0
  );

export const registerUser = async (
  name,
  email,
  password,
  role = "participant"
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
      emailRedirectTo: getAuthEmailRedirectUrl(),
    },
  });

  if (error) {
    const message = error.message?.toLowerCase() || "";

    if (message.includes("already registered")) {
      throw new Error("This email is already registered. Please log in instead.");
    }

    throw error;
  }

  if (isExistingConfirmedUser(data)) {
    throw new Error("This email is already registered. Please log in instead.");
  }

  return data;
};

export const verifySignupOtp = async (email, token) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });

  if (error) throw error;

  return data;
};

export const resendSignupOtp = async (email) => {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: getAuthEmailRedirectUrl(),
    },
  });

  if (error) throw error;
};

export const loginUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const message = error.message?.toLowerCase() || "";

    if (message.includes("email not confirmed")) {
      throw new Error(
        "Please verify your email with the OTP sent during registration before logging in."
      );
    }

    throw error;
  }

  return data;
};

export const logoutUser = async () => {
  await supabase.auth.signOut();
};
