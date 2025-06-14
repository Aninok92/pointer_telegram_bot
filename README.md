# Telegram Bot for Auto Painting Studio

Telegram bot for managing auto painting studio services, allowing users to select services, specify quantities, and generate PDF invoices. Includes an admin interface for managing services.

## Features

- 🚗 Service selection for cars, motorcycles, and additional services
- 📊 Quantity management for each service
- 💰 Automatic price calculation
- 📄 PDF invoice generation
- 🔐 Admin interface for service management
- 📁 JSON export functionality

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd telegram-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
BOT_TOKEN=your_telegram_bot_token
ADMIN_PASSWORD=your_admin_password
```

4. Build the project:
```bash
npm run build
```

## Running the Bot

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Usage

### User Commands

- `/start` - Start the bot and select service category
- Select services and specify quantities
- Generate PDF invoice

### Admin Commands

- `/admin` - Access admin interface (requires password)
- View all services
- Add new services
- Edit existing services
- Delete services
- Export services to JSON

## Project Structure

```
src/
├── commands/
│   ├── start.ts
│   ├── admin.ts
│   ├── userHandlers.ts
│   └── adminHandlers.ts
├── middleware/
│   └── session.ts
├── pdf/
│   └── generateInvoice.ts
├── data/
│   └── services.json
└── index.ts
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 