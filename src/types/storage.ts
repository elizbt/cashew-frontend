export const STORAGE_KEYS = {
	TOKEN: "@Castanha:token",
	USER: "@Castanha:user",
	HISTORY: "@Castanha:history",
	LAST_CHAT_ID: "@Castanha:last_chat_id",
	CHAT_CACHE: (id: string) => `@Castanha:chat_cache_${id}`,
};
