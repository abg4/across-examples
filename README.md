# Across SDK Examples

> **IMPORTANT DISCLAIMER**: This repository is NOT maintained by the Across Protocol team and is intended for educational purposes only. The examples provided here are for demonstration and learning purposes. Use at your own risk. The maintainers of this repository assume no responsibility or liability for any errors or issues that may arise from using these examples.

This repository demonstrates how to use the Across Protocol SDK to interact with the Across bridge, showing various examples of cross-chain token transfers and bridge interactions.

## Project Structure

To create a new example:

1. Copy the `template` folder
2. Rename it based on your use case (e.g., `token-bridge`, `usdc-transfer`)
3. Add your configuration in `config.ts`
4. Modify the message handler in `message.ts`

## Installation

Install dependencies using yarn:

```bash
yarn install
```

## Running Examples

You can run examples using the following command:

```bash
yarn start --project <example-directory> --simulate <true|false>
```

Where:

- `<example-directory>` is the name of the example folder you want to run
- `--simulate`:
  - `true`: Uses Tenderly virtual networks for simulation
  - `false`: Executes actual transactions (requires PRIVATE_KEY in env)

Example:

```bash
# To simulate a protocol-fees bridge example
yarn start --project protocol-fees --simulate true

# To execute a real transaction
yarn start --project protocol-fees --simulate false
```

## Environment Variables

### Required for Simulation

Create a `.env` file with the following Tenderly credentials:

```env
TENDERLY_ACCESS_KEY=your_access_key
TENDERLY_ACCOUNT=your_account_name
TENDERLY_PROJECT=your_project_name
```

> Note: A fallback Tenderly configuration is provided, but it's recommended to use your own credentials as the fallback cannot be guaranteed to always work.

### Required for Transaction Execution

When running with `--simulate false`, add PRIVATE_KEY to your environment variables:

```env
PRIVATE_KEY=your_wallet_private_key
```

## Examples

[Add specific examples and their descriptions here]

## Contributing

Feel free to contribute by adding new examples or improving existing ones. Follow the project structure guidelines mentioned above.
