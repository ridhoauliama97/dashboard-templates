import { RouterProvider, createBrowserRouter } from "react-router-dom";

import RootLayout from "@/app/layout";
import { routes } from "@/routes";

const router = createBrowserRouter(routes);

export default function App() {
  return (
    <RootLayout>
      <RouterProvider router={router} />
    </RootLayout>
  );
}
