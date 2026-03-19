# LeaseLink API

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- Docker
- PNPM (Package Manager)

### Installing Docker

You can download and install Docker from the [official Docker website](https://www.docker.com/get-started).

### Installing PNPM

To install PNPM, you can use Homebrew:

```sh
brew install pnpm
```

## Getting Started

### Cloning the Repository

To clone the repository, run the following command:

```sh
git clone <your-repo-url>
cd leaselink
```

### Setting Up the Environment

Be sure you have a Node version above 20.19!!

After cloning the repository, you need to set up the environment:

1. Copy the example environment file to create your own local environment file env variables on (https://dev.azure.com/StonehageFleming/SF-Digital/_wiki/wikis/SF-InHouseDev.wiki/164/SF-Backend):
    ```sh
    cp .env.example .env
    ```

2. Install the dependencies using PNPM:
    ```sh
    pnpm install
    ```

3. Create the Docker database:
    ```sh
    pnpm db:setup
    ```

3. Create the Docker blob storage:
    ```sh
    pnpm azurite:start
    ```


5. Start the development server:
    ```sh
    pnpm start:dev
    ```
6. Open api documentation:
    ```sh
    pnpm open:docs
    ```