import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

// Define access control function
const canAccessFooter = ({ req: { user } }) => {
  if (!user) return false
  return ['administrator', 'editor'].includes(user.role || '')
}

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true, // Anyone can read the footer
    update: canAccessFooter, // Only admins and editors can update
  },
  admin: {
    description: 'Footer navigation configuration',
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
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
