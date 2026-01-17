import { UserProvider } from "@/context/UserContext";
import { ToastProvider } from "@/context/ToastContext";
import "@/styles/globals.css";
import { MantineProvider } from "@mantine/core";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider>
      <UserProvider>
        <ToastProvider>
          <Component {...pageProps} />
        </ToastProvider>
      </UserProvider>
    </MantineProvider>
  );
}
