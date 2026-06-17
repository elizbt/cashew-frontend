import { LogOut, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import ConfirmationModal from "./ConfirmationModal";
import { Button } from "./ui/Button";

export const Sidebar: React.FC = () => {
	const { chatHistory, currentChatId, loadChat, startNewChat, deleteChat } =
		useChat();
	const { user, signOut } = useAuth();

	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [chatToDelete, setChatToDelete] = useState<string | null>(null);

	const handleDeleteClick = (id: string) => {
		setChatToDelete(id);
		setIsDeleteModalOpen(true);
	};

	const handleConfirmDelete = () => {
		if (chatToDelete) {
			deleteChat(chatToDelete);
			setChatToDelete(null);
		}
	};

	return (
		<div className="w-64 bg-primary h-screen flex flex-col text-emerald-50">
			<div className="p-4">
				<Button
					variant="outline"
					onClick={startNewChat}
					className="w-full flex gap-2"
				>
					<Plus size={20} />
					Nova Conversa
				</Button>
			</div>

			<div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-custom">
				{chatHistory.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-32 text-emerald-300/50 text-xs px-4 text-center">
						<MessageSquare size={24} className="mb-2 opacity-20" />
						<p>Nenhuma conversa encontrada</p>
					</div>
				) : (
					chatHistory.map((chat) => (
						<div
							key={chat.id}
							className={`group w-full flex items-center justify-between rounded-xl transition-all ${
								currentChatId === chat.id
									? "bg-white/20 text-white"
									: "hover:bg-white/10"
							}`}
						>
							<button
								type="button"
								onClick={() => loadChat(chat.id)}
								className="flex-1 flex items-center gap-3 px-3 py-3 text-sm text-left truncate"
							>
								<MessageSquare size={16} className="shrink-0 opacity-70" />
								<span className="truncate">{chat.title}</span>
							</button>

							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									handleDeleteClick(chat.id);
								}}
								className="opacity-0 group-hover:opacity-100 p-2 mr-1 hover:text-red-300 transition-all"
								title="Excluir conversa"
							>
								<Trash2 size={14} />
							</button>
						</div>
					))
				)}
			</div>

			<div className="p-4 border-t border-white/10 space-y-2">
				<div className="flex items-center gap-3 px-3 py-2 text-sm text-emerald-200/70">
					<div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold uppercase shadow-sm">
						{user?.name?.[0] || "U"}
					</div>
					<span className="truncate font-medium">
						{user?.name || "Usuário"}
					</span>
				</div>

				<Button
					variant="danger"
					size="sm"
					onClick={signOut}
					className="w-full justify-start gap-3"
				>
					<LogOut size={16} />
					Sair
				</Button>
			</div>

			<ConfirmationModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				onConfirm={handleConfirmDelete}
				title="Excluir conversa"
				message="Tem certeza que deseja excluir esta conversa? Esta ação não poderá ser desfeita e todo o histórico será perdido."
			/>
		</div>
	);
};
