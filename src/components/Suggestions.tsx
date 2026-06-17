import type React from "react";

export const Suggestions: React.FC = () => {
	return (
		<div className="flex flex-col items-center justify-center max-w-2xl mx-auto px-4 text-center space-y-5">
			<h1 className="text-5xl font-sans font-bold text-slate-900 tracking-tight">
				Bem-vindo ao Castanha
			</h1>
			<p className="text-xl text-slate-700 font-light max-w-xl leading-relaxed">
				Este é um projeto independente para ajudar estudantes a encontrarem
				informações sobre os cursos superiores por aqui.
			</p>
			<p className="text-base text-slate-500 italic max-w-md">
				Nota: Para atendimento oficial ou burocrático, consulte a secretaria do
				campus.
			</p>
		</div>
	);
};
