interface AccessTokenPayload {
  name: string | null;
  id: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  dateOfBirth: Date | null;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RefreshTokenPayload {
  id: string;
  createdAt: Date;
}
