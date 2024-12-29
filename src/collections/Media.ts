import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Define role-based access control functions
const canManageMedia = ({ req: { user } }): boolean => {
  if (!user) return false
  return ['administrator', 'editor', 'author'].includes(user.role || '')
}

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    // Only administrators, editors, and authors can create media
    create: canManageMedia,
    // Only administrators and editors can delete media
    delete: ({ req: { user } }): boolean => {
      if (!user) return false
      return ['administrator', 'editor'].includes(user.role || '')
    },
    // Anyone can read media
    read: anyone,
    // Only administrators, editors, and authors can update media
    update: canManageMedia,
  },
  admin: {
    description: 'Upload and manage media files with WordPress-like permissions',
    group: 'Content',
    hidden: ({ user }) => user?.role === 'subscriber',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: false,
      admin: {
        description: 'Alternative text for accessibility (recommended)',
      },
      hooks: {
        beforeChange: [
          ({ value, operation }) => {
            if (operation === 'create' && !value) {
              return 'Image'
            }
            return value
          },
        ],
      },
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.alt) {
          return {
            ...data,
            alt: 'Image',
          }
        }
        return data
      },
    ],
  },
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
}
