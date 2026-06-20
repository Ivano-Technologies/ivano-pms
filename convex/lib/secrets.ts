export function assertInternalJobSecret(secret: string): void {
  const expected = process.env.INTERNAL_JOB_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized");
  }
}
