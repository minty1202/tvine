dev:
	pnpm tauri dev

lint:
	pnpm run lint
	cargo clippy -- -D warnings

lint-fix:
	pnpm biome check --fix .
	cargo clippy --fix --allow-dirty

format:
	pnpm biome format --fix .
	cargo fmt

test:
	pnpm test
	cargo test

generate:
	cargo test -p kernel export_bindings
	pnpm biome check --write src/generated/

BACKEND_CRATES = --workspace --exclude tvine

frontend-ci:
	pnpm run lint
	pnpm test
	pnpm run build

backend-ci:
	cargo fmt --all --check
	cargo clippy $(BACKEND_CRATES) -- -D warnings
	cargo check $(BACKEND_CRATES)
	cargo test $(BACKEND_CRATES)

ci: frontend-ci backend-ci
