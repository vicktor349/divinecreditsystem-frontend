import { useEffect } from "react";
import { useRouter } from "next/router";
import { UserProvider, useUser } from "@/context/UserContext";
import { ToastProvider } from "@/context/ToastContext";
import "@/styles/globals.css";
import { MantineProvider } from "@mantine/core";
import type { AppProps } from "next/app";

// Customers only ever see /portal/* — keep them out of the staff/admin app.
function CustomerRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role === 'customer' && !router.pathname.startsWith('/portal')) {
      router.replace('/portal/dashboard');
    }
  }, [isLoading, user, router]);

  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider>
      <UserProvider>
        <ToastProvider>
          <CustomerRouteGuard>
            <Component {...pageProps} />
          </CustomerRouteGuard>
        </ToastProvider>
      </UserProvider>
    </MantineProvider>
  );
}
