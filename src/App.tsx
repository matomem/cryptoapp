
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Welcome from "./pages/user/Welcome";
import SendReceive from "./pages/user/SendReceive";
import Send from "./pages/user/Send";
import Receive from "./pages/user/Receive";
import History from "./pages/user/History";
import Settings from "./pages/user/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/user/welcome" element={<Welcome />} />
          <Route path="/user/send-receive" element={<SendReceive />} />
          <Route path="/user/send" element={<Send />} />
          <Route path="/user/receive" element={<Receive />} />
          <Route path="/user/history" element={<History />} />
          <Route path="/user/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
