import PyPDF2
import io

class PDFService:
    @staticmethod
    def extract_text(file_bytes):
        """PDF içeriğini metne dönüştürür."""
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            return text
        except Exception as e:
            print(f"PDF okuma hatası: {e}")
            return ""