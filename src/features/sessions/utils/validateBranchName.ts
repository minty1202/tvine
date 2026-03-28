export function validateBranchName(name: string): string | null {
  if (name.trim() === '') {
    return 'ブランチ名を入力してください';
  }

  if (/[^\x20-\x7E]/.test(name)) {
    return 'ASCII 文字のみ使用できます';
  }

  if (name.includes(' ')) {
    return 'スペースは使えません';
  }

  if (name.includes('..')) {
    return '".." は使えません';
  }

  if (/[~^:\\]/.test(name)) {
    return '"~", "^", ":", "\\" は使えません';
  }

  if (name.startsWith('/') || name.endsWith('/') || name.includes('//')) {
    return '"/" で始まる・終わる、または "//" を含むブランチ名は使えません';
  }

  if (name.endsWith('.lock')) {
    return '".lock" で終わるブランチ名は使えません';
  }

  if (name.startsWith('.')) {
    return '"." で始まるブランチ名は使えません';
  }

  return null;
}
