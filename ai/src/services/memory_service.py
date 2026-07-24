class MemoryService:
    def __init__(self):
        # Artık her kullanıcının kendi metin deposu var: {user_id: "birikmiş metin"}
        self.user_stores = {}

    def add_to_memory(self, user_id, text, metadata):
        if user_id not in self.user_stores:
            self.user_stores[user_id] = ""
        self.user_stores[user_id] += "\n" + text
        print(f"✅ Kullanıcı {user_id} hafızasına eklendi: {metadata}")
        return True

    def query_memory(self, user_id, query_text):
        return self.user_stores.get(user_id, "Kurumsal bilgi bankası boş.")
