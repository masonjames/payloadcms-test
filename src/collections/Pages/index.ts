import type { CollectionConfig, Where } from 'payload'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { Archive } from '../../blocks/ArchiveBlock/config'
import { CallToAction } from '../../blocks/CallToAction/config'
import { Content } from '../../blocks/Content/config'
import { FormBlock } from '../../blocks/Form/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { hero } from '@/heros/config'
import { slugField } from '@/fields/slug'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

// Define role-based access control functions
const canAccessAdmin = ({ req: { user } }): boolean => {
  return Boolean(user) // All authenticated users can view pages in admin
}

const canCreate = ({ req: { user } }): boolean => {
  if (!user) return false
  return ['administrator', 'editor'].includes(user.role || '')
}

const canUpdate = ({ req: { user } }): boolean | Where => {
  if (!user) return false

  // Administrators and editors can update any page
  if (['administrator', 'editor'].includes(user.role || '')) return true

  // Authors can only update their own pages
  if (user.role === 'author') {
    return {
      createdBy: {
        equals: user.id,
      },
    }
  }

  return false
}

const canDelete = ({ req: { user } }): boolean => {
  if (!user) return false

  // Only administrators and editors can delete pages
  return ['administrator', 'editor'].includes(user.role || '')
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt', '_status'],
    description: 'Create and manage pages with WordPress-like permissions',
    group: 'Content',
    useAsTitle: 'title',
    hidden: ({ user }) => user?.role === 'subscriber',
    preview: (doc, { req }) =>
      generatePreviewPath({
        slug: typeof doc?.slug === 'string' ? doc.slug : '',
        collection: 'pages',
        req,
      }),
  },
  access: {
    admin: canAccessAdmin,
    create: canCreate,
    delete: canDelete,
    read: authenticatedOrPublished,
    update: canUpdate,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [hero],
        },
        {
          label: 'Content',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock, Archive, FormBlock],
              required: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    ...slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt],
    beforeDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
    },
    maxPerDoc: 50,
  },
}
