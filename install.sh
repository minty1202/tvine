#!/bin/bash
set -euo pipefail

REPO="minty1202/tvine"
APP_NAME="tvine"
INSTALL_DIR="/Applications"
BIN_DIR="/usr/local/bin"

info() { printf "\033[34m%s\033[0m\n" "$1"; }
error() { printf "\033[31mError: %s\033[0m\n" "$1" >&2; exit 1; }

# --- OS・アーキテクチャ判定 ---

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin) ;;
  *) error "現在 macOS のみ対応しています" ;;
esac

case "$ARCH" in
  arm64)  TARGET="aarch64" ;;
  x86_64) TARGET="x86_64" ;;
  *) error "未対応のアーキテクチャです: $ARCH" ;;
esac

info "検出: macOS $ARCH ($TARGET)"

# --- 最新リリースのダウンロード URL を取得 ---

info "最新リリースを確認中..."

DOWNLOAD_URL=$(curl -sSf "https://api.github.com/repos/${REPO}/releases/latest" \
  | grep -o "\"browser_download_url\": *\"[^\"]*${TARGET}[^\"]*\.dmg\"" \
  | head -1 \
  | cut -d'"' -f4) || true

if [ -z "$DOWNLOAD_URL" ]; then
  error "ダウンロード URL が見つかりません。リリースが公開されているか確認してください: https://github.com/${REPO}/releases"
fi

info "ダウンロード: $DOWNLOAD_URL"

# --- ダウンロード ---

TMP_DIR=$(mktemp -d)
DMG_PATH="${TMP_DIR}/${APP_NAME}.dmg"

cleanup() {
  if [ -d "/Volumes/${APP_NAME}" ]; then
    hdiutil detach "/Volumes/${APP_NAME}" -quiet 2>/dev/null || true
  fi
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

curl -sSfL -o "$DMG_PATH" "$DOWNLOAD_URL"

# --- インストール ---

info "${APP_NAME}.app をインストール中..."

hdiutil attach "$DMG_PATH" -quiet -nobrowse -mountpoint "/Volumes/${APP_NAME}"

if [ -d "${INSTALL_DIR}/${APP_NAME}.app" ]; then
  info "既存の ${APP_NAME}.app を上書きします"
  rm -rf "${INSTALL_DIR}/${APP_NAME}.app"
fi

cp -R "/Volumes/${APP_NAME}/${APP_NAME}.app" "$INSTALL_DIR/"

# --- シンボリックリンク ---

info "${BIN_DIR}/${APP_NAME} にリンクを作成中..."

if [ ! -d "$BIN_DIR" ]; then
  sudo mkdir -p "$BIN_DIR"
fi

sudo ln -sf "${INSTALL_DIR}/${APP_NAME}.app/Contents/MacOS/${APP_NAME}" "${BIN_DIR}/${APP_NAME}"

# --- 完了 ---

info "インストール完了!"
info "  アプリ: ${INSTALL_DIR}/${APP_NAME}.app"
info "  コマンド: ${APP_NAME}"
