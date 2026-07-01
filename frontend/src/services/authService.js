import supabase from "../supabase/supabase";

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

export const loginUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
};

export const logoutUser = async () => {
  await supabase.auth.signOut();
};
