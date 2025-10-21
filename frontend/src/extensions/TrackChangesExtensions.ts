/**
 * TipTap extensions for Track Changes (Microsoft Word-like)
 * Provides insertion and deletion marks for tracking content changes
 */
import { Mark, mergeAttributes } from '@tiptap/core';

// Insertion Mark - Highlights newly added text
export const InsertionMark = Mark.create({
  name: 'insertion',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      'data-change-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-change-id'),
        renderHTML: attributes => {
          if (!attributes['data-change-id']) {
            return {};
          }
          return {
            'data-change-id': attributes['data-change-id'],
          };
        },
      },
      'data-change-type': {
        default: 'insert',
        parseHTML: element => element.getAttribute('data-change-type'),
        renderHTML: () => {
          return {
            'data-change-type': 'insert',
          };
        },
      },
      'data-user': {
        default: null,
        parseHTML: element => element.getAttribute('data-user'),
        renderHTML: attributes => {
          if (!attributes['data-user']) {
            return {};
          }
          return {
            'data-user': attributes['data-user'],
          };
        },
      },
      'data-user-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-user-id'),
        renderHTML: attributes => {
          if (!attributes['data-user-id']) {
            return {};
          }
          return {
            'data-user-id': attributes['data-user-id'],
          };
        },
      },
      'data-timestamp': {
        default: null,
        parseHTML: element => element.getAttribute('data-timestamp'),
        renderHTML: attributes => {
          if (!attributes['data-timestamp']) {
            return {};
          }
          return {
            'data-timestamp': attributes['data-timestamp'],
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-change-type="insert"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: 'track-change-insert',
    }), 0];
  },
});

// Deletion Mark - Shows deleted text with strikethrough
export const DeletionMark = Mark.create({
  name: 'deletion',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      'data-change-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-change-id'),
        renderHTML: attributes => {
          if (!attributes['data-change-id']) {
            return {};
          }
          return {
            'data-change-id': attributes['data-change-id'],
          };
        },
      },
      'data-change-type': {
        default: 'delete',
        parseHTML: element => element.getAttribute('data-change-type'),
        renderHTML: () => {
          return {
            'data-change-type': 'delete',
          };
        },
      },
      'data-user': {
        default: null,
        parseHTML: element => element.getAttribute('data-user'),
        renderHTML: attributes => {
          if (!attributes['data-user']) {
            return {};
          }
          return {
            'data-user': attributes['data-user'],
          };
        },
      },
      'data-user-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-user-id'),
        renderHTML: attributes => {
          if (!attributes['data-user-id']) {
            return {};
          }
          return {
            'data-user-id': attributes['data-user-id'],
          };
        },
      },
      'data-timestamp': {
        default: null,
        parseHTML: element => element.getAttribute('data-timestamp'),
        renderHTML: attributes => {
          if (!attributes['data-timestamp']) {
            return {};
          }
          return {
            'data-timestamp': attributes['data-timestamp'],
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-change-type="delete"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: 'track-change-delete',
    }), 0];
  },
});
