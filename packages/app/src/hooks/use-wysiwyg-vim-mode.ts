import { useSyncExternalStore } from 'react';
import { getWysiwygVimMode, subscribeWysiwygVimMode } from '@/editor/wysiwyg-vim';

export function useWysiwygVimMode(docName: string | null) {
  return useSyncExternalStore(subscribeWysiwygVimMode, () => getWysiwygVimMode(docName));
}
