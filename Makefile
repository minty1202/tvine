dev:
	pnpm tauri dev

lint:
	pnpm biome check .

lint-fix:
	pnpm biome check --fix .

format:
	pnpm biome format --fix .
