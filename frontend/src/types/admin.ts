export type User = {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  role: string;
  status: "Active" | "Inactive" | "Blocked";
  agency?: string;
  specialties?: string[];
};