import type { Editor } from '@tiptap/core';
import { createVimPlugin, vimPluginKey } from 'vim-prose';
import { getVimMode, type Mode } from 'vim-prose/tiptap';

const modeByDoc = new Map<string, Mode>();
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function publishWysiwygVimMode(docName: string, mode: Mode | null): void {
  if (mode === null) {
    if (modeByDoc.delete(docName)) notify();
    return;
  }
  if (modeByDoc.get(docName) === mode) return;
  modeByDoc.set(docName, mode);
  notify();
}

export function getWysiwygVimMode(docName: string | null): Mode | null {
  if (docName === null) return null;
  return modeByDoc.get(docName) ?? null;
}

export function subscribeWysiwygVimMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function installWysiwygVim(editor: Editor, docName: string): () => void {
  const plugin = createVimPlugin({
    undo: () => editor.commands.undo(),
    redo: () => editor.commands.redo(),
    indent: () => editor.commands.sinkListItem('listItem'),
    outdent: () => editor.commands.liftListItem('listItem'),
  });
  editor.registerPlugin(plugin, (added, plugins) => [added, ...plugins]);
  const syncMode = () => publishWysiwygVimMode(docName, getVimMode(editor));
  syncMode();
  editor.on('transaction', syncMode);
  return () => {
    editor.off('transaction', syncMode);
    publishWysiwygVimMode(docName, null);
    if (!editor.isDestroyed) editor.unregisterPlugin(vimPluginKey);
  };
}
