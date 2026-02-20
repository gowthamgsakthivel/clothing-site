import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';

const buildAuthError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const getRoleContext = async () => {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    throw buildAuthError(401, 'Authentication required');
  }

  let rawRole = sessionClaims?.publicMetadata?.role;
  if (!rawRole) {
    const user = await currentUser();
    rawRole = user?.publicMetadata?.role;
  }
  if (!rawRole) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    rawRole = user?.publicMetadata?.role;
  }
  const role = rawRole === 'customer' ? 'user' : (rawRole || 'user');
  return { userId, role };
};

const requireRole = async (allowedRoles) => {
  const context = await getRoleContext();
  if (!allowedRoles.includes(context.role)) {
    throw buildAuthError(403, 'Access denied');
  }
  return context;
};

export const requireAdmin = async () => {
  return requireRole(['admin']);
};

export const requireUser = async ({ allowAdmin = false } = {}) => {
  const roles = ['user'];
  if (allowAdmin) roles.push('admin');
  return requireRole(roles);
};
