import { Outlet } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";

export function LayoutOutlet() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
