import type { CollectionConfig } from 'payload'

type Role = 'administrator' | 'editor' | 'author' | 'subscriber'

// Define access control functions based on user roles
const isAdministrator = ({ req: { user } }) => {
  return user?.role === 'administrator'
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 7200, // 2 hours
    verify: false,
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // lock time in ms (10 minutes)
    useAPIKey: false,
    depth: 0,
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      domain: process.env.COOKIE_DOMAIN,
    },
  },
  access: {
    // Allow all authenticated users to access admin UI
    admin: ({ req: { user } }) => {
      return Boolean(user)
    },
    // Only administrators can create new users
    create: isAdministrator,
    // Only administrators can delete users
    delete: isAdministrator,
    // Users can read their own profile, admins can read all
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'administrator') return true
      return {
        id: {
          equals: user.id,
        },
      }
    },
    // Users can update their own profile, admins can update all
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'administrator') return true
      return {
        id: {
          equals: user.id,
        },
      }
    },
  },
  admin: {
    defaultColumns: ['name', 'email', 'role'],
    useAsTitle: 'name',
    description: 'Users with WordPress-like role-based permissions',
    group: 'Admin',
    // Hide the Users collection from subscribers in the sidebar
    hidden: ({ user }) => user?.role === 'subscriber',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Your display name',
      },
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'subscriber',
      options: [
        {
          label: 'Administrator',
          value: 'administrator',
        },
        {
          label: 'Editor',
          value: 'editor',
        },
        {
          label: 'Author',
          value: 'author',
        },
        {
          label: 'Subscriber',
          value: 'subscriber',
        },
      ],
      access: {
        // Only administrators can change roles
        update: isAdministrator,
        // Only show role field to administrators
        read: isAdministrator,
      },
      admin: {
        position: 'sidebar',
        description: 'The role determines what actions the user can perform',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      admin: {
        description: 'Your email address (used for login)',
      },
    },
  ],
  timestamps: true,
}
