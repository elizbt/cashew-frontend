import type React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ChatArea } from "./components/ChatArea";
import Login from "./components/Login";
import Register from "./components/Register";
import { Sidebar } from "./components/Sidebar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import "./index.css";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const { isAuthenticated, loading } = useAuth();

	if (loading) {
		return (
			<div className="h-screen w-screen flex items-center justify-center bg-gray-50">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
			</div>
		);
	}

	return isAuthenticated ? children : <Navigate to="/login" />;
};

function ChatLayout() {
	return (
		<ChatProvider>
			<div className="flex w-full h-screen">
				<Sidebar />
				<ChatArea />
			</div>
		</ChatProvider>
	);
}

function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route
						path="/*"
						element={
							<PrivateRoute>
								<ChatLayout />
							</PrivateRoute>
						}
					/>
				</Routes>
			</AuthProvider>
		</BrowserRouter>
	);
}

export default App;
