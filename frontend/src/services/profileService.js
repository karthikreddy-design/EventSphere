import supabase from "../supabase/supabase";

const BUCKET = "profile-images";

const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("You must be logged in");

  return user;
};

export const getProfile = async () => {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, phone, department, profile_image, created_at")
    .eq("id", user.id)
    .single();

  if (error) throw error;

  return {
    ...data,
    email: data.email || user.email,
  };
};

export const uploadProfileImage = async (file) => {
  const user = await getCurrentUser();

  const extension = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  return publicUrl;
};

export const updateProfile = async (profileData) => {
  const user = await getCurrentUser();

  const payload = {
    name: profileData.name?.trim(),
    phone: profileData.phone?.trim() || null,
    department: profileData.department?.trim() || null,
  };

  if (profileData.profile_image !== undefined) {
    payload.profile_image = profileData.profile_image;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select("id, name, email, role, phone, department, profile_image, created_at")
    .single();

  if (error) throw error;

  return {
    ...data,
    email: data.email || user.email,
  };
};

export const changePassword = async (newPassword) => {
  await getCurrentUser();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
};
