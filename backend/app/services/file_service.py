import os
import tempfile
import aiofiles
from typing import Optional, Dict, Any, Tuple
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

SUPPORTED_TEXT_TYPES = {".txt", ".md", ".markdown"}
SUPPORTED_PDF_TYPES = {".pdf"}
SUPPORTED_DOCX_TYPES = {".docx", ".doc"}
SUPPORTED_IMAGE_TYPES = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff"}
SUPPORTED_AUDIO_TYPES = {".mp3", ".wav", ".m4a", ".ogg", ".flac", ".aac"}
SUPPORTED_VIDEO_TYPES = {".mp4", ".avi", ".mov", ".mkv", ".webm"}

class FileService:

    async def extract_text_from_file(
        self,
        file_path: str,
        file_type: str
    ) -> Tuple[str, Optional[str]]:
        """Extract text content from various file types. Returns (text, error)"""
        ext = Path(file_path).suffix.lower()

        try:
            if ext in SUPPORTED_TEXT_TYPES:
                return await self._extract_from_text(file_path), None

            elif ext in SUPPORTED_PDF_TYPES:
                return await self._extract_from_pdf(file_path), None

            elif ext in SUPPORTED_DOCX_TYPES:
                return await self._extract_from_docx(file_path), None

            elif ext in SUPPORTED_IMAGE_TYPES:
                return await self._extract_from_image_ocr(file_path), None

            elif ext in SUPPORTED_AUDIO_TYPES or ext in SUPPORTED_VIDEO_TYPES:
                return await self._transcribe_audio(file_path), None

            else:
                return "", f"Unsupported file type: {ext}"

        except Exception as e:
            logger.error(f"File extraction error: {e}")
            return "", str(e)

    async def _extract_from_text(self, file_path: str) -> str:
        async with aiofiles.open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return await f.read()

    async def _extract_from_pdf(self, file_path: str) -> str:
        try:
            import PyPDF2
            text_parts = []
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        text_parts.append(text)
            return "\n\n".join(text_parts)
        except ImportError:
            return "PDF extraction requires PyPDF2. Please install it."

    async def _extract_from_docx(self, file_path: str) -> str:
        try:
            from docx import Document
            doc = Document(file_path)
            paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
            return "\n\n".join(paragraphs)
        except ImportError:
            return "DOCX extraction requires python-docx. Please install it."

    async def _extract_from_image_ocr(self, file_path: str) -> str:
        try:
            from PIL import Image
            import pytesseract
            img = Image.open(file_path)
            return pytesseract.image_to_string(img)
        except ImportError:
            return "OCR requires Pillow and pytesseract. Please install them."
        except Exception as e:
            return f"OCR failed: {str(e)}"

    async def _transcribe_audio(self, file_path: str) -> str:
        """Transcribe audio using Whisper or return placeholder"""
        try:
            import whisper
            model = whisper.load_model("base")
            result = model.transcribe(file_path)
            return result["text"]
        except ImportError:
            logger.warning("Whisper not available, returning placeholder")
            return "[Audio transcription requires whisper library. Please process manually.]"
        except Exception as e:
            return f"[Transcription failed: {str(e)}]"

    def get_file_info(self, filename: str) -> Dict[str, str]:
        ext = Path(filename).suffix.lower()

        if ext in SUPPORTED_AUDIO_TYPES:
            return {"type": "audio", "category": "media"}
        elif ext in SUPPORTED_VIDEO_TYPES:
            return {"type": "video", "category": "media"}
        elif ext in SUPPORTED_PDF_TYPES:
            return {"type": "pdf", "category": "document"}
        elif ext in SUPPORTED_DOCX_TYPES:
            return {"type": "docx", "category": "document"}
        elif ext in SUPPORTED_IMAGE_TYPES:
            return {"type": "image", "category": "media"}
        elif ext in SUPPORTED_TEXT_TYPES:
            return {"type": "text", "category": "document"}
        else:
            return {"type": "unknown", "category": "other"}

file_service = FileService()
