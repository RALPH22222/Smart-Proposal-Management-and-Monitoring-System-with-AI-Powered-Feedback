export type User = {
  id: string;
  first_name: string;
  middle_ini?: string;
  last_name: string;
  email: string;
  roles: string[];
  is_disabled: boolean;
  department_id?: number;
  department_name?: string;
  photo_profile_url?: string;
  profile_completed?: boolean;
};
