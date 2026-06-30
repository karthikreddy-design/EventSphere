import supabase from "../supabase/supabase";

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

  if (error) throw error;

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
