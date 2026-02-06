# PuzzleRush Arena

A multiplayer Sudoku-like game built with Next.js, Prisma, NextAuth, and Socket.IO. This repository currently contains foundational code including:

- Prisma schema
- NextAuth configuration
- Socket.IO server wiring
- Sudoku puzzle generator and solver
- GameBoard React component
- Jest test for puzzle logic

## Development

```
cp .env.example .env
# Fill environment variables for DATABASE_URL, REDIS_URL, AUTH secrets
npm install
npx prisma migrate dev
npm run dev
```

## Testing

```
npm test
```

## License

MIT

## Rogue Engine Factory Prototype

This repo includes a code-only Rogue Engine prototype for a 3D top-down factory slice.

### Controls

- WASD: pan camera
- Mouse wheel: zoom
- Middle mouse drag: pan
- Left click: place belt
- Right click: remove belt
- Q/E: rotate belt direction
- 1: inject ore into hovered belt
- F5: save to localStorage
- F9: load from localStorage

### Running in Rogue Engine

1. Open the project in Rogue Engine.
2. Create a GameObject in the scene and add the `GameManager` component from `src/game/GameManager.ts`.
3. Press Play to run the prototype.
