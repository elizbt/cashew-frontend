import type React from "react";

export const Suggestions: React.FC = () => {
	return (
		<div className="flex flex-col items-center justify-center max-w-2xl mx-auto px-4 text-center space-y-5">
			<h1 className="text-5xl font-sans font-bold text-slate-900 tracking-tight">
				Bem-vindo ao Castanha
			</h1>
			<p className="text-xl text-slate-700 font-light max-w-xl leading-relaxed">
				Este é um assistente para tirar dúvidas sobre os cursos superiores do
				IFNMG – Campus Araçuaí. Ele não é um canal oficial da instituição.
			</p>
			<p className="text-base text-slate-500 italic max-w-lg">
				As respostas se baseiam em documentos públicos do IFNMG e podem conter
				imprecisões. Confirme informações importantes no site oficial do{" "}
				<a
					href="https://www.ifnmg.edu.br"
					target="_blank"
					rel="noopener noreferrer"
					className="text-secondary hover:text-primary underline underline-offset-2"
				>
					IFNMG
				</a>
				.
			</p>
		</div>
	);
};
