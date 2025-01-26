// Define a type for a single authorization field
type AuthorizationField = {
  name: string;
  type: string;
};

// Define a type for the authorization structure
type AuthorizationType = {
  Authorization: AuthorizationField[];
};

// Example usage of the type
export const authorizationTypes: AuthorizationType = {
  Authorization: [
    { name: 'authorizer', type: 'address' },
    { name: 'authorized', type: 'address' },
    { name: 'isAuthorized', type: 'bool' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};
