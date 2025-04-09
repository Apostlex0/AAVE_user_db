# Aave Protocol Event Indexer

This project is an event processing and metrics calculation engine for the Aave Protocol. It tracks various protocol events and updates user metrics in a PostgreSQL database.

## Features

- **Initial Sync**: Fetches and stores user metrics at startup.
- **Event Processing**: Handles `Supply`, `Withdraw`, `Borrow`, `Repay`, and `LiquidationCall` events.
- **Position Tracking**: Monitors user positions and updates metrics in real-time.

## Prerequisites

- Node.js
- PostgreSQL
- Aave Protocol access

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure the database**:
   - Ensure your PostgreSQL database is running.
   - Update the connection details in your configuration file (e.g., `.env`).

## Usage

1. **Start the application**:
   ```bash
   npx ponder dev
   ```

2. **Monitor logs**:
   - Check the console for logs indicating user metrics updates.
   - Verify that data is being stored in the database.

## Configuration

- **Port**: Change the port in `ponder.config.ts` if needed.
- **Start Block**: Adjust the start block in `ponder.config.ts` to control event processing from a specific block.

## Troubleshooting

- **Database Issues**: Ensure connection details are correct and the database is accessible.
- **Event Handling**: Add logging to verify that event handlers are being executed.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. 