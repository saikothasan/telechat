# TeleChat - Advanced Telegram Clone

A feature-rich Telegram clone built with Next.js 14, Supabase, and TypeScript. This project demonstrates real-time messaging, group chats, file sharing, and more.

## Features

- 🔐 Authentication with Google and GitHub via Supabase Auth
- 💬 Real-time messaging with Supabase Realtime
- 👥 Group chat support
- 📎 File sharing and media uploads
- ✏️ Message editing and deletion
- 📱 Responsive design
- 👀 Read receipts
- ⌨️ Typing indicators
- 🔍 Chat search functionality

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Realtime)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **Styling:** Tailwind CSS, shadcn/ui
- **Icons:** Lucide React

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/saikothasan/telechat.git
cd telechat
```

2. Install dependencies:


```shellscript
npm install
```

3. Set up your environment variables in `.env.local`:


```plaintext
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:


```shellscript
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.


## Database Schema

The project uses the following main tables in Supabase:

- `profiles` - User profiles and settings
- `groups` - Group chat information
- `group_members` - Group membership records
- `chats` - Individual and group chat sessions
- `messages` - Chat messages
- `message_read_status` - Message read receipts


## Project Structure

```plaintext
telechat/
├── app/                # Next.js app router pages
├── components/         # React components
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
├── public/            # Static assets
└── types/             # TypeScript type definitions
```

## Key Components

- `ChatInterface` - Main chat interface container
- `Sidebar` - Chat list and navigation
- `ChatArea` - Message display and input
- `ProfileSettings` - User profile management
- `CreateGroup` - Group creation interface
- `FileUpload` - File upload handling
- `MessageOptions` - Message editing and deletion


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)


## Support

For support, please open an issue in the repository or contact the maintainers.

---

Built with ❤️ by [Saiko Thasan](https://github.com/saikothasan)
