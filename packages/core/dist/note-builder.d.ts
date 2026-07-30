import type { ParsedNote } from './types.js';
export declare class NoteBuilder {
    static appendWebCard(parsed: ParsedNote, url: string, title?: string, imageRemoteId?: string): void;
    static appendPictureCard(parsed: ParsedNote, remoteId: string, filename: string, width?: number, height?: number): void;
}
//# sourceMappingURL=note-builder.d.ts.map