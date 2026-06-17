import {
	Check,
	Eye,
	EyeOff,
	Loader2,
	Lock,
	Mail,
	User as UserIcon,
	UserPlus,
	X,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/api";
import type { ApiError } from "../types/auth";

const Register: React.FC = () => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const { signIn } = useAuth();
	const navigate = useNavigate();

	const passwordCriteria = useMemo(
		() => ({
			minChars: password.length >= 6,
			hasUpper: /[A-Z]/.test(password),
			hasNumber: /[0-9]/.test(password),
		}),
		[password],
	);

	const isPasswordValid =
		passwordCriteria.minChars &&
		passwordCriteria.hasUpper &&
		passwordCriteria.hasNumber;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (name.length < 2) {
			setError("O nome deve ter pelo menos 2 caracteres");
			return;
		}

		if (!isPasswordValid) {
			setError("A senha não atende a todos os requisitos de segurança");
			return;
		}

		setLoading(true);
		try {
			await authService.register({ name, email, password });

			const loginResponse = await authService.login({ email, password });
			signIn(loginResponse);

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
				setError(responseData?.message || "Erro ao cadastrar usuário");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
			<div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
				<div className="text-center">
					<div className="flex justify-center mb-4">
						<div className="p-3 bg-green-100 rounded-full">
							<UserPlus className="w-8 h-8 text-green-700" />
						</div>
					</div>
					<h2 className="text-3xl font-extrabold text-gray-900">Criar conta</h2>
					<p className="mt-2 text-sm text-gray-600">
						Comece sua jornada acadêmica assistida por IA
					</p>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					{error && (
						<div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">
							{error}
						</div>
					)}

					<div className="space-y-4">
						<div>
							<label
								htmlFor="name"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Nome Completo
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<UserIcon className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="name"
									type="text"
									required
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition-colors"
									placeholder="Seu nome"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								E-mail
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Mail className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="email"
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition-colors"
									placeholder="usuario@email.com"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Senha
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Lock className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="password"
									type={showPassword ? "text" : "password"}
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className={`block w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 transition-colors ${
										password && !isPasswordValid
											? "border-red-300 bg-red-50"
											: "border-gray-300"
									}`}
									placeholder="••••••••"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
								>
									{showPassword ? (
										<EyeOff className="h-5 w-5" />
									) : (
										<Eye className="h-5 w-5" />
									)}
								</button>
							</div>

							<div className="mt-3 space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
								<p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
									Requisitos da senha:
								</p>
								<div className="grid grid-cols-1 gap-1.5">
									<div
										className={`flex items-center text-xs transition-colors ${passwordCriteria.minChars ? "text-green-600" : "text-red-500"}`}
									>
										{passwordCriteria.minChars ? (
											<Check size={14} className="mr-1.5" />
										) : (
											<X size={14} className="mr-1.5" />
										)}
										Mínimo de 6 caracteres
									</div>
									<div
										className={`flex items-center text-xs transition-colors ${passwordCriteria.hasUpper ? "text-green-600" : "text-red-500"}`}
									>
										{passwordCriteria.hasUpper ? (
											<Check size={14} className="mr-1.5" />
										) : (
											<X size={14} className="mr-1.5" />
										)}
										Pelo menos uma letra maiúscula
									</div>
									<div
										className={`flex items-center text-xs transition-colors ${passwordCriteria.hasNumber ? "text-green-600" : "text-red-500"}`}
									>
										{passwordCriteria.hasNumber ? (
											<Check size={14} className="mr-1.5" />
										) : (
											<X size={14} className="mr-1.5" />
										)}
										Pelo menos um número
									</div>
								</div>
							</div>
						</div>
					</div>

					<div>
						<button
							type="submit"
							disabled={loading}
							className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-50"
						>
							{loading ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : (
								"Cadastrar"
							)}
						</button>
					</div>

					<div className="text-center text-sm">
						<span className="text-gray-600">Já tem uma conta? </span>
						<Link
							to="/login"
							className="font-medium text-green-700 hover:text-green-800 transition-colors"
						>
							Fazer login
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Register;
