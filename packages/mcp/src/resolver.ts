import { LoilonoteClient } from '@samcct-bit/loilonote-core';

export async function resolveCourseId(client: LoilonoteClient, query: string | number): Promise<number> {
  if (typeof query === 'number') {
    return query;
  }

  // If it's a string, we need to find the course by name
  const result = await client.listCourses();
  const groups = Array.isArray(result) ? result : [result];
  
  // exact match first
  for (const group of groups) {
    for (const course of group.courses) {
      if (course.name === query) return course.course_id;
    }
  }

  // fuzzy match
  const lowerQuery = query.toLowerCase();
  for (const group of groups) {
    for (const course of group.courses) {
      if (course.name.toLowerCase().includes(lowerQuery)) {
        return course.course_id;
      }
    }
  }

  // check if it's a string that parses strictly to a number
  const parsed = parseInt(query, 10);
  if (!isNaN(parsed) && parsed.toString() === query.trim()) {
    return parsed;
  }

  throw new Error(`找不到符合名稱 "${query}" 的課程。`);
}

export async function resolveNoteId(client: LoilonoteClient, courseId: number, query: string | number): Promise<number> {
  if (typeof query === 'number') {
    return query;
  }

  const result = await client.listNotes(courseId);
  const notes = result.notes;

  // exact match first
  for (const note of notes) {
    if (note.name === query) return note.id;
  }

  // fuzzy match
  const lowerQuery = query.toLowerCase();
  for (const note of notes) {
    if (note.name.toLowerCase().includes(lowerQuery)) return note.id;
  }

  // check if it's a string that parses strictly to a number
  const parsed = parseInt(query, 10);
  if (!isNaN(parsed) && parsed.toString() === query.trim()) {
    return parsed;
  }

  throw new Error(`在課程 ${courseId} 中找不到符合名稱 "${query}" 的筆記。`);
}
