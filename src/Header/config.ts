import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

// Define access control function
const canAccessHeader = ({ req: { user } }) => {
  if (!user) return false
  return ['administrator', 'editor'].includes(user.role || '')
}

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true, // Anyone can read the header
    update: canAccessHeader, // Only admins and editors can update
  },
  admin: {
    description: 'Header navigation configuration',
    group: 'Content',
    hidden: ({ user }) => user?.role === 'subscriber',
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
