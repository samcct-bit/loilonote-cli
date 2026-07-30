import { randomUUID } from 'node:crypto';
import type { ParsedNote, NoteFrame } from './types.js';

export class NoteBuilder {
  static appendWebCard(parsed: ParsedNote, url: string, title?: string, imageRemoteId?: string): void {
    const id = randomUUID();
    const frame: NoteFrame = {
      id,
      type: 'web',
      content: {
        uri: url,
        size: { width: 160, height: 120 },
        backcolor: '#FFFFFFFF',
        margins: { left: 0, right: 0, bottom: 0, top: 0 },
        needs_display_url_domain: true,
        asset: imageRemoteId ? {
          description: title || 'Web Page',
          extension: '.png',
          remote_id: imageRemoteId
        } : undefined
      } as any,
      metadata: {
        position: { left: 480, top: 250 },
        author: { id: parsed.header.updater.id, name: 'API Client' },
        duration: 5,
        layout_size: { width: 160, height: 120 },
        unlimited_recording_time: true
      },
      gadgets: {}
    };
    parsed.body.data.frames.push(frame);
  }

  static appendPictureCard(parsed: ParsedNote, remoteId: string, filename: string, width: number = 1024, height: number = 768): void {
    const id = randomUUID();
    const frame: NoteFrame = {
      id,
      type: 'picture',
      content: {
        backcolor: '#00FFFFFF',
        size: { width, height },
        margins: { left: 0, right: 0, bottom: 0, top: 0 },
        asset: {
          description: filename,
          extension: filename.toLowerCase().endsWith('.png') ? '.png' : '.jpg',
          remote_id: remoteId
        }
      } as any,
      metadata: {
        position: { left: 248, top: 250 },
        author: { id: parsed.header.updater.id, name: 'API Client' },
        duration: 5,
        layout_size: { width: 160, height: 120 },
        unlimited_recording_time: true
      },
      gadgets: {}
    };
    parsed.body.data.frames.push(frame);
  }
}
