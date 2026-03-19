# LeaseLink Mobile

Here is the readme of the LeaseLink Mobile app. Instructions here detail the technical implementation as well as instructions and help to run the project.
This app is built on top of [Expo](https://expo.dev).

## Implementations

1. [Expo Router](https://docs.expo.dev/router/introduction)
   - Used a grouping structure to organise stacks
   - Create a `Stack` on the **app** level and then nested `Stacks` for each group
2. [Biome Linter](https://biomejs.dev/)
   - Basic rules available at `biome.json`
   - Implemented **pre-commit checks**, using [Lefthook](https://biomejs.dev/recipes/git-hooks/#lefthook)
3. [Unit Testing w/ @testing-library/react-native](https://testing-library.com/docs/react-native-testing-library/intro/)
4. [E2E Testing w/ maestro](https://docs.expo.dev/build-reference/e2e-tests/)
5. **File Structure**: example component structure, with \*imports, hooks, logic, functions, return JSX, and styling
6. [JSON Server Mocking](https://github.com/typicode/json-server/tree/v0)
7. Custom **Pull Request** template
8. [i18Next](https://react.i18next.com/)

## Running the project

1. Install the Azure CLI (if not already installed)

   - Run the following commands in your terminal:
     ```bash
     brew update && brew install azure-cli
     ```

2. Set up environment variables

   - Follow the instructions provided in the [SF-Mobile Environment Variables Wiki](https://dev.azure.com/StonehageFleming/SF-Digital/_wiki/wikis/SF-InHouseDev.wiki/162/SF-Mobile) to configure the required environment variables.
   - Ensure the `.env.backend` file is correctly set up for the backend.

3. Start the JSON Server Backend

   - Create a fresh terminal and run:
     ```bash
     npm run json-server:dev
     ```
   - If you run into any errors, reset the seed database with:
     ```bash
     npm run json-server:reset
     ```

4. Make Scripts Executable

   - Ensure the scripts in the `scripts` folder are executable by running:
     ```bash
     chmod +x ./scripts/*
     ```

5. Start the local backend

   - Run the following command to start the backend:

     ```bash
     npm run backend:start
     ```

     Press `enter` on the prompt:

     `Select a subscription and tenant (Type a number or Enter for no changes): `

6. Start the frontend

   - Run the following command to clean and prebuild the project:
     ```bash
     npx expo prebuild --clean
     ```
   - Create another terminal and run:
     ```bash
     npm run dev
     ```
   - Hit `i` for iOS or `a` for Android.

   **NOTE for Android**

   - Before running the app against a local backend:

   1. Open an emulator
   2. brew install `android-platform-tools`
   3. Run `adb devices` to make sure your device is connected
   4. Run `adb reverse tcp:3333 tcp:3333` which will map your IP to localhost
   5. Run `npm run android`

7. Run Unit Tests

   - To run unit tests:
     ```bash
     npm run test:unit
     ```
   - To check test coverage:
     ```bash
     npm run test:coverage
     ```

8. Run E2E Tests

   - Ensure the app is running locally, then execute:
     ```bash
     npm run test:e2e
     ```

9. Regenerate API Client

   - If you make changes to the backend API, regenerate the API client:
     ```bash
     npm run codegen
     ```

10. Access API Documentation

- After starting the backend, access the API documentation at:
  ```
  http://localhost:3333/api/docs
  ```

11. Pre-commit Hooks

    - Pre-commit hooks are configured using Lefthook. These will automatically run Biome linting checks before committing changes.

12. Make Scripts Executable
    - Ensure the scripts in the `scripts` folder are executable by running:
      ```bash
      chmod +x ./scripts/*
      ```

### Connect to the Database Using DBeaver(or any other tool of your choice)

1. **Install DBeaver**:

   - Download and install [DBeaver](https://dbeaver.io/).

2. **Create a New Connection**:

   - Open DBeaver and click on **"New Database Connection"**.
   - Select **PostgreSQL** as the database type.

3. **Fill in the Connection Details**:

   - **Host**: `localhost`
   - **Port**: `5432`
   - **Database**: `backend-pg`
   - **Username**: `postgres`
   - **Password**: `postgres`

4. **Test the Connection**:

   - Click **"Test Connection"** to verify the connection.
   - If successful, click **"Finish"** to save the connection.

5. **Explore the Database**:
   - Once connected, you can browse tables, run queries, and manage your database using DBeaver's interface.

## Project Snippets

You can edit or create snippets in the `.vscode/snippets` folder.
You can update the metadata in the snippetDefinitions const in `src/scripts/build-snippets.ts`.

To re-generate the snippets, after a change you should run `npm run snippets:refresh` after any changes.

## Deploying the project

### iOS

[Build and deploy various build types with iOS](DEPLOY-IOS.md)