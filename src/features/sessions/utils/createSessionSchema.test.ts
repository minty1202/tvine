import { describe, expect, it } from 'vitest';
import { createSessionSchema } from './createSessionSchema';

const valid = (branchName: string) =>
  createSessionSchema.safeParse({ baseBranch: 'main', branchName }).success;

describe('createSessionSchema', () => {
  it('有効なブランチ名は通る', () => {
    expect(valid('feature/login')).toBe(true);
    expect(valid('fix/csv-export')).toBe(true);
    expect(valid('main')).toBe(true);
    expect(valid('release/1.0.0')).toBe(true);
  });

  it('空文字はエラー', () => {
    expect(valid('')).toBe(false);
  });

  it('非 ASCII 文字はエラー', () => {
    expect(valid('feature/ログイン')).toBe(false);
    expect(valid('機能追加')).toBe(false);
  });

  it('スペースを含むとエラー', () => {
    expect(valid('feature login')).toBe(false);
  });

  it('".." を含むとエラー', () => {
    expect(valid('feature..login')).toBe(false);
  });

  it('"~", "^", ":", "\\" を含むとエラー', () => {
    expect(valid('feature~1')).toBe(false);
    expect(valid('feature^2')).toBe(false);
    expect(valid('feature:login')).toBe(false);
    expect(valid('feature\\login')).toBe(false);
  });

  it('"/" の不正な使い方はエラー', () => {
    expect(valid('/feature')).toBe(false);
    expect(valid('feature/')).toBe(false);
    expect(valid('feature//login')).toBe(false);
  });

  it('".lock" で終わるとエラー', () => {
    expect(valid('feature.lock')).toBe(false);
  });

  it('"." で始まるとエラー', () => {
    expect(valid('.feature')).toBe(false);
  });

  it('ベースブランチが空だとエラー', () => {
    const result = createSessionSchema.safeParse({
      baseBranch: '',
      branchName: 'feature/test',
    });
    expect(result.success).toBe(false);
  });
});
