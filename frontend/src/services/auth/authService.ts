import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const sendOtp = (email: string) => {
  return axios.post(`${API_URL}/send-otp/`, { email });
};

export const verifyOtp = (email: string, otp: string) => {
  return axios.post(`${API_URL}/verify-otp/`, { email, otp });
};
