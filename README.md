# Universal AI Chat 🚀

A high-performance, responsive AI Chat client built with **React Native + Expo**, designed to connect seamlessly to local models via **Ollama**, custom **OpenAI-compatible servers** (vLLM, LM Studio, LiteLLM), and cloud APIs.

![Universal AI Reference](Plan/ChatGPT%20Image%20Sep%2012,%202026,%2001_03_30%20PM.png)

---

## 🌟 Key Features

1. **Multi-Provider Architecture (`AIProvider`)**
   - 🖥️ **Local Ollama**: Connect to `http://localhost:11434` or over your local Wi-Fi/LAN `http://192.168.x.x:11434`.
   - ☁️ **OpenAI Compatible**: Connect to any OpenAI-compatible endpoint (OpenAI, vLLM, LM Studio, OpenRouter, Groq, Together).
   - 🌐 **Custom Endpoints**: Extensible provider interface with zero UI coupling.

2. **Adaptive Master-Detail Responsive UI**
   - 📱 **Mobile Portrait (<600dp)**: Single-pane view with slide-out drawer and bottom navigation tabs.
   - 📱 **Mobile Landscape / Foldable (600–900dp)**: Compact chat pane with adaptive toolbar.
   - 🖥️ **Tablet Landscape (>900dp)**: Dual-pane master-detail sidebar with persistent conversation list and chat surface.

3. **Live Token Speed & Latency Telemetry**
   - ⚡ **Time to First Token (TTFT)** in seconds/ms.
   - 📊 **Real-time generation speed** in `tokens/sec` with live status badge.
   - 📈 **Dedicated Performance & Benchmark Dashboard** with historical comparison across models (Qwen, Gemma, Llama, GPT-OSS).

4. **Rich ChatGPT-Grade Chat Experience**
   - Formatted Markdown rendering with bullet lists and headers.
   - Syntax-highlighted code blocks with language badge and one-tap **Copy Code**.
   - Immediate **Stop Generation** via AbortController.
   - Prompt suggestion cards on empty chat (*Explain something*, *Write code*, *Analyze data*, *Learn something*).
   - Conversation management: Search, grouped date buckets (Today, Yesterday, Earlier), Pin, Delete.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+) or Bun
- Expo CLI (`npx expo`)
- (Optional) [Ollama](https://ollama.com/) running on your computer or local network.

### 2. Run the Application

```bash
# Start the Expo development server
npx expo start

# Run in Web Browser
npm run web
# or: npx expo start --web

# Run on Android Device / Emulator
npm run android
# or: npx expo start --android
```

---

## 🔌 Connecting to Ollama

1. Start Ollama with open CORS and network binding (if connecting from an Android phone over Wi-Fi):
   ```bash
   OLLAMA_HOST=0.0.0.0:11434 ollama serve
   ```
2. Pull your favorite model:
   ```bash
   ollama pull qwen2.5:7b
   # or
   ollama pull llama3.2:3b
   ```
3. In the Universal AI app:
   - Go to **Providers** (`+ Add Provider`)
   - Type: **Ollama**
   - Base URL: `http://192.168.1.xxx:11434` (or `http://10.0.2.2:11434` for Android Emulator)
   - Click **Test Connection** (verify latency and discovered models)
   - Click **Save Provider**.

---

## 🏗️ Project Architecture

```
universal-ai-chat/
├── src/
│   ├── components/
│   │   ├── chat/          # EmptyChatState, MessageBubble, ChatInputBar
│   │   ├── navigation/    # MobileDrawer, BottomTabBar, TabletSidebar, Header
│   │   └── modals/        # ModelSelectorModal, ChatSettingsModal, AddProviderModal
│   ├── providers/
│   │   ├── AIProvider.ts  # Common interface
│   │   ├── OllamaProvider.ts
│   │   ├── OpenAICompatibleProvider.ts
│   │   └── providerFactory.ts
│   ├── screens/
│   │   ├── ChatScreen.tsx
│   │   ├── ConversationsScreen.tsx
│   │   ├── ProvidersScreen.tsx
│   │   ├── PerformanceScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── storage/
│   │   └── storageAdapter.ts # Universal persistence & seed data
│   ├── store/
│   │   ├── appStore.ts    # Global state (active tab, model, provider)
│   │   └── chatStore.ts   # Streaming, messages, speed metrics
│   ├── theme/
│   │   └── tokens.ts      # Dark charcoal palette & typography
│   ├── types/
│   │   └── index.ts       # Strict TypeScript definitions
│   └── hooks/
│       └── useResponsive.ts # Phone / Tablet layout detection
├── App.tsx                # Master responsive entry
└── package.json
```

---

## 📄 License
MIT License
