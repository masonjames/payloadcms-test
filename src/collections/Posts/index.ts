import type { CollectionConfig, Access, Where } from 'payload'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { populateAuthors } from './hooks/populateAuthors'
import { revalidateDelete, revalidatePost } from './hooks/revalidatePost'
import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from '@/fields/slug'

// Define role-based access control functions
const canAccessAdmin = ({ req: { user } }): boolean => {
  return Boolean(user) // All authenticated users can view posts in admin
}

const canCreate = ({ req: { user } }): boolean => {
  if (!user) return false
  return ['administrator', 'editor', 'author'].includes(user.role || '')
}

const canUpdate = ({ req: { user } }): boolean | Where => {
  if (!user) return false

  // Administrators and editors can update any post
  if (['administrator', 'editor'].includes(user.role || '')) return true

  // Authors can only update their own posts
  if (user.role === 'author') {
    const where: Where = {
      or: [
        {
          'authors.value': {
            equals: user.id,
          },
        },
        {
          createdBy: {
            equals: user.id,
          },
        },
      ],
    }
    return where
  }

  return false
}

const canDelete = ({ req: { user } }): boolean => {
  if (!user) return false

  // Only administrators and editors can delete posts
  return ['administrator', 'editor'].includes(user.role || '')
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt', '_status'],
    description: 'Create and manage blog posts with WordPress-like permissions',
    group: 'Content',
    useAsTitle: 'title',
    hidden: ({ user }) => user?.role === 'subscriber',
    preview: (doc, { req }) =>
      generatePreviewPath({
        slug: typeof doc?.slug === 'string' ? doc.slug : '',
        collection: 'posts',
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
          label: 'Content',
          fields: [
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'content',
              type: 'richText',
              required: true,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    BlocksFeature({ blocks: [Banner, Code, MediaBlock] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
            },
          ],
        },
        {
          label: 'Meta',
          fields: [
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
              admin: {
                position: 'sidebar',
              },
            },
            {
              name: 'authors',
              type: 'relationship',
              relationTo: 'users',
              hasMany: true,
              admin: {
                position: 'sidebar',
              },
              // Authors field is required for proper access control
              required: true,
              defaultValue: ({ user }) => [user?.id], // Set current user as default author
            },
            {
              name: 'relatedPosts',
              type: 'relationship',
              relationTo: 'posts',
              hasMany: true,
              admin: {
                position: 'sidebar',
              },
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                }
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
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    // This field is only used to populate the user data via the `populateAuthors` hook
    {
      name: 'populatedAuthors',
      type: 'array',
      admin: {
        disabled: true,
        readOnly: true,
      },
      access: {
        update: () => false,
      },
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    ...slugField(),
  ],
  hooks: {
    afterChange: [revalidatePost],
    afterRead: [populateAuthors],
    afterDelete: [revalidateDelete],
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
