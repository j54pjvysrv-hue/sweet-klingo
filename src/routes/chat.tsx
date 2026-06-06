import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat with Soyeon — Sweet" },
      { name: "description", content: "Threaded conversations with Soyeon, your AI Korean tutor." },
    ],
  }),
  component: () => <Outlet />,
});
