# Sprint 14 — Human Action Items

Here are the human action items for Sprint 14:

- [ ] **Install `react-native-signature-canvas`**: The mobile app imports it but it's not in `package.json`. Run: `cd apps/mobile && npx expo install react-native-signature-canvas`
- [ ] **Run Prisma migration** against staging/production databases: `cd apps/api && npx prisma migrate deploy`. Note: the migration SQL is missing the foreign key from `signatures.signed_by` → `clients.id`, so verify the migration file matches the schema before running against prod.
- [ ] **Rebuild Expo dev client**: `react-native-signature-canvas` uses a WebView — after installing, rebuild the dev client (`npx expo prebuild && npx expo run:ios`) since new native dependencies may require it.

No new env vars, external service setup, or CI/CD secret changes are needed — this sprint reuses existing blob storage and auth infrastructure.
