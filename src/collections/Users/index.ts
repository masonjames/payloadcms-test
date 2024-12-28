import type { CollectionConfig } from 'payload'

type Role = 'administrator' | 'editor' | 'author' | 'contributor' | 'subscriber'

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
    // Only administrators can access admin UI
    admin: isAdministrator,
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
    description: 'Users with role-based permissions',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
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
          label: 'Contributor',
          value: 'contributor',
        },
        {
          label: 'Subscriber',
          value: 'subscriber',
        },
      ],
      access: {
        // Only administrators can change roles
        update: isAdministrator,
      },
      admin: {
        position: 'sidebar',
        description: 'The role determines what actions the user can perform',
      },
    },
  ],
  timestamps: true,
}
