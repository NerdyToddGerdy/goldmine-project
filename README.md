# Goldmine Tycoon

A placer gold mining idle/clicker game with a React frontend and a Python serverless backend.

---

## Repository Layout

```
goldmine-project/
├── goldmine-game/        # Frontend — React + TypeScript + Vite + Tailwind
└── goldmine-lambda/      # Backend  — Python AWS Lambda (Poetry + Pulumi)
```

---

## goldmine-game

The playable game. All game logic runs client-side in a 60 FPS fixed-step loop using a Zustand vanilla store. Progress is saved to LocalStorage with schema versioning and automatic migration.

See [`goldmine-game/README.md`](goldmine-game/README.md) for gameplay overview, dev setup, and architecture details.

```bash
cd goldmine-game
npm install
npm run dev        # dev server
npm test           # Vitest test suite
npm run build      # production build
```

---

## goldmine-lambda

Serverless backend for server-side events (gold selling validation, player actions, future persistence). Built in Python, managed with Poetry, deployed via Pulumi to AWS Lambda.

```bash
cd goldmine-lambda
poetry install
poetry run python handler.py   # run locally
pulumi up                       # deploy to AWS
```

---

## Author

**Todd Gerdy**
[toadimous@gmail.com](mailto:toadimous@gmail.com)
[Nerdy Gerdy Games on Twitch](https://twitch.tv/nerdygerdygames)
