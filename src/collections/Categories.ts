import type { CollectionConfig, PayloadRequest } from 'payload'
import { anyone } from '../access/anyone'

type Role = 'administrator' | 'editor' | 'author' | 'contributor' | 'subscriber'

// Define role-based access control
const canManageCategories = ({ req: { user } }: { req: PayloadRequest }): boolean => {
  if (!user) return false
  return ['administrator', 'editor'].includes((user.role as Role) || '')
}

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    // Only administrators and editors can create categories
    create: canManageCategories,
    // Only administrators and editors can delete categories
    delete: canManageCategories,
    // Anyone can read categories
    read: anyone,
    // Only administrators and editors can update categories
    update: canManageCategories,
  },
  admin: {
    useAsTitle: 'title',
    description: 'Categories can only be managed by administrators and editors.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional description for the category',
      },
    },
  ],
}
