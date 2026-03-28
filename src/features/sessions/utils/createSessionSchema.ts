import { z } from 'zod';

const branchNameSchema = z
  .string()
  .min(1, 'ブランチ名を入力してください')
  .regex(/^[\x21-\x7E]+$/, 'ASCII 文字のみ使用できます')
  .refine((v) => !v.includes('..'), '".." は使えません')
  .refine((v) => !/[~^:\\]/.test(v), '"~", "^", ":", "\\" は使えません')
  .refine(
    (v) => !v.startsWith('/') && !v.endsWith('/') && !v.includes('//'),
    '"/" で始まる・終わる、または "//" を含むブランチ名は使えません',
  )
  .refine((v) => !v.endsWith('.lock'), '".lock" で終わるブランチ名は使えません')
  .refine((v) => !v.startsWith('.'), '"." で始まるブランチ名は使えません');

export const createSessionSchema = z.object({
  baseBranch: z.string().min(1, 'ベースブランチを入力してください'),
  branchName: branchNameSchema,
});

export type CreateSessionValues = z.infer<typeof createSessionSchema>;
