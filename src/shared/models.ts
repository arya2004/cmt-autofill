// Preserve the existing stored field names until the versioned schema in item 2.
export interface Author {
  email: string;
  name: string;
  surname: string;
  organization: string;
  country: string;
}

export interface AutoFillRequest {
  action: 'autoFillAuthors';
  profile?: string;
}
