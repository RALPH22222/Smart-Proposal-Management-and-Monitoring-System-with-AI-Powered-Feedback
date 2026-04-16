import { api } from "../../utils/axios";

export type UserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_ini?: string;
  birth_date?: string;
  sex?: 'Male' | 'Female' | 'Prefer not to say' | '';
  department_id?: string;
  name?: string; // computed name if needed
  avatarUrl?: string | null;
  photo_profile_url?: string | null; // backend name
  departments?: { name: string };
};

// Fetch current user profile
export const getMyProfile = async () => {
  const res = await api.get<{ data?: UserProfile }>('/profile/me');
  // Handle backend wrapping
  const profile: any = res.data?.data || res.data;
  if (!profile) throw new Error("Profile not found");

  // Format data for legacy frontend expectations
  return {
    ...profile,
    name: [profile.first_name, profile.middle_ini, profile.last_name].filter(Boolean).join(" "),
    avatarUrl: profile.photo_profile_url,
    firstName: profile.first_name,
    lastName: profile.last_name,
    middleInitial: profile.middle_ini,
    birthdate: profile.birth_date,
    sex: profile.sex,
    department: profile.departments?.name, // extracted for UI
  };
};

export const updateMyProfile = async (data: Record<string, any>) => {
  // Map frontend fields back to backend names if needed
  const backendPayload = {
    first_name: data.firstName || data.first_name,
    last_name: data.lastName || data.last_name,
    middle_ini: data.middleInitial !== undefined ? data.middleInitial : data.middle_ini,
    birth_date: data.birthdate !== undefined ? data.birthdate : data.birth_date,
    sex: data.sex,
    department_id: data.department_id,
  };
  
  const res = await api.patch('/profile/me', backendPayload);
  return res.data;
};

// Backwards compatibility wrapper for older settings page code
export const updateMyName = async (_name: string) => {
  throw new Error("Use updateMyProfile instead");
};

// Update email
export const updateMyEmail = async (email: string) => {
  const res = await api.post<{ message?: string }>('/profile/me/change-email', { email });
  return res.data;
};

// Change password
export const changeMyPassword = async (currentPassword: string, newPassword: string) => {
  const res = await api.post<{ success?: boolean }>('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return res.data;
};

// Update avatar/profile picture
export const updateMyAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await api.post<{ avatarUrl: string }>('/profile/me/avatar', formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
