import { LoilonoteClient } from '@samcct-bit/loilonote-core';
export declare function resolveCourseId(client: LoilonoteClient, query: string | number): Promise<number>;
export declare function resolveNoteId(client: LoilonoteClient, courseId: number, query: string | number): Promise<number>;
