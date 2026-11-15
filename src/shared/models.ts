export interface Author {
  email: string;
  name: string;
  surname: string;
  organization: string;
  country: string;
}

export interface Profile {
  id: string;
  name: string;
  authors: Author[];
}

export interface AppSettings {
  schemaVersion: 2;
  activeProfileId: string;
}

export interface ProfileState extends AppSettings {
  profiles: Profile[];
}

export interface AutoFillRequest {
  action: 'autoFillAuthors';
  profile?: string;
}

export interface ValidationIssue {
  authorIndex: number;
  field: keyof Author;
  message: string;
}
