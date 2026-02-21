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

BACKEND_CRATES = -p kernel -p adapter -p registry -p api -p cli -p shared -p data

frontend-ci:
	pnpm run lint
	pnpm test
	pnpm run build

backend-ci:
	cargo fmt --check $(BACKEND_CRATES)
	cargo clippy $(BACKEND_CRATES) -- -D warnings
	cargo check $(BACKEND_CRATES)
	cargo test $(BACKEND_CRATES)

ci: frontend-ci backend-ci
