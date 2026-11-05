import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { vimPluginKey } from 'vim-prose';
import { getVimMode } from 'vim-prose/tiptap';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getWysiwygVimMode, installWysiwygVim } from './wysiwyg-vim';

const editors: Editor[] = [];

function makeEditor(extensions: Extension[] = []): Editor {
  const editor = new Editor({
    extensions: [StarterKit, ...extensions],
    content: '<p>hello world</p>',
  });
  editors.push(editor);
  return editor;
}

function press(editor: Editor, key: string): void {
  editor.view.dom.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  );
}

afterEach(() => {
  for (const editor of editors.splice(0)) editor.destroy();
});

describe('WYSIWYG vim', () => {
  test('enters insert mode on i and returns to normal on Escape', () => {
    const editor = makeEditor();
    const uninstall = installWysiwygVim(editor, 'vim-doc');
    expect(getWysiwygVimMode('vim-doc')).toBe('normal');

    press(editor, 'i');
    expect(getVimMode(editor)).toBe('insert');
    expect(getWysiwygVimMode('vim-doc')).toBe('insert');

    press(editor, 'Escape');
    expect(getVimMode(editor)).toBe('normal');
    expect(getWysiwygVimMode('vim-doc')).toBe('normal');

    uninstall();
    expect(getWysiwygVimMode('vim-doc')).toBeNull();
    expect(vimPluginKey.getState(editor.state)).toBeUndefined();
  });

  test('moves the cursor and deletes a line in normal mode', () => {
    const editor = makeEditor();
    const uninstall = installWysiwygVim(editor, 'vim-motions');
    const start = editor.state.selection.head;

    press(editor, 'l');
    expect(editor.state.selection.head).toBe(start + 1);

    press(editor, 'd');
    press(editor, 'd');
    expect(editor.state.doc.textContent).toBe('');

    uninstall();
  });

  test('takes Escape before a higher-priority editor shortcut', () => {
    const shortcut = vi.fn(() => true);
    const editor = makeEditor([
      Extension.create({
        name: 'escapeShortcut',
        priority: 1000,
        addKeyboardShortcuts: () => ({ Escape: shortcut }),
      }),
    ]);
    const uninstall = installWysiwygVim(editor, 'vim-precedence');

    press(editor, 'i');
    shortcut.mockClear();
    press(editor, 'Escape');

    expect(getVimMode(editor)).toBe('normal');
    expect(shortcut).not.toHaveBeenCalled();
    uninstall();
  });
});
