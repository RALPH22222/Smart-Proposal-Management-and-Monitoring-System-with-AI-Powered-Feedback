import axios from "axios";

// Reuse the same API base URL used by auth services
const API_URL = "http://127.0.0.1:8000";

export type UserProfile = {
  id: number | string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  notificationsEnabled?: boolean;
};

// Fetch current user profile
export const getMyProfile = async () => {
  const res = await axios.get(`${API_URL}/users/me/`);
  return res.data as UserProfile;
};

// Update display name
export const updateMyName = async (name: string) => {
  const res = await axios.patch(`${API_URL}/users/me/`, { name });
  return res.data as UserProfile;
};

// Update email
export const updateMyEmail = async (email: string, currentPassword?: string) => {
  const res = await axios.post(`${API_URL}/users/me/change-email/`, { email, current_password: currentPassword });
  return res.data as { message: string };
};

// Change password
export const changeMyPassword = async (currentPassword: string, newPassword: string) => {
  const res = await axios.post(`${API_URL}/users/me/change-password/`, {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return res.data as { message: string };
};

// Update avatar/profile picture
export const updateMyAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await axios.post(`${API_URL}/users/me/avatar/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data as { avatarUrl: string };
};

// Toggle notifications
export const setMyNotifications = async (enabled: boolean) => {
  const res = await axios.post(`${API_URL}/users/me/notifications/`, { enabled });
  return res.data as { enabled: boolean };
};
