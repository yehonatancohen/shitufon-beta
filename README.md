# Shitufon-Beta

Welcome to **Shitufon-Beta**, an experimental platform designed to facilitate seamless and efficient communication for users leveraging the WhatsApp Web interface. This project serves as a beta version, focusing on providing advanced automation capabilities, session management, and multi-client handling within the WhatsApp ecosystem.

## Features

- **Automated Messaging:** Easily send bulk messages to multiple recipients using predefined templates and client IDs.
- **Session Management:** Efficiently manage multiple WhatsApp sessions with unique session IDs, allowing you to operate several WhatsApp Web instances simultaneously.
- **Client Handling:** Add, monitor, and control multiple WhatsApp Web clients through a user-friendly interface.
- **Session Persistence:** Save session states and resume operations without losing any previous context or data.
- **Cross-Platform Support:** Built using Electron, this application runs on Windows, MacOS, and Linux.

## Installation

### Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14.x or later)
- npm (v6.x or later)
- Git
- WhatsApp account(s) to be used with WhatsApp Web

### Clone the Repository

Clone the repository to your local machine:

```bash
git clone https://github.com/yehonatancohen/shitufon-beta.git
cd shitufon-beta
```

### Install Dependencies

Navigate to the project directory and install the necessary dependencies:

```bash
npm install
```

### Start the Application

To run the application locally:

```bash
npm start
```

## Usage

### Starting a Session

1. **Add a New Client:**
   - Go to the 'Connection' page, choose a client ID, and click 'Start'.
   - A QR code will be generated. Scan it with the WhatsApp app on your mobile device.
   - Once connected, a green checkmark will appear, indicating a successful connection.

2. **Creating and Managing Sessions:**
   - In the 'Sending' page, upload an Excel file containing client IDs, input the message body, and set the desired sleep time between messages.
   - Click on 'Create Session' to initiate the process.
   - Monitor the progress of each session in real-time.

### Logging

Shitufon-Beta uses `electron-log` to handle logging. The logs are sent directly from the backend, ensuring they are not intercepted by the renderer process.

## Contributing

We welcome contributions! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit them (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Contact

If you have any questions or need further assistance, feel free to contact the project maintainer:

- **Name:** Yehonatan Cohen
- **Email:** yoncohenyon@gmail.com
