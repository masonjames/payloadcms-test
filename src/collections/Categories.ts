import type { CollectionConfig } from 'payload'
import { anyone } from '../access/anyone'

// Import access control functions
const isEditor = ({ req: { user } }) => {
  return ['administrator', 'editor'].includes(user?.role || '')
}

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    // Only editors and administrators can create categories
    create: isEditor,
    // Only editors and administrators can delete categories
    delete: isEditor,
    // Anyone can read categories
    read: anyone,
    // Only editors and administrators can update categories
    update: isEditor,
  },
  admin: {
    useAsTitle: 'title',
    description: 'Categories can be managed by editors and administrators',
    group: 'Content',
    hidden: ({ user }) => user?.role === 'subscriber',
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
