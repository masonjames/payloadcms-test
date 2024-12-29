import type { CollectionConfig } from 'payload'

type Role = 'administrator' | 'editor' | 'author' | 'subscriber'

// Define access control functions based on user roles
const isAdministrator = ({ req: { user } }) => {
  if (!user) return false
  return user.role === 'administrator'
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
    defaultColumns: ['name', 'email', 'role', 'status'],
    useAsTitle: 'name',
    description: '',
    group: 'Admin',
    // Hide the Users collection from subscribers in the sidebar
    hidden: ({ user }) => {
      if (!user) return true
      return user.role === 'subscriber'
    },
  },
  fields: [
    // Required fields - always visible
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      admin: {
        description: 'Email address (used for login)',
      },
    },
    // Optional fields in tabs
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Profile',
          fields: [
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
              name: 'description',
              type: 'textarea',
              admin: {
                description: 'Biographical info',
              },
            },
          ],
        },
        {
          label: 'Preferences',
          fields: [
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
        },
      ],
    },
    // Sidebar fields
    {
      name: 'status',
      type: 'radio',
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
        description: 'User status',
      },
    },
    // Role field
    {
      name: 'role',
      type: 'radio',
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
  ],
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        // Set nickname to name if not provided
        if (!data.nickname && data.name) {
          data.nickname = data.name
        }

        // Set role to administrator for first user
        if (operation === 'create') {
          const { payload } = req
          return payload
            .find({
              collection: 'users',
              limit: 1,
            })
            .then(({ docs }) => {
              if (docs.length === 0) {
                data.role = 'administrator'
              }
              return data
            })
        }

        return data
      },
    ],
  },
}
