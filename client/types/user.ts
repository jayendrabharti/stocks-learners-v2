interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  dateOfBirth: Date | null;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}
