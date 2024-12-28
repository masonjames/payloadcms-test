import type { CollectionConfig } from 'payload'

type Role = 'administrator' | 'editor' | 'author' | 'subscriber'

// Define access control functions based on user roles
const isAdministrator = ({ req: { user } }) => {
  if (!user) return false
  return user.role === 'administrator' || user.roleSelect === 'administrator'
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
      if (user.role === 'administrator' || user.roleSelect === 'administrator') return true
      return {
        id: {
          equals: user.id,
        },
      }
    },
    // Users can update their own profile, admins can update all
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'administrator' || user.roleSelect === 'administrator') return true
      return {
        id: {
          equals: user.id,
        },
      }
    },
  },
  admin: {
    defaultColumns: ['name', 'email', 'roleSelect', 'nickname', 'status'],
    useAsTitle: 'name',
    description: 'Users with WordPress-like role-based permissions and metadata',
    group: 'Admin',
    // Hide the Users collection from subscribers in the sidebar
    hidden: ({ user }) => {
      if (!user) return true
      return user.role === 'subscriber' || user.roleSelect === 'subscriber'
    },
  },
  fields: [
    // Basic user fields (wp_users equivalent)
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name (maps to display_name in WordPress)',
      },
    },
    {
      name: 'firstName',
      type: 'text',
      admin: {
        description: 'First name',
      },
    },
    {
      name: 'lastName',
      type: 'text',
      admin: {
        description: 'Last name',
      },
    },
    {
      name: 'nickname',
      type: 'text',
      admin: {
        description: 'Nickname (required in WordPress)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Biographical info',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Spam',
          value: 'spam',
        },
        {
          label: 'Deleted',
          value: 'deleted',
        },
      ],
      admin: {
        position: 'sidebar',
        description: 'User status (similar to WordPress user_status)',
      },
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description: 'Website URL',
      },
    },
    {
      name: 'locale',
      type: 'text',
      defaultValue: 'en_US',
      admin: {
        description: 'User language preference',
      },
    },
    // Role fields
    {
      name: 'roleSelect',
      type: 'select',
      required: true,
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
        update: isAdministrator,
        read: isAdministrator,
      },
      admin: {
        position: 'sidebar',
        description: 'The role determines what actions the user can perform',
      },
    },
    {
      name: 'role',
      type: 'text',
      required: true,
      defaultValue: 'subscriber',
      validate: (val) => {
        const validRoles = ['administrator', 'editor', 'author', 'subscriber']
        return validRoles.includes(val) || 'Invalid role'
      },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            return siblingData?.roleSelect || 'subscriber'
          },
        ],
      },
      admin: {
        position: 'sidebar',
        description: 'The role determines what actions the user can perform',
        style: {
          display: 'none',
        },
      },
    },
    // Authentication fields
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      admin: {
        description: 'Email address (used for login)',
      },
    },
    // Essential WordPress metadata fields
    {
      name: 'meta',
      type: 'group',
      admin: {
        description: 'Essential WordPress user metadata',
      },
      fields: [
        {
          name: 'capabilities',
          type: 'json',
          admin: {
            description: 'WordPress capabilities (wp_capabilities)',
          },
        },
        {
          name: 'syntaxHighlighting',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Syntax Highlighting enabled',
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Set nickname to name if not provided
        if (!data.nickname && data.name) {
          data.nickname = data.name
        }
        return data
      },
    ],
  },
  timestamps: true,
}
