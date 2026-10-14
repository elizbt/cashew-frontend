import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/constants";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/api";
import type { ApiError } from "../types/auth";
import { Button } from "./ui/Button";

const Login: React.FC = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const { signIn } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!email || !password) {
			setError("Preencha todos os campos");
			return;
		}

		setLoading(true);
		try {
			const response = await authService.login({ email, password });
			signIn(response);
			navigate("/");
		} catch (err) {
			const error = err as ApiError;
			const responseData = error.response?.data;

			if (responseData?.issues && Array.isArray(responseData.issues)) {
				const messages = responseData.issues
					.map((issue) => issue.message)
					.join(", ");
				setError(messages);
			} else {
				setError(responseData?.message || "E-mail ou senha inválidos");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
			<div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100 animate-in zoom-in-95 duration-300">
				<div className="text-center">
					<div className="flex justify-center mb-4">
						<div className="p-4 bg-emerald-50 rounded-2xl">
							<LogIn className="w-8 h-8 text-secondary" />
						</div>
					</div>
					<h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
						Acesse o {APP_CONFIG.APP_NAME}
					</h2>
					<p className="mt-2 text-sm text-slate-500 font-medium">
						Entre para continuar suas conversas acadêmicas
					</p>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
					{error && (
						<div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 font-medium">
							{error}
						</div>
					)}

					<div className="space-y-4">
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-semibold text-slate-700 mb-1 ml-1"
							>
								E-mail
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
									<Mail className="h-5 w-5 text-slate-400" />
								</div>
								<input
									id="email"
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="block w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-secondary outline-none transition-all placeholder:text-slate-400"
									placeholder="usuario@email.com"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-semibold text-slate-700 mb-1 ml-1"
							>
								Senha
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
									<Lock className="h-5 w-5 text-slate-400" />
								</div>
								<input
									id="password"
									type={showPassword ? "text" : "password"}
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="block w-full pl-12 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-secondary outline-none transition-all placeholder:text-slate-400"
									placeholder="••••••••"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
									className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-secondary transition-colors"
								>
									{showPassword ? (
										<EyeOff className="h-5 w-5" />
									) : (
										<Eye className="h-5 w-5" />
									)}
								</button>
							</div>
						</div>
					</div>

					<Button
						type="submit"
						isLoading={loading}
						className="w-full py-4 text-base"
					>
						Entrar
					</Button>

					<div className="text-center text-sm font-medium">
						<span className="text-slate-500">Ainda não tem uma conta? </span>
						<Link
							to="/register"
							className="text-secondary hover:text-primary font-bold transition-colors underline underline-offset-4"
						>
							Cadastre-se aqui
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Login;
