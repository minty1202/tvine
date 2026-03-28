import { describe, expect, it } from 'vitest';
import { validateBranchName } from './validateBranchName';

describe('validateBranchName', () => {
  it('有効なブランチ名は null を返す', () => {
    expect(validateBranchName('feature/login')).toBeNull();
    expect(validateBranchName('fix/csv-export')).toBeNull();
    expect(validateBranchName('main')).toBeNull();
    expect(validateBranchName('release/1.0.0')).toBeNull();
  });

  it('非 ASCII 文字はエラー', () => {
    expect(validateBranchName('feature/ログイン')).not.toBeNull();
    expect(validateBranchName('機能追加')).not.toBeNull();
  });

  it('空文字はエラー', () => {
    expect(validateBranchName('')).not.toBeNull();
    expect(validateBranchName('   ')).not.toBeNull();
  });

  it('スペースを含むとエラー', () => {
    expect(validateBranchName('feature login')).not.toBeNull();
  });

  it('".." を含むとエラー', () => {
    expect(validateBranchName('feature..login')).not.toBeNull();
  });

  it('"~", "^", ":", "\\" を含むとエラー', () => {
    expect(validateBranchName('feature~1')).not.toBeNull();
    expect(validateBranchName('feature^2')).not.toBeNull();
    expect(validateBranchName('feature:login')).not.toBeNull();
    expect(validateBranchName('feature\\login')).not.toBeNull();
  });

  it('"/" の不正な使い方はエラー', () => {
    expect(validateBranchName('/feature')).not.toBeNull();
    expect(validateBranchName('feature/')).not.toBeNull();
    expect(validateBranchName('feature//login')).not.toBeNull();
  });

  it('".lock" で終わるとエラー', () => {
    expect(validateBranchName('feature.lock')).not.toBeNull();
  });

  it('"." で始まるとエラー', () => {
    expect(validateBranchName('.feature')).not.toBeNull();
  });
});
