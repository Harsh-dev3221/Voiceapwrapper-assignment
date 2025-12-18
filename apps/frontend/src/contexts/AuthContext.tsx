import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useMutation, gql } from '@apollo/client';
import client from '../lib/apolloClient';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface Membership {
  role: string;
  organization: Organization;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  currentOrg: Organization | null;
  membership: Membership | null;
  isOwner: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setCurrentOrg: (org: Organization) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  address?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_AUTH = gql`
  mutation TokenAuth($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
      token
    }
  }
`;

const REGISTER_OWNER = gql`
  mutation RegisterOwner(
    $email: String!,
    $password: String!,
    $firstName: String!,
    $lastName: String!,
    $businessName: String!,
    $address: String
  ) {
    registerOwner(
      email: $email,
      password: $password,
      firstName: $firstName,
      lastName: $lastName,
      businessName: $businessName,
      address: $address
    ) {
      user { id email username firstName lastName }
      organization { id name slug }
      token
    }
  }
`;

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      username
      firstName
      lastName
    }
    myOrganizations {
      id
      name
      slug
    }
  }
`;

const MY_MEMBERSHIP = gql`
  query MyMembership($organizationId: Int!) {
    myMembership(organizationId: $organizationId) {
      role
    }
  }
`;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  const [tokenAuthMutation] = useMutation(TOKEN_AUTH);
  const [registerMutation] = useMutation(REGISTER_OWNER);

  // Fetch user data when token exists
  useEffect(() => {
    if (token) {
      client.query({ query: ME_QUERY, fetchPolicy: 'network-only' })
        .then(({ data }) => {
          if (data.me) {
            setUser(data.me);
            if (data.myOrganizations?.length > 0) {
              const savedOrgId = localStorage.getItem('currentOrgId');
              const org = data.myOrganizations.find((o: Organization) => o.id === savedOrgId) || data.myOrganizations[0];
              setCurrentOrg(org);
            }
          } else {
            // Token invalid
            logout();
          }
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  // Fetch membership when org changes
  useEffect(() => {
    if (currentOrg && token) {
      client.query({
        query: MY_MEMBERSHIP,
        variables: { organizationId: parseInt(currentOrg.id) },
        fetchPolicy: 'network-only'
      })
        .then(({ data }) => {
          if (data.myMembership) {
            setMembership({ role: data.myMembership.role, organization: currentOrg });
          }
        })
        .catch(console.error);
    }
  }, [currentOrg, token]);

  const login = async (email: string, password: string) => {
    const { data } = await tokenAuthMutation({ variables: { username: email, password } });
    const newToken = data.tokenAuth.token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const register = async (registerData: RegisterData) => {
    const { data } = await registerMutation({ variables: registerData });
    const newToken = data.registerOwner.token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(data.registerOwner.user);
    setCurrentOrg(data.registerOwner.organization);
    setMembership({ role: 'OWNER', organization: data.registerOwner.organization });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentOrgId');
    setToken(null);
    setUser(null);
    setCurrentOrg(null);
    setMembership(null);
    client.clearStore();
  };

  const handleSetCurrentOrg = (org: Organization) => {
    setCurrentOrg(org);
    localStorage.setItem('currentOrgId', org.id);
  };

  const isOwner = membership?.role === 'OWNER';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      currentOrg,
      membership,
      isOwner,
      loading,
      login,
      register,
      logout,
      setCurrentOrg: handleSetCurrentOrg
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
