# WhatsAnalyzer: AI-Powered WhatsApp Chat Analysis

This is a Next.js application that allows you to upload and analyze your WhatsApp chat histories using the power of Google's Gemini AI. You can get summaries, ask specific questions, analyze media, and generate visualizations from your conversations.

## Features

- **Local First:** Your chat data is processed and stored entirely in your browser's IndexedDB. Nothing is uploaded to a server.
- **AI-Powered Analysis:** Use Google Gemini to ask questions about your chat, get summaries, and generate insights.
- **Contextual Media Analysis:** Double-click any message (text, image, or audio) to ask questions about it specifically.
- **Dynamic Chart Generation:** Ask the AI to create charts and diagrams (e.g., "create a pie chart of the most active users") and see them rendered directly in the chat.
- **Text-to-Speech:** Convert AI responses into audible speech.
- **Customizable:** Easily set your own Gemini API key and change the AI's response language (Arabic/French).

---

## Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 1. Install Dependencies

Once you have downloaded the project files, open your terminal in the project's root directory and run the following command to install all the necessary packages:

```bash
npm install
```

### 2. Set Up Environment Variables

The application uses Google Gemini for its AI capabilities, which requires an API key.

1.  Create a new file named `.env` in the root of your project directory.
2.  Add your Gemini API key to this file:

    ```
    GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```

> **Note:** Although you can also set the API key through the app's interface (`.key` command), setting it in the `.env` file is recommended for the initial setup, as it is used by the Genkit development server.

### 3. Run the Application

This project requires two separate processes to be running at the same time in two different terminal windows:

1.  **The Next.js Frontend Application**
2.  **The Genkit AI Backend**

#### Terminal 1: Start the Frontend

In your first terminal, run the following command to start the Next.js development server:

```bash
npm run dev
```

The application will now be running at [http://localhost:9002](http://localhost:9002).

#### Terminal 2: Start the Genkit AI Server

In a second terminal, run the following command to start the Genkit development server. This server handles all the AI-related tasks.

```bash
npm run genkit:watch
```

This will start the Genkit server and automatically restart it if you make any changes to the AI flow files in `src/ai/flows/`.

---

You are now all set! Open your browser to [http://localhost:9002](http://localhost:9002) to start using the application.
