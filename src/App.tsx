import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Charts from "./pages/Charts";
import Transactions from "./pages/Transactions";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "charts", element: <Charts /> },
      { path: "transactions", element: <Transactions /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;